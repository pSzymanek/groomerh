import assert from "node:assert/strict";
import { load } from "cheerio";

const base = new URL(process.argv[2] || "http://127.0.0.1:4399");
assert.ok(["127.0.0.1", "localhost"].includes(base.hostname), "Use a local runtime; no changes to live CMS");
const expected = process.argv[3] || "published";
const route = "/sukcesy-naszych-klientow/";
let checks = 0;
const verify = (value, label) => { assert.ok(value, label); checks++; };
const response = await fetch(new URL(route, base));
verify(response.status === (expected === "published" ? 200 : expected === "missing" ? 404 : 503), "Correct Page availability status");
const $ = load(await response.text());
verify($("main h1").length === 1, "Exactly one page title");
verify($("main h1").text() === "Sukcesy naszych klientów", "Correct Polish title");
verify(response.headers.get("cache-control")?.includes("no-store"), "External cache cannot mask CMS edits/unpublishing");
verify($("#desktop-course-menu a[href='/sukcesy-naszych-klientow/']").length === 1, "New desktop submenu link");
verify($("#mobile-course-menu a[href='/sukcesy-naszych-klientow/']").length === 1, "New mobile submenu link");
if (expected === "published") {
  verify($("[data-wordpress-page]").length === 1, "CMS Page ID attached, not archived static body");
  verify($(".wordpress-content").text().trim().length > 30, "WordPress content rendered server-side");
  verify($("link[rel='canonical']").attr("href") === `https://groomerhouse.pl${route}`, "Canonical on main domain, not CMS");
  verify($("meta[name=robots]").attr("content") === "index,follow", "Published page indexable");
  verify($(".cms-page-content iframe,.cms-page-content script").length === 0, "No iframe/theme/scripts embedded");
  verify($("meta[name=description]").attr("content").length > 20, "Description generated from CMS content");
  verify($("[data-cookie-consent]").length === 1, "Existing privacy controls retained");
} else {
  verify($("meta[name=robots]").attr("content") === "noindex,nofollow", "Unavailable/private Page not indexed");
  verify($("[data-wordpress-page]").length === 0, "No stale/private content in unavailable response");
}
const sitemap = load(await (await fetch(new URL("/sitemap.xml", base))).text(), { xmlMode:true });
verify(sitemap("loc").toArray().some(node => sitemap(node).text() === `https://groomerhouse.pl${route}`) === (expected === "published"), "Sitemap reflects publication status");
if (expected === "published") verify(sitemap("url").filter((_, node) => sitemap(node).find("loc").text().endsWith(route)).find("lastmod").text().match(/^\d{4}-\d{2}-\d{2}$/), "Sitemap uses WordPress modification date");
for (const asset of $("link[rel=stylesheet][href^='/']").map((_, node) => $(node).attr("href")).get()) {
  verify((await fetch(new URL(asset, base))).status === 200, `Page stylesheet available ${asset}`);
}
console.log(JSON.stringify({result:"PASS", checks, expected, base:base.origin}, null, 2));
