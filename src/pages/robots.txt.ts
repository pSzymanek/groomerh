import type { APIRoute } from "astro";

export const GET: APIRoute = () => new Response(
  "User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: https://groomerhouse.pl/sitemap.xml\n",
  { headers: { "content-type": "text/plain; charset=utf-8" } },
);
