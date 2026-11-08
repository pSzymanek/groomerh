import { readFile } from "node:fs/promises";
import { load } from "cheerio";

const pages = JSON.parse(await readFile("archive/current/pages.json", "utf8"));
for (const page of pages) {
  const $ = load(page.content.rendered);
  const headings = $("h1,h2,h3,h4").map((_, element) => $(element).text().trim().replace(/\s+/g, " ")).get().filter(Boolean);
  const widgets = $("[data-widget_type]").map((_, element) => $(element).attr("data-widget_type")).get();
  const images = $("img").map((_, element) => $(element).attr("src") || $(element).attr("data-src")).get().filter(Boolean);
  console.log(JSON.stringify({
    slug: page.slug,
    path: new URL(page.link).pathname,
    title: page.title.rendered,
    headings: headings.slice(0, 40),
    widgetTypes: [...new Set(widgets)],
    images: images.slice(0, 15),
  }, null, 2));
}
