import type { APIRoute } from "astro";

const ALLOWED_PREFIXES = ["wp/v2/posts", "wp/v2/pages", "wp/v2/categories", "wp/v2/tags", "wp/v2/media"];

export const GET: APIRoute = async ({ params, request }) => {
  const requestedPath = params.path || "";
  if (!ALLOWED_PREFIXES.some((prefix) => requestedPath.startsWith(prefix))) {
    return new Response(JSON.stringify({ error: "Endpoint niedostępny" }), { status: 404 });
  }

  const wordpress = (process.env.WORDPRESS_URL || "https://groomerhouse.pl").replace(/\/$/, "");
  const url = new URL(`${wordpress}/wp-json/${requestedPath}`);
  url.search = new URL(request.url).search;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    },
  });
};
