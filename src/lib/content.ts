import pages from "../../archive/current/normalized-pages.json";
import media from "../../archive/current/media.json";
import { load } from "cheerio";
import { currentBusinessStats } from "./business-stats";
import { currentCourseFaq } from "./course-faq";

export function removeEmoji(value: string): string {
  return value.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, "").replace(/ {2,}/g, " ");
}

export function demoteEmbeddedH1(value: string): string {
  // Every article/page already has its visible H1 in the page hero.
  return value.replace(/<h1(\b[^>]*)>/gi, "<h2$1>").replace(/<\/h1\s*>/gi, "</h2>");
}

export type ContentBlock = {
  type: string;
  level?: number;
  text?: string;
  html?: string;
  src?: string;
  alt?: string;
  href?: string;
};

export type ContentPage = {
  id: number;
  slug: string;
  path: string;
  title: string;
  modified: string;
  blocks: ContentBlock[];
};

export const contentPages = pages as ContentPage[];

export const activePaths = [
  "/",
  "/o-mnie/",
  "/kurs-groomerski/",
  "/podstawowy-kurs-groomerski-slask/",
  "/kurs-grooming-kotow/",
  "/kurs-groomerski-ruda-slaska/",
  "/cennik/",
];

export function getPage(path: string): ContentPage | undefined {
  const page = contentPages.find((page) => page.path === path);
  if (!page) return undefined;
  let inFaq = false;
  // Update displayed facts/hours without modifying the original WordPress archive.
  return { ...page, blocks: page.blocks.map(block => {
    if (block.type === "heading") inFaq = /\bFAQ\b|najczęściej zadawane pytania/i.test(block.text || "");
    const refreshed = {
      ...block,
      text: block.text ? currentBusinessStats(block.text) : block.text,
      html: block.html ? currentBusinessStats(block.html) : block.html,
    };
    if (inFaq && refreshed.html) refreshed.html = currentCourseFaq(refreshed.html);
    if (!refreshed.html?.includes("Poniedziałek")) return refreshed;
    const $ = load(refreshed.html, null, false);
    $("li").filter((_, el) => /^Poniedziałek\s+\d{2}:\d{2}/.test($(el).text().trim())).each((_, el) => {
      $(el).html("<span>Poniedziałek — nieczynne</span>");
    });
    return { ...refreshed, html: $.html() };
  }) };
}

export function mediaPath(id?: number): string | undefined {
  const item = (media as { id: number; source_url: string }[]).find((entry) => entry.id === id);
  if (!item) return undefined;
  try {
    const url = new URL(item.source_url);
    return url.hostname === "groomerhouse.pl" ? url.pathname : undefined;
  } catch { return undefined; }
}

export function homeCard(block: ContentBlock) {
  const $ = load(block.html || "");
  const image = $("img").first();
  return {
    title: removeEmoji($("h2,h3,h4,h5").first().text()).replace(/\s+/g, " ").trim(),
    description: removeEmoji($("p").first().text()).replace(/\s+/g, " ").trim(),
    image: image.attr("src") || "",
    alt: image.attr("alt") || "",
    href: $("a").first().attr("href") || "",
  };
}

export function cleanPostHtml(value: string): string {
  const $ = load(`<div id="article-root">${value}</div>`, null, false);
  const root = $("#article-root");
  $("script,style,iframe,form,input,select,textarea,button,noscript,nav,svg").remove();
  $("img").each((_, element) => {
    const image = $(element);
    const source = image.attr("src") || image.attr("data-src") || "";
    try {
      const url = new URL(source, "https://groomerhouse.pl");
      image.attr("src", url.hostname === "groomerhouse.pl" ? url.pathname : url.href);
    } catch { image.remove(); }
  });
  $("a").each((_, element) => {
    const anchor = $(element);
    try {
      const url = new URL(anchor.attr("href") || "", "https://groomerhouse.pl");
      anchor.attr("href", url.hostname === "groomerhouse.pl" ? `${url.pathname}${url.hash}` : url.href);
    } catch { anchor.removeAttr("href"); }
  });
  $("*").each((_, element) => {
    const current = $(element);
    const tag = current.prop("tagName")?.toLowerCase();
    const allowed = tag === "a" ? ["href"] : tag === "img" ? ["src", "alt", "width", "height"] : [];
    for (const name of Object.keys(current.attr() || {})) if (!allowed.includes(name)) current.removeAttr(name);
  });
  return demoteEmbeddedH1(removeEmoji(root.html() || ""));
}

