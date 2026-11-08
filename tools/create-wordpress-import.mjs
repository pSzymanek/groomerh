import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { load } from "cheerio";

const workspace = path.resolve(import.meta.dirname, "..");
const exportRoot = path.join(workspace, "export");
const target = path.resolve(process.argv[2] || "");
if (!process.argv[2] || !target.startsWith(exportRoot + path.sep) || existsSync(target)) {
  throw new Error("Choose a new, unused directory inside export/.");
}

const source = JSON.parse(await readFile(path.join(workspace, "archive/current/posts.json"), "utf8"));
const media = JSON.parse(await readFile(path.join(workspace, "archive/current/media.json"), "utf8"));
const origin = "https://wp.groomerhouse.pl";

const xml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
})[char]);
const cdata = (value) => `<![CDATA[${String(value ?? "").replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;
const text = (html) => load(html || "").text().replace(/\s+/g, " ").trim();
const wpDate = (date) => String(date || "").replace("T", " ").slice(0, 19);
const utcDate = (date) => new Date(`${date}+02:00`).toISOString().slice(0, 19).replace("T", " ");
const semanticTags = "h1,h2,h3,h4,h5,h6,p,ul,ol,blockquote,table,figure,img";

function articleHtml(sourceHtml, title) {
  const $ = load(sourceHtml || "");
  $("script,style,iframe,form,input,button,noscript,svg,nav,header,footer").remove();
  const sections = [];
  let skippedTitle = false;
  $(semanticTags).each((_, node) => {
    if ($(node).parents(semanticTags).length) return;
    const tag = node.tagName.toLowerCase();
    if (tag === "h1" && !skippedTitle && $(node).text().trim() === text(title)) {
      skippedTitle = true;
      return;
    }
    const element = $(node).clone();
    element.find("img").addBack("img").each((__, image) => {
      if (/^https?:\/\/s\.w\.org\/images\/core\/emoji\//.test($(image).attr("src") || "")) $(image).remove();
    });
    element.find("*").addBack().each((__, child) => {
      const current = $(child);
      const childTag = child.tagName?.toLowerCase();
      const allowed = childTag === "a" ? ["href"] : childTag === "img" ? ["src", "alt"] : [];
      for (const attribute of Object.keys(current.attr() || {})) {
        if (!allowed.includes(attribute)) current.removeAttr(attribute);
      }
      if (childTag === "a" && !/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(current.attr("href") || "")) current.removeAttr("href");
    });
    if (!element.text().trim() && !element.find("img").length && tag !== "img") return;
    let html = $.html(element);
    if (tag === "h1") html = html.replace(/^<h1>/, "<h2>").replace(/<\/h1>$/, "</h2>");
    if (tag === "img") html = `<figure>${html}</figure>`;
    sections.push(html);
  });
  if (sections.length < 10) throw new Error(`Too little article content extracted for ${title}`);
  return sections.join("\n\n");
}

const mediaById = new Map(media.map((item) => [item.id, item]));
const requiredMedia = new Map();
const items = [];
const report = [];
for (const post of source) {
  if (post.status !== "publish") throw new Error(`Post is not published: ${post.slug}`);
  const body = articleHtml(post.content.rendered, post.title.rendered);
  const oldText = text(post.content.rendered);
  const newText = text(body);
  const embeddedArticle = load(post.content.rendered)(".wrapper").first().text().replace(/\s+/g, " ").trim();
  const referenceLength = embeddedArticle.length > 1000 ? embeddedArticle.length : oldText.length;
  report.push({ slug: post.slug, sourceRenderedCharacters: oldText.length, sourceArticleCharacters: referenceLength, importedCharacters: newText.length, sections: body.split("\n\n").length });
  if (newText.length < referenceLength * 0.75) throw new Error(`Possible content loss in ${post.slug}: ${newText.length}/${referenceLength} article characters`);

  for (const match of post.content.rendered.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) {
    const item = media.find((entry) => entry.source_url === match[1]);
    if (item) requiredMedia.set(item.id, item);
  }
  const featured = mediaById.get(post.featured_media);
  if (featured) requiredMedia.set(featured.id, featured);

  items.push(`<item>
  <title>${cdata(text(post.title.rendered))}</title>
  <link>${xml(`${origin}/${post.slug}/`)}</link>
  <pubDate>${new Date(`${post.date}+02:00`).toUTCString()}</pubDate>
  <dc:creator>${cdata("groomerhouse")}</dc:creator>
  <guid isPermaLink="false">${xml(`https://groomerhouse.pl/?p=${post.id}`)}</guid>
  <description></description>
  <content:encoded>${cdata(body)}</content:encoded>
  <excerpt:encoded>${cdata(text(post.excerpt.rendered))}</excerpt:encoded>
  <wp:post_id>${post.id}</wp:post_id>
  <wp:post_date>${wpDate(post.date)}</wp:post_date>
  <wp:post_date_gmt>${utcDate(post.date)}</wp:post_date_gmt>
  <wp:post_modified>${wpDate(post.modified || post.date)}</wp:post_modified>
  <wp:post_modified_gmt>${utcDate(post.modified || post.date)}</wp:post_modified_gmt>
  <wp:comment_status>${cdata("closed")}</wp:comment_status>
  <wp:ping_status>${cdata("closed")}</wp:ping_status>
  <wp:post_name>${cdata(post.slug)}</wp:post_name>
  <wp:status>${cdata("publish")}</wp:status>
  <wp:post_parent>0</wp:post_parent>
  <wp:menu_order>0</wp:menu_order>
  <wp:post_type>${cdata("post")}</wp:post_type>
  <wp:post_password>${cdata("")}</wp:post_password>
  <wp:is_sticky>0</wp:is_sticky>
  ${featured ? `<wp:postmeta><wp:meta_key>${cdata("_thumbnail_id")}</wp:meta_key><wp:meta_value>${cdata(String(featured.id))}</wp:meta_value></wp:postmeta>` : ""}
