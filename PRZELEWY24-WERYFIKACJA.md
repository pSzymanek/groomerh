# Przelewy24 — weryfikacja strony i sandbox

## Uzupełnienie — 16 października 2026

Właściciel otrzymał wezwanie P24 do zapewnienia pola akceptacji regulaminu z aktywnym linkiem. Na publicznym wariancie www znaleziono brak przekierowania, podczas gdy kasa dopuszcza osadzenie tylko na domenie bez www. Przygotowano lokalną poprawkę entrypointu Node i testy; nie wgrano jej na WEBD. Nie przesądzono przyczyny konkretnej decyzji weryfikatora. Porównanie wskazanej strony Magda Maluje, instrukcja i ograniczenia są w `WEBD-WWW-20261016.md`.

Nie zmieniano liczby checkboxów, ustawień WordPressa lub P24. Na dzień 16.10 sesja administratora wygasła, a koszyk jest pusty; nie tworzono rezerwacji, aby ponownie obejrzeć końcówkę procesu. Poniższy szczegółowy audyt dotyczy potwierdzonego stanu z 15.10, nie testu powtórzonego 16.10. Dodatek otrzymał później wersję 1.0.4 z korektą tekstu opcjonalnych uwag do kursu.

## Audyt z 15 października 2026

Stan audytu: 15 października 2026. Sprawdzono publiczny serwis `groomerhouse.pl` oraz CMS `wp.groomerhouse.pl`. Poniższe poprawki zapisano bezpośrednio na WordPressie; w tym audycie nie wgrywano Node ani nie zmieniano DNS.

## Ponowny audyt — jedna akceptacja i pełna cena

Z listy wymagań P24 wynika potrzeba dokumentów dostępnych z koszyka i checkboxa przy zakupie, ale nie dodatkowej, identycznej zgody w poprzednim kroku. Na tej podstawie pozostawiono jedną akceptację Groomer House w WooCommerce. Nie jest to osobna decyzja P24 o zatwierdzeniu strony.

**Wdrożono:**

- W Booknetic wyłączono **Enable form** formularza ID 1 „Warunki rezerwacji kursu”. Stan potwierdzono po odświeżeniu. Zachowano definicję trzech pól i historyczne dane; nie usuwano odpowiedzi lub rezerwacji.
- Strona ID 8 pokazuje przed formularzem informację o przetwarzaniu danych na potrzeby zapisu i umowy oraz linki do regulaminu i polityki. Akceptacja następuje przy końcowym zamówieniu; dodatkowy krok zgody zniknął z Booknetic.
- W WooCommerce pozostaje jeden niezaznaczony checkbox Groomer House i walidacja serwerowa. Ewentualne własne warunki PayPro na stronie operatora nie są pomijane; nie ustawiano automatycznie `regulationAccept=true`.
- Dodatek **Groomer House — warunki zamówienia 1.0.3** pokazuje pełną cenę brutto, płatność teraz, saldo po tej wpłacie i termin dopłaty. Czyta zapisaną rezerwację Booknetic i koszyk, nie ceny wpisane na sztywno. Nie zmienia cen, pobieranej kwoty ani statusów.
- W istniejących koszykach potwierdzono Pakiet 2: **6500 / 500 / 6000 zł**, a następnie Pakiet 1: **4500 / 500 / 4000 zł**. Audyt nie tworzył rezerwacji, zamówień ani płatności.
- Podsumowanie zostaje zachowane w metadanych zamówienia i dodane wraz z dokumentami do istniejących wiadomości klienta. Dostarczalności wiadomości nie testowano.

