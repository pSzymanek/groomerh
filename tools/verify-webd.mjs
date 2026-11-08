import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

// Read-only checks against a separately extracted production package.
const base = new URL(process.argv[2] || "http://127.0.0.1:4399");
assert.ok(["127.0.0.1", "localhost"].includes(base.hostname), "Use a local test server");
const previousPackage = process.argv[3];
const get = (route) => fetch(new URL(route, base), { signal: AbortSignal.timeout(20000) });
let checks = 0;
const verify = (condition, label) => { assert.ok(condition, label); checks++; };

const sitemapResponse = await get("/sitemap.xml");
verify(sitemapResponse.status === 200, "Sitemap status");
verify(sitemapResponse.headers.get("content-type")?.includes("application/xml"), "Sitemap MIME");
const sitemap = load(await sitemapResponse.text(), { xmlMode: true });
const locations = sitemap("loc").map((_, el) => sitemap(el).text()).get();
verify(locations.length >= 12, "Sitemap includes core routes");
verify(new Set(locations).size === locations.length, "Sitemap has no duplicate URLs");
verify(locations.every(url => url.startsWith("https://groomerhouse.pl/")), "Production sitemap origin");

const routes = [...new Set(locations.map(url => new URL(url).pathname))];
const documents = new Map();
for (const route of routes) {
  const response = await get(route);
  verify(response.status === 200, `Route ${route}`);
  const $ = load(await response.text());
  documents.set(route, $);
  verify($("main h1").length === 1, `Single main H1 ${route}`);
  verify($("link[rel=canonical]").attr("href") === `https://groomerhouse.pl${route}`, `Canonical ${route}`);
  verify(!($("meta[name=robots]").attr("content") || "").includes("noindex"), `Indexable ${route}`);
  verify(Boolean($("meta[name=description]").attr("content")), `Description ${route}`);
  verify(!/Poniedziałek\s+\d{2}:\d{2}/.test($("body").text()), `No Monday salon hours ${route}`);
  verify($("footer").text().includes("Poniedziałek — nieczynne"), `Monday closed explicitly ${route}`);
  verify($("footer").text().includes("NIP 6262553631"), `Seller NIP in footer ${route}`);
  verify($("footer img[alt=Przelewy24]").length === 1, `Payment operator in footer ${route}`);
  verify(!/\b9\s+lat\s+doświadczenia|\b50\+?\s+kursant/i.test($("main").text().replace(/\s+/g, " ")), `No outdated business statistics ${route}`);
  verify($("main a[href='/']").filter((_, el) => $(el).text().trim().endsWith("?")).length === 0, `FAQ questions do not navigate home ${route}`);
}

const home = documents.get("/");
verify(home("[data-stat-counter]").length === 3, "Both main figures and experience badge have counters");
verify(home("[data-count-target='10']").length === 2, "Experience is over ten years in strip and badge");
verify(home("[data-count-target='100']").length === 1, "Graduate count is one hundred plus");
verify(home("[data-count-value]").map((_, el) => home(el).text()).get().join(",") === "10,100,10", "Final numbers are rendered without requiring JavaScript");
verify(home(".stat-value-a11y").length === 3 && home(".stat-visual[aria-hidden='true']").length === 3, "Screen readers get static final figures, not animation updates");
const about = documents.get("/o-mnie/");
verify(about("main").text().includes("ponad 100 kursantów"), "About page graduate count updated");
verify(about("main").text().includes("ponad 10 lat doświadczenia"), "About page experience updated");

const assets = new Set();
for (const $ of documents.values()) {
  $("img[src],script[src],link[rel=stylesheet][href]").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("href");
    if (src?.startsWith("/") && !src.startsWith("//")) assets.add(src);
  });
}
await Promise.all([...assets].map(async src => {
  const response = await get(src);
  verify(response.status === 200, `Asset ${src}`);
  verify((await response.arrayBuffer()).byteLength > 0, `Nonempty asset ${src}`);
}));

