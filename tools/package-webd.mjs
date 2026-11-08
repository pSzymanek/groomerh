import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const exportRoot = path.resolve(workspaceRoot, "export");
const targetRoot = path.resolve(process.argv[2] || "");

if (!process.argv[2] || !targetRoot.startsWith(exportRoot + path.sep)) {
  throw new Error("Export target must be a new directory inside export/.");
}
if (existsSync(targetRoot)) {
  throw new Error(`Export target already exists: ${targetRoot}`);
}

const lock = JSON.parse(await readFile(path.join(workspaceRoot, "package-lock.json"), "utf8"));
const versionOf = (name) => {
  const version = lock.packages[`node_modules/${name}`]?.version;
  if (!version) throw new Error(`Missing installed package: ${name}`);
  return version;
};

const serverEntry = await readFile(path.join(workspaceRoot, "dist/server/entry.mjs"), "utf8");
if (!serverEntry.includes("groomerhouse-canonical-entry-v1")) {
  throw new Error("Run npm run build:webd first: canonical-host entry is missing.");
}

await mkdir(targetRoot, { recursive: true });
const copies = [
  ["dist/server", "dist/server"],
  ["dist/client", "dist/client"],
  ["archive/current/posts.json", "archive/current/posts.json"],
  ["SEO-WDROZENIE.md", "SEO-WDROZENIE.md"],
  ["SEO-AUDYT-20261024.md", "SEO-AUDYT-20261024.md"],
  ["TRACKING-SETUP.md", "TRACKING-SETUP.md"],
  ["BOOKNETIC-WDROZENIE.md", "BOOKNETIC-WDROZENIE.md"],
  ["WORDPRESS-SETUP.md", "WORDPRESS-SETUP.md"],
  ["wordpress/booknetic-page.html", "wordpress/booknetic-page.html"],
  ["wordpress/woocommerce-checkout-page.html", "wordpress/woocommerce-checkout-page.html"],
  ["wordpress/sukcesy-naszych-klientow.html", "wordpress/sukcesy-naszych-klientow.html"],
  ["wordpress/sukcesy-naszych-klientow.xml", "wordpress/sukcesy-naszych-klientow.xml"],
  ["wordpress/booknetic-payment-wc/App/Providers/WcProductObject.php", "wordpress/booknetic-payment-wc/App/Providers/WcProductObject.php"],
  ["BOOKNETIC-NAPRAWA-20261023.md", "BOOKNETIC-NAPRAWA-20261023.md"],
  ["wordpress/groomerhouse-checkout", "wordpress/groomerhouse-checkout"],
  ["PRZELEWY24-WERYFIKACJA.md", "PRZELEWY24-WERYFIKACJA.md"],
  ["WEBD-WWW-20261016.md", "WEBD-WWW-20261016.md"],
];
for (const [source, destination] of copies) {
  const target = path.join(targetRoot, destination);
  await mkdir(path.dirname(target), { recursive: true });
  await cp(path.join(workspaceRoot, source), target, { recursive: true });
}

