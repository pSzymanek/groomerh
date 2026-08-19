# Groomer House — hybrydowa migracja z WordPressa

Publiczna część strony działa w Astro/Node i zachowuje wygląd starej witryny. WordPress pozostaje wyłącznie źródłem bloga oraz silnikiem Booknetic.

## Co znajduje się w projekcie

- `archive/` — publiczny snapshot WordPressa: 10 stron, wpisy, media, mapy witryny i pobrane zasoby;
- `src/` — front-end, dynamiczny blog, proxy tylko do publicznych endpointów WordPress REST API i strona rezerwacji;
- `wordpress/mu-plugins/groomerhouse-booknetic-bridge.php` — most tworzący stronę `/rezerwacja/` z shortcode `[booknetic]`;
- `tools/extract-wordpress.mjs` — ponowny eksport publicznej zawartości;
- `tools/prepare-assets.mjs` — przygotowanie lokalnych zasobów do builda.

## Uruchomienie lokalne

1. `npm install`
2. `npm run dev`
3. Otwórz `http://127.0.0.1:4321/`.

Build produkcyjny: `npm run build`, a następnie `npm run preview`.

## Podłączenie WordPressa i Booknetic

1. Skopiuj `.env.example` jako `.env` i ustaw `WORDPRESS_URL` na docelowy adres WordPressa, najlepiej `https://cms.groomerhouse.pl`.
2. W docelowym WordPressie pozostaw aktywne publikowanie wpisów przez REST API.
3. Skopiuj `wordpress/mu-plugins/groomerhouse-booknetic-bridge.php` do `wp-content/mu-plugins/`.
4. Aktywuj Booknetic. Most automatycznie utworzy publiczną stronę `/rezerwacja/` z oficjalnym shortcode `[booknetic]` i widokiem `?embed=1`.
5. Skonfiguruj w Booknetic usługi, personel, godziny, płatności i powiadomienia. Tych danych nie da się bezpiecznie odtworzyć z publicznej strony.

## Ważne ograniczenie eksportu

Publiczne API nie udostępnia ustawień administracyjnych, bazy rezerwacji, kluczy płatniczych ani prywatnych danych klientów. Projekt celowo ich nie pozyskuje. Do pełnej migracji Booknetic potrzebny będzie eksport bazy z panelu starego WordPressa albo dostęp administratora.
