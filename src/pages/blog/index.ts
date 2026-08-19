import type { APIRoute } from "astro";
import { htmlResponse, loadSnapshot, makePortable } from "../../lib/snapshot";
import { getPosts, primaryPostCards, replaceDivContents, sidebarPostCards } from "../../lib/wordpress";

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  let html = await loadSnapshot("/blog/");
  html = replaceDivContents(
    html,
    "elementor-posts elementor-posts--skin-cards elementor-grid",
    primaryPostCards(posts),
  );
  html = replaceDivContents(
    html,
    "elementor-posts elementor-posts--skin-classic elementor-grid",
    sidebarPostCards(posts),
  );
  return htmlResponse(makePortable(html));
};
