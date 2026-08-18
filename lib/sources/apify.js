// lib/sources/apify.js

const APIFY_API_BASE = "https://api.apify.com/v2";

export function createApifySource() {
  return {
    name: "Apify LinkedIn Jobs Adapter",

    async fetchJobs({ limit = 50 } = {}) {
      const token = process.env.APIFY_API_TOKEN;
      const actorId = process.env.APIFY_ACTOR_ID;

      if (!token) {
        throw new Error(
          "APIFY_API_TOKEN is not configured"
        );
      }

      if (!actorId) {
        throw new Error(
          "APIFY_ACTOR_ID is not configured"
        );
      }

      const safeLimit = normalizeLimit(limit);

      const searchUrl =
        process.env.LINKEDIN_JOBS_SEARCH_URL;

      if (!searchUrl) {
        throw new Error(
          "LINKEDIN_JOBS_SEARCH_URL is not configured"
        );
      }

      console.log(
        `[APIFY] Starting LinkedIn Jobs Actor: ${actorId}`
      );

      console.log(
        `[APIFY] Requested maximum jobs: ${safeLimit}`
      );

      console.log(
        `[APIFY] Search URL: ${searchUrl}`
      );

      const runUrl =
        `${APIFY_API_BASE}/acts/` +
        `${encodeURIComponent(actorId)}` +
        `/runs?token=${encodeURIComponent(token)}` +
        `&waitForFinish=120`;

      console.log(
        "[APIFY] Starting Actor run..."
      );

      let runResponse;

      try {
        runResponse = await fetch(runUrl, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            urls: [searchUrl],

            count: safeLimit,

            scrapeCompany: true,

            splitByLocation: false,
          }),

          cache: "no-store",
        });
      } catch (error) {
        throw new Error(
          `Apify Actor network request failed: ${
            error?.message ||
            "unknown error"
          }`
        );
      }

      if (!runResponse.ok) {
        const errorBody =
          await safeReadResponse(runResponse);

        throw new Error(
          `Apify run HTTP ${runResponse.status}` +
            `${
              errorBody
                ? `: ${errorBody}`
                : ""
            }`
        );
      }

      const run =
        await safeJson(
          runResponse,
          "Apify run response"
        );

      const runData = run?.data;

      if (!runData) {
        throw new Error(
          "Apify returned an invalid run response"
        );
      }

      const datasetId =
        runData.defaultDatasetId;

      if (!datasetId) {
        throw new Error(
          "Apify did not return a default dataset id"
        );
      }

      console.log(
        `[APIFY] Actor run completed: ${
          runData.id || "unknown"
        }`
      );

      console.log(
        `[APIFY] Dataset: ${datasetId}`
      );

      const datasetUrl =
        `${APIFY_API_BASE}/datasets/` +
        `${encodeURIComponent(datasetId)}` +
        `/items?token=${encodeURIComponent(token)}` +
        `&clean=true`;

      console.log(
        "[APIFY] Fetching dataset..."
      );

      let datasetResponse;

      try {
        datasetResponse = await fetch(
          datasetUrl,
          {
            method: "GET",

            headers: {
              Accept: "application/json",
            },

            cache: "no-store",
          }
        );
      } catch (error) {
        throw new Error(
          `Apify dataset network request failed: ${
            error?.message ||
            "unknown error"
          }`
        );
      }

      if (!datasetResponse.ok) {
        const errorBody =
          await safeReadResponse(
            datasetResponse
          );

        throw new Error(
          `Apify dataset HTTP ${datasetResponse.status}` +
            `${
              errorBody
                ? `: ${errorBody}`
                : ""
            }`
        );
      }

      const items =
        await safeJson(
          datasetResponse,
          "Apify dataset response"
        );

      if (!Array.isArray(items)) {
        throw new Error(
          "Apify dataset is not an array"
        );
      }

      console.log(
        `[APIFY] Dataset records received: ${items.length}`
      );

      if (items.length > 0) {
        console.log(
          "[APIFY] First record keys:",
          Object.keys(items[0])
        );
      }

      const normalizedJobs = items
        .slice(0, safeLimit)
        .map((job, index) => {
          try {
            return normalizeApifyJob(
              job,
              index
            );
          } catch (error) {
            console.log(
              `[APIFY] Failed to normalize record ${index}: ` +
                `${
                  error?.message ||
                  "unknown error"
                }`
            );

            return null;
          }
        })
        .filter(Boolean);

      console.log(
        `[APIFY] Normalized jobs: ${normalizedJobs.length}`
      );

      if (
        normalizedJobs.length === 0 &&
        items.length > 0
      ) {
        throw new Error(
          "Apify returned records, but none could be normalized"
        );
      }

      if (normalizedJobs.length === 0) {
        throw new Error(
          "Apify returned 0 usable jobs"
        );
      }

      return normalizedJobs;
    },
  };
}

