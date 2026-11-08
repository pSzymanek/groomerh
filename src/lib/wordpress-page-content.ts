import { load } from "cheerio";

const allowedTags = new Set("a article b blockquote br caption dd div dl dt em figcaption figure h1 h2 h3 h4 h5 h6 hr i img li mark ol p s section small span strong sub sup table tbody td tfoot th thead tr u ul".split(" "));
const blockedTags = "script,style,iframe,object,embed,form,input,button,textarea,select,link,meta,base,svg,math,noscript,template";
const safeUrl = (value: string, image = false) => {
  const normalized = value.replace(/[\u0000-\u0020\u007f]/g, "");
  return /^(https?:\/\/|\/(?!\/))/i.test(normalized) || (!image && /^(#|mailto:|tel:)/i.test(normalized));
};

// Keep normal Gutenberg text/image/gallery/column/group/button blocks, but do
// not execute scripts, shortcodes, tracking embeds or WordPress theme markup.
export function cleanWordPressPageHtml(html: string): string {
  const $ = load(html || "", null, false);
  $(blockedTags).remove();
  $("*").each((_, node) => {
    if (!("tagName" in node)) return;
    const element = $(node);
    if (!allowedTags.has(node.tagName)) { element.replaceWith(element.contents()); return; }
    for (const attr of Object.keys(element.attr() || {})) {
      const allowed = ["class", "id"].includes(attr)
        || (node.tagName === "a" && ["href", "title", "target", "rel"].includes(attr))
        || (node.tagName === "img" && ["src", "alt", "width", "height"].includes(attr))
        || (["td", "th"].includes(node.tagName) && ["colspan", "rowspan", "scope"].includes(attr))
        || (node.tagName === "ol" && ["start", "reversed"].includes(attr));
      if (!allowed) element.removeAttr(attr);
    }
    const classes = (element.attr("class") || "").split(/\s+/).filter(name => /^(wp-block-[\w-]+|align(?:left|right|center|wide|full)|is-(?:layout-[\w-]+|style-[\w-]+|cropped)|has-[\w-]+|are-vertically-aligned-[\w-]+)$/.test(name));
    if (classes.length) element.attr("class", classes.join(" "));
    else element.removeAttr("class");
    // Elementor/Gutenberg headings inside the content must not add a second H1.
    if (node.tagName === "h1") node.tagName = "h2";
    if (node.tagName === "a") {
      if (!safeUrl(element.attr("href") || "")) element.removeAttr("href");
      if (element.attr("target") === "_blank") element.attr("rel", "noopener noreferrer");
      else element.removeAttr("target");
    }
    if (node.tagName === "img") {
      if (!safeUrl(element.attr("src") || "", true)) { element.remove(); return; }
      element.attr("alt", element.attr("alt") || "");
      for (const name of ["width", "height"]) if (!/^\d{1,5}$/.test(element.attr(name) || "")) element.removeAttr(name);
      element.attr("loading", "lazy").attr("decoding", "async");
    }
  });
  return $.html();
}

export function wordPressPageText(html: string): string {
  const $ = load(html || "", null, false);
  $(blockedTags).remove();
  return $.text().replace(/\s+/g, " ").trim();
}
