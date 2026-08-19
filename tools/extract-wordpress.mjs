import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://groomerhouse.pl";
const OUTPUT = path.resolve("archive");
const API = `${ORIGIN}/wp-json/wp/v2`;

const ensureDir = (file) => mkdir(path.dirname(file), { recursive: true });

async function request(url, options = {}) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "user-agent": "GroomerHouse local preservation export/1.0",
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response;
}

async function saveText(url, file) {
  const response = await request(url);
  const text = await response.text();
  await ensureDir(file);
  await writeFile(file, text, "utf8");
  return text;
}

async function saveJson(url, file) {
  const response = await request(url);
  const data = await response.json();
  await ensureDir(file);
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return { data, headers: response.headers };
}

function localPathForUrl(rawUrl) {
  const url = new URL(rawUrl, ORIGIN);
  const host = url.hostname.replace(/[^a-z0-9.-]/gi, "_");
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";
  if (!path.extname(pathname)) pathname += ".html";
  const safe = pathname
    .split("/")
    .map((part) => part.replace(/[<>:"|?*]/g, "_"))
    .join(path.sep);
  return path.join(OUTPUT, "mirror", host, safe);
}

function findAssetUrls(html, baseUrl) {
  const urls = new Set();
  const add = (value) => {
    if (!value || value.startsWith("data:") || value.startsWith("blob:")) return;
    try {
      const url = new URL(value.replaceAll("&amp;", "&"), baseUrl);
      if (["http:", "https:"].includes(url.protocol)) urls.add(url.href);
    } catch {}
  };

  for (const match of html.matchAll(/(?:src|href|poster)=["']([^"']+)["']/gi)) add(match[1]);
  for (const match of html.matchAll(/srcset=["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(",")) add(candidate.trim().split(/\s+/)[0]);
  }
  for (const match of html.matchAll(/url\((?:["']?)([^)'"?]+(?:\?[^)'" ]*)?)(?:["']?)\)/gi)) add(match[1]);
  return urls;
}

async function downloadFile(url) {
  const file = localPathForUrl(url);
  try {
    const response = await request(url);
    const bytes = Buffer.from(await response.arrayBuffer());
    await ensureDir(file);
    await writeFile(file, bytes);
    return { url, file: path.relative(OUTPUT, file), bytes: bytes.length, type: response.headers.get("content-type") };
  } catch (error) {
    return { url, error: error.message };
  }
}

async function fetchAll(restBase, fields = "") {
  const firstUrl = `${API}/${restBase}?per_page=100&page=1${fields ? `&_fields=${fields}` : ""}`;
  const first = await request(firstUrl);
  const firstPage = await first.json();
  const pages = Number(first.headers.get("x-wp-totalpages") || 1);
  const results = [...firstPage];
  for (let page = 2; page <= pages; page += 1) {
    const response = await request(`${API}/${restBase}?per_page=100&page=${page}${fields ? `&_fields=${fields}` : ""}`);
    results.push(...(await response.json()));
  }
  return results;
}

const publicPageUrls = [
  `${ORIGIN}/`,
  `${ORIGIN}/kurs-grooming-kotow/`,
  `${ORIGIN}/kurs-groomerski/`,
  `${ORIGIN}/podstawowy-kurs-groomerski-slask/`,
  `${ORIGIN}/cennik/`,
  `${ORIGIN}/blog/`,
  `${ORIGIN}/polityka-prywatnosci/`,
  `${ORIGIN}/2023/07/31/jak-zostac-groomerem-w-polsce-kompletny-przewodnik/`,
];

await mkdir(OUTPUT, { recursive: true });

const [pages, posts, media, categories, tags] = await Promise.all([
  fetchAll("pages", "id,date,modified,slug,status,link,title,content,excerpt,parent,menu_order,featured_media"),
  fetchAll("posts", "id,date,modified,slug,status,link,title,content,excerpt,author,featured_media,categories,tags"),
  fetchAll("media", "id,date,modified,slug,status,link,title,caption,description,alt_text,media_type,mime_type,source_url,media_details"),
  fetchAll("categories"),
  fetchAll("tags"),
]);

await writeFile(path.join(OUTPUT, "wordpress", "pages.json"), `${JSON.stringify(pages, null, 2)}\n`, "utf8").catch(async () => {
  await mkdir(path.join(OUTPUT, "wordpress"), { recursive: true });
  await writeFile(path.join(OUTPUT, "wordpress", "pages.json"), `${JSON.stringify(pages, null, 2)}\n`, "utf8");
});
await Promise.all([
  writeFile(path.join(OUTPUT, "wordpress", "posts.json"), `${JSON.stringify(posts, null, 2)}\n`, "utf8"),
  writeFile(path.join(OUTPUT, "wordpress", "media.json"), `${JSON.stringify(media, null, 2)}\n`, "utf8"),
  writeFile(path.join(OUTPUT, "wordpress", "categories.json"), `${JSON.stringify(categories, null, 2)}\n`, "utf8"),
  writeFile(path.join(OUTPUT, "wordpress", "tags.json"), `${JSON.stringify(tags, null, 2)}\n`, "utf8"),
]);

await Promise.all([
  saveText(`${ORIGIN}/robots.txt`, path.join(OUTPUT, "seo", "robots.txt")),
  saveText(`${ORIGIN}/sitemap_index.xml`, path.join(OUTPUT, "seo", "sitemap_index.xml")),
  saveText(`${ORIGIN}/post-sitemap.xml`, path.join(OUTPUT, "seo", "post-sitemap.xml")),
  saveText(`${ORIGIN}/page-sitemap.xml`, path.join(OUTPUT, "seo", "page-sitemap.xml")),
  saveJson(`${ORIGIN}/wp-json/`, path.join(OUTPUT, "wordpress", "api-index.json")),
]);

const pageHtml = new Map();
const discoveredAssets = new Set();
for (const url of publicPageUrls) {
  const html = await (await request(url)).text();
  pageHtml.set(url, html);
  const file = localPathForUrl(url);
  await ensureDir(file);
  await writeFile(file, html, "utf8");
  for (const asset of findAssetUrls(html, url)) {
    const assetUrl = new URL(asset);
    if (assetUrl.hostname === "groomerhouse.pl" || assetUrl.hostname === "www.groomerhouse.pl") discoveredAssets.add(assetUrl.href);
  }
}

for (const item of media) {
  if (item.source_url) discoveredAssets.add(item.source_url);
  for (const size of Object.values(item.media_details?.sizes || {})) {
    if (size.source_url) discoveredAssets.add(size.source_url);
  }
}

const queue = [...discoveredAssets];
const assetManifest = [];
for (let index = 0; index < queue.length; index += 8) {
  const batch = queue.slice(index, index + 8);
  const downloaded = await Promise.all(batch.map(downloadFile));
  assetManifest.push(...downloaded);
  for (const item of downloaded) {
    if (item.error || !item.type || !/text\/(css|html)|javascript|json/.test(item.type)) continue;
    const file = path.join(OUTPUT, item.file);
    try {
      const text = await import("node:fs/promises").then(({ readFile }) => readFile(file, "utf8"));
      for (const asset of findAssetUrls(text, item.url)) {
        const assetUrl = new URL(asset);
        if (!["groomerhouse.pl", "www.groomerhouse.pl"].includes(assetUrl.hostname)) continue;
        if (!discoveredAssets.has(assetUrl.href)) {
          discoveredAssets.add(assetUrl.href);
          queue.push(assetUrl.href);
        }
      }
    } catch {}
  }
}

// Asset discovery also sees internal navigation links. Restore the authoritative
// page captures last so a linked HTML document can never overwrite a snapshot.
for (const [url, html] of pageHtml) {
  const file = localPathForUrl(url);
  await ensureDir(file);
  await writeFile(file, html, "utf8");
}

await writeFile(
  path.join(OUTPUT, "manifest.json"),
  `${JSON.stringify({
    exportedAt: new Date().toISOString(),
    origin: ORIGIN,
    counts: { pages: pages.length, posts: posts.length, media: media.length, assets: assetManifest.length },
    pages: publicPageUrls,
    assets: assetManifest,
  }, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify({ pages: pages.length, posts: posts.length, media: media.length, assets: assetManifest.length }, null, 2));
