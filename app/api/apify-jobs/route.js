import { createApifySource } from "@/lib/sources/apify";
import { normalizeJob, validateJob } from "@/lib/job-schema";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") || "50");
  const limit = Math.min(
    Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 50, 1),
    100,
  );
  const source = createApifySource();

  try {
    const rawJobs = await source.fetchJobs({ limit });
    const validJobs = rawJobs
      .filter((job) => validateJob(job).valid)
      .map((job) => normalizeJob(job, source.name));

    if (!validJobs.length) {
      throw new Error("Apify returned no valid jobs");
    }

    return Response.json(
      {
        jobs: validJobs.slice(0, limit),
        report: {
          status: "success",
          source: source.name,
          rawCount: rawJobs.length,
          validCount: validJobs.length,
          rejectedCount: rawJobs.length - validJobs.length,
          finalCount: validJobs.length,
          attempts: [
            {
              name: source.name,
              status: "success",
              message: `Fetched ${rawJobs.length}; ${validJobs.length} passed validation.`,
            },
          ],
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error?.message || "Apify ingestion failed";
    return Response.json(
      {
        error: message,
        jobs: [],
        report: {
          status: "failed",
          source: null,
          rawCount: 0,
          validCount: 0,
          rejectedCount: 0,
          finalCount: 0,
          attempts: [{ name: source.name, status: "failed", message }],
        },
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
