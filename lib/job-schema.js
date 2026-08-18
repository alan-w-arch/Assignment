export function validateJob(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      valid: false,
      reason: "record is not an object",
    };
  }

  const title = String(raw.title ?? "").trim();
  const company = String(raw.company ?? "").trim();
  const url = String(raw.url ?? "").trim();

  if (!title) {
    return {
      valid: false,
      reason: "missing title",
    };
  }

  if (!company) {
    return {
      valid: false,
      reason: "missing company",
    };
  }

  if (!url) {
    return {
      valid: false,
      reason: "missing URL",
    };
  }

  try {
    new URL(url);
  } catch {
    return {
      valid: false,
      reason: "invalid URL",
    };
  }

  return {
    valid: true,
  };
}

export function normalizeJob(raw, source) {
  return {
    id: raw.id || stableId(`${source}|${raw.url}|${raw.title}|${raw.company}`),

    title: clean(raw.title),

    company: clean(raw.company),

    location: clean(raw.location),

    url: raw.url,

    description: clean(raw.description),

    publishedAt: raw.publishedAt || null,

    jobType: clean(raw.jobType),

    source,
  };
}

function clean(value) {
  if (value == null) return "";

  let text = String(value);

  // Decode HTML entities such as &lt;, &gt;, &amp;, &quot;, &nbsp;
  text = decodeHtmlEntities(text);

  // Remove HTML tags.
  text = text.replace(/<[^>]*>/g, " ");

  // Decode again in case encoded entities were exposed after tag removal.
  text = decodeHtmlEntities(text);

  // Normalize whitespace.
  return text.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      try {
        return String.fromCodePoint(Number(code));
      } catch {
        return _;
      }
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => {
      try {
        return String.fromCodePoint(parseInt(code, 16));
      } catch {
        return _;
      }
    });
}

function stableId(input) {
  let hash = 2166136261;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}
