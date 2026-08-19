import type { APIRoute } from "astro";
import { escapeHtml, htmlResponse, loadSnapshot, makePortable, stripHtml } from "../../../../lib/snapshot";
import { getPost } from "../../../../lib/wordpress";

const PRESERVED_SLUG = "jak-zostac-groomerem-w-polsce-kompletny-przewodnik";

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug || "";
  const post = await getPost(slug);
  if (!post) return htmlResponse("<!doctype html><meta charset=\"utf-8\"><title>Nie znaleziono wpisu</title><h1>Nie znaleziono wpisu</h1>", 404);

  if (slug === PRESERVED_SLUG) {
    return htmlResponse(makePortable(await loadSnapshot(`/2023/07/31/${PRESERVED_SLUG}/`)));
  }

  const title = escapeHtml(stripHtml(post.title.rendered));
  const canonical = `/${params.year}/${params.month}/${params.day}/${slug}/`;
  const html = `<!doctype html>
  <html lang="pl-PL"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} | Groomer House</title><link rel="canonical" href="${canonical}">
  <link rel="stylesheet" href="/wp-content/themes/hello-elementor/assets/css/reset.css">
  <link rel="stylesheet" href="/wp-content/themes/hello-elementor/assets/css/theme.css">
  <style>body{font-family:Arial,sans-serif;color:#18142c;margin:0}.gh-article{max-width:860px;margin:0 auto;padding:64px 24px;line-height:1.75}.gh-article h1{font-size:clamp(2.2rem,6vw,4.5rem);line-height:1.05}.gh-article h2{font-size:2rem;margin-top:2.6rem}.gh-back{display:inline-block;margin:24px;color:#15122a;text-decoration:none}.gh-article img{max-width:100%;height:auto}.gh-book{position:fixed;right:20px;bottom:20px;background:#64c7c5;color:#111;padding:14px 20px;border-radius:12px;font-weight:700;text-decoration:none}</style>
  </head><body><a class="gh-back" href="/blog/">← Blog</a><article class="gh-article"><h1>${title}</h1>${post.content.rendered}</article><a class="gh-book" href="/rezerwacja/">Umów wizytę</a></body></html>`;
  return htmlResponse(makePortable(html));
};
