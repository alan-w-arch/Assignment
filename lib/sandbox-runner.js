import { sandboxSource } from "@/lib/sources/sandbox";
import { arbeitnowSource } from "@/lib/sources/arbeitnow";
import { remoteOkSource } from "@/lib/sources/remoteok";
import { validateJob, normalizeJob } from "@/lib/job-schema";
import { classifyFailure } from "@/lib/detection/detector";
import { evaluateScenario } from "@/lib/detection/risk-engine";
import { getScenario } from "@/lib/detection/scenarios";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runSandboxScenario({
  scenarioId = "normal",
  limit = 12,
  retries = 1,
  requestCount = 1,
  repeated = false,
}) {
  const scenario = getScenario(scenarioId);
  const risk = evaluateScenario({
    scenario,
    requestCount,
    repeated,
  });

  const events = [
    event(
      "scenario",
      "Scenario selected",
      `${scenario.label}. ${scenario.description}`,
      { scenario: scenario.id, risk: risk.score, riskLabel: risk.label },
    ),
  ];

  for (const signal of risk.signals) {
    events.push(
      event(
        "detection",
        `${signal.name}: ${signal.status.toUpperCase()}`,
        signal.detail,
      ),
    );
  }

  const sources = [
    { adapter: sandboxSource, isSandbox: true },
    { adapter: remoteOkSource, isSandbox: false },
    { adapter: arbeitnowSource, isSandbox: false },
  ];

  const attempts = [];
  let sourceIndex = 0;

  while (sourceIndex < sources.length) {
    const current = sources[sourceIndex];

    for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
      const label = `${current.adapter.name} (attempt ${attempt})`;

      events.push(
        event(
          "request",
          `Trying approach: ${current.adapter.name}`,
          current.isSandbox
            ? `Controlled sandbox scenario "${scenario.id}".`
            : "Fallback to a public job source.",
        ),
      );

      try {
        const raw = await current.adapter.fetchJobs({
          limit,
          scenarioId,
          requestCount,
          timeoutMs: 1200,
        });

        if (!Array.isArray(raw)) {
          throw createLocalError(
            "SCHEMA_VALIDATION_FAILED",
            "Source returned a non-array payload.",
          );
        }

        if (raw.length === 0) {
          throw createLocalError(
            "EMPTY_RESPONSE",
            "Source returned zero records.",
          );
        }

        const valid = [];
        const rejected = [];

        for (const record of raw) {
          const validation = validateJob(record);

          if (validation.valid) {
            valid.push(normalizeJob(record, current.adapter.name));
          } else {
            rejected.push(validation.reason);
          }
        }

        if (!valid.length) {
          throw createLocalError(
            "SCHEMA_VALIDATION_FAILED",
            "All returned records failed job validation.",
          );
        }

        const jobs = dedupe(valid).slice(0, limit);

        attempts.push({
          source: current.adapter.name,
          attempt,
          status: "success",
          rawCount: raw.length,
          validCount: valid.length,
          finalCount: jobs.length,
        });

        events.push(
          event(
            "success",
            `Approach succeeded: ${current.adapter.name}`,
            `${jobs.length} normalized jobs are ready for the UI.`,
          ),
        );

        return {
          jobs,
          report: {
            status: "success",
            scenario: scenario.id,
            scenarioLabel: scenario.label,
            risk: risk.score,
            riskLabel: risk.label,
            source: current.adapter.name,
            attempts,
            events,
          },
        };
      } catch (error) {
        const failure = classifyFailure(error);

        attempts.push({
          source: current.adapter.name,
          attempt,
          status: "failed",
          code: failure.code,
          action: failure.action,
          message: error?.message || "Unknown failure",
        });

        events.push(
          event(
            "failure",
            `${current.adapter.name} failed`,
            `${failure.code}: ${error?.message || "Unknown failure"}`,
            { code: failure.code, action: failure.action },
          ),
        );

        console.error(
          `[SANDBOX] Approach "${label}" failed: ${failure.code} — ${
            error?.message || "Unknown failure"
          }`,
        );

        if (failure.code === "CHALLENGE_REQUIRED") {
          events.push(
            event(
              "policy",
              "Stop automated bypass",
              "A challenge is treated as a hard boundary. The system does not attempt to solve or bypass it.",
            ),
          );
        }

        const shouldRetry = failure.retryable && attempt <= retries;

        if (shouldRetry) {
          const delay = 500 * 2 ** (attempt - 1);

          events.push(
            event(
              "retry",
              `Retrying ${current.adapter.name}`,
              `Retry ${attempt + 1} scheduled after ${delay}ms using exponential backoff.`,
            ),
          );

          console.log(
            `[SANDBOX] This try failed. Retrying the same approach "${current.adapter.name}" in ${delay}ms...`,
          );

          await sleep(delay);
          continue;
        }

        const next = sources[sourceIndex + 1];

        if (next) {
          events.push(
            event(
              "fallback",
              `Switching to new approach: ${next.adapter.name}`,
              `The current source could not recover after its permitted retry policy.`,
            ),
          );

          console.log(
            `[SANDBOX] Approach "${current.adapter.name}" exhausted. Retrying with new approach: "${next.adapter.name}".`,
          );

          break;
        }

        events.push(
          event(
            "stop",
            "No fallback source remains",
            "Ingestion exhausted all configured approaches.",
          ),
        );

        return {
          jobs: [],
          report: {
            status: "failed",
            scenario: scenario.id,
            scenarioLabel: scenario.label,
            risk: risk.score,
            riskLabel: risk.label,
            source: null,
            attempts,
            events,
          },
        };
      }
    }

    sourceIndex += 1;
  }

  return {
    jobs: [],
    report: {
      status: "failed",
      scenario: scenario.id,
      scenarioLabel: scenario.label,
      risk: risk.score,
      riskLabel: risk.label,
      source: null,
      attempts,
      events,
    },
  };
}

function event(type, title, message, metadata = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    time: new Date().toISOString(),
    type,
    title,
    message,
    metadata,
  };
}

function createLocalError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.status = 502;
  error.risk = 50;
  return error;
}

function dedupe(jobs) {
  const seen = new Set();

  return jobs.filter((job) => {
    const key = job.url || `${job.company}|${job.title}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}
