import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

// Isolated tests of the actual WordPress reader, without mutating the live CMS.
// Only presentation helpers (not used by getPosts) are replaced for this harness.
const source = (await readFile("src/lib/wordpress.ts", "utf8"))
  .replace('import { escapeHtml, stripHtml } from "./snapshot";', 'const escapeHtml = value => value; const stripHtml = value => value;')
  .replace('import { mediaPath } from "./content";', 'const mediaPath = () => undefined;');
const js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
let moduleId = 0;
const fresh = () => import(`data:text/javascript;base64,${Buffer.from(js + `\n// ${moduleId++}`).toString("base64")}`);
const post = (id, slug) => ({ id, slug, date: "2026-10-12T10:00:00", link: `https://wp.groomerhouse.pl/index.php/${slug}/`, title: { rendered: slug }, content: { rendered: `<p>${slug}</p>` }, excerpt: { rendered: slug } });
const response = (posts, pages = 1) => new Response(JSON.stringify(posts), { headers: { "content-type": "application/json", "x-wp-totalpages": String(pages) } });
const originalFetch = globalThis.fetch;
const originalNow = Date.now;
const originalOrigin = process.env.WORDPRESS_URL;
let checks = 0;
const verify = (value, label) => { assert.ok(value, label); checks++; };

try {
  process.env.WORDPRESS_URL = "https://wordpress-reader.example";
  let calls = 0;
  let now = originalNow();
  Date.now = () => now;
  globalThis.fetch = async url => {
    calls++;
    const parsed = new URL(url);
    verify(parsed.searchParams.get("status") === "publish", "Only published posts requested");
    verify(parsed.searchParams.get("_embed") === "wp:featuredmedia", "Featured media embedded");
    return response([post(1, "new-article"), post(2, "hello-world")]);
  };
  const reader = await fresh();
  const [first, concurrent] = await Promise.all([reader.getPosts(), reader.getPosts()]);
  verify(first.length === 1 && first[0].slug === "new-article", "Live list authoritative, no archive merge");
  verify(concurrent === first && calls === 1, "Concurrent loads deduplicated");
  verify((await reader.getPosts()) === first && calls === 1, "Thirty-second cache reused");
  verify(reader.postPath(first[0]) === "/new-article/", "Public route independent of CMS permalink");
  now += 31000;
  globalThis.fetch = async () => response([]);
  verify((await reader.getPosts()).length === 0, "Draft/deletion/empty blog does not restore archive");
  now += 31000;
  globalThis.fetch = async () => { throw new Error("Offline"); };
  verify((await reader.getPosts()).length === 0, "Last successful empty list retained during outage");

  calls = 0;
  globalThis.fetch = async url => {
    calls++;
    return response([post(calls, new URL(url).searchParams.get("page") === "1" ? "first-page" : "second-page")], 2);
  };
  const paginated = await fresh();
  const all = await paginated.getPosts();
  verify(all.length === 2 && calls === 2, "All API pages fetched");
  const featured = await paginated.featuredImage({ ...all[0], featured_media: 99, _embedded: { "wp:featuredmedia": [{ source_url: "https://wp.groomerhouse.pl/photo.jpg" }] } });
  verify(featured === "https://wp.groomerhouse.pl/photo.jpg" && calls === 2, "No extra request for embedded image");

  globalThis.fetch = async () => { throw new Error("Offline"); };
  const offline = await fresh();
  verify((await offline.getPosts()).length === 3, "Initial outage retains three archived posts");
  console.log(JSON.stringify({ result: "PASS", checks, liveCmsMutations: 0 }, null, 2));
} finally {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  if (originalOrigin === undefined) delete process.env.WORDPRESS_URL;
  else process.env.WORDPRESS_URL = originalOrigin;
}
