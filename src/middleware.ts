import { defineMiddleware } from "astro:middleware";
import { SITE_ORIGIN } from "./lib/seo";

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.hostname === "www.groomerhouse.pl") {
    // Assign the path separately: a user-supplied //path must not change origin.
    const destination = new URL(SITE_ORIGIN);
    destination.pathname = context.url.pathname;
    destination.search = context.url.search;
    const status = ["GET", "HEAD"].includes(context.request.method) ? 301 : 308;
    return Response.redirect(destination, status);
  }
  const response = await next();
  if (context.url.pathname.startsWith("/api/") || context.url.pathname === "/googlec1a70dd1837c7567.html") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
});
