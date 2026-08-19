import type { APIRoute } from "astro";
import { marketingPaths } from "../lib/snapshot";
import { getPosts, postPath } from "../lib/wordpress";

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
})[char] || char);

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const urls = [...marketingPaths, "/blog/", "/rezerwacja/", ...posts.map(postPath)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...new Set(urls)].map((route) => `  <url><loc>${escapeXml(new URL(route, "https://groomerhouse.pl").href)}</loc></url>`).join("\n")}
</urlset>`;
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
};
