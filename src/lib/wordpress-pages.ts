export const SUCCESS_PAGE_SLUG = "sukcesy-naszych-klientow";
export const SUCCESS_PAGE_PATH = `/${SUCCESS_PAGE_SLUG}/`;

export type WordPressPage = {
  id: number;
  slug: string;
  status: "publish";
  modified?: string;
  modified_gmt?: string;
  title: { rendered: string };
  content: { rendered: string; protected?: boolean };
  _embedded?: { "wp:featuredmedia"?: { source_url?: string; alt_text?: string }[] };
};

export type PageResult =
  | { state: "published"; page: WordPressPage; stale: boolean }
  | { state: "missing" }
  | { state: "unavailable" };

const CACHE_MS = 30_000;
const MAX_STALE_MS = 5 * 60_000;
const cache = new Map<string, { expires: number; confirmed: number; result: PageResult }>();
const pending = new Map<string, Promise<PageResult>>();

// Deliberately expose only this editorial page, not checkout/account/legal pages
// or every new Page created in the WordPress installation.
export async function getSuccessPage(): Promise<PageResult> {
  const origin = (process.env.WORDPRESS_URL || "https://wp.groomerhouse.pl").replace(/\/$/, "");
  const key = `${origin}/${SUCCESS_PAGE_SLUG}`;
  const previous = cache.get(key);
  if (previous && previous.expires > Date.now()) return previous.result;
  const running = pending.get(key);
  if (running) return running;

  const promise = (async (): Promise<PageResult> => {
    try {
      const url = new URL(`${origin}/wp-json/wp/v2/pages`);
      url.search = new URLSearchParams({
        slug: SUCCESS_PAGE_SLUG,
        status: "publish",
        per_page: "1",
        _embed: "wp:featuredmedia",
        _fields: "id,slug,status,modified,modified_gmt,title,content,_links,_embedded",
      }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`WordPress Page returned ${response.status}`);
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid WordPress Page response");
      const page = data[0];
      if (page && (typeof page.id !== "number" || page.slug !== SUCCESS_PAGE_SLUG || page.status !== "publish"
        || typeof page.title?.rendered !== "string" || typeof page.content?.rendered !== "string")) {
        throw new Error("Invalid published WordPress Page");
      }
      const result: PageResult = page && page.content.protected !== true
        ? { state: "published", page, stale: false }
        : { state: "missing" };
      cache.set(key, { result, expires: Date.now() + CACHE_MS, confirmed: Date.now() });
      return result;
    } catch {
      // A successful empty response is authoritative: never restore an
      // unpublished/deleted page from a bundled copy or an old success story.
      const result: PageResult = previous && Date.now() - previous.confirmed < MAX_STALE_MS
        ? previous.result.state === "published" ? { ...previous.result, stale: true } : previous.result
        : { state: "unavailable" };
      cache.set(key, { result, expires: Date.now() + 5000, confirmed: previous?.confirmed || 0 });
      return result;
    }
  })();
  pending.set(key, promise);
  try { return await promise; }
  finally { if (pending.get(key) === promise) pending.delete(key); }
}
