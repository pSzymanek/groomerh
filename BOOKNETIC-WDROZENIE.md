# Booknetic i Przelewy24 — wdrożenie

## Jedna akceptacja i podsumowanie ceny — 15 października 2026

Aktualny dodatek **1.0.3** zapisano bezpośrednio na WordPressie. Zachowuje poprawki wyglądu/osadzania i dodaje pełną cenę brutto, płatność teraz, saldo oraz termin dopłaty przed końcową akceptacją. Odczytuje zapisany kurs Booknetic i koszyk; potwierdzono 6500/500/6000 zł i 4500/500/4000 zł. Nie zmienia pobieranych kwot. Podsumowanie jest zachowywane z zamówieniem i dodawane do treści potwierdzenia; doręczenia e-maila nie testowano.

Formularz Booknetic ID 1 „Warunki rezerwacji kursu” jest **wyłączony**, z zachowaniem definicji i historii. Strona ID 8 pokazuje wcześniej informację o danych i linki. Pozostaje jeden niezaznaczony checkbox Groomer House przy „Zamawiam i płacę”; ewentualne własne warunki PayPro nie są pomijane.

Świeży test API P24 w sandboxie przeszedł. Nie powtarzano rezerwacji lub transakcji. Audyt i granice weryfikacji są w `PRZELEWY24-WERYFIKACJA.md`. Te zmiany nie wymagają nowego wdrożenia Node.

## Historia: wygląd i wysokość checkout 1.0.2 — 15 października 2026

Aktualny dodatek **Groomer House — warunki zamówienia 1.0.2** zapisano bezpośrednio na WordPressie. Tylko na publicznej stronie zamówienia ukrywa belkę administratora i nagłówek/stopkę motywu. Formularz używa kolorów strony, fontów DM Sans/Manrope, prostokątnych pól i przycisków, dwóch kolumn na komputerze i jednej w wąskiej ramce. Nie zmienia pól rozliczeniowych, zgód, koszyka, statusów ani ustawień P24.

Skrypt wysyła do istniejącego odbiornika na głównej stronie wysokość naturalnej treści; `ResizeObserver` i zdarzenia WooCommerce aktualizują ją po zmianach. W Chrome potwierdzono: komputer — szerokość dokumentu 1154 px, wysokość dokumentu i ramki 1292 px; wąska ramka — 360 px i 2124 px. W obu przypadkach `scrollHeight === clientHeight` oraz `scrollWidth === clientWidth`: brak osobnych suwaków formularza. Kontrola wąskiej ramki nie jest testem fizycznego telefonu. Dodatkowe 16 kontroli mechanizmu wysokości i 18 wcześniejszych kontroli konfiguracji/przekierowania przeszło. Nie wysłano zamówienia ani płatności. Aplikacja Node nie wymaga ponownego wgrania z powodu tej poprawki.

## Poprawka checkout — 15 października 2026

Dodatek **Groomer House — warunki zamówienia 1.0.1** jest zapisany bezpośrednio na WordPressie. Usuwa konflikt nagłówków przy osadzaniu wyłącznie skonfigurowanej strony zamówienia na `https://groomerhouse.pl`. Konto klienta i panel administratora pozostają chronione. W Chrome potwierdzono prawdziwy formularz WooCommerce wewnątrz głównej strony, checkbox i metodę Przelewy24, bez nowego zapisu lub płatności. Ta poprawka nie wymaga ponownego wgrywania paczki Node. Szczegóły i ograniczenia kontroli w `PRZELEWY24-WERYFIKACJA.md`.

## Konfiguracja zapisana 12 października 2026

- CMS: `https://wp.groomerhouse.pl`; formularz ID 8: `https://wp.groomerhouse.pl/index.php/rezerwacja/`.
- Shortcode `[booknetic category=1 staff=1 location=1]`: istniejące pakiety ID 1–3, Sylwia Ociepka, lokalizacja Groomer House.
- Pakiet 1: 40 godzin / 4500 zł brutto; Pakiet 2: 80 godzin / 6500 zł brutto; Pakiet 3: 120 godzin / 8500 zł brutto. Zaliczka 500 zł, możliwość pełnej wpłaty, grupa do 4 osób.
- Godzinny slot wskazuje początek kursu, a nie jego całkowitą długość. Harmonogram ustalany indywidualnie; godziny kalendarza i przypisania usług zachowano.
- Zgodnie z poleceniem usunięto kurs demo ID 4 oraz wszystkie trzy jego testowe rezerwacje. Pakiety, personel i konta klientów pozostawiono.
- Aktywne: WooCommerce 11.2.1, WooCommerce payment gateway for Booknetic 3.9.0, oficjalny Przelewy24 Payment Gateway 1.2.0.
- Booknetic: WooCommerce włączone pod etykietą Przelewy24, przekierowanie do zamówienia, pomijanie podsumowania wyłączone. Płatność na miejscu wyłączona. PLN, format `4 500,00 zł`.
- Formularz używa domyślnego prefiksu Polski +48. Uzupełniono 37 pól tłumaczeń w rodzimym Translatorze (124 pola polskiego słownika bez pustych/angielskich wartości źródłowych). Nowsze etykiety „Pokaż więcej”, „Pokaż mniej” i „Spróbuj ponownie” są uzupełniane tylko na dedykowanej stronie formularza.
- Potwierdzanie dla WooCommerce `processing` i `completed`, nigdy `pending`/`on-hold`. Domyślny status Booknetic Pending, udana płatność Approved, nieudana Canceled. Ręczne zatwierdzenie nie oznacza opłacenia zamówienia.
- WooCommerce: Polska, PLN, adres 41-933 Bytom, koszyk ID 914, zamówienie ID 915, regulamin ID 922, polityka ID 3, zakup jako gość. Dodatkowa telemetria WooCommerce wyłączona.
- Wtyczka Przelewy24 jest aktywna; bramka „Przelewy Online” pozostaje wyłączona bez prawdziwych kluczy operatora.

