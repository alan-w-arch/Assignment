"use client";
import { useState } from "react";

export default function Home() {
  const [jobs, setJobs] = useState([]),
    [report, setReport] = useState(null),
    [loadingSource, setLoadingSource] = useState(null),
    [error, setError] = useState("");
  async function fetchJobs() {
    setLoadingSource("public");
    setError("");
    try {
      const r = await fetch("/api/jobs?limit=50", { cache: "no-store" }),
        d = await r.json();
      if (!r.ok) throw new Error(d.error || "Ingestion failed");
      setJobs(d.jobs || []);
      setReport(d.report || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingSource(null);
    }
  }
  async function fetchFromApify() {
    setLoadingSource("apify");
    setError("");
    try {
      const r = await fetch("/api/apify-jobs?limit=50", {
          cache: "no-store",
        });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Apify ingestion failed");
      setJobs(d.jobs || []);
      setReport(d.report || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingSource(null);
    }
  }
  return (
    <main className="page">
      <section className="hero">
        <div className="eyebrow">RESILIENT INGESTION DEMO</div>
        <h1>Jobs, collected without silently failing.</h1>
        <p>
          A Next.js source-adapter pipeline that validates upstream data,
          retries transient failures, and switches to a new acquisition approach
          when the current one fails.
        </p>
        <div className="hero-actions gap-4">
          <button
            className="p-4 m-4"
            onClick={fetchJobs}
            disabled={Boolean(loadingSource)}
          >
            {loadingSource === "public"
              ? "Running ingestion..."
              : "Fetch from Public APIs"}
          </button>
          <button
            className="p-4 m-4"
            onClick={fetchFromApify}
            disabled={Boolean(loadingSource)}
          >
            {loadingSource === "apify"
              ? "Running ingestion..."
              : "Fetch from Apify"}
          </button>
          <a className="sandbox-link p-4" href="/sandbox">
            Open Detection & Resilience Lab →
          </a>
        </div>
        
      </section>
      {error && <div className="error">{error}</div>}
      {report && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <div className="eyebrow">INGESTION REPORT</div>
              <h2>
                {report.status === "success"
                  ? "Pipeline succeeded"
                  : "Pipeline failed"}
              </h2>
            </div>
            <span className={"badge " + report.status}>{report.status}</span>
          </div>
          <div className="stats">
            <div>
              <strong>{report.source || "—"}</strong>
              <span>successful source</span>
            </div>
            <div>
              <strong>{report.rawCount}</strong>
              <span>raw records</span>
            </div>
            <div>
              <strong>{report.validCount}</strong>
              <span>valid records</span>
            </div>
            <div>
              <strong>{report.finalCount}</strong>
              <span>final jobs</span>
            </div>
          </div>
          <div className="attempts">
            <h3>Approaches tried</h3>
            {report.attempts.map((a, i) => (
              <div className="attempt" key={a.name + i}>
                <div>
                  <strong>{a.name}</strong>
                  <span>{a.status}</span>
                </div>
                <p>{a.message}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="jobs">
        <div className="section-heading">
          <div>
            <div className="eyebrow">NORMALIZED DATA</div>
            <h2>Latest jobs</h2>
          </div>
          <span>{jobs.length} results</span>
        </div>
        {jobs.length === 0 ? (
          <div className="empty">Run the ingestion to load jobs.</div>
        ) : (
          <div className="grid">
            {jobs.map((j) => (
              <article className="job" key={j.id}>
                <div className="job-top">
                  <span className="source">{j.source}</span>
                  <span>{j.jobType || "Job"}</span>
                </div>
                <h3>{j.title}</h3>
                <p className="company">{j.company}</p>
                <p className="location">
                  {j.location || "Location not specified"}
                </p>
                <p className="description">
                  {j.description || "No description available."}
                </p>
                <div className="job-footer">
                  <span>
                    {j.publishedAt
                      ? new Date(j.publishedAt).toLocaleDateString()
                      : "Unknown date"}
                  </span>
                  {j.url && (
                    <a href={j.url} target="_blank" rel="noreferrer">
                      View job →
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
