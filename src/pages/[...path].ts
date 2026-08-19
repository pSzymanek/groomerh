import type { APIRoute } from "astro";
import { htmlResponse, loadSnapshot, makePortable, marketingPaths } from "../lib/snapshot";

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
  const route = `/${params.path || ""}/`.replace(/\/{2,}/g, "/");
  const redirects: Record<string, string> = {
    "/cennik-uslug/": "/cennik/",
    "/glowna/": "/",
    "/projekt/": "/",
    "/przykladowa-strona/": "/",
  };
  if (redirects[route]) return Response.redirect(new URL(redirects[route], request.url), 301);
  if (!marketingPaths.includes(route)) return htmlResponse("<!doctype html><title>Nie znaleziono strony</title><h1>404</h1>", 404);
  return htmlResponse(makePortable(await loadSnapshot(route)));
};
