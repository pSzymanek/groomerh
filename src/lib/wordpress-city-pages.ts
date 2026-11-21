import type { WordPressPage } from "./wordpress-pages";

/**
 * City landing pages ("Kurs groomerski <miejscowość>") managed in WordPress.
 * Only Pages with the "Kafelek miejscowości" checkbox (meta gh_city_tile,
 * registered by the groomerhouse-cms mu-plugin) are exposed on groomerhouse.pl —
 * never checkout/account/booking pages or arbitrary new Pages.
 */
export const CITY_META = "gh_city_tile";

export type CityTile = { id: number; slug: string; title: string; href: string; order: number; modified?: string };
export type CityPage = WordPressPage & { menu_order?: number; meta?: Record<string, unknown> };

const CACHE_MS = 30_000;
const MAX_STALE_MS = 5 * 60_000;
const SLUG = /^[a-z0-9][a-z0-9-]{0,190}$/;

const origin = () => (process.env.WORDPRESS_URL || "https://wp.groomerhouse.pl").replace(/\/$/, "");
const decode = (html: string) => html
  .replace(/<[^>]*>/g, "")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .trim();

const isCity = (page: CityPage) => page?.meta?.[CITY_META] === true;

let listCache: { expires: number; confirmed: number; tiles: CityTile[] } | undefined;
let listPending: Promise<CityTile[]> | undefined;

/** Checked city pages, ordered by WordPress "Kolejność" (menu_order), then title. */
export async function getCityTiles(): Promise<CityTile[]> {
  if (listCache && listCache.expires > Date.now()) return listCache.tiles;
  if (listPending) return listPending;
  listPending = (async () => {
    try {
      const url = new URL(`${origin()}/wp-json/wp/v2/pages`);
      url.search = new URLSearchParams({
        status: "publish", per_page: "100", orderby: "menu_order", order: "asc",
        _fields: "id,slug,status,title,menu_order,modified_gmt,meta,content",
      }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`WordPress Pages returned ${response.status}`);
      const data: unknown = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid WordPress Pages response");
      const tiles = (data as CityPage[])
        .filter((page) => page?.status === "publish" && isCity(page) && SLUG.test(page.slug) && page.content?.protected !== true)
        .map((page) => ({
          id: page.id,
          slug: page.slug,
          title: decode(page.title?.rendered || "") || page.slug,
          href: `/${page.slug}/`,
          order: Number(page.menu_order) || 0,
          modified: page.modified_gmt,
        }))
        .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "pl"));
      listCache = { tiles, expires: Date.now() + CACHE_MS, confirmed: Date.now() };
      return tiles;
    } catch {
      // Keep the last good list through a short CMS outage, then show none.
      const tiles = listCache && Date.now() - listCache.confirmed < MAX_STALE_MS ? listCache.tiles : [];
      listCache = { tiles, expires: Date.now() + 5000, confirmed: listCache?.confirmed || 0 };
      return tiles;
    } finally {
      listPending = undefined;
    }
  })();
  return listPending;
}

export type CityPageResult = { state: "published"; page: CityPage } | { state: "missing" } | { state: "unavailable" };
const pageCache = new Map<string, { expires: number; confirmed: number; result: CityPageResult }>();

/** One checked city page with content, or missing/unavailable. */
export async function getCityPage(slug: string): Promise<CityPageResult> {
  if (!SLUG.test(slug)) return { state: "missing" };
  const previous = pageCache.get(slug);
  if (previous && previous.expires > Date.now()) return previous.result;
  try {
    const url = new URL(`${origin()}/wp-json/wp/v2/pages`);
    url.search = new URLSearchParams({
      slug, status: "publish", per_page: "1", _embed: "wp:featuredmedia",
      _fields: "id,slug,status,modified,modified_gmt,title,content,menu_order,meta,_links,_embedded",
    }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`WordPress Page returned ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid WordPress Page response");
    const page = data[0] as CityPage | undefined;
    const valid = page && page.slug === slug && page.status === "publish" && isCity(page)
      && typeof page.title?.rendered === "string" && typeof page.content?.rendered === "string" && page.content.protected !== true;
    const result: CityPageResult = valid ? { state: "published", page } : { state: "missing" };
    pageCache.set(slug, { result, expires: Date.now() + CACHE_MS, confirmed: Date.now() });
    return result;
  } catch {
    const result: CityPageResult = previous && Date.now() - previous.confirmed < MAX_STALE_MS ? previous.result : { state: "unavailable" };
    pageCache.set(slug, { result, expires: Date.now() + 5000, confirmed: previous?.confirmed || 0 });
    return result;
  }
}