| Obszar | Wynik i dowód |
| --- | --- |
| Dostępność i HTTPS | Potwierdzone: publiczny serwis i osadzone zamówienie działają. |
| Sprzedawca i kontakt | Nazwa, NIP 6262553631, adres Strzelców Bytomskich 226a/1, **41-933 Bytom**, telefon i e-mail są dostępne w dokumentach/kontakcie. Zgodności z prywatnymi danymi konta P24 nie poświadczano. |
| Oferta | Aktywne Pakiety 1–3: 40/80/120 h, 4500/6500/8500 zł, zaliczka 500 zł; są opisy i zdjęcie oferty. Ceny dodatkowej strony kursu podstawowego sprawdzono w Chrome, nie ze starej kopii wyszukiwarki. Koci kurs za 1500 zł pozostaje ofertą kontaktową, nie nową usługą Booknetic. |
| Dokumenty i checkbox | Dostępne przed podaniem danych i w checkout; jeden końcowy checkbox, bez marketingu i domyślnego zaznaczenia. WooCommerce wskazuje checkout 915 i regulamin 922; WordPress politykę 3. Kopie dokumentów w CMS zawierają dane firmy i opis rezerwacji/płatności. |
| Warunki sprzedaży | Regulamin opisuje realizację stacjonarną bez wysyłki, płatność i dopłatę, reklamacje, 14 dni odstąpienia, zwroty i wzór oświadczenia. Jest to przegląd treści, nie certyfikacja prawna całości. |
| Ostatni ekran | Poprawione: pełna cena, kwota teraz i saldo przed checkboxem oraz „Zamawiam i płacę”. |
| Operator | Dane PayPro SA są w regulaminie; link do informacji RODO płatników P24 działa. |
| API sandbox | Ponowiono wyłącznie test połączenia: **„Ustawienia są poprawne”**, widoczny tryb **Test - sandbox**. Nie odczytywano lub zmieniano kluczy. |
| Transakcja i e-mail | **Nadal niepotwierdzone:** pełne przekierowanie, udana/odrzucona płatność, powrót, callback, statusy i dostarczenie wiadomości. Poprzedniej decyzji o zatrzymaniu testu nie zmieniano. |
| Flagi metod | Jest oficjalne logo P24. **Do potwierdzenia** pozostaje lista metod aktywowanych na koncie produkcyjnym; przy aktywacji kart potrzebne również Visa/Mastercard. Nie dodawano znaków niepotwierdzonych metod. |
| Konto produkcyjne | **Po stronie właściciela/P24:** weryfikacja firmy, rachunku, dokumentów i decyzja operatora. Sandbox nie jest rzeczywistą płatnością klientów. |
| Kurs zaczynający się przed 14 dniami | **Do ustalenia procedury:** zwykła akceptacja regulaminu nie jest wyraźnym żądaniem wcześniejszego rozpoczęcia świadczenia. Przed takim rozpoczęciem należy uzyskać odpowiednie oświadczenia, np. osobno lub korespondencyjnie. Nie dodawano ogólnej zgody i nie ograniczano prawa odstąpienia. |

Nie testowano kuponów, dopłat do wcześniej opłaconych rezerwacji ani przyszłych wersji integracji. Kupon WooCommerce nie musi zmienić pełnej ceny umowy w Booknetic. Parser PHP nie zgłasza błędów; 18 wcześniejszych testów konfiguracji/przekierowania i 16 testów wysokości przechodzi. Nie są to testy całej transakcji. Kopie i zrzuty: `export/proofs-20261015/`.

**Miniatury oferty:** na głównej podstronie kursów jest działające zdjęcie szkolenia, natomiast trzy usługi w samym Booknetic nadal mają domyślne ikony zastępcze zdjęć. Nie stwierdzono na tej podstawie jednoznacznego naruszenia wymogu P24 dotyczącego zdjęcia oferty w każdej kategorii, ale przed zgłoszeniem warto uzupełnić miniatury usług rzeczywistymi fotografiami. Nie wgrywano nowych zdjęć w ramach zmiany zgód.

