# Booknetic / WooCommerce — naprawa błędu daty, 23.10.2026

## Przyczyna potwierdzona w kodzie

Booknetic 5.10.2 przechowuje początek rezerwacji w `starts_at`, a jej identyfikator w `id`. Dodatek **WooCommerce payment gateway for Booknetic 3.9.0** w `App/Providers/WcProductObject.php` nadal czytał `date`, `start_time` i `appointment_id`.

Podczas odtwarzania pozycji koszyka na `wp_loaded` dodatek wykonywał walidację terminu. Nieistniejące stare pola dawały pustą datę (`" "`). PHP 8.5.12 zgłaszał `DateMalformedStringException`, więc awaria dotyczyła również panelu administracyjnego, mimo że nie otwierano formularza rezerwacji.

Nie potwierdzono uszkodzenia dat istniejących rezerwacji. Problem leżał w odczycie pól przez dodatek; nie należy „naprawiać” go wpisywaniem arbitralnych terminów, kasowaniem rezerwacji ani obniżeniem PHP.

## Zakres poprawki

- Termin jest wyprowadzany z `starts_at` przez własne helpery Booknetic `Date::dateSQL()` i `Date::time()`, tak jak w aktualnym rdzeniu wtyczki.
- W sprawdzaniu zajętości wykluczana jest własna rezerwacja przez `id`, nie nieistniejące `appointment_id`. Publiczne ograniczenia dostępności pozostają włączone.
- Brak rezerwacji, brak poprawnego początku terminu, brak instruktora/usługi lub niedostępność terminu nie wywołują parsowania pustej daty.
- Taka pozycja odłączana jest wyłącznie z bieżącego koszyka i jego sesji WooCommerce, z informacją o ponownym wyborze terminu. Nie trafia też do mapy płatności ani automatycznego wypełniania danych rozliczeniowych. Inne pozycje koszyka pozostają bez zmian.
- Ominięto w tej ścieżce `emptyCart()`, `remove_cart_item()` i `removeAppointment()`: standardowe hooki dodatku mogą usuwać nieopłacone rezerwacje. Poprawka walidacyjna nie wywołuje kasowania ani zmiany rezerwacji, zamówień, klientów czy usług.
- Nie zmieniano obsługi bramki Przelewy24, cen, zaliczek, statusów płatności ani istniejącej funkcji jawnego usuwania pozycji przez klienta.

## Wdrożenie i kopia

Poprawiono istniejący plik dodatku przez edytor WordPressa. Po wyjściu z trybu odzyskiwania i przeładowaniu panel działa w zwykłym trybie, z aktywnym Booknetic. To zmiana na WordPressie, niezależna od podmiany plików Node na WEBD.

Paczka zawiera kopię poprawionego pliku w `wordpress/booknetic-payment-wc/App/Providers/WcProductObject.php`. Nie jest to kompletna wtyczka do instalacji przez „Dodaj wtyczkę”; nie kasuj ani nie zastępuj całego katalogu Booknetic. Przy tym wdrożeniu plik został już poprawiony w CMS i nie wymaga ponownego wgrania.

Kopia poprzedniej wersji znajduje się w dowodach weryfikacji. Jej SHA-256 po ujednoliceniu końców linii: `480dc0f78cb9db893848c26dba7ca0241ef17e6934c29ad54dabe6707dd231f1`. Poprawiony plik: `cdab31d42391e09681d5fa489d34addbe55817193c88795f2fee3d9a692e9575`.

**Po aktualizacji dodatku WooCommerce/Booknetic ponownie sprawdź ten fragment.** Aktualizator producenta może nadpisać własną poprawkę. Nie podmieniaj automatycznie nowej wersji producenta tym starym plikiem; najpierw sprawdź zgodność nowych wersji i czy producent naprawił odczyt daty. Docelowo zalecana jest zgodna para aktualnych wersji producenta, sprawdzona na kopii strony.

## Sprawdzenie

- Odtworzono dokładny wyjątek na lokalnym PHP **8.5.12**, następnie sprawdzono składnię i 59 warunków na odseparowanych danych.
- Testy obejmują poprawny termin, płatność oczekującą, brak daty, pustą datę, brak rezerwacji, brak instruktora/usługi oraz zajęty termin. Potwierdzają brak wywołań kasowania, zachowanie innych pozycji oraz niezmienność danych rezerwacji.
- Na żywym WordPressie sprawdzono ponowne wczytanie panelu i edytora po wyjściu z trybu awaryjnego.
- Nie utworzono rezerwacji, zamówienia ani płatności testowej. Pełna transakcja P24 nie była częścią tego sprawdzenia.
