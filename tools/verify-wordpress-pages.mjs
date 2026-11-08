import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import { load } from "cheerio";

const source = await readFile("src/lib/wordpress-pages.ts", "utf8");
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
let moduleId = 0;
const fresh = () => import(`data:text/javascript;base64,${Buffer.from(js + `\n// ${moduleId++}`).toString("base64")}`);
const response = data => new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
const page = (text = "Pierwsza treść", extra = {}) => ({ id: 1500, slug: "sukcesy-naszych-klientow", status: "publish", title: { rendered: "Sukcesy naszych klientów" }, content: { rendered: `<p>${text}</p>` }, modified: "2026-10-23T12:00:00", ...extra });
const originalFetch = globalThis.fetch;
const originalNow = Date.now;
const originalOrigin = process.env.WORDPRESS_URL;
let checks = 0;
const verify = (value, label) => { assert.ok(value, label); checks++; };
try {
  process.env.WORDPRESS_URL = "https://cms-pages.example/";
  let now = originalNow();
  Date.now = () => now;
  let calls = 0;
  globalThis.fetch = async url => {
    calls++;
    const parsed = new URL(url);
    verify(parsed.pathname === "/wp-json/wp/v2/pages", "Uses Pages, not Posts");
    verify(parsed.searchParams.get("slug") === "sukcesy-naszych-klientow", "Requests exactly allowed Page slug");
    verify(parsed.searchParams.get("status") === "publish", "Only published Pages");
    verify(parsed.searchParams.get("_embed") === "wp:featuredmedia", "Featured image embedded");
    return response([page()]);
  };
  const reader = await fresh();
  const [first, parallel] = await Promise.all([reader.getSuccessPage(), reader.getSuccessPage()]);
  verify(first.state === "published" && first.page.id === 1500, "Reads published Page");
  verify(first === parallel && calls === 1, "Concurrent requests deduplicated");
  verify(await reader.getSuccessPage() === first && calls === 1, "Reuses thirty-second cache");
  now += 31_000;
  globalThis.fetch = async () => response([page("Nowa treść po edycji w CMS")]);
  const edited = await reader.getSuccessPage();
  verify(edited.state === "published" && edited.page.content.rendered.includes("Nowa treść"), "Edits visible after cache expiry without rebuild");
  now += 31_000;
  globalThis.fetch = async () => { throw new Error("offline"); };
  const stale = await reader.getSuccessPage();
  verify(stale.state === "published" && stale.stale, "Short outage retains last successful Page");
  now += 301_000;
  verify((await reader.getSuccessPage()).state === "unavailable", "Does not retain stale personal stories indefinitely");
  now += 6000;
  globalThis.fetch = async () => response([]);
  verify((await reader.getSuccessPage()).state === "missing", "Draft/deletion produces missing, never archive resurrection");
  now += 31_000;
  globalThis.fetch = async () => { throw new Error("offline"); };
  verify((await reader.getSuccessPage()).state === "missing", "Outage after deletion does not restore old page");
  const offline = await fresh();
  verify((await offline.getSuccessPage()).state === "unavailable", "Cold outage handled explicitly, no fake success stories");
  for (const bad of [{wrong:"shape"}, [page("private", {content:{rendered:"secret",protected:true}})]]) {
    const test = await fresh();
    globalThis.fetch = async () => response(bad);
    const result = await test.getSuccessPage();
    verify(result.state !== "published", "Malformed/password-protected Page not rendered");
  }
  globalThis.fetch = async () => response([page("one")]);
  const origins = await fresh();
  await origins.getSuccessPage();
  process.env.WORDPRESS_URL = "https://different-cms.example";
  globalThis.fetch = async () => response([page("two")]);
  verify((await origins.getSuccessPage()).page.content.rendered.includes("two"), "Cache isolated by CMS origin");
} finally {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  if (originalOrigin === undefined) delete process.env.WORDPRESS_URL;
  else process.env.WORDPRESS_URL = originalOrigin;
}

const htmlSource = await readFile("src/lib/wordpress-page-content.ts", "utf8");
const htmlJs = ts.transpileModule(htmlSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
vm.runInNewContext(htmlJs, {exports, require:createRequire(import.meta.url)});
const {cleanWordPressPageHtml: clean, wordPressPageText: text} = exports;
const html = `<h1>Nagłówek</h1><p>Treść żółć &amp; ćwiczenia</p><script>danger()</script><iframe src="https://tracking.example"></iframe><img src="https://wp.groomerhouse.pl/photo.jpg" alt="Zdjęcie kursantki" onerror="alert(1)"><a href="javascript:alert(1)">Zły link</a><a href="https://example.org" target="_blank">Salon</a><div class="wp-block-columns evil"><div class="wp-block-column"><figure class="wp-block-image"><img src="/images/local.webp"></figure></div></div>`;
const $ = load(clean(html));
verify($("h1").length === 0 && $("h2").text() === "Nagłówek", "Content H1 demoted; template retains one H1");
verify($("script,iframe,form,svg,style").length === 0, "Executable/tracking embeds removed");
verify($("img[onerror]").length === 0, "Inline script handlers removed");
verify($("a[href^='javascript']").length === 0, "Dangerous href removed");
verify($("a[target='_blank']").attr("rel") === "noopener noreferrer", "External links safely open");
verify($(".wp-block-columns .wp-block-column .wp-block-image img").length === 1, "Gutenberg layout and images retained");
verify($(".evil").length === 0, "Arbitrary global CSS classes stripped");
verify($("img").first().attr("alt") === "Zdjęcie kursantki", "Image alt retained");
verify($("img").first().attr("loading") === "lazy", "CMS images lazy-loaded");
verify(text("<p>Zażółć &amp; gęślą</p>") === "Zażółć & gęślą", "Polish title and entities decoded");
for (const badUrl of ["javascript:alert(1)", "data:image/svg+xml,evil", "//tracker.example/pixel", "java\nscript:alert(1)"]) {
  verify(!load(clean(`<img src="${badUrl}">`))("img").length, `Unsafe image URL blocked ${badUrl}`);
}
const seed = await readFile("wordpress/sukcesy-naszych-klientow.html", "utf8");
verify(clean(seed).includes("wp-block-button__link"), "Editable Gutenberg CTA preserved");
verify(!/demo|testow|wkrótce|Anna Kowalska/i.test(text(seed)), "No invented clients/test copy in starter content");
console.log(JSON.stringify({result:"PASS", checks, liveCmsMutations:0}, null, 2));