Źródła ponownego audytu: [wymagania P24](https://www.przelewy24.pl/centrum-pomocy/sprzedaje-z-przelewy24/weryfikacja-sklepu-internetowego/jakie-warunki-musze-spelnic-sklep-byl-zweryfikowany-pozytywnie), [UOKiK — cena i przycisk zamówienia](https://prawakonsumenta.uokik.gov.pl/pytania-i-odpowiedzi/prawo-do-informacji/), [aktywacja konta P24](https://www.przelewy24.pl/centrum-pomocy/sprzedaje-z-przelewy24/rejestracja-w-przelewy24/jakie-kroki-musze-podjac-aby-moje-konto-bylo-aktywne), [regulamin PayPro](https://www.przelewy24.pl/regulamin), [RODO płatników P24](https://www.przelewy24.pl/obowiazek-informacyjny-rodo-platnicy), [ECK — odstąpienie i wcześniejsze rozpoczęcie](https://konsument.gov.pl/zakupy-przez-internet-odstapienie-od-umowy/). Kod zainstalowanej integracji WooCommerce–Booknetic sprawdzono tylko do odczytu.

Aktualizacja wyglądu po osadzeniu (od 1.0.2, zachowana w 1.0.3): dodatek usuwa elementy motywu/toolbar z checkoutu, dopasowuje go do głównej strony i automatycznie raportuje wysokość. W rzeczywistym osadzeniu potwierdzono brak wewnętrznego przewijania na komputerze i w kontrolnej ramce 360 px. Szczegóły w `BOOKNETIC-WDROZENIE.md`. Poprawka nie jest testem transakcji ani callbacku P24.

## Poprawka osadzania zamówienia — 15 października 2026

- Po przejściu z Booknetic do `/index.php/zamowienie/` przeglądarka blokowała ramkę: WooCommerce wysyłało `X-Frame-Options: SAMEORIGIN` oraz `Content-Security-Policy: frame-ancestors 'self';`. Strona poza ramką odpowiadała HTTP 200.
- Za zgodą właściciela aktywny dodatek **Groomer House — warunki zamówienia 1.0.1** otrzymał wyjątek wyłącznie dla skonfigurowanej strony checkout. Dopuszczone są `'self'` i dokładnie `https://groomerhouse.pl`, bez wildcardów, HTTP, innych subdomen i localhosta. Inne dyrektywy CSP są zachowywane. Panel administratora, AJAX i konto klienta nie są objęte wyjątkiem. Nie zmieniano kodu WooCommerce ani Przelewy24.
- Poprawkę zapisano bezpośrednio w aktywnej wtyczce WordPress. Nagłówek checkout potwierdzono przez Chrome: `frame-ancestors 'self' https://groomerhouse.pl;`, bez sprzecznego `X-Frame-Options`. Strona `/index.php/moje-konto/` nadal zwraca `SAMEORIGIN` i `frame-ancestors 'self';`.
- W kontrolnej ramce na prawdziwym `https://groomerhouse.pl/rezerwacja/` załadowano istniejący koszyk WooCommerce. Formularz, podsumowanie 500 zł, Przelewy24, niezaznaczony checkbox i przycisk „Zamawiam i płacę” są dostępne. Nie ponawiano zapisu Booknetic, nie wysłano zamówienia WooCommerce ani płatności. Samo osadzenie nie potwierdza transakcji/callbacku P24.
- Składnia PHP sprawdzona parserem; 18 dotychczasowych kontroli konfiguracji i przekierowania pozostaje poprawnych. Kopia sprzed zmiany i zrzuty znajdują się w lokalnym `export/proofs-20261015/`. Poprawka nie wymaga zmiany ani ponownego wdrożenia aplikacji Node.
- Oficjalna podstawa zachowania: [WooCommerce — wc_send_frame_options_header](https://woocommerce.github.io/code-reference/files/woocommerce-includes-wc-template-functions.html#function_wc_send_frame_options_header), [WordPress — send_frame_options_header](https://developer.wordpress.org/reference/functions/send_frame_options_header/).

## Co należy wykazać operatorowi

- Działająca publiczna strona, rzeczywista oferta ze zdjęciami, opisami i cenami; bez pustych kategorii.
- Tożsamość sprzedawcy i NIP zgodne z kontem P24, adres oraz kontakt.
- Dostępne regulamin sprzedaży usług, polityka prywatności, płatności, wykonanie usługi, reklamacje i ustawowe odstąpienie z formularzem.
- Niezaznaczony domyślnie, wymagany checkbox i linki do obu dokumentów przed zamówieniem.
- Oznaczenie operatora i metod płatności rzeczywiście uruchomionych na koncie. Nie deklarujemy dostępności kart/BLIK/portfeli przed ich aktywacją.
- Zakończona weryfikacja konta firmy po stronie P24, w tym dokumenty i przelew weryfikacyjny zgodnie z żądaniem operatora. Kod strony nie zastąpi tej procedury.

Oficjalne źródła:

- [Wymagania weryfikacji strony](https://www.przelewy24.pl/centrum-pomocy/sprzedaje-z-przelewy24/weryfikacja-sklepu-internetowego/jakie-warunki-musze-spelnic-sklep-byl-zweryfikowany-pozytywnie)
- [Aktywacja konta P24](https://www.przelewy24.pl/centrum-pomocy/sprzedaje-z-przelewy24/rejestracja-w-przelewy24/jakie-kroki-musze-podjac-aby-moje-konto-bylo-aktywne)
- [Dokumentacja API i środowiska sandbox](https://developers.przelewy24.pl/index.php?pl)
- [Oficjalna wtyczka WooCommerce](https://www.przelewy24.pl/do-pobrania/woocommerce)
- [Natywne formularze Booknetic](https://www.booknetic.com/documentation/custom-forms)

## Wdrożone rozwiązanie

1. Booknetic: wcześniejszy formularz „Warunki rezerwacji kursu” jest wyłączony, a nie usunięty. Przed formularzem są informacja o danych i linki do dokumentów. Wymagany checkbox jest tylko w WooCommerce; nie jest zgodą na marketing ani podstawą przetwarzania danych koniecznych do umowy.
2. Dodatek `wordpress/groomerhouse-checkout`: zmienia treść natywnego obowiązkowego checkboxa WooCommerce, egzekwuje jego wartość na serwerze w klasycznym checkout i zapisuje datę oraz kopie zaakceptowanych dokumentów w metadanych zamówienia. Kopie dokumentów są dołączane do treści wiadomości klienta. Nie wysłano jeszcze płatnego zamówienia ani nie sprawdzono dostarczalności poczty.
3. Stan P24 jest wyznaczany na serwerze z aktywności wtyczki, bramki i obecności trzech pól dostępu. Do przeglądarki trafiają tylko stan i nazwa środowiska, nigdy klucze. Samo ich wypełnienie nie dowodzi poprawnego połączenia — trzeba użyć testu połączenia P24.
4. Zgodnie z poleceniem właściciela interfejs Booknetic i WooCommerce nie pokazuje komunikatów „tryb testowy/demo” i odpowiada docelowemu procesowi. P24 pozostaje ustawione na sandbox; oznaczeń należących do samej bramki operatora nie zmieniono. Zamówienia dostają znacznik środowiska. Udany callback sandbox pozostawia WooCommerce `on-hold`, więc nie powinien zatwierdzać miejsca jako prawdziwie opłaconego kursu (Booknetic zatwierdza tylko `processing`/`completed`). Tego callbacku nie sprawdzono — właściciel zatrzymał test przed złożeniem zamówienia.
5. Banki i P24 nie muszą pozwalać na płatność wewnątrz iframe. Booknetic pozostaje osadzony na głównej stronie; przekierowanie do P24 po złożeniu zamówienia odbywa się w tej samej karcie na pełnym ekranie. Komunikat jest akceptowany tylko z własnej ramki WordPress i tylko dla HTTPS `secure.przelewy24.pl` / `sandbox.przelewy24.pl`.
6. Stopka strony Node: dane firmy, NIP i oficjalne logo P24. Regulamin: dane PayPro, realizacja kursu bez wysyłki, termin płatności zaliczki i pozostałej ceny. Rachunek 31 1050 1230 1000 0090 8251 8383 jest poprawny pod względem sumy kontrolnej (MOD97 = 1); nie dowodzi to właściciela rachunku.

## Prywatna konfiguracja i test

1. WooCommerce → Ustawienia → Przelewy24. Wybierz **Test — sandbox**, wpisz ID, CRC i klucz API z **konta testowego**, zapisz. Nigdy nie mieszaj kluczy produkcyjnych z sandboxem.
2. W panelu P24 dodaj adres wychodzący IP serwera WordPress zgodnie z dokumentacją. Nie jest to automatycznie adres Cloudflare ani komputera właściciela. Jeśli nie znasz go, potwierdź z hostingiem. Użyj przycisku **Test połączenia**.
3. Dokumentacja P24 opisuje tworzenie sandboxa z konta produkcyjnego: Moje konto → Konto w SANDBOX. Jeśli ta opcja nie jest dostępna na etapie weryfikacji, poproś support o dostęp testowy i wskaż, że wymagają demonstracji przed aktywacją.
4. Włączona ma być bramka „Przelewy Online”; nie włączaj kart, BLIK ani portfeli osobno, jeśli nie są skonfigurowane. Nie włączaj opłaty dodatkowej.
5. Dodatek **Groomer House — warunki zamówienia** został wgrany i aktywowany przez właściciela. Zaktualizowano rezerwację ID 8, zamówienie ID 915 oraz regulamin ID 922. Stronę zamówienia przełączono z bloku WooCommerce na wspierany klasyczny shortcode, aby działały wymagany checkbox i walidacja serwerowa dodatku. Poprzednia treść jest w wersjach WordPress i lokalnej kopii kontrolnej.
6. Sprawdź formularz jako gość: wybrany pakiet, termin, dane; brak zgody musi blokować przejście; potem podsumowanie, zaliczka/pełna kwota, WooCommerce z wymaganym checkboxem i kwotą, przekierowanie do prawdziwego hosta sandbox, symulacja udanej/odrzuconej płatności, powrót/callback, statusy i poczta. Testuj fikcyjne dane; nie składaj rzeczywistego zamówienia na kurs dla samego testu.
7. Po wgraniu paczki Node przekaż supportowi adres `https://groomerhouse.pl/rezerwacja/`, `https://groomerhouse.pl/regulamin/`, `https://groomerhouse.pl/polityka-prywatnosci/` i `https://groomerhouse.pl/dane-kontaktowe/`. Nie wysyłaj im kluczy w treści zgłoszenia.

## Przejście na produkcję

Dopiero po akceptacji P24: prywatnie wpisz klucze produkcyjne i przełącz tryb modułu. Sprawdź obsługę rzeczywistej płatności, status i wiadomości — sam test połączenia sandbox nie potwierdza gotowości produkcyjnej. Płatność produkcyjną wykonuje właściciel. Przed uruchomieniem kolejnych metod dodaj ich oficjalne flagi zgodnie z wymaganiami P24. Nie udostępniaj prawdziwym klientom płatności sandbox jako rzeczywistej zapłaty za kurs.

## Wynik potwierdzony przed otrzymaniem kluczy

- Zapisany natywny wymagany checkbox Booknetic i działające linki.
- Próba przejścia bez zaznaczenia zatrzymana; po zaznaczeniu formularz przeszedł do podsumowania. Bez utworzenia rezerwacji.
- Wtyczka P24 aktywna, tryb sandbox, bramka Przelewy Online włączona. Na początku sesji wszystkie trzy pola uwierzytelnienia były puste.
- Właściciel wprowadził później dane, a test wyświetlił „Ustawienia są niepoprawne”. Potwierdził, że były to klucze z głównego konta produkcyjnego, podczas gdy wtyczka była ustawiona na sandbox. Nie przełączano modułu na produkcję. Konieczne są klucze właściwego konta testowego i poprawna lista IP.
- Następnie właściciel poprawił konfigurację: w panelu bezpośrednio potwierdzono **„Ustawienia są poprawne”** i tryb **sandbox**. Z serwera PHP zmierzono adres wychodzący **194.181.228.135**.
- Uzgodniony test przeszedł przez Booknetic do klasycznej kasy WooCommerce: Pakiet 1, początek 29.10.2026 o 09:00, zaliczka 500 zł, fikcyjne dane TEST SANDBOX / Weryfikacja P24. Kasa pokazała P24 i niezaznaczony wymagany checkbox z oboma odnośnikami. Właściciel polecił zatrzymać test przed „Zamawiam i płacę”. Nie wykonano transakcji P24 ani testu callbacku; nie zmieniano profilu rozliczeniowego administratora. Pozostawiono wyłącznie stan/koszyk testowy — nie kasowano żadnych istniejących danych.
- Do dodatku dołączono narzędzie **WooCommerce → IP serwera P24**, dostępne wyłącznie administratorom sklepu. Przycisk wykonuje zapytanie do api.ipify.org z serwera PHP, bez przesyłania kluczy ani danych klientów. Wynik może wymagać uzupełnienia o inne adresy wychodzące hostingu.
- Połączenie API jest potwierdzone testem wtyczki. Brak potwierdzenia pełnej transakcji, przekierowania i callbacku. Pozytywny test połączenia nie oznacza decyzji P24 o akceptacji sklepu.
- Lokalny wynik: `astro check` — 29 plików, 0 błędów/ostrzeżeń; audyty npm projektu i paczki — 0 znanych podatności; `verify-webd.mjs` — 240 kontroli, 15 tras, 25 zasobów; `verify-checkout.mjs` — 18 testów stanu przycisku i ograniczeń przekierowania; `verify-wordpress.mjs` — 11 kontroli odczytu CMS, bez mutacji. Czyste rozpakowanie ZIP-a z instalacją zależności i uruchomieniem Node przeszło poprawnie. Końcowa aktualizacja dotyczy wyłącznie kopii plików WordPress i dokumentacji w paczce, nie zmienia uruchomionego builda Node.
