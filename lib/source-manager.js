import { arbeitnowSource } from "@/lib/sources/arbeitnow";
import { remoteOkSource } from "@/lib/sources/remoteok";
import { createApifySource } from "@/lib/sources/apify";
import { normalizeJob, validateJob } from "@/lib/job-schema";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function buildSources() {
  const s = [arbeitnowSource, remoteOkSource];
  if (process.env.APIFY_API_TOKEN && process.env.APIFY_ACTOR_ID)
    s.push(createApifySource());
  return s;
}
export async function ingestJobs({ limit = 50, retriesPerSource = 1 } = {}) {
  const attempts = [],
    sources = buildSources();
  for (const source of sources) {
    for (let attempt = 1; attempt <= retriesPerSource + 1; attempt++) {
      const label = `${source.name} (attempt ${attempt})`;
      try {
        console.log(`[INGESTION] Trying approach: "${label}"`);
        const raw = await source.fetchJobs({ limit });
        if (!Array.isArray(raw))
          throw new Error("source returned a non-array payload");
        if (raw.length === 0)
          throw new Error(
            "source returned 0 records; treating this as a possible upstream failure",
          );
        const valid = [],
          rejected = [];
        for (const r of raw) {
          const v = validateJob(r);
          if (v.valid) valid.push(normalizeJob(r, source.name));
          else rejected.push(v.reason);
        }
        if (!valid.length)
          throw new Error(`all ${raw.length} records failed validation`);
        const jobs = dedupe(valid);
        attempts.push({
          name: label,
          status: "success",
          message: `Fetched ${raw.length}; ${valid.length} passed validation; ${jobs.length} remained after deduplication.`,
        });
        console.log(
          `[INGESTION] Approach "${label}" succeeded: ${jobs.length} normalized jobs.`,
        );
        return {
          jobs: jobs.slice(0, limit),
          report: {
            status: "success",
            source: source.name,
            rawCount: raw.length,
            validCount: valid.length,
            rejectedCount: rejected.length,
            finalCount: jobs.length,
            attempts,
          },
        };
      } catch (e) {
        const message = e?.message || "unknown error";
        attempts.push({ name: label, status: "failed", message });
        console.error(`[INGESTION] Approach "${label}" failed: ${message}`);
        if (attempt < retriesPerSource + 1) {
          const delay = 500 * attempt;
          console.log(
            `[INGESTION] This try failed. Retrying the same approach "${source.name}" in ${delay}ms...`,
          );
          await sleep(delay);
        } else {
          const next = sources[sources.indexOf(source) + 1];
          if (next)
            console.log(
              `[INGESTION] Approach "${source.name}" failed after retries. Retrying with new approach: "${next.name}".`,
            );
          else
            console.log(
              `[INGESTION] No new source approach remains after "${source.name}". Ingestion exhausted.`,
            );
        }
      }
    }
  }
  return {
    jobs: [],
    report: {
      status: "failed",
      source: null,
      rawCount: 0,
      validCount: 0,
      rejectedCount: 0,
      finalCount: 0,
      attempts,
    },
  };
}
function dedupe(jobs) {
  const seen = new Set();
  return jobs.filter((j) => {
    const k = j.url || `${j.company}|${j.title}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
