export const remoteOkSource = {
  name: "RemoteOK API",
  async fetchJobs({ limit = 50 } = {}) {
    const c = new AbortController(),
      t = setTimeout(() => c.abort(), 10000);
    try {
      const r = await fetch("https://remoteok.com/api", {
        headers: {
          Accept: "application/json",
          "User-Agent": "ResilientJobIngestionDemo/1.0",
        },
        signal: c.signal,
        cache: "no-store",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const p = await r.json();
      if (!Array.isArray(p))
        throw new Error("schema validation failed: response is not an array");
      return p
        .filter((j) => j && j.position && j.company && j.url)
        .slice(0, limit)
        .map((j) => ({
          id: j.id,
          title: j.position,
          company: j.company,
          location: j.location || "Remote",
          url: j.url.startsWith("http")
            ? j.url
            : `https://remoteok.com${j.url}`,
          description: j.description,
          publishedAt: j.date || null,
          jobType: Array.isArray(j.tags) ? j.tags.slice(0, 3).join(", ") : "",
        }));
    } finally {
      clearTimeout(t);
    }
  },
};
