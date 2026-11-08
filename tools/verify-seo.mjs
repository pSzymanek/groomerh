import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { load } from "cheerio";

// Unit checks never contact WordPress, image hosts, Search Console or payments.
// Supply a localhost URL to additionally inspect a running, extracted package.
let checks = 0;
const verify = (condition, label) => { assert.ok(condition, label); checks++; };
const source = await readFile("src/lib/seo.ts", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
vm.runInNewContext(compiled, { exports, require: createRequire(import.meta.url), URL }, { filename: "seo.ts" });
const {
  SITE_ORIGIN, canonicalUrl, seoText, seoExcerpt, normalizedSeoTitle,
  absoluteImageUrl, sitemapDate, wordpressUtcDate, structuredPageData, serializeJsonLd,
} = exports;

verify(SITE_ORIGIN === "https://groomerhouse.pl", "One fixed production SEO origin");
verify(canonicalUrl("/blog/") === `${SITE_ORIGIN}/blog/`, "Absolute public canonical URL");
verify(seoText("<h2>Zażółć &amp; gęślą</h2><p>jaźń<br>dalej</p><script>tracking()</script><style>.hidden{}</style>") === "Zażółć & gęślą jaźń dalej", "SEO text preserves Polish letters, entities and block boundaries; excludes executable text");
verify(seoText('<a href="javascript:alert(1)">Zwykły tekst</a>') === "Zwykły tekst", "HTML href including javascript never leaks into a text-only SEO field");
verify(seoExcerpt("<script>tracking()</script>", "<p>Opis zastępczy</p>") === "Opis zastępczy", "Empty useful excerpt falls back to real content");
verify(seoExcerpt("<p>Krótki opis.</p>") === "Krótki opis.", "Short excerpt is not altered");
const excerpt = seoExcerpt("<p>To jest rzeczywisty dłuższy opis kursu groomerskiego dla uczestników szkolenia.</p>", "", 45);
verify(excerpt.length <= 45 && excerpt.endsWith("…") && !excerpt.includes("<"), "Long excerpt is safely truncated with ellipsis");
verify(normalizedSeoTitle("Poradnik | Groomer House | Groomer House") === "Poradnik | Groomer House", "Repeated brand suffix removed");
verify(normalizedSeoTitle("Poradnik | Groomer House") === "Poradnik | Groomer House", "Single existing brand suffix preserved");
verify(normalizedSeoTitle("Kurs Groomer House — Bytom") === "Kurs Groomer House — Bytom", "Editorial title wording preserved");

verify(absoluteImageUrl("/images/course.webp") === `${SITE_ORIGIN}/images/course.webp`, "Relative social image becomes public absolute URL");
verify(absoluteImageUrl("http://wp.groomerhouse.pl/photo.jpg") === "https://wp.groomerhouse.pl/photo.jpg", "Owned CMS image upgraded to HTTPS");
for (const invalid of ["javascript:alert(1)", "java\nscript:alert(1)", "data:image/svg+xml,evil", "file:///private.png", "https://["]) {
  verify(absoluteImageUrl(invalid) === undefined, `Invalid or executable social-image URL rejected: ${invalid}`);
}

verify(sitemapDate("2024-02-29T12:30:00Z") === "2024-02-29", "Valid leap day supported");
for (const invalid of [undefined, "", "0000-00-00", "2026-02-30", "2026-13-01", "23.10.2026", "not-a-date"]) {
  verify(sitemapDate(invalid) === undefined, `Invalid sitemap date omitted: ${invalid}`);
}
verify(wordpressUtcDate("2026-10-23T12:30:00") === "2026-10-23T12:30:00.000Z", "WP GMT field without suffix interpreted as UTC");
verify(wordpressUtcDate("2026-10-23T12:30:00+02:00") === "2026-10-23T10:30:00.000Z", "Explicit timestamp offset respected");
for (const invalid of [undefined, "", "0000-00-00T00:00:00", "2026-02-30T12:00:00", "2026-10-23T24:00:00", "2026-10-23T25:00:00", "2026-10-23", "not-a-date"]) {
  verify(wordpressUtcDate(invalid) === undefined, `Invalid publication timestamp omitted: ${invalid}`);
}

const dangerous = { headline: '</script><script>alert("x")</script>', separator: "one\u2028two\u2029three", polish: "Żółć" };
const serialized = serializeJsonLd(dangerous);
verify(!serialized.includes("<") && !serialized.includes("\u2028") && !serialized.includes("\u2029"), "Inline JSON-LD escapes script closers and Unicode line separators");
verify(JSON.stringify(JSON.parse(serialized)) === JSON.stringify(dangerous), "Escaped JSON-LD remains lossless valid JSON");

const options = {
  path: "/przykladowy-wpis/", title: "Prawdziwy tytuł", description: "Prawdziwy opis",
  image: "javascript:alert(1)",
  article: { headline: "<strong>Prawdziwy tytuł</strong>", publishedGmt: "2026-10-23T12:30:00", modifiedGmt: "invalid" },
};
const structured = JSON.parse(JSON.stringify(structuredPageData(options)));
const types = item => Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
const findType = (graph, type) => graph.find(item => types(item).includes(type));
verify(structured["@context"] === "https://schema.org" && Array.isArray(structured["@graph"]), "JSON-LD graph uses Schema.org context");
const business = findType(structured["@graph"], "LocalBusiness");
verify(business.name === "Groomer House" && business.address.postalCode === "41-933", "LocalBusiness identifies actual business and postal address");
verify(!("aggregateRating" in business) && !("review" in business), "No invented self-serving review stars");
verify(!business.openingHoursSpecification.some(hours => hours.dayOfWeek.endsWith("Monday")), "No fabricated Monday opening hours");
verify(Boolean(findType(structured["@graph"], "WebSite")), "WebSite entity included");
verify(findType(structured["@graph"], "WebPage").url === `${SITE_ORIGIN}/przykladowy-wpis/`, "WebPage uses public canonical");
verify(findType(structured["@graph"], "BreadcrumbList").itemListElement.length >= 2, "Non-home page has real breadcrumb path");
const article = findType(structured["@graph"], "BlogPosting");
verify(article.headline === "Prawdziwy tytuł" && article.datePublished === "2026-10-23T12:30:00.000Z", "BlogPosting title stripped and publication date is UTC");
verify(!("dateModified" in article) && !("author" in article), "Unknown date and fictional author omitted");
verify(!JSON.stringify(structured).includes("javascript:"), "Unsafe image does not enter structured data");
verify(!findType(structured["@graph"], "FAQPage"), "No retired Google FAQ rich-result markup promised");
const homepage = structuredPageData({ path: "/", title: "Groomer House", description: "Salon" });
verify(!findType(homepage["@graph"], "BreadcrumbList"), "Homepage does not invent a one-item breadcrumb");
for (const [route, type] of [["/o-mnie/", "AboutPage"], ["/dane-kontaktowe/", "ContactPage"], ["/blog/", "CollectionPage"], ["/sukcesy-naszych-klientow/", "CollectionPage"]]) {
  verify(Boolean(findType(structuredPageData({ path: route, title: type, description: "Opis" })["@graph"], type)), `Specific WebPage subtype ${route}`);
}

const requestedBase = process.argv[2];
let routeCount = 0;
let articleCount = 0;
if (requestedBase) {
  const base = new URL(requestedBase);
  verify(["127.0.0.1", "localhost", "[::1]"].includes(base.hostname), "Runtime SEO checks restricted to localhost");
  const get = route => fetch(new URL(route, base), { redirect: "manual", signal: AbortSignal.timeout(25000) });
  const sitemapResponse = await get("/sitemap.xml");
  verify(sitemapResponse.status === 200, "Sitemap HTTP 200");
  verify(/(?:application|text)\/xml/i.test(sitemapResponse.headers.get("content-type") || ""), "Sitemap XML content type");
  const xml = await sitemapResponse.text();
  const sitemap = load(xml, { xmlMode: true });
  verify(sitemap("urlset").attr("xmlns") === "http://www.sitemaps.org/schemas/sitemap/0.9", "Sitemap protocol namespace");
  verify(sitemap("urlset").attr("xmlns:image") === "http://www.google.com/schemas/sitemap-image/1.1", "Image sitemap namespace");
  const locations = sitemap("url > loc").map((_, element) => sitemap(element).text()).get();
  verify(locations.length >= 16, "Sitemap includes core routes, three posts and CMS success page");
  verify(new Set(locations).size === locations.length, "Sitemap contains no duplicate canonical URLs");
  for (const location of locations) {
    const url = new URL(location);
    verify(url.origin === SITE_ORIGIN && !url.search && !url.hash && !url.username && !url.password, `Canonical HTTPS root-host sitemap URL: ${location}`);
  }
  verify(locations.includes(`${SITE_ORIGIN}/sukcesy-naszych-klientow/`), "Published editable page included");
  const imageLocations = sitemap("image\\:loc").map((_, element) => sitemap(element).text()).get();
  verify(imageLocations.length > 0, "Sitemap exposes actual content images");
  for (const image of imageLocations) verify(/^https:\/\//.test(image), `Absolute HTTPS sitemap image: ${image}`);
  sitemap("lastmod").each((_, element) => {
    const value = sitemap(element).text();
    verify(Boolean(sitemapDate(value)), `Real calendar date in lastmod: ${value}`);
    if (value.includes("T")) verify(/Z$/.test(value) && Boolean(wordpressUtcDate(value)), `Sitemap timestamp has UTC timezone: ${value}`);
  });

  const titles = new Map();
  const descriptions = new Map();
  const webPageTypes = ["WebPage", "AboutPage", "ContactPage", "CollectionPage"];
  for (const canonical of locations) {
    const route = new URL(canonical).pathname;
    const response = await get(route);
    verify(response.status === 200, `Indexable page HTTP 200: ${route}`);
    verify(!/noindex/i.test(response.headers.get("x-robots-tag") || ""), `No noindex response header: ${route}`);
    const $ = load(await response.text());
    verify($("h1").length === 1 && Boolean($("main h1").text().trim()), `One meaningful H1 in main: ${route}`);
    verify($("link[rel='canonical']").length === 1 && $("link[rel='canonical']").attr("href") === canonical, `One exact canonical: ${route}`);
    const robots = ($("meta[name='robots']").attr("content") || "").toLowerCase().split(/[\s,]+/);
    verify(robots.includes("index") && robots.includes("follow") && !robots.includes("noindex") && !robots.includes("nofollow"), `Explicit index,follow: ${route}`);
    const title = $("head title").text().trim();
    const description = ($("meta[name='description']").attr("content") || "").trim();
    verify(Boolean(title) && $("head title").length === 1, `One populated title: ${route}`);
    verify(Boolean(description) && $("meta[name='description']").length === 1, `One populated description: ${route}`);
    verify(!titles.has(title), `Unique title: ${route}; duplicate ${titles.get(title) || "none"}`);
    verify(!descriptions.has(description), `Unique description: ${route}; duplicate ${descriptions.get(description) || "none"}`);
    titles.set(title, route);
    descriptions.set(description, route);
    verify(!/(?:\|\s*Groomer\s*House){2}/i.test(title), `No duplicate brand suffix: ${route}`);
    for (const [key, expected] of [["og:title", title], ["og:description", description], ["og:url", canonical]]) {
      verify($(`meta[property='${key}']`).attr("content") === expected, `Matching ${key}: ${route}`);
    }
    const ogImage = $("meta[property='og:image']").attr("content") || "";
    verify(/^https:\/\//.test(ogImage) && Boolean($("meta[property='og:image:alt']").attr("content")), `Absolute social image and alt: ${route}`);
    verify($("meta[name='twitter:card']").attr("content") === "summary_large_image", `Twitter image card: ${route}`);
    for (const [key, expected] of [["twitter:title", title], ["twitter:description", description], ["twitter:image", ogImage]]) {
      verify($(`meta[name='${key}']`).attr("content") === expected, `Matching ${key}: ${route}`);
    }
    const graphs = [];
    $("script[type='application/ld+json']").each((_, element) => {
      let data;
      assert.doesNotThrow(() => { data = JSON.parse($(element).text()); }, `Parseable JSON-LD: ${route}`);
      checks++;
      verify(data["@context"] === "https://schema.org" && Array.isArray(data["@graph"]), `Schema.org graph: ${route}`);
      graphs.push(...data["@graph"]);
    });
    verify(Boolean(findType(graphs, "LocalBusiness")) && Boolean(findType(graphs, "WebSite")), `LocalBusiness and WebSite entities: ${route}`);
    verify(graphs.some(item => types(item).some(type => webPageTypes.includes(type)) && item.url === canonical), `WebPage entity matches canonical: ${route}`);
    if (route !== "/") {
      const breadcrumb = findType(graphs, "BreadcrumbList");
      verify(Boolean(breadcrumb) && breadcrumb.itemListElement.length >= 2, `Two or more breadcrumb items: ${route}`);
      breadcrumb.itemListElement.forEach((item, index) => {
        verify(item.position === index + 1 && Boolean(item.name) && item.item?.startsWith(`${SITE_ORIGIN}/`), `Valid breadcrumb ${index + 1}: ${route}`);
      });
    }
    if ($("meta[property='og:type']").attr("content") === "article") {
      articleCount++;
      const entry = findType(graphs, "BlogPosting");
      verify(Boolean(entry) && entry.url === canonical && Boolean(entry.headline), `BlogPosting for real article: ${route}`);
      verify(!("author" in entry), `No inferred fictional article author: ${route}`);
      for (const field of ["datePublished", "dateModified"]) {
        if (entry[field]) verify(/Z$/.test(entry[field]) && Boolean(wordpressUtcDate(entry[field].replace(/\.\d{3}Z$/, "Z"))), `Valid optional GMT ${field}: ${route}`);
      }
    }
    routeCount++;
  }
  verify(articleCount >= 1, "Live sitemap includes and renders WordPress blog articles");
  const robotsResponse = await get("/robots.txt");
  verify(robotsResponse.status === 200 && (await robotsResponse.text()).includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`), "Robots points at public sitemap");
  const missing = await get("/seo-check-missing-page-20261024/");
  const missingHtml = load(await missing.text());
  verify(missing.status === 404, "Unknown URL keeps real HTTP 404");
  verify(/noindex/.test(missingHtml("meta[name='robots']").attr("content") || ""), "404 is noindex");
  verify(missingHtml("script[type='application/ld+json'],link[rel='canonical']").length === 0, "404 has no public schema or false canonical");
  for (const route of ["/googlec1a70dd1837c7567.html", "/api/tracking-config", "/api/wordpress/wp/v2/posts"]) {
    const response = await get(route);
    const directives = (response.headers.get("x-robots-tag") || "").toLowerCase();
    verify(directives.includes("noindex") && directives.includes("nofollow"), `Technical resource excluded from indexing by header: ${route}`);
    if (!route.startsWith("/api/wordpress/")) verify(response.status === 200, `Technical resource works: ${route}`);
    await response.arrayBuffer();
  }
}
console.log(JSON.stringify({ result: "PASS", checks, runtime: Boolean(requestedBase), routes: routeCount, articles: articleCount, externalImageRequests: 0, liveCmsMutations: 0 }, null, 2));
