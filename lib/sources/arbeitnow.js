export const arbeitnowSource = {
  name: "Arbeitnow API",
  async fetchJobs({ limit = 50 } = {}) {
    const c = new AbortController(),
      t = setTimeout(() => c.abort(), 10000);
    try {
      const r = await fetch("https://www.arbeitnow.com/api/job-board-api", {
        headers: {
          Accept: "application/json",
          "User-Agent": "ResilientJobIngestionDemo/1.0",
        },
        signal: c.signal,
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const p = await r.json();
      if (!p || !Array.isArray(p.data))
        throw new Error("schema validation failed: data[] missing");
      return p.data
        .slice(0, limit)
        .map((j) => ({
          id: j.slug,
          title: j.title,
          company: j.company_name,
          location: j.location,
          url: j.url,
          description: j.description,
          publishedAt: j.created_at
            ? new Date(j.created_at * 1000).toISOString()
            : null,
          jobType: j.job_types?.join(", ") || "",
        }));
    } finally {
      clearTimeout(t);
    }
  },
};
