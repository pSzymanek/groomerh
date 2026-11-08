# WordPress — blog, podstrona i rezerwacje Groomer House

CMS: `https://wp.groomerhouse.pl`. Blog i główna strona: `https://groomerhouse.pl`. WordPress wykonuje Booknetic/PHP, a Node pobiera publikacje przez REST API i osadza formularz.

## Blog

12 października 2026 zaimportowano trzy oryginalne artykuły z datami, tytułami, treścią i zdjęciami:

- `kapiel-ozonowa-dla-psa`
- `co-robi-groomer-praca-jako-groomer`
- `jak-zostac-groomerem-w-polsce-kompletny-przewodnik`

Zarządzanie: **Wpisy → Wszystkie wpisy / Dodaj wpis**. Publikacje, edycje, zdjęcia oraz przeniesienie do szkicu są odczytywane przez stronę główną. Lista odświeża się co najwyżej co 30 sekund. Zachowaj slugi oryginalnych artykułów — zmiana wymaga przekierowania SEO.

Starter „Hello world!” pozostawiono w panelu, ale nie jest pokazywany na głównej domenie. Zdrowe API WordPressa jest jedynym źródłem listy, bez przywracania ukrytych/usuniętych wpisów z archiwum. Podczas awarii wykorzystywana jest ostatnia poprawna lista, a po restarcie awaryjna kopia trzech artykułów.

## Sukcesy naszych klientów — strona edytowana w WordPressie

Adres publiczny: `https://groomerhouse.pl/sukcesy-naszych-klientow/`. Link znajduje się w podmenu **Kursy**, na komputerze i telefonie.

23.10.2026 utworzono i opublikowano stronę w CMS (ID 938). Nie trzeba importować jej ponownie. Wstęp jest neutralny, bez wymyślonych historii klientów; właściwe realizacje i zdjęcia można dopisywać w edytorze blokowym.

Zarządzanie: **Strony → Sukcesy naszych klientów → Edytuj**. To zwykła strona WordPressa, nie wpis blogowy i nie formularz Booknetic. Zachowaj jej slug `sukcesy-naszych-klientow` oraz widoczność **Publiczna / Opublikowana**. Nie trzeba zmieniać działających permalinków CMS.

- Tytuł, treść, zdjęcia i zdjęcie wyróżniające są odczytywane z REST API. Używaj zwykłych bloków WordPressa: akapit, nagłówek, obraz, galeria, kolumny, grupa, cytat, przyciski i tabela. Osadzone skrypty, formularze i iframe są pomijane.
- Po kliknięciu **Zapisz / Aktualizuj** zmiany pojawią się na głównej domenie po maksymalnie około 30 sekundach. Nie wymagają nowego ZIP-a ani restartu Node. Zewnętrzny cache hostingu może wymagać wyczyszczenia.
- Nie zmieniaj slugu przy zwykłej edycji. Dodatkowe historie dodawaj jako kolejne bloki tej samej strony.
- Po przeniesieniu do szkicu, kosza lub ustawieniu hasła publiczna podstrona odpowiada 404 i znika z nowo wygenerowanej sitemapy. Krótka awaria CMS korzysta z ostatniej poprawnej treści przez maksymalnie 5 minut; bez takiej kopii zwraca 503 zamiast wymyślonej historii.
- Strona ma własny canonical, opis z treści i wpis w sitemapie z datą modyfikacji WordPressa. Pozostałe podstrony nadal mają treść utrzymywaną w projekcie.

Jeżeli strony nie utworzono jeszcze w CMS: dodaj nową **Stronę**, ustaw tytuł i powyższy slug, w edytorze kodu wklej zawartość `wordpress/sukcesy-naszych-klientow.html`, a następnie opublikuj. Alternatywnie zaimportuj `wordpress/sukcesy-naszych-klientow.xml` przez **Narzędzia → Import → WordPress**, przypisując do istniejącego autora. Importuj tylko raz i nie nadpisuj istniejącej strony, jeśli ma już własne treści. Pliki zawierają tylko neutralny wstęp i odnośnik do kursów — żadnych fikcyjnych historii, opinii ani zdjęć klientów.

## Konfiguracja Node i SEO

```ini
WORDPRESS_URL=https://wp.groomerhouse.pl
PUBLIC_SITE_URL=https://groomerhouse.pl
```

Domyślny CMS jest również zapisany w kodzie, ale jawna zmienna ułatwia konfigurację hostingu. Nie wskazuj `WORDPRESS_URL` na Node i nie blokuj publicznego `/wp-json/wp/v2/posts`.

Publiczne artykuły pozostają na `https://groomerhouse.pl/slug/`. Stare ścieżki datowane mają przekierowania. **Nie zmieniaj działających permalinków `/index.php/...` CMS bez sprawdzenia serwera.**

W CMS włączono prośbę o nieindeksowanie, główna domena pozostaje indeksowalna. Sitemap: `https://groomerhouse.pl/sitemap.xml`. Po wgraniu ZIP sprawdź obrazy, blog, canonical i sitemapę na żywej domenie.

## Rezerwacje

Formularz korzysta ze strony WordPress ID 8: `https://wp.groomerhouse.pl/index.php/rezerwacja/`. Szczegóły i kroki podłączenia płatności: `BOOKNETIC-WDROZENIE.md`.

Nie instaluj starego `groomerhouse-booknetic-bridge.php` ani nie usuwaj subdomeny CMS. Utrzymuj aktualizacje i kopie bazy oraz plików. Nie nadpisuj aktywnej instalacji starym WordPressem — utraciłbyś bieżące dane rezerwacji i zamówień.

Regulamin WordPress ID 922 i polityka ID 3 są kopiami dokumentów głównej strony. Przyszłe zmiany aktualizuj w obu miejscach. Nie skonfigurowano osobnych GA4/Meta w CMS; zgody głównej strony nie upoważniają automatycznie skryptów marketingowych w ramce.
