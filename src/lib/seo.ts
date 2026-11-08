import { load } from "cheerio";

export const SITE_ORIGIN = "https://groomerhouse.pl";
export const DEFAULT_SOCIAL_IMAGE = `${SITE_ORIGIN}/wp-content/uploads/2026/08/groomer-house-glowna-baner.jpg`;
export const DEFAULT_IMAGE_ALT = "Zespół Groomer House podczas pielęgnacji psa";

// Verified from the archived HTML of the previous public site. Preserve these
// search snippets through the hosting migration before making editorial changes.
export const preservedMetadata: Record<string, { title: string; description: string }> = {
  "/": {
    title: "Groomer House – Kursy Groomerskie i Salon Pielęgnacji Zwierząt",
    description: "Kursy groomerskie na Śląsku oraz profesjonalne strzyżenie psów i kotów. Zapisz się na kurs lub zarezerwuj wizytę dla pupila przez Booksy!",
  },
  "/kurs-groomerski/": {
    title: "Groomer House Kursy Groomerskie I Salon Pielęgnacji Zwierząt",
    description: "Chcesz zostać groomerem? — zdobądź certyfikat i praktyczne umiejętności strzyżenia psów pod okiem doświadczonej instruktorki.",
  },
  "/podstawowy-kurs-groomerski-slask/": {
    title: "Kurs groomerski Śląsk – nauka zawodu groomera od podstaw",
    description: "Chcesz zostać groomerem? Wybierz praktyczny kurs groomerski dla początkujących. 80 godzin nauki, maksymalnie 4 osoby w grupie i doświadczony instruktor.",
  },
  "/kurs-grooming-kotow/": {
    title: "Kurs groomingu kotów w Groomer House",
    description: "Naucz się bezpiecznej pielęgnacji, kąpieli, suszenia, rozczesywania i pracy z wymagającymi kotami. Sprawdź szczegóły.",
  },
  "/cennik/": {
    title: "Salon Groomerski Bytom – Strzyżenie Psów i Kotów | Groomer House",
    description: "Strzyżenie, trymowanie, kąpiele i pielęgnacja psów i kotów w Bytomiu. Sprawdź cennik i zarezerwuj wizytę online przez Booksy.",
  },
};

export function canonicalUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).href;
}

export function seoText(html = ""): string {
  const $ = load(html.replace(/<\/(?:p|div|li|h[1-6])\s*>|<br\s*\/?\s*>/gi, " "), null, false);
  $("script,style,noscript").remove();
  return $.text().replace(/\s+/g, " ").trim();
}

export function seoExcerpt(html: string, fallback = "", limit = 160): string {
  const text = seoText(html) || seoText(fallback);
  if (text.length <= limit) return text;
  const shorter = text.slice(0, limit - 1);
  const boundary = shorter.lastIndexOf(" ");
  return `${shorter.slice(0, boundary > limit * .65 ? boundary : undefined).trimEnd()}…`;
}

export function normalizedSeoTitle(title: string): string {
  // Keep the source wording. Only remove the repeated suffix introduced when a
  // WordPress article already ends in "| Groomer House" and Layout adds it again.
  return seoText(title).replace(/(?:\s*\|\s*Groomer\s*House){2,}$/iu, " | Groomer House");
}

export function absoluteImageUrl(source?: string): string | undefined {
  if (!source) return undefined;
  try {
    const url = new URL(source, SITE_ORIGIN);
    if (!["http:", "https:"].includes(url.protocol)) return undefined;
    if (["groomerhouse.pl", "wp.groomerhouse.pl"].includes(url.hostname)) url.protocol = "https:";
    return url.href;
  } catch { return undefined; }
}

export function sitemapDate(value?: string): string | undefined {
  const date = value?.slice(0, 10);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith("0000")) return undefined;
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : undefined;
}

// Only GMT fields (or an explicitly offset ISO value) are safe for timestamps.
// The timezone of an archived WP date without an offset is not guessed.
export function wordpressUtcDate(gmt?: string): string | undefined {
  if (!gmt || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})?$/.test(gmt) || !sitemapDate(gmt)) return undefined;
  const [hours, minutes, seconds] = gmt.slice(11, 19).split(":").map(Number);
  if (hours > 23 || minutes > 59 || seconds > 59) return undefined;
  const explicit = /(?:Z|[+-]\d{2}:\d{2})$/.test(gmt) ? gmt : `${gmt}Z`;
  const date = new Date(explicit);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export type BreadcrumbItem = { name: string; path: string };
export type SeoArticle = {
  headline: string;
  publishedGmt?: string;
  modifiedGmt?: string;
  image?: string;
};

