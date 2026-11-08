import type { APIRoute } from "astro";
import { activePaths, pageDesign, photos, mediaPath } from "../lib/content";
import { getPosts, postPath } from "../lib/wordpress";
import { canonicalUrl, absoluteImageUrl, sitemapDate } from "../lib/seo";
import { getSuccessPage, SUCCESS_PAGE_PATH } from "../lib/wordpress-pages";

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
})[char] || char);

export const GET: APIRoute = async () => {
  if (process.env.SEO_NOINDEX === "true") return new Response(null, { status: 404 });
  const [posts, successPage] = await Promise.all([getPosts(), getSuccessPage()]);
  const staticUrls = [...activePaths, "/blog/", "/rezerwacja/", "/dane-kontaktowe/", "/polityka-prywatnosci/", "/regulamin/"];
  const urls = new Map<string, { modified?: string; image?: string }>(staticUrls.map((route) => [route, {
    image: absoluteImageUrl(route === "/" ? photos.hero : pageDesign[route]?.photo),
  }]));
  if (successPage.state === "published") {
    urls.set(SUCCESS_PAGE_PATH, {
      modified: sitemapDate(successPage.page.modified_gmt || successPage.page.modified),
      image: absoluteImageUrl(successPage.page._embedded?.["wp:featuredmedia"]?.[0]?.source_url),
    });
  }
  for (const post of posts) {
    urls.set(postPath(post), {
      modified: sitemapDate(post.modified_gmt || post.modified),
      image: absoluteImageUrl(post._embedded?.["wp:featuredmedia"]?.[0]?.source_url || mediaPath(post.featured_media)),
    });
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...urls].map(([route, { modified, image }]) => `  <url><loc>${escapeXml(canonicalUrl(route))}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ""}${image ? `<image:image><image:loc>${escapeXml(image)}</image:loc></image:image>` : ""}</url>`).join("\n")}
</urlset>`;
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60",
    },
  });
};
