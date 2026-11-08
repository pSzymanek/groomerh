import { readFile } from "node:fs/promises";
import path from "node:path";
import { escapeHtml, stripHtml } from "./snapshot";
import { mediaPath } from "./content";

export type WordPressPost = {
  id: number;
  date: string;
  date_gmt?: string;
  modified?: string;
  modified_gmt?: string;
  slug: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  featured_media?: number;
  _embedded?: { "wp:featuredmedia"?: { source_url?: string }[] };
};

const API_FIELDS = "id,date,date_gmt,modified,modified_gmt,slug,link,title,excerpt,content,featured_media,_links,_embedded";
const DEFAULT_WORDPRESS_URL = "https://wp.groomerhouse.pl";
const CACHE_MS = 30000;
let postCache: { origin: string; expires: number; posts: WordPressPost[] } | undefined;
let pendingPosts: { origin: string; promise: Promise<WordPressPost[]> } | undefined;
const wordpressOrigin = () => (process.env.WORDPRESS_URL || DEFAULT_WORDPRESS_URL).replace(/\/$/, "");

export async function getPosts(): Promise<WordPressPost[]> {
  const wordpress = wordpressOrigin();
  if (postCache?.origin === wordpress && postCache.expires > Date.now()) return postCache.posts;
  if (pendingPosts?.origin === wordpress) return pendingPosts.promise;
  const promise = (async () => {
    try {
      const live: WordPressPost[] = [];
      let totalPages = 1;
      for (let page = 1; page <= totalPages; page++) {
        const response = await fetch(`${wordpress}/wp-json/wp/v2/posts?status=publish&per_page=100&page=${page}&_embed=wp:featuredmedia&_fields=${API_FIELDS}`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error(`WordPress returned ${response.status}`);
        const posts = await response.json();
        if (!Array.isArray(posts)) throw new Error("Invalid WordPress response");
        totalPages = Math.min(20, Math.max(1, Number(response.headers.get("x-wp-totalpages")) || 1));
        live.push(...posts.filter(post => typeof post.slug === "string" && post.slug !== "hello-world"));
      }
      const posts = live.sort((a, b) => b.date.localeCompare(a.date));
      // WordPress is authoritative: a draft, deletion or empty blog must not
      // be silently replaced by published articles from the old local archive.
      postCache = { origin: wordpress, posts, expires: Date.now() + CACHE_MS };
      return posts;
    } catch {
      if (postCache?.origin === wordpress) {
        postCache.expires = Date.now() + 5000;
        return postCache.posts;
      }
      return JSON.parse(await readFile(path.resolve("archive", "current", "posts.json"), "utf8")) as WordPressPost[];
    }
  })();
  pendingPosts = { origin: wordpress, promise };
  try { return await promise; }
  finally { if (pendingPosts?.promise === promise) pendingPosts = undefined; }
}

export async function getPost(slug: string): Promise<WordPressPost | undefined> {
  const posts = await getPosts();
  return posts.find((post) => post.slug === slug);
}

export async function featuredImage(post: WordPressPost): Promise<string | undefined> {
  if (!post.featured_media) return undefined;
  const embeddedSource = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  if (embeddedSource) return embeddedSource;
  const configuredWordpress = wordpressOrigin();
  const wordpress = configuredWordpress && post.link.startsWith(`${configuredWordpress}/`)
    ? configuredWordpress : undefined;
  try {
    if (wordpress) {
      const response = await fetch(`${wordpress}/wp-json/wp/v2/media/${post.featured_media}?_fields=source_url`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const media = await response.json();
        if (typeof media.source_url === "string") return media.source_url;
      }
    }
  } catch { /* The archived image remains available if WordPress is offline. */ }
  return mediaPath(post.featured_media);
}

export function postPath(post: WordPressPost): string {
  // WordPress may use /index.php/date/slug/ on the CMS subdomain. The public
  // blog deliberately keeps the old root-level slug URL on groomerhouse.pl.
  return `/${post.slug}/`;
}

export function primaryPostCards(posts: WordPressPost[]): string {
  return posts.map((post) => {
    const title = escapeHtml(stripHtml(post.title.rendered));
    const excerpt = escapeHtml(stripHtml(post.excerpt.rendered).slice(0, 190));
    const href = escapeHtml(postPath(post));
    const date = escapeHtml(post.date.slice(0, 10));
    return `<article class="elementor-post elementor-grid-item post-${post.id} post type-post status-publish format-standard hentry" role="listitem">
      <div class="elementor-post__card">
        <div class="elementor-post__text">
          <h3 class="elementor-post__title"><a href="${href}">${title}</a></h3>
          <div class="elementor-post__excerpt"><p>${excerpt}</p></div>
          <a class="elementor-post__read-more" href="${href}" aria-label="Przeczytaj: ${title}">Przeczytaj całość »</a>
        </div>
        <div class="elementor-post__meta-data"><span class="elementor-post-date">${date}</span></div>
      </div>
    </article>`;
  }).join("\n");
}

export function sidebarPostCards(posts: WordPressPost[]): string {
  return posts.slice(0, 8).map((post) => {
    const title = escapeHtml(stripHtml(post.title.rendered));
    const href = escapeHtml(postPath(post));
    return `<article class="elementor-post elementor-grid-item post-${post.id} post type-post status-publish format-standard hentry" role="listitem">
      <div class="elementor-post__text">
        <h3 class="elementor-post__title"><a href="${href}">${title}</a></h3>
        <a class="elementor-post__read-more" href="${href}" aria-label="Przeczytaj: ${title}">Przeczytaj całość »</a>
      </div>
    </article>`;
  }).join("\n");
}

export function replaceDivContents(html: string, classFragment: string, contents: string): string {
  const classIndex = html.indexOf(classFragment);
  if (classIndex < 0) return html;
  const openStart = html.lastIndexOf("<div", classIndex);
  const openEnd = html.indexOf(">", classIndex);
  if (openStart < 0 || openEnd < 0) return html;

  const tokenPattern = /<div\b[^>]*>|<\/div\s*>/gi;
  tokenPattern.lastIndex = openEnd + 1;
  let depth = 1;
  let match;
  while ((match = tokenPattern.exec(html))) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) {
      return `${html.slice(0, openEnd + 1)}\n${contents}\n${html.slice(match.index)}`;
    }
  }
  return html;
}