export function structuredPageData(options: {
  path: string;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  breadcrumbs?: BreadcrumbItem[];
  article?: SeoArticle;
  modifiedGmt?: string;
}) {
  const { path, title, description, article } = options;
  const canonical = canonicalUrl(path);
  const businessId = `${SITE_ORIGIN}/#business`;
  const websiteId = `${SITE_ORIGIN}/#website`;
  const pageId = `${canonical}#webpage`;
  const image = absoluteImageUrl(options.image) || DEFAULT_SOCIAL_IMAGE;
  const breadcrumbItems = options.breadcrumbs || (path === "/" ? [] : [
    { name: "Strona główna", path: "/" },
    { name: title.replace(/\s*\|\s*Groomer\s*House$/i, ""), path },
  ]);
  const pageTypes: Record<string, string> = {
    "/o-mnie/": "AboutPage",
    "/dane-kontaktowe/": "ContactPage",
    "/blog/": "CollectionPage",
    "/sukcesy-naszych-klientow/": "CollectionPage",
  };
  const graph: Record<string, unknown>[] = [
    {
      "@type": "LocalBusiness", "@id": businessId,
      name: "Groomer House", legalName: "Groomer House Sylwia Ociepka", taxID: "6262553631",
      url: `${SITE_ORIGIN}/`, telephone: "+48607252521", email: "groomerhousetg@gmail.com",
      image: DEFAULT_SOCIAL_IMAGE,
      logo: { "@type": "ImageObject", url: canonicalUrl("/wp-content/uploads/2025/10/logo-groomer-house.png"), width: 1080, height: 1080 },
      address: {
        "@type": "PostalAddress", streetAddress: "ul. Strzelców Bytomskich 226a/1",
        addressLocality: "Bytom", postalCode: "41-933", addressCountry: "PL",
      },
      // These are the salon hours printed in the footer, not course slots.
      // No hours are invented for closed Monday or unspecified Sunday.
      openingHoursSpecification: [
        ["Tuesday", "08:00", "16:00"], ["Wednesday", "10:00", "18:00"],
        ["Thursday", "09:00", "17:00"], ["Friday", "10:00", "18:00"], ["Saturday", "10:00", "16:00"],
      ].map(([day, opens, closes]) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${day}`, opens, closes })),
      sameAs: ["https://www.instagram.com/groomerhouse_tg/", "https://www.facebook.com/GroomerHouseStrzyzeniePsow/"],
    },
    { "@type": "WebSite", "@id": websiteId, name: "Groomer House", url: `${SITE_ORIGIN}/`, inLanguage: "pl-PL", publisher: { "@id": businessId } },
    { "@type": "ImageObject", "@id": `${canonical}#primaryimage`, url: image, contentUrl: image,
      ...(options.imageAlt ? { caption: seoText(options.imageAlt) } : {}),
      ...(image === DEFAULT_SOCIAL_IMAGE ? { width: 1280, height: 720 } : {}),
    },
    {
      "@type": pageTypes[path] || "WebPage", "@id": pageId, url: canonical,
      name: title, description, inLanguage: "pl-PL", isPartOf: { "@id": websiteId }, about: { "@id": businessId },
      primaryImageOfPage: { "@id": `${canonical}#primaryimage` },
      ...(breadcrumbItems.length >= 2 ? { breadcrumb: { "@id": `${canonical}#breadcrumb` } } : {}),
      ...(wordpressUtcDate(options.modifiedGmt) ? { dateModified: wordpressUtcDate(options.modifiedGmt) } : {}),
    },
  ];
  if (breadcrumbItems.length >= 2) graph.push({
    "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`,
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: seoText(item.name), item: canonicalUrl(item.path),
    })),
  });
  if (article) graph.push({
    "@type": "BlogPosting", "@id": `${canonical}#article`, url: canonical,
    headline: seoText(article.headline), description, inLanguage: "pl-PL",
    mainEntityOfPage: { "@id": pageId }, isPartOf: { "@id": `${canonicalUrl("/blog/")}#webpage` },
    publisher: { "@id": businessId },
    ...(absoluteImageUrl(article.image) ? { image: [absoluteImageUrl(article.image)] } : {}),
    ...(wordpressUtcDate(article.publishedGmt) ? { datePublished: wordpressUtcDate(article.publishedGmt) } : {}),
    ...(wordpressUtcDate(article.modifiedGmt) ? { dateModified: wordpressUtcDate(article.modifiedGmt) } : {}),
    // No fictional Person/author, stars, reviews or prices are inferred.
  });
  return { "@context": "https://schema.org", "@graph": graph };
}

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}