</item>`);
}

for (const item of requiredMedia.values()) {
  const url = new URL(item.source_url);
  if (url.hostname !== "groomerhouse.pl" || !url.pathname.startsWith("/wp-content/uploads/")) continue;
  const relative = url.pathname.slice("/wp-content/uploads/".length);
  const sourceFile = path.join(workspace, "archive/mirror/groomerhouse.pl/wp-content/uploads", relative);
  if (!existsSync(sourceFile)) throw new Error(`Missing archived image: ${relative}`);
  const destination = path.join(target, "media", relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(sourceFile, destination);
  const ext = path.extname(relative).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  const mediaDate = /^\d{4}\/\d{2}\//.test(relative) ? `${relative.slice(0, 4)}-${relative.slice(5, 7)}-01T12:00:00` : "2026-09-01T12:00:00";
  items.push(`<item>
  <title>${cdata(path.basename(relative))}</title>
  <link>${xml(item.source_url)}</link>
  <guid isPermaLink="false">${xml(item.source_url)}</guid>
  <description></description>
  <content:encoded>${cdata("")}</content:encoded>
  <excerpt:encoded>${cdata("")}</excerpt:encoded>
  <wp:post_id>${item.id}</wp:post_id>
  <wp:post_date>${wpDate(mediaDate)}</wp:post_date>
  <wp:post_date_gmt>${utcDate(mediaDate)}</wp:post_date_gmt>
  <wp:post_name>${cdata(path.parse(relative).name)}</wp:post_name>
  <wp:status>${cdata("inherit")}</wp:status>
  <wp:post_parent>0</wp:post_parent>
  <wp:menu_order>0</wp:menu_order>
  <wp:post_type>${cdata("attachment")}</wp:post_type>
  <wp:post_mime_type>${cdata(mime)}</wp:post_mime_type>
  <wp:attachment_url>${cdata(item.source_url)}</wp:attachment_url>
</item>`);
}

const document = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
  <title>${xml("Groomer House — blog")}</title>
  <link>${xml(origin)}</link>
  <description>${xml("Archiwum trzech wpisów Groomer House")}</description>
  <pubDate>${new Date().toUTCString()}</pubDate>
  <language>pl-PL</language>
  <wp:wxr_version>1.2</wp:wxr_version>
  <wp:base_site_url>${xml(origin)}</wp:base_site_url>
  <wp:base_blog_url>${xml(origin)}</wp:base_blog_url>
  <wp:author>
    <wp:author_id>1</wp:author_id>
    <wp:author_login>${cdata("groomerhouse")}</wp:author_login>
    <wp:author_email>${cdata("")}</wp:author_email>
    <wp:author_display_name>${cdata("Groomer House")}</wp:author_display_name>
    <wp:author_first_name>${cdata("")}</wp:author_first_name>
    <wp:author_last_name>${cdata("")}</wp:author_last_name>
  </wp:author>
  ${items.join("\n  ")}
</channel>
</rss>
`;

await mkdir(target, { recursive: true });
await writeFile(path.join(target, "groomerhouse-3-wpisy.xml"), document);
await writeFile(path.join(target, "raport-importu.json"), `${JSON.stringify({ posts: report, archivedImages: requiredMedia.size }, null, 2)}\n`);
await cp(path.join(workspace, "WORDPRESS-SETUP.md"), path.join(target, "WORDPRESS-SETUP.md"));
console.log(`Prepared ${source.length} posts and ${requiredMedia.size} archived images in ${target}`);
