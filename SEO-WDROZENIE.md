# SEO — Groomer House / WEBD

Aktualizacja: 24 października 2026. Adres docelowy: **https://groomerhouse.pl/**.

## Sitemapa i Search Console

- Sitemapa: https://groomerhouse.pl/sitemap.xml
- Robots: https://groomerhouse.pl/robots.txt
- Weryfikacja GSC: https://groomerhouse.pl/googlec1a70dd1837c7567.html

W Google Search Console dodaj lub otwórz usługę `https://groomerhouse.pl/` (Prefiks adresu URL), potwierdź ją metodą Plik HTML, jeśli nie jest jeszcze zweryfikowana, i w sekcji Mapy witryn wyślij `sitemap.xml`. Usługa domenowa wymaga odrębnej weryfikacji DNS; paczka jej nie wykonuje. Nie wysyłaj sitemapy subdomeny WordPress jako mapy głównej witryny.

W Inspekcji adresu URL sprawdź stronę główną, stronę kursu, jeden wpis i `/sukcesy-naszych-klientow/`. Google powinien móc odczytać stronę, a wskazany adres kanoniczny powinien prowadzić do HTTPS bez www. Zgłoszenie mapy ani prośba o indeksowanie nie gwarantują indeksacji lub pozycji.

## Co zawiera ta paczka

- Dynamiczną sitemapę XML: publiczne strony, opublikowane wpisy WordPressa i opublikowaną stronę „Sukcesy naszych klientów”. W audycie obecnej publikacji było 16 adresów. Mapa aktualizuje się razem z treścią CMS, bez nowego eksportu (cache 30 s).
- Kanoniczne bezwzględne adresy HTTPS, bez parametrów śledzących, oraz istotne zdjęcia w rozszerzeniu image sitemapy. `lastmod` wynika z rzeczywistej daty modyfikacji WordPressa. Dla stron bez wiarygodnej daty nie jest dopisywana data budowania paczki. Brak pozornego priorytetu i częstotliwości zmian.
- Otwarty `robots.txt` ze wskazaniem sitemapy, metadane `index,follow` na publicznych stronach oraz `noindex` na stronach błędów i odpowiedziach technicznych API/weryfikacji GSC. Nagłówek noindex pliku weryfikacyjnego nie zmienia jego treści ani dostępności.
- Osobne tytuły i opisy. Pięć potwierdzonych par title/description ze starej witryny zachowano dosłownie. Usunięto jedynie zdublowany końcowy dopisek marki w tytule wpisu.
- Open Graph i Twitter Card z tytułem, opisem, obrazem oraz tekstem alternatywnym; dla stron i wpisów z własnym zdjęciem używany jest właściwy obraz, a nie zawsze baner główny.
- Dane strukturalne JSON-LD: LocalBusiness (rzeczywiste dane firmy, adres z kodem pocztowym, telefon, logo, godziny zgodne ze stopką), WebSite, WebPage i odpowiednie podtypy, BreadcrumbList, BlogPosting. Daty artykułów korzystają z faktycznych pól GMT. Nie dodano fikcyjnego autora, ocen, opinii ani ofert. Nie obiecujemy rozszerzonych wyników FAQ.
- Treść bloga i strony z CMS renderowaną w HTML po stronie serwera, a nie ukrytą w iframe. Skaner nie musi uruchamiać JavaScriptu, aby zobaczyć artykuł. Tytuł strony i zdjęcia w CMS wpływają również na jej metadane.
- Zachowane historyczne slugi wpisów i strony oraz lokalne pliki zdjęć pod dawnymi adresami `/wp-content/uploads/`.
- Przekierowania 301 starych map (`sitemap_index.xml`, `page-sitemap.xml`, `post-sitemap.xml`, `wp-sitemap.xml`), adresów `/glowna/`, `/projekt/`, `/przykladowa-strona/`, `/cennik-uslug/` i historycznych adresów wpisów z datą.
- Prawdziwe 404 dla nieistniejących stron; nie kierujemy wszystkich błędnych URL-i na stronę główną. Niedostępna początkowo strona CMS zwraca 503 z Retry-After, a usunięta lub nieopublikowana — 404.

## WordPress jako CMS

`WORDPRESS_URL=https://wp.groomerhouse.pl`. Nie ustawiaj tego na aplikację Node. Po publikacji lub edycji odczekaj około 30 sekund. Zachowuj stare slugi przy edytowaniu artykułów.

**Poprawna pusta odpowiedź WordPressa jest wiążąca**: szkic, usunięcie lub pusty blog nie przywracają automatycznie artykułów z archiwum. Przy awarii blog zachowuje ostatnią pobraną listę; tylko przy pierwszym uruchomieniu bez działającego API używana jest dołączona kopia trzech historycznych wpisów. Strona „Sukcesy naszych klientów” nie ma archiwalnego zastępstwa; przy krótkiej awarii może zachować treść do 5 minut.

