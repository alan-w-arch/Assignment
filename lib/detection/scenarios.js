export const SANDBOX_SCENARIOS = {
  normal: {
    id: "normal",
    label: "Normal request",
    category: "baseline",
    description: "The simulated source responds normally with valid job data.",
    risk: 0,
    failureCode: null,
    retryable: false,
  },
  rate_limit: {
    id: "rate_limit",
    label: "Rate limit (429)",
    category: "request frequency",
    description:
      "The simulated source returns HTTP 429 after detecting excessive request frequency.",
    risk: 85,
    failureCode: "RATE_LIMIT",
    retryable: true,
  },
  header_anomaly: {
    id: "header_anomaly",
    label: "Header anomaly",
    category: "request profile",
    description:
      "The simulated source reports an invalid or incomplete request profile.",
    risk: 65,
    failureCode: "HEADER_ANOMALY",
    retryable: false,
  },
  behavior_anomaly: {
    id: "behavior_anomaly",
    label: "Behavior anomaly",
    category: "request behavior",
    description: "The simulated source reports a repetitive request pattern.",
    risk: 75,
    failureCode: "BEHAVIOR_ANOMALY",
    retryable: false,
  },
  session_anomaly: {
    id: "session_anomaly",
    label: "Session inconsistency",
    category: "session",
    description: "The simulated source reports inconsistent session state.",
    risk: 80,
    failureCode: "SESSION_ANOMALY",
    retryable: false,
  },
  challenge: {
    id: "challenge",
    label: "Challenge / CAPTCHA",
    category: "challenge",
    description: "The simulated source requires additional verification.",
    risk: 100,
    failureCode: "CHALLENGE_REQUIRED",
    retryable: false,
  },
  server_error: {
    id: "server_error",
    label: "Temporary server error (503)",
    category: "availability",
    description: "The simulated source returns a transient HTTP 503.",
    risk: 70,
    failureCode: "UPSTREAM_5XX",
    retryable: true,
  },
  timeout: {
    id: "timeout",
    label: "Request timeout",
    category: "availability",
    description:
      "The simulated source never completes within the configured timeout.",
    risk: 60,
    failureCode: "TIMEOUT",
    retryable: true,
  },
  schema_change: {
    id: "schema_change",
    label: "Schema / markup change",
    category: "data quality",
    description:
      "The simulated source returns a payload that no longer matches the adapter contract.",
    risk: 55,
    failureCode: "SCHEMA_VALIDATION_FAILED",
    retryable: false,
  },
  empty_response: {
    id: "empty_response",
    label: "Empty response",
    category: "data quality",
    description: "The simulated source returns zero records.",
    risk: 45,
    failureCode: "EMPTY_RESPONSE",
    retryable: false,
  },
};

export function getScenario(id = "normal") {
  return SANDBOX_SCENARIOS[id] || SANDBOX_SCENARIOS.normal;
}

export function listScenarios() {
  return Object.values(SANDBOX_SCENARIOS);
}
