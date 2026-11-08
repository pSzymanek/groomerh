import type { APIRoute } from "astro";
import { getPost, postPath } from "../../../../lib/wordpress";
import { canonicalUrl } from "../../../../lib/seo";

export const GET: APIRoute = async ({ params }) => {
  const post = await getPost(params.slug || "");
  if (!post) return new Response("Nie znaleziono wpisu", { status: 404 });
  return Response.redirect(canonicalUrl(postPath(post)), 301);
};
