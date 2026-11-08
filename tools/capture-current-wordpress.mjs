import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const origin = "https://groomerhouse.pl";
const root = path.resolve("archive", "current");
const uploads = path.resolve("archive", "mirror", "groomerhouse.pl", "wp-content", "uploads");

async function getCollection(type, fields) {
  const items = [];
  for (let page = 1; ; page++) {
    const url = `${origin}/wp-json/wp/v2/${type}?per_page=100&page=${page}&_fields=${fields}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${url}: ${response.status}`);
    const batch = await response.json();
    items.push(...batch);
    if (page >= Number(response.headers.get("x-wp-totalpages") || 1)) break;
  }
  return items;
}

const [pages, posts, media] = await Promise.all([
  getCollection("pages", "id,slug,link,title,content,excerpt,date,modified,status"),
  getCollection("posts", "id,slug,link,title,content,excerpt,date,modified,status,featured_media"),
  getCollection("media", "id,source_url,alt_text,caption,media_details"),
]);

await mkdir(root, { recursive: true });
for (const [name, data] of Object.entries({ pages, posts, media })) {
  await writeFile(path.join(root, `${name}.json`), `${JSON.stringify(data, null, 2)}\n`);
}

let downloaded = 0;
let missing = 0;
const imageUrls = new Set(media.map((item) => item.source_url));
for (const item of [...pages, ...posts]) {
  for (const match of item.content.rendered.matchAll(/https:\/\/groomerhouse\.pl\/wp-content\/uploads\/[^"'\s<>]+/g)) {
    imageUrls.add(match[0].replaceAll("&amp;", "&"));
  }
}
for (const imageUrl of imageUrls) {
  const url = new URL(imageUrl);
  if (url.origin !== origin || !url.pathname.startsWith("/wp-content/uploads/")) continue;
  const relative = decodeURIComponent(url.pathname.slice("/wp-content/uploads/".length));
  if (relative.split("/").some((segment) => segment === "..")) continue;
  const target = path.join(uploads, relative);
  try {
    await readFile(target);
    continue;
  } catch { /* Download media absent from the earlier archive. */ }
  const response = await fetch(url);
  if (!response.ok) {
    missing++;
    continue;
  }
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  downloaded++;
}

console.log(JSON.stringify({ pages: pages.length, posts: posts.length, media: media.length, downloaded, missing }, null, 2));
