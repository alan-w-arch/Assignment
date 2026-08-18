# DECISIONS

## 1. Why this ingestion strategy?
I separated source acquisition from normalization with a source-adapter interface. The live demo uses low-risk public job APIs so the end-to-end ingestion behavior can be demonstrated without operating against a live LinkedIn account. The obvious alternative was to hard-code one scraper against one source; I rejected that because a source-specific implementation makes failure and future source replacement harder to isolate.

The source manager validates both response shape and individual records. A transient failure is retried with backoff. If an approach still fails, the manager explicitly moves to the next source adapter and logs the transition.

## 2. Time-limit trade-off
I kept persistence out of the first implementation and return normalized jobs directly from the ingestion API. With a real week, I would add Postgres, scheduled ingestion, per-source circuit breakers, structured metrics, parser contract tests, freshness monitoring, and an ingestion history table.

## 3. AI usage
AI assistance was used for scaffolding, implementation review, and identifying edge cases. I personally verified the source boundaries, response validation, fallback behavior, normalization contract, and console logging. The implementation is intentionally structured so each decision can be explained independently during review.