const runtimePackage = {
  name: "groomerhouse-webd-runtime",
  private: true,
  version: "1.0.0",
  type: "module",
  scripts: { start: "node dist/server/entry.mjs" },
  engines: { node: ">=22.19.0" },
  dependencies: {
    "@astrojs/node": versionOf("@astrojs/node"),
    astro: versionOf("astro"),
    cheerio: versionOf("cheerio"),
  },
};
await writeFile(path.join(targetRoot, "package.json"), `${JSON.stringify(runtimePackage, null, 2)}\n`);
await writeFile(path.join(targetRoot, "README-WEBD.md"), `# Groomer House — paczka Node.js dla WEBD

Ta paczka zawiera samodzielny serwer Astro oraz zasoby nowej strony. Nie jest motywem WordPress ani zbiorem plików do zwykłego katalogu statycznego WWW.

Wersje: Astro ${versionOf("astro")}, adapter Node ${versionOf("@astrojs/node")}. Zależności serwera są zapisane w dołączonym lockfile i sprawdzane osobnym audytem paczki runtime. Wynik audytu nie jest gwarancją bezpieczeństwa konfiguracji hostingu ani WordPressa. Zakres i ograniczenia kontroli: \`SEO-AUDYT-20261024.md\`.

## Wymagania

- Node.js **22.19.0 lub nowszy**, w obsługiwanej wersji parzystej; zalecany Node 24. Biblioteka Undici 8 wymaga co najmniej 22.19.0.
- Możliwość uruchomienia procesu Node oraz instalacji zależności npm.
- Katalog aplikacji z prawem odczytu plików i ustawieniem portu w panelu WEBD.

## Instalacja

1. Rozpakuj ZIP i prześlij **jego zawartość** do katalogu aplikacji Node na WEBD (przez SFTP/FTP lub menedżer plików). Nie nadpisuj plików starego WordPressa ani nie przełączaj domeny przed testem.
2. W katalogu aplikacji uruchom: \`npm ci --omit=dev\`.
3. Ustaw komendę startową: \`npm start\` (równoważnie: \`node dist/server/entry.mjs\`).
4. Ustaw zmienne środowiskowe: \`NODE_ENV=production\`, \`HOST=0.0.0.0\`, \`PORT\` zgodny z portem przydzielonym przez WEBD oraz \`PUBLIC_SITE_URL=https://groomerhouse.pl\`. Dla domeny produkcyjnej nie ustawiaj \`SEO_NOINDEX=true\`.
5. Ustaw \`WORDPRESS_URL=https://wp.groomerhouse.pl\`. Trzy oryginalne artykuły są już zaimportowane do CMS. Ten adres jest również domyślny w kodzie; nie wskazuj go na aplikację Node. Edytowane i nowe opublikowane wpisy pojawiają się w blogu z krótką pamięcią podręczną (30 sekund). Szczegóły w \`WORDPRESS-SETUP.md\`.
6. Uruchom aplikację i sprawdź stronę główną, \`/blog/\`, \`/polityka-prywatnosci/\`, \`/regulamin/\`, \`/rezerwacja/\` oraz obrazy. Przy awarii WordPressa blog zachowuje ostatni pobrany stan; tylko przy pierwszym starcie bez API używa kopii historycznych wpisów. Poprawna pusta odpowiedź CMS jest wiążąca i nie przywraca usuniętych wpisów.
7. Gdy otrzymasz identyfikatory GA4 i Meta Pixel, dodaj \`GA4_MEASUREMENT_ID\` i \`META_PIXEL_ID\` do środowiska Node zgodnie z \`TRACKING-SETUP.md\`, a następnie zrestartuj aplikację.

## Aktualizacja przekierowania www — 16 października 2026

- Zachowaj własne zmienne środowiskowe i katalog WordPressa. Zastąp kompletny katalog \`dist\` wersją z tej paczki; nie mieszaj plików dwóch buildów. Przed podmianą zachowaj poprzedni \`dist\` do wycofania.
- Komenda pozostaje ta sama: \`npm start\` lub \`node dist/server/entry.mjs\`. Nie uruchamiaj wewnętrznego \`astro-entry.mjs\`, bo pomija obsługę www.
- Nowy \`entry.mjs\` przekierowuje www na HTTPS bez www przed stronami statycznymi, SSR i obrazami/CSS. Zachowuje ścieżkę i parametry URL. GET/HEAD: 301; pozostałe metody: 308.
- Po podmianie zrestartuj Node w WEBD. Sprawdź \`https://www.groomerhouse.pl/rezerwacja/?kontrola=www\`: ma przejść na \`https://groomerhouse.pl/rezerwacja/?kontrola=www\`.
- Ta poprawka nie wymaga nowej wtyczki WordPress. Dołączona kopia dodatku ma wersję 1.0.4; nie zastępuj nią nowszej wersji z panelu.
- Jeżeli hosting/CDN sam serwuje pliki, zanim żądanie trafi do Node, dodaj również przekierowanie na jego poziomie. Szczegóły w \`WEBD-WWW-20261016.md\`.

## Ważne

- Aktualizacja SEO 24.10.2026: dynamiczna sitemapa ze zdjęciami, dane strukturalne firmy/stron/artykułów/breadcrumbs, osobne metadane obrazów i korekta zdublowanej nazwy marki. Zachowano stare adresy i pięć archiwalnych par title/description. Szczegóły i kroki Search Console są w \`SEO-WDROZENIE.md\`. HTTP → HTTPS zostało osobno włączone i sprawdzone w Cloudflare za zgodą właściciela; ZIP nie zmienia tej opcji. Zależności źródłowe i runtime zaktualizowano do zgodnych, poprawionych wersji; oba audyty npm: 0 znanych podatności. W WordPressie nie trzeba nic instalować ani nadpisywać.
- Aktualizacja 23.10.2026: \`/sukcesy-naszych-klientow/\` jest zarządzana przez zwykłą Stronę w WordPressie o slugu \`sukcesy-naszych-klientow\`. Link dodano do podmenu Kursy. Treść, zdjęcia i tytuł odświeżają się bez nowego ZIP-a (cache 30 s). Jeżeli strony nie ma jeszcze w panelu, utwórz ją zgodnie z \`WORDPRESS-SETUP.md\`; dołączono pliki HTML i import jednej strony. Nie instaluj do tego nowej wtyczki, nie zmieniaj Booknetic ani WooCommerce.
- W CMS utworzono już tę stronę (ID 938) — nie importuj jej ponownie. Poprawiono również niezgodny odczyt dat w dodatku WooCommerce dla Booknetic, który blokował panel. Zmiana została wykonana w WordPressie, więc samo wdrożenie Node nie wymaga instalacji nowej wtyczki. Dokumentacja i kopia pliku: \`BOOKNETIC-NAPRAWA-20261023.md\`. Nie podmieniaj całego WordPressa ani Booknetic plikami paczki Node.
- Aktualizacja 22.10.2026: ponad 10 lat doświadczenia i 100+ kursantów, większe liczby z jednorazowym zliczaniem po wejściu w widok (bez animacji przy ograniczonym ruchu). Dane ujednolicono także w „O mnie”. Pytania FAQ są nieklikalne, odpowiedzi widoczne, a informacja o płatności wskazuje panel rezerwacji. Nie wymaga to nowej wtyczki WordPress.
- Formularz Booknetic jest wkomponowany w \`groomerhouse.pl/rezerwacja/\`, bez otwierania nowej karty. Wtyczka działa w tle na WordPressie, a wizyty w salonie nadal pozostają w Booksy poniżej formularza.
- Formularz pokazuje rzeczywiste Pakiety 1–3 (4500/6500/8500 zł, 40/80/120 godzin). Kurs demo i trzy testowe rezerwacje zostały usunięte za zgodą właściciela. Ustaw \`BOOKNETIC_ENABLED=true\` i \`BOOKING_EMBED_URL=https://wp.groomerhouse.pl/index.php/rezerwacja/\`. Nie jest już używana zmienna \`BOOKNETIC_DEMO\`.
- WooCommerce i oficjalna wtyczka Przelewy24 są zainstalowane. Stan bramki jest pobierany z WordPressa przez dodatek Groomer House — warunki zamówienia. Bez kluczy przycisk pozostaje zablokowany. P24 jest w sandboxie, ale formularz nie zawiera publicznych komunikatów demo/testu, zgodnie z poleceniem właściciela. Wynik sprawdzenia jest w \`PRZELEWY24-WERYFIKACJA.md\`. Nie wgrywaj paczki Node do katalogu WordPressa.
- Paczka nie zawiera plików ani bazy starego WordPressa. Zawiera jedynie potrzebne nowej stronie obrazy z archiwum oraz zasoby Astro.
- Przeczytaj \`SEO-WDROZENIE.md\` i po wdrożeniu sprawdź indeksowalność oraz sitemapę na żywej domenie.
- Sam poprawny start lokalny nie potwierdza wersji Node, konfiguracji portu ani uprawnień na WEBD. W razie błędu potrzebne są logi startowe hostingu.
`);

console.log(targetRoot);
