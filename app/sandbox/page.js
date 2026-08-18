"use client";

import { useEffect, useState } from "react";

export default function SandboxPage() {
  const [scenarios, setScenarios] = useState([]);
  const [scenarioId, setScenarioId] = useState("rate_limit");
  const [requestCount, setRequestCount] = useState(1);
  const [retries, setRetries] = useState(1);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/sandbox/config")
      .then((response) => response.json())
      .then((data) => setScenarios(data.scenarios || []))
      .catch(() => setError("Could not load sandbox scenarios."));
  }, []);

  async function runScenario() {
    setRunning(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId,
          requestCount,
          retries,
          limit: 8,
        }),
      });

      const data = await response.json();

      if (!data.report) {
        throw new Error(data.error || "Sandbox execution failed.");
      }

      setResult(data);
    } catch (runError) {
      setError(runError.message);
    } finally {
      setRunning(false);
    }
  }

  const selected =
    scenarios.find((scenario) => scenario.id === scenarioId) || null;

  return (
    <main className="page">
      <section className="hero">
        <div className="eyebrow">DETECTION & RESILIENCE LAB</div>
        <h1>Trigger the failure. Watch the system recover.</h1>
        <p>
          A deterministic, local sandbox for demonstrating how the ingestion
          pipeline reacts when a LinkedIn-like source reports rate limits,
          challenges, session anomalies, schema changes, timeouts, and other
          failure conditions.
        </p>
        <a className="back-link" href="/">
          ← Back to live ingestion
        </a>
      </section>

      <section className="sandbox-layout">
        <aside className="sandbox-controls">
          <div className="eyebrow">SCENARIO</div>
          <h2>Detection simulator</h2>

          <label>
            Scenario
            <select
              value={scenarioId}
              onChange={(event) => setScenarioId(event.target.value)}
            >
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Simulated request count
            <input
              type="number"
              min="1"
              max="50"
              value={requestCount}
              onChange={(event) =>
                setRequestCount(Number(event.target.value))
              }
            />
          </label>

          <label>
            Retry attempts
            <select
              value={retries}
              onChange={(event) => setRetries(Number(event.target.value))}
            >
              <option value="0">0 retries</option>
              <option value="1">1 retry</option>
              <option value="2">2 retries</option>
            </select>
          </label>

          {selected && (
            <div className="scenario-card">
              <div className="scenario-risk">
                <span>Simulated risk</span>
                <strong>{selected.risk}/100</strong>
              </div>
              <p>{selected.description}</p>
              <small>
                This is a controlled engineering simulation, not a claim about
                proprietary platform rules.
              </small>
            </div>
          )}

          <button onClick={runScenario} disabled={running}>
            {running ? "Running scenario..." : "Run scenario"}
          </button>
        </aside>

        <section className="sandbox-results">
          {error && <div className="error">{error}</div>}

          {!result && !error && (
            <div className="empty sandbox-empty">
              <strong>Ready.</strong>
              <span>
                Choose a scenario and run it to see the detection, retry,
                fallback, and stop decisions.
              </span>
            </div>
          )}

          {result && (
            <>
              <div className="result-summary">
                <div>
                  <div className="eyebrow">RESULT</div>
                  <h2>{result.report.scenarioLabel}</h2>
                  <p>
                    Final source:{" "}
                    <strong>{result.report.source || "None"}</strong>
                  </p>
                </div>
                <div className={`risk-badge ${result.report.riskLabel}`}>
                  {result.report.riskLabel} RISK
                  <strong>{result.report.risk}</strong>
                </div>
              </div>

              <div className="stats">
                <div>
                  <strong>{result.report.attempts.length}</strong>
                  <span>source attempts</span>
                </div>
                <div>
                  <strong>{result.jobs.length}</strong>
                  <span>jobs recovered</span>
                </div>
                <div>
                  <strong>{result.report.status}</strong>
                  <span>final status</span>
                </div>
              </div>

              <div className="timeline">
                <div className="eyebrow">EVENT TIMELINE</div>
                <h3>What the ingestion engine did</h3>

                {result.report.events.map((item) => (
                  <div className={`timeline-item ${item.type}`} key={item.id}>
                    <div className="timeline-marker" />
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <small>
                        {new Date(item.time).toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>

              <div className="attempts">
                <div className="eyebrow">SOURCE ATTEMPTS</div>
                <h3>Adapter behavior</h3>

                {result.report.attempts.map((attempt, index) => (
                  <div className="attempt" key={`${attempt.source}-${index}`}>
                    <div>
                      <strong>{attempt.source}</strong>
                      <span>{attempt.status}</span>
                    </div>
                    <p>
                      {attempt.status === "success"
                        ? `${attempt.finalCount} jobs normalized successfully.`
                        : `${attempt.code}: ${attempt.message}`}
                    </p>
                  </div>
                ))}
              </div>

              {result.jobs.length > 0 && (
                <div className="sandbox-jobs">
                  <div className="eyebrow">RECOVERED DATA</div>
                  <h3>Jobs after fallback</h3>

                  <div className="mini-grid">
                    {result.jobs.slice(0, 6).map((job) => (
                      <article className="mini-job" key={job.id}>
                        <span>{job.source}</span>
                        <strong>{job.title}</strong>
                        <p>{job.company}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </section>

      <section className="sandbox-note">
        <strong>Boundary:</strong> this sandbox intentionally does not attempt
        CAPTCHA solving, stealth automation, fingerprint spoofing, credential
        rotation, proxy evasion, or other mechanisms intended to bypass a
        third-party platform's defenses. Its purpose is to test your
        ingestion system's failure classification, retry policy, validation,
        fallback behavior, and stop conditions.
      </section>
    </main>
  );
}
