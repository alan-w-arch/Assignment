import { runSandboxScenario } from "@/lib/sandbox-runner";
import { getScenario } from "@/lib/detection/scenarios";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const scenarioId = body.scenarioId || "normal";
    const scenario = getScenario(scenarioId);

    const limit = clamp(body.limit, 1, 20, 8);
    const retries = clamp(body.retries, 0, 2, 1);
    const requestCount = clamp(body.requestCount, 1, 50, 1);
    const repeated = Boolean(body.repeated);

    const result = await runSandboxScenario({
      scenarioId: scenario.id,
      limit,
      retries,
      requestCount,
      repeated,
    });

    return Response.json(result, {
      status: result.report.status === "success" ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      {
        error: error?.message || "Sandbox execution failed.",
      },
      { status: 500 }
    );
  }
}

function clamp(value, min, max, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) return fallback;

  return Math.min(max, Math.max(min, number));
}
