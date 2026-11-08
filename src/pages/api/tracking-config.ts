import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const ga4Candidate = process.env.GA4_MEASUREMENT_ID?.trim() || "";
  const metaCandidate = process.env.META_PIXEL_ID?.trim() || "";
  const gtmCandidate = process.env.GTM_CONTAINER_ID?.trim() || "";
  const ga4Id = /^G-[A-Z0-9]+$/.test(ga4Candidate) ? ga4Candidate : "";
  const metaPixelId = /^\d{8,25}$/.test(metaCandidate) ? metaCandidate : "";
  const gtmContainerId = /^GTM-[A-Z0-9]+$/.test(gtmCandidate) ? gtmCandidate : "";

  return new Response(JSON.stringify({ ga4Id, metaPixelId, gtmContainerId }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "x-robots-tag": "noindex, nofollow",
    },
  });
};
