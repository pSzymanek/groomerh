# GA4 i Meta Pixel — konfiguracja Groomer House

Strona główna działa na Astro/Node, a `wp.groomerhouse.pl` jest osobnym WordPressem. Ten baner zarządza wyłącznie GA4 i Meta Pixel na głównej stronie. WordPress wymaga własnej konfiguracji zgód, jeżeli dodasz tam narzędzia pomiarowe.

## Włączenie na WEBD

1. W Google Tag Manager utwórz kontener dla `https://groomerhouse.pl` i skopiuj jego identyfikator w formacie `GTM-...`. Otrzymany dla strony kontener to `GTM-PHLXPT2N`. W kontenerze dodaj tag Google Analytics 4 i ustaw jego uruchamianie wyłącznie po zgodzie analitycznej. Nie wpisuj równolegle identyfikatora GA4 do środowiska Node, jeśli GA4 działa przez GTM — zapobiega to podwójnemu pomiarowi.
2. W Meta Events Manager utwórz Pixel i skopiuj jego identyfikator liczbowy.
3. W ustawieniach środowiska aplikacji Node na WEBD dodaj:

   `GTM_CONTAINER_ID=GTM-PHLXPT2N`

   `META_PIXEL_ID=123456789012345`

4. Zrestartuj aplikację Node. Identyfikatory są odczytywane z procesu Node przez `/api/tracking-config`; nie trzeba przebudowywać statycznych stron. Bez poprawnego identyfikatora dana integracja pozostaje wyłączona.

## Kontrola po wdrożeniu

- Przed wyborem w banerze nie powinno być żądań do `googletagmanager.com/gtm.js`, `googletagmanager.com/gtag/js` ani `connect.facebook.net/en_US/fbevents.js`.
- „Odrzuć opcjonalne” nie uruchamia żadnego z tych skryptów. Każdą kategorię można włączyć osobno w „Ustawieniach”.
- Po zgodzie analitycznej sprawdź wizytę w GA4 Realtime; po zgodzie marketingowej sprawdź zdarzenie `PageView` w Meta Events Manager. Kontrolę można też wykonać narzędziami Tag Assistant i Meta Pixel Helper.
- Link „Ustawienia cookies” w stopce pozwala zmienić lub cofnąć zgodę. Wycofanie zgody przeładowuje stronę i zatrzymuje dalsze uruchamianie skryptów.
- Wybór jest zapisywany lokalnie na maksymalnie 180 dni. Gdy dodasz lub zmienisz identyfikator, baner poprosi odwiedzających ponownie o decyzję.

Formularz Booknetic, jeśli jest osadzony, ładuje się dopiero po wybraniu „Pokaż formularz rezerwacji”. To nie zastępuje polityki prywatności i ewentualnego banera cookies osobnego WordPressa.
