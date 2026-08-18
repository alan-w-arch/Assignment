import { calculateRisk, riskLabel } from "@/lib/detection/detector";

export function evaluateScenario({
  scenario,
  requestCount = 1,
  repeated = false,
}) {
  const score = calculateRisk({
    scenarioRisk: scenario.risk,
    requestCount,
    repeated,
  });

  return {
    score,
    label: riskLabel(score),
    signals: buildSignals(scenario.id, requestCount, repeated),
  };
}

function buildSignals(id, requestCount, repeated) {
  const signals = [];

  if (id === "rate_limit") {
    signals.push({
      name: "Request frequency",
      status: "high",
      detail: `Simulated threshold exceeded at ${requestCount} request(s).`,
    });
  }

  if (id === "header_anomaly") {
    signals.push({
      name: "Request profile",
      status: "high",
      detail: "Simulated required header contract was not satisfied.",
    });
  }

  if (id === "behavior_anomaly" || repeated) {
    signals.push({
      name: "Behavior pattern",
      status: "high",
      detail: "Repeated request behavior was detected by the sandbox.",
    });
  }

  if (id === "session_anomaly") {
    signals.push({
      name: "Session consistency",
      status: "high",
      detail: "Simulated session state changed unexpectedly.",
    });
  }

  if (id === "challenge") {
    signals.push({
      name: "Challenge",
      status: "critical",
      detail: "Additional verification is required.",
    });
  }

  if (id === "schema_change") {
    signals.push({
      name: "Payload contract",
      status: "medium",
      detail: "The response shape no longer matches the adapter contract.",
    });
  }

  if (id === "server_error" || id === "timeout") {
    signals.push({
      name: "Availability",
      status: "medium",
      detail: "The simulated source is temporarily unavailable.",
    });
  }

  if (id === "empty_response") {
    signals.push({
      name: "Data quality",
      status: "medium",
      detail: "No usable job records were returned.",
    });
  }

  if (!signals.length) {
    signals.push({
      name: "Baseline",
      status: "low",
      detail: "No simulated detection signal is active.",
    });
  }

  return signals;
}