## Paczka Node na WEBD

Zrób kopię aplikacji głównej domeny, wgraj zawartość ZIP, uruchom `npm ci --omit=dev` i zrestartuj właściwą aplikację. Nie nadpisuj katalogu WordPressa.

Node co najmniej **22.19.0**, zalecany **24**. Start `/usr/bin/node`, plik `dist/server/entry.mjs`. Port **44374**, jeśli WEBD nie zmieniło przydziału.

```ini
NODE_ENV=production
HOST=0.0.0.0
PORT=44374
PUBLIC_SITE_URL=https://groomerhouse.pl
WORDPRESS_URL=https://wp.groomerhouse.pl
BOOKNETIC_ENABLED=true
BOOKING_EMBED_URL=https://wp.groomerhouse.pl/index.php/rezerwacja/
```

Usuń dawną zmienną `BOOKNETIC_DEMO`, jeśli nadal jest w panelu — nowa aplikacja jej nie używa. Formularz znajduje się wewnątrz `/rezerwacja/`, Booksy poniżej. Nie usuwaj subdomeny CMS ani nie instaluj starego mostu PHP.

## Własnoręczne podłączenie płatności

**Aktualizacja 15.10.2026:** obowiązuje procedura w `PRZELEWY24-WERYFIKACJA.md`. Wcześniejszy formularz zgody Booknetic wyłączono, zachowując pojedynczą akceptację w WooCommerce i informację z linkami przed podaniem danych. Stan przycisku jest automatyczny, z konfiguracji serwerowej; dawna ręczna flaga nie obowiązuje.

1. WooCommerce → Ustawienia → Przelewy24: wpisz prywatnie rzeczywisty identyfikator sprzedawcy, CRC i klucz API. Skonfiguruj wymagania konta/adres IP zgodnie z dokumentacją operatora. Nie umieszczaj kluczy w paczce, repozytorium ani czacie.
2. Zweryfikuj połączenie i właściwy tryb konta, a następnie włącz „Przelewy Online” w WooCommerce → Płatności. Nie włączaj niepotrzebnych bramek ani dodatkowych opłat.
3. Dodatek `Groomer House — warunki zamówienia` jest aktywny. Nie ustawiaj ręcznie `PAYMENTS_CONNECTED=true`: stan wynika z konfiguracji P24 po stronie serwera. Tryb sandbox sprawdzaj w ustawieniach operatora; zgodnie z poleceniem właściciela formularz nie zawiera publicznych komunikatów demo/testu.
4. Sprawdź: pakiet → termin → dane → podsumowanie → zaliczka lub pełna kwota → WooCommerce → Przelewy24 → powrót i status. Sprawdź porzuconą/odrzuconą płatność, miejsca i brak podwójnych zapisów.
5. Sprawdź sesję i płatność w osadzeniu na telefonie. Operator płatności może wymagać nawigacji poza ramką; samo podsumowanie nie potwierdza tego etapu.
6. Sprawdź dostarczanie wiadomości, potwierdzeń warunków umowy oraz ustawowego prawa odstąpienia na trwałym nośniku. Nie testowano płatnych transakcji ani dostarczalności poczty.

Przycisk „Zapłać przez Przelewy24” jest nieaktywny bez aktywnego dodatku, bramki i kompletu pól dostępu. Stan interfejsu nie zastępuje testu API; dodatek dodatkowo waliduje wymagane warunki i brak konfiguracji w klasycznym checkout WooCommerce. Nigdy nie potwierdza płatności na podstawie samego powrotu użytkownika z bramki.

Karty cen na stronie korzystają z `src/lib/courses.ts`, zgodnego z Booknetic w dniu weryfikacji. Zmiana cen w panelu wymaga również aktualizacji tego pliku i nowej paczki.

Dokumentacja: [Booknetic–WooCommerce](https://www.booknetic.com/documentation/woocommerce-payment-integration), [oficjalny moduł Przelewy24](https://www.przelewy24.pl/do-pobrania/woocommerce).