Publiczne kopie wpisów na subdomenie CMS powinny pozostać `noindex`, dostępne dla crawlera. Sam `Disallow` nie zastępuje noindex. Nie trzeba instalować nowej wtyczki SEO na WordPressie do wygenerowania metadanych frontendu Node. Nie zmieniaj przez tę paczkę Booknetic, WooCommerce, rezerwacji ani płatności.

## Audyt domeny przed wdrożeniem tej paczki — 24.10.2026

Potwierdzono odczytem HTTP/HTML:

- Obecna sitemapa, robots i plik GSC: HTTP 200. Wszystkie 16 adresów z mapy: HTTP 200, jeden H1, własny title/description, kanoniczny HTTPS bez www, index/follow.
- „Sukcesy naszych klientów” działa już publicznie i jest w mapie; nie wymaga ponownego importu do WordPressa (ID 938).
- Wariant www przekierowuje na HTTPS bez www, zachowując ścieżkę i parametry.
- Sprawdzone kopie treści na subdomenie WordPressa mają `noindex,nofollow`.
- HTTP bez www początkowo zwracał 200. **24.10.2026, po zgodzie właściciela włączono w Cloudflare wyłącznie Always Use HTTPS.** Potwierdzono HTTP 301 → HTTPS 200 dla strony głównej, kursu z parametrem, wariantu www i subdomeny WordPressa. Ścieżki i parametry są zachowane, nie ma pętli. Nie zmieniono DNS, HSTS ani trybu TLS. To ustawienie działa niezależnie od ZIP-a; nie trzeba włączać go ponownie.

To audyt techniczny, nie raport z konta GSC, analityki lub rzeczywistych Core Web Vitals. Nie wykonano transakcji ani zmian rezerwacji. Zaktualizowane metadane i sitemapa z tej paczki wymagają jej wgrania i restartu Node, aby pojawiły się na domenie.

## Wgranie i kontrola po aktualizacji

1. Zachowaj poprzedni `dist` do wycofania; zastąp **cały** `dist` wersją z paczki. Nie mieszaj plików dwóch buildów. Zachowaj zmienne środowiskowe, bazy i katalog WordPressa. Aktualizacja SEO nie wymaga ponownego instalowania wtyczek.
2. Zaktualizuj pliki runtime package/lock zgodnie z README, wykonaj `npm ci --omit=dev` i zrestartuj aplikację. Start: `node dist/server/entry.mjs` albo `npm start`. Nie uruchamiaj `astro-entry.mjs`, bo pomija poprawkę www.
3. Na produkcji `SEO_NOINDEX` nie może mieć wartości `true`. Dla oddzielnego podglądu ustawiaj ją zarówno przy budowaniu, jak i uruchamianiu (strony statyczne są generowane przy buildzie). W podglądzie robots pozwala na odczyt noindex, a sitemapa nie jest publikowana.
4. Sprawdź publiczne `/`, `/kurs-groomerski/`, `/blog/`, wpis, `/sukcesy-naszych-klientow/`, `/sitemap.xml`, `/robots.txt` oraz plik GSC. Strony mają zwracać 200, błędny adres 404, stare adresy 301. WWW musi kierować do HTTPS bez www. Osobno sprawdź HTTP → HTTPS na poziomie Cloudflare.
5. Wyślij sitemapę do GSC; monitoruj „Indeksowanie stron”, „Mapy witryn”, błędy 404 i kanoniczne adresy. Dla dodatkowych starych URL-i z raportu GSC dodawaj przekierowania do merytorycznych odpowiedników, nie zbiorczo do strony głównej.
6. Sprawdź najważniejsze podstrony w Rich Results Test / Schema Markup Validator i PageSpeed Insights, osobno mobile i desktop. Wyników szybkości nie należy wywnioskowywać z obecności kodu SEO. Po zebraniu danych obserwuj raport Core Web Vitals w GSC.
7. Aktualizuj rzeczywisty Profil Firmy Google: nazwa, adres, telefon i godziny powinny być zgodne ze stroną. Opisuj kolejne realizacje i kursy rzeczowo, dodawaj sensowne podpisy/alty zdjęć. Nie wstawiaj fraz do dekoracyjnych ikon. Treści i wyniki lokalnego wyszukiwania wymagają dalszej pracy; sam ZIP ich nie gwarantuje.

## Dokumentacja Google

- [Sitemapy i wiarygodne daty lastmod](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Canonical i duplikaty adresów](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Noindex i dostępność dla crawlera](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Dane artykułu](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Firma lokalna](https://developers.google.com/search/docs/appearance/structured-data/local-business)
- [Breadcrumbs](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)
- [Obrazy](https://developers.google.com/search/docs/appearance/google-images)
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
