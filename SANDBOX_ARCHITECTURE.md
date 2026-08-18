# Detection & Resilience Lab Architecture

## Purpose

The sandbox is a deterministic test source. It lets the reviewer trigger source-side failures on demand without depending on a third-party production service to produce a particular response.

## Flow

Browser
  -> POST /api/sandbox
  -> runSandboxScenario()
  -> LinkedIn-like Detection Sandbox adapter
  -> failure classifier / risk engine
  -> retry policy
  -> fallback source adapter
  -> validation
  -> normalization
  -> response + event timeline

## Why this is separate from the live source

Public APIs are useful for demonstrating real ingestion, but they cannot be expected to produce every failure mode on demand. The sandbox makes those cases reproducible.

## Scenario semantics

The scenario names are engineering simulations. They are not claims that the corresponding condition is the exact proprietary signal or threshold used by LinkedIn.

## Failure policy

- RATE_LIMIT, UPSTREAM_5XX, TIMEOUT: retry with exponential backoff, then fallback.
- HEADER_ANOMALY, BEHAVIOR_ANOMALY, SESSION_ANOMALY: no blind retry; classify and fallback.
- CHALLENGE_REQUIRED: stop automated bypass attempts and fallback.
- SCHEMA_VALIDATION_FAILED: do not accept corrupt data; fallback.
- EMPTY_RESPONSE: treat as a data-quality failure; fallback.

## Interview demonstration

The strongest sequence is:

1. Run `rate_limit`.
2. Show the 429 failure.
3. Show exponential backoff.
4. Show the retry.
5. Show the switch to a new source adapter.
6. Show recovered jobs.
7. Run `challenge`.
8. Show that the system explicitly refuses to automate a challenge and moves to a safe fallback.
9. Run `schema_change`.
10. Show that invalid data is rejected before normalization/storage.
