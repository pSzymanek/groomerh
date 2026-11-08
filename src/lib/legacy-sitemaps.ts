import type { APIRoute } from "astro";
import { canonicalUrl } from "./seo";

export const redirectToSitemap: APIRoute = () => Response.redirect(canonicalUrl("/sitemap.xml"), 301);
