# Job Scraper — Next.js / JavaScript

A source-adapter-based job ingestion demo for the Acdyon Technologies Frontend Challenge.

## What it demonstrates
- Common source adapter interface
- Low-risk public job APIs
- Apify actor fetching directly from linkedin
- Response and record validation
- Retry with backoff
- Fallback to a new source approach
- Explicit console logging of failed/retried approaches
- Normalization and deduplication
- Responsive dashboard
- Health endpoint

## Run
npm install
npm run dev

Open http://localhost:3000 

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

