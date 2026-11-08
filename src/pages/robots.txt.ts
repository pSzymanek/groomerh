import type { APIRoute } from "astro";
import { SITE_ORIGIN } from "../lib/seo";

export const GET: APIRoute = () => {
  // Even a noindex preview must remain crawlable so bots can see that directive.
  const body = process.env.SEO_NOINDEX === "true"
    ? "User-agent: *\nAllow: /\n"
    : `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=300" } });
};
