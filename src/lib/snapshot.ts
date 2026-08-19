import { readFile } from "node:fs/promises";
import path from "node:path";

const SNAPSHOT_ROOT = path.resolve("archive", "mirror", "groomerhouse.pl");
const LIVE_ORIGIN = "https://groomerhouse.pl";

const SNAPSHOTS: Record<string, string> = {
  "/": "index.html",
  "/kurs-grooming-kotow/": "kurs-grooming-kotow/index.html",
  "/kurs-groomerski/": "kurs-groomerski/index.html",
  "/podstawowy-kurs-groomerski-slask/": "podstawowy-kurs-groomerski-slask/index.html",
  "/cennik/": "cennik/index.html",
  "/polityka-prywatnosci/": "polityka-prywatnosci/index.html",
  "/blog/": "blog/index.html",
  "/2023/07/31/jak-zostac-groomerem-w-polsce-kompletny-przewodnik/":
    "2023/07/31/jak-zostac-groomerem-w-polsce-kompletny-przewodnik/index.html",
};

export const marketingPaths = Object.keys(SNAPSHOTS).filter(
  (route) => route !== "/blog/" && !route.startsWith("/2023/"),
);

export async function loadSnapshot(route: string): Promise<string> {
  const file = SNAPSHOTS[route];
  if (!file) throw new Error(`No preserved snapshot for ${route}`);
  return readFile(path.join(SNAPSHOT_ROOT, file), "utf8");
}

export function makePortable(html: string, options: { bookingPath?: string } = {}): string {
  const bookingPath = options.bookingPath || process.env.BOOKING_PATH || "/rezerwacja/";
  return html
    .replace(/<script[^>]*(?:pixelyoursite|\bpys[-_])[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<noscript>\s*<img[^>]+facebook\.com\/tr[^>]*>\s*<\/noscript>/gi, "")
    .replaceAll(`${LIVE_ORIGIN}/wp-content/`, "/wp-content/")
    .replaceAll(`${LIVE_ORIGIN}/wp-includes/`, "/wp-includes/")
    .replaceAll(`${LIVE_ORIGIN}/wp-json/`, "/api/wordpress/")
    .replaceAll(`${LIVE_ORIGIN}/wp-admin/admin-ajax.php`, `${process.env.WORDPRESS_URL || LIVE_ORIGIN}/wp-admin/admin-ajax.php`)
    .replaceAll("/cennik-uslug", "/cennik/")
    .replaceAll("https://booksy.com/pl-pl/dl/show-business/203451?utm_medium=c2c_referral", bookingPath)
    .replaceAll(`href="${LIVE_ORIGIN}/`, 'href="/')
    .replaceAll(`href='${LIVE_ORIGIN}/`, "href='/")
    .replaceAll(`action="${LIVE_ORIGIN}/`, 'action="/')
    .replaceAll(`action='${LIVE_ORIGIN}/`, "action='/");
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
    },
  });
}

export function stripHtml(value = ""): string {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&hellip;|&#8230;/gi, "…")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeHtml(value = ""): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char] || char);
}
