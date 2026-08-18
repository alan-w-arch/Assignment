import { listScenarios } from "@/lib/detection/scenarios";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      scenarios: listScenarios(),
      defaults: {
        limit: 8,
        retries: 1,
        requestCount: 1,
        repeated: false,
      },
      disclaimer:
        "The sandbox models representative anti-automation failure conditions for resilience testing. It does not reproduce or attempt to bypass any proprietary detection system.",
    },
    {
      headers: { "Cache-Control": "no-store" },
    }
  );
}