const booking = documents.get("/rezerwacja/");
verify(booking("iframe").attr("src") === "https://wp.groomerhouse.pl/index.php/rezerwacja/", "WordPress embedded in-page");
verify(booking("a[target=_blank][href*='wp.groomerhouse.pl']").length === 0, "No new WordPress tab link");
verify(booking(".booking-demo-note").length === 0, "No demo offer");
verify(booking("[data-course-package]").length === 3, "Three real packages on booking page");
verify(booking("#salon a[href*='booksy.com']").length === 1, "Booksy remains below course booking");
verify(booking("[data-booking-reload]").length === 1, "Same-frame reload control");
verify(booking("[data-cookie-consent]").length === 1, "Consent banner retained");
const courses = documents.get("/kurs-groomerski/");
verify(courses(".faq-question").length === 6, "All six main course FAQ questions preserved as static text");
verify(courses(".faq-online-payment").text().includes("panelu rezerwacji"), "FAQ explains online payment through booking panel");
verify(courses(".faq-online-payment a").attr("href") === "/rezerwacja/#szkolenia", "Payment answer links to booking panel");
for (const route of ["/kurs-groomerski/", "/podstawowy-kurs-groomerski-slask/", "/kurs-grooming-kotow/", "/kurs-groomerski-ruda-slaska/"]) {
  verify(documents.get(route)("details,summary").length === 0, `FAQ answers visible without clicking ${route}`);
}
verify(courses(".page-hero-framed .page-hero-image").length === 1, "Course hero image inset from viewport edge");
verify(courses("[data-course-package]").length === 3, "Visual course cards");
for (const [id, hours, price] of [[1,40,4500],[2,80,6500],[3,120,8500]]) {
  const card = courses(`[data-course-package='${id}']`);
  verify(card.find(".course-package-price").text().replace(/\s/g, "").includes(String(price)), `Booknetic price package ${id}`);
  verify(card.find(".course-package-hours").text().includes(String(hours)), `Hours package ${id}`);
  verify(card.find("a").attr("href") === "/rezerwacja/#szkolenia", `Booking CTA package ${id}`);
}
verify(!/Finansowanie kursu groomerskiego z Urzędu Pracy/i.test(courses("main").text()), "Removed funding section");
verify(!/\b(?:3\s?900|5\s?900|7\s?500)\b/.test(courses("main").text()), "No old package prices");
for (const route of ["/kurs-groomerski/", "/kurs-grooming-kotow/"]) {
  verify(!/zadat(?:ek|ku)/i.test(documents.get(route)("main").text()), `Deposit wording consistent ${route}`);
  verify(documents.get(route)("main").text().includes("500 zł"), `Deposit amount preserved ${route}`);
}
for (const route of ["/podstawowy-kurs-groomerski-slask/", "/kurs-grooming-kotow/"]) {
  verify(documents.has(route), `Original course subpage ${route}`);
  verify(courses(`.nav-course-menu a[href='${route}']`).length === 2, `Desktop and mobile submenu ${route}`);
}
verify(courses("#desktop-course-menu a").first().attr("href") === "/kurs-groomerski/", "Overview first in desktop course menu");
verify(courses("#mobile-course-menu a").first().attr("href") === "/kurs-groomerski/", "Overview first in mobile course menu");
for (const route of ["/dane-kontaktowe/", "/polityka-prywatnosci/", "/regulamin/"]) {
  verify(documents.get(route)("main").text().includes("41-933"), `Postal code in ${route}`);
}
verify(documents.get("/")("script[type='application/ld+json']").text().includes('"postalCode":"41-933"'), "Business postal structured data");
const blog = documents.get("/blog/");
verify(!blog("main").text().includes("Hello world"), "WordPress starter post excluded");
verify(blog("main a[href='/kapiel-ozonowa-dla-psa/']").length > 0, "Imported article public path retained");
verify(documents.get("/polityka-prywatnosci/")("main").text().includes("Przelewy24"), "Privacy includes payments");

const robots = await (await get("/robots.txt")).text();
verify(robots.includes("Sitemap: https://groomerhouse.pl/sitemap.xml"), "Robots sitemap directive");
const trackingResponse = await get("/api/tracking-config");
verify(trackingResponse.status === 200, "Tracking config endpoint");
verify(trackingResponse.headers.get("cache-control")?.includes("no-store"), "Tracking config not cached");
verify(JSON.stringify(await trackingResponse.json()) === JSON.stringify({ga4Id:"",metaPixelId:""}), "No unconfigured tracking IDs");
const verification = await get("/googlec1a70dd1837c7567.html");
verify(verification.status === 200 && (await verification.text()).includes("google-site-verification: googlec1a70dd1837c7567.html"), "GSC verification retained");
for (const route of ["/sitemap_index.xml", "/wp-sitemap.xml", "/page-sitemap.xml", "/post-sitemap.xml"]) {
  // Verify the local redirect itself, not an older live deployment at its target.
  const response = await fetch(new URL(route, base), { redirect: "manual", signal: AbortSignal.timeout(20000) });
  verify(response.status === 301, `Legacy sitemap redirect ${route}`);
  verify(response.headers.get("location") === "https://groomerhouse.pl/sitemap.xml", `Legacy sitemap destination ${route}`);
}

if (previousPackage) {
  for (const route of ["/", "/dane-kontaktowe/", "/polityka-prywatnosci/", "/regulamin/"]) {
    const previous = load(await readFile(path.join(previousPackage, "dist/client", route, "index.html"), "utf8"));
    const current = documents.get(route);
    const text = $ => $("main").clone().find(".stat-strip,.split-badge").remove().end().text().replace(/\s+/g, " ").trim();
    // Contact/legal copy now includes the postcode and current payment tools.
    // Compare homepage copy outside the explicitly updated statistics/badge,
    // plus image preservation for every page.
    if (route === "/") verify(text(current) === text(previous), `Visible content preserved ${route}`);
    const images = $ => $("main img[src]").map((_, el) => $(el).attr("src")).get();
    verify(JSON.stringify(images(current)) === JSON.stringify(images(previous)), `Images preserved ${route}`);
  }
}
console.log(JSON.stringify({ checks, routes: routes.length, assets: assets.size, result: "PASS", base: base.origin }, null, 2));
