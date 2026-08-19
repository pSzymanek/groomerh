import { readFile } from "node:fs/promises";
import path from "node:path";
import { escapeHtml, stripHtml } from "./snapshot";

export type WordPressPost = {
  id: number;
  date: string;
  slug: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
};

const API_FIELDS = "id,date,slug,link,title,excerpt,content";

export async function getPosts(): Promise<WordPressPost[]> {
  const wordpress = (process.env.WORDPRESS_URL || "https://groomerhouse.pl").replace(/\/$/, "");
  try {
    const response = await fetch(`${wordpress}/wp-json/wp/v2/posts?per_page=100&_fields=${API_FIELDS}`);
    if (!response.ok) throw new Error(`WordPress returned ${response.status}`);
    return await response.json();
  } catch {
    const fallback = await readFile(path.resolve("archive", "wordpress", "posts.json"), "utf8");
    return JSON.parse(fallback);
  }
}

export async function getPost(slug: string): Promise<WordPressPost | undefined> {
  const posts = await getPosts();
  return posts.find((post) => post.slug === slug);
}

export function postPath(post: WordPressPost): string {
  try {
    return new URL(post.link).pathname;
  } catch {
    const date = post.date.slice(0, 10).replaceAll("-", "/");
    return `/${date}/${post.slug}/`;
  }
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