export const photos = {
  hero: "/wp-content/uploads/2026/08/groomer-house-glowna-baner.jpg",
  about: "/wp-content/uploads/2025/10/IMG_4382-scaled.jpg",
  course: "/wp-content/uploads/2026/08/12.jpg",
  courseDetail: "/wp-content/uploads/2026/08/8.jpg",
  cat: "/wp-content/uploads/2026/07/kurs-groomingu-kotow.jpg",
  salon: "/wp-content/uploads/2025/10/40.png",
  salonDetail: "/wp-content/uploads/2026/08/9.jpg",
  ruda: "/wp-content/uploads/2026/08/8.jpg",
  graduates: "/wp-content/uploads/2026/09/sylwia-ociepka-instruktor-groomingu.jpeg",
  dogWash: "/wp-content/uploads/2023/08/washing-the-spitz-in-the-bathroom-animal-care-SVK2LN8.jpg",
};

export const pageDesign: Record<string, { eyebrow: string; heading: string; lead: string; photo: string; photoAlt: string }> = {
  "/o-mnie/": {
    eyebrow: "Groomer House",
    heading: "Kilka słów o mnie",
    lead: "Sylwia Ociepka — właścicielka Centrum Szkoleniowego i Salonu Pielęgnacji Zwierząt Groomer House w Bytomiu.",
    photo: photos.about,
    photoAlt: "Sylwia Ociepka w salonie Groomer House",
  },
  "/kurs-groomerski/": {
    eyebrow: "Groomer House Bytom",
    heading: "Kurs groomerski Śląsk – naucz się zawodu z pasją w Groomer House Bytom",
    lead: "Grooming to zawód dla osób, które chcą połączyć pracę ze zwierzętami z konkretnymi, praktycznymi umiejętnościami.",
    photo: photos.course,
    photoAlt: "Praktyczna nauka groomingu w Groomer House",
  },
  "/podstawowy-kurs-groomerski-slask/": {
    eyebrow: "Groomer House",
    heading: "Naucz się zawodu groomera od podstaw",
    lead: "Marzysz o pracy ze zwierzętami i szukasz miejsca, w którym nauczysz się zawodu od podstaw?",
    photo: photos.courseDetail,
    photoAlt: "Pielęgnacja psa podczas kursu podstawowego",
  },
  "/kurs-grooming-kotow/": {
    eyebrow: "Kurs specjalistyczny z groomingu kotów",
    heading: "Kurs groomingu kotów – naucz się profesjonalnej pielęgnacji kotów w Groomer House",
    lead: "Koty wymagają zupełnie innego podejścia niż psy. Są bardziej wrażliwe na stres, szybciej reagują na zmiany otoczenia i często nie akceptują pielęgnacji wykonywanej w nieodpowiedni sposób.",
    photo: photos.cat,
    photoAlt: "Kurs pielęgnacji kotów w Groomer House",
  },
  "/kurs-groomerski-ruda-slaska/": {
    eyebrow: "Groomer House",
    heading: "Kurs groomerski Ruda Śląska – praktyczna nauka zawodu w Groomer House",
    lead: "Szukasz kursu groomerskiego w Rudzie Śląskiej i chcesz nauczyć się zawodu od podstaw? Zapraszamy do Groomer House w Bytomiu-Stroszku.",
    photo: photos.ruda,
    photoAlt: "Zajęcia na kursie groomerskim",
  },
  "/cennik/": {
    eyebrow: "Groomer House",
    heading: "Groomer Bytom - Strzyżenie i Pielęgnacja Psów i Kotów",
    lead: "Groomer House to profesjonalny salon groomerski w Bytomiu, obsługujący klientów z całego Śląska – Katowic, Gliwic, Tarnowskich Gór i okolic.",
    photo: photos.salon,
    photoAlt: "Pies podczas pielęgnacji w salonie Groomer House",
  },
};
