# Resilient Job Scraper — Next.js / JavaScript

A source-adapter-based job ingestion demo for the Acdyon Technologies Frontend Challenge.

## What it demonstrates
- Common source adapter interface
- Low-risk public job APIs
- Response and record validation
- Retry with backoff
- Fallback to a new source approach
- Explicit console logging of failed/retried approaches
- Normalization and deduplication
- Responsive dashboard
- Health endpoint

## Assignment boundary
The assignment asks the live demo to use a low-risk public job-board RSS/API or sandbox, not a live LinkedIn account. The default demo therefore uses public APIs.

An optional Apify adapter is included as a provider extension and is only attempted when APIFY_API_TOKEN and APIFY_ACTOR_ID are configured.

## Run
npm install
npm run dev

Open http://localhost:3000 and click "Fetch latest jobs".

## API
GET /api/jobs?limit=50
GET /api/health

## Console fallback behavior
Example:
[INGESTION] Approach "Arbeitnow API (attempt 1)" failed: ...
[INGESTION] This try failed. Retrying the same approach "Arbeitnow API" in 500ms...
[INGESTION] Approach "Arbeitnow API" failed after retries. Retrying with new approach: "RemoteOK API".

## Architecture
Browser -> Next.js API -> Source Manager -> Source Adapter -> Validation -> Normalization -> Deduplication -> Response


## Detection & Resilience Lab

Open `/sandbox` to run deterministic, controlled source-failure scenarios.

Available scenarios:
- Normal request
- Rate limit (429)
- Header anomaly
- Behavior anomaly
- Session inconsistency
- Challenge / CAPTCHA
- Temporary server error (503)
- Request timeout
- Schema / markup change
- Empty response

The sandbox uses the same source-adapter and ingestion concepts as the live path. It deliberately produces representative failure conditions so the demo can show classification, retry/backoff, validation, fallback, and stop behavior on demand.

### Demo sequence

1. Open `/sandbox`.
2. Select **Rate limit (429)**.
3. Set retries to `1`.
4. Run the scenario.
5. Show the timeline: sandbox failure → retry → fallback → public API success.
6. Run **Challenge / CAPTCHA** to demonstrate the hard boundary: the system does not attempt to solve or bypass a challenge and instead falls back.
7. Run **Schema / markup change** to demonstrate parser-contract validation.
8. Run **Timeout** or **Temporary server error** to demonstrate transient retry behavior.

### Important boundary

The sandbox models representative anti-automation failure conditions for resilience testing. It does not reproduce or attempt to bypass any proprietary detection system. It intentionally does not implement CAPTCHA solving, fingerprint spoofing, stealth automation, credential/session rotation, proxy evasion, or other bypass mechanisms.
