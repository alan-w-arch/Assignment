export const FAILURE_POLICIES = {
  RATE_LIMIT: {
    retryable: true,
    action: "BACKOFF_AND_RETRY",
    description: "Transient request-frequency failure.",
  },
  UPSTREAM_5XX: {
    retryable: true,
    action: "BACKOFF_AND_RETRY",
    description: "Transient upstream availability failure.",
  },
  TIMEOUT: {
    retryable: true,
    action: "BACKOFF_AND_RETRY",
    description: "Request exceeded the configured timeout.",
  },
  HEADER_ANOMALY: {
    retryable: false,
    action: "FALLBACK",
    description: "Request profile failed the sandbox contract.",
  },
  BEHAVIOR_ANOMALY: {
    retryable: false,
    action: "FALLBACK",
    description: "Repeated request behavior triggered the sandbox.",
  },
  SESSION_ANOMALY: {
    retryable: false,
    action: "FALLBACK",
    description: "Session state failed consistency checks.",
  },
  CHALLENGE_REQUIRED: {
    retryable: false,
    action: "STOP_AND_FALLBACK",
    description:
      "Additional verification is required; no automated bypass is attempted.",
  },
  SCHEMA_VALIDATION_FAILED: {
    retryable: false,
    action: "PARSER_INVALID",
    description: "Upstream payload no longer matches the adapter contract.",
  },
  EMPTY_RESPONSE: {
    retryable: false,
    action: "DATA_QUALITY_FAILURE",
    description: "The source returned no usable records.",
  },
};

export function classifyFailure(error) {
  const code = error?.code || "UNKNOWN_FAILURE";
  const policy = FAILURE_POLICIES[code] || {
    retryable: false,
    action: "FALLBACK",
    description: "Unknown source failure.",
  };

  return {
    code,
    retryable: policy.retryable,
    action: policy.action,
    description: policy.description,
    risk: Number(error?.risk ?? 50),
  };
}

export function calculateRisk({
  scenarioRisk = 0,
  requestCount = 1,
  repeated = false,
}) {
  let score = Number(scenarioRisk) || 0;

  if (requestCount >= 5) score += 5;
  if (requestCount >= 10) score += 10;
  if (repeated) score += 10;

  return Math.min(100, score);
}

export function riskLabel(score) {
  if (score >= 80) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}