function normalizeApifyJob(
  job,
  index
) {
  if (
    !job ||
    typeof job !== "object"
  ) {
    throw new Error(
      `record ${index} is not an object`
    );
  }

  /*
   * This Actor's documented output uses:
   *
   * id
   * link
   * title
   * companyName
   * location
   * postedAt
   * descriptionText
   *
   * See the Actor's sample output.
   */

  const id =
    firstValue(
      job.id,
      job.jobId,
      job.linkedinJobId,
      job.link
    );

  const title =
    firstValue(
      job.title,
      job.jobTitle,
      job.position
    );

  const company =
    firstValue(
      job.companyName,
      job.company,
      job.company_name
    );

  const location =
    normalizeLocation(
      job.location
    );

  const url =
    firstValue(
      job.link,
      job.url,
      job.jobUrl,
      job.linkedinUrl
    );

  const description =
    firstValue(
      job.descriptionText,
      job.description,
      job.descriptionHtml,
      job.summary
    ) || "";

  const publishedAt =
    firstValue(
      job.postedAt,
      job.publishedAt,
      job.postedDate,
      job.date
    );

  const jobType =
    firstValue(
      job.employmentType,
      job.jobType,
      job.job_type
    ) || "";

  if (!title) {
    throw new Error(
      `record ${index} is missing title`
    );
  }

  if (!company) {
    throw new Error(
      `record ${index} is missing companyName`
    );
  }

  if (!url) {
    throw new Error(
      `record ${index} is missing link`
    );
  }

  return {
    id:
      String(
        id ||
          `apify-${index}`
      ),

    title:
      String(title),

    company:
      String(company),

    location:
      location,

    url:
      String(url),

    description:
      String(description),

    publishedAt:
      publishedAt
        ? String(publishedAt)
        : null,

    jobType:
      String(jobType),

    source:
      "Apify LinkedIn Jobs",
  };
}

function normalizeLocation(
  location
) {
  if (!location) {
    return "";
  }

  if (
    typeof location === "string"
  ) {
    return location;
  }

  if (
    typeof location === "object"
  ) {
    return (
      location.defaultLocalizedName ||
      location.abbreviatedLocalizedName ||
      location.name ||
      ""
    );
  }

  return String(location);
}

function firstValue(
  ...values
) {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return null;
}

function normalizeLimit(
  limit
) {
  const parsed =
    Number(limit);

  if (
    !Number.isFinite(parsed)
  ) {
    return 50;
  }

  return Math.min(
    Math.max(
      Math.floor(parsed),
      10
    ),
    1000
  );
}

async function safeJson(
  response,
  responseName
) {
  try {
    return await response.json();
  } catch {
    throw new Error(
      `${responseName} was not valid JSON`
    );
  }
}

async function safeReadResponse(
  response
) {
  try {
    const text =
      await response.text();

    if (!text) {
      return "";
    }

    return text.slice(
      0,
      1000
    );
  } catch {
    return "";
  }
}