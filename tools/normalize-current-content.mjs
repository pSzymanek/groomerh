import { readFile, writeFile } from "node:fs/promises";
import { load } from "cheerio";

const pages = JSON.parse(await readFile("archive/current/pages.json", "utf8"));
const origin = "https://groomerhouse.pl";
const removeEmoji = (value) => value.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/ {2,}/g, " ");

function assetPath(value = "") {
  try {
    const url = new URL(value, origin);
    return url.origin === origin && url.pathname.startsWith("/wp-content/uploads/") ? url.pathname : "";
  } catch { return ""; }
}

function cleanHtml(fragment) {
  const $ = load(`<div id="gh-root">${fragment}</div>`, null, false);
  const root = $("#gh-root");
  $("script,style,iframe,form,input,select,textarea,button,noscript,svg").remove();
  $("img").each((_, element) => {
    const image = $(element);
    const src = assetPath(image.attr("src") || image.attr("data-src"));
    if (src) image.attr("src", src);
    else if (image.attr("alt")) image.replaceWith(image.attr("alt"));
    else image.remove();
  });
  $("a").each((_, element) => {
    const anchor = $(element);
    const href = anchor.attr("href") || "";
    try {
      const url = new URL(href, origin);
      if (!["http:", "https:", "mailto:", "tel:"].includes(url.protocol)) anchor.removeAttr("href");
      else anchor.attr("href", url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : url.href);
    } catch { anchor.removeAttr("href"); }
  });
  $("*").each((_, element) => {
    const allowed = element.name === "a" ? ["href"] : element.name === "img" ? ["src", "alt", "width", "height"] : [];
    for (const name of Object.keys(element.attribs || {})) if (!allowed.includes(name)) $(element).removeAttr(name);
  });
  return removeEmoji(root.html()?.trim() || "");
}

function textOf($, element) {
  return $(element).text().replace(/\s+/g, " ").trim();
}

const normalized = pages.map((page) => {
  const $ = load(page.content.rendered);
  const blocks = [];
  $("[data-widget_type]").each((_, element) => {
    const widget = $(element);
    const type = (widget.attr("data-widget_type") || "").split(".")[0];
    const container = widget.find(".elementor-widget-container").first();
    if (!container.length) return;
    if (type === "heading") {
      const heading = container.find("h1,h2,h3,h4,h5,h6").first();
      const text = removeEmoji(textOf($, heading)).trim();
      if (text) blocks.push({ type: "heading", level: Math.min(4, Math.max(2, Number(heading.prop("tagName")?.slice(1)) || 2)), text });
    } else if (["text-editor", "icon-list", "tabs", "toggle", "testimonial-carousel"].includes(type)) {
      const html = cleanHtml(container.html() || "");
      if (load(html).text().trim()) blocks.push({ type: "rich", html });
    } else if (["image-box", "icon-box"].includes(type)) {
      const html = cleanHtml(container.html() || "");
      if (load(html).text().trim()) blocks.push({ type: "rich", html });
    } else if (type === "image") {
      const image = container.find("img").first();
      const src = assetPath(image.attr("src") || image.attr("data-src"));
      if (src && !/logo|icon|particles|screenshot/i.test(src)) blocks.push({ type: "image", src, alt: image.attr("alt") || page.title.rendered });
    } else if (type === "button") {
      const anchor = container.find("a").first();
      const href = anchor.attr("href") || "";
      const text = removeEmoji(textOf($, anchor)).trim();
      if (text && href) blocks.push({ type: "button", text, href: href.startsWith(origin) ? href.slice(origin.length) : href });
    }
  });
  return {
    id: page.id,
    slug: page.slug,
    path: new URL(page.link).pathname,
    title: load(page.title.rendered).text(),
    modified: page.modified,
    blocks,
  };
});

await writeFile("archive/current/normalized-pages.json", `${JSON.stringify(normalized, null, 2)}\n`);
console.log(normalized.map((page) => `${page.path}: ${page.blocks.length} blocks`).join("\n"));
