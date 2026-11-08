import type { APIRoute } from "astro";

const ALLOWED_PREFIXES = ["wp/v2/posts", "wp/v2/pages", "wp/v2/categories", "wp/v2/tags", "wp/v2/media"];

export const GET: APIRoute = async ({ params, request }) => {
  const requestedPath = params.path || "";
  if (!ALLOWED_PREFIXES.some((prefix) => requestedPath.startsWith(prefix))) {
    return new Response(JSON.stringify({ error: "Endpoint niedostępny" }), { status: 404 });
  }

  const wordpress = process.env.WORDPRESS_URL?.replace(/\/$/, "");
  if (!wordpress) {
    return new Response(JSON.stringify({ error: "WordPress nie jest jeszcze skonfigurowany" }), { status: 503, headers: { "content-type": "application/json; charset=utf-8" } });
  }
  const url = new URL(`${wordpress}/wp-json/${requestedPath}`);
  url.search = new URL(request.url).search;
  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(5000) });
  } catch {
    return new Response(JSON.stringify({ error: "WordPress chwilowo niedostępny" }), { status: 503, headers: { "content-type": "application/json; charset=utf-8" } });
  }
  return new Response(response.body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    },
  });
};
