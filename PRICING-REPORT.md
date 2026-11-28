# Dynamiczny cennik WEIRDO

Stan: implementacja lokalna, zweryfikowana 2026-11-28, bez publikacji.

## Centralne dane

`pricing.js` zawiera dane i czysta funkcje `calculate(selections)`.
Backend importuje ten sam modul; `public/configurator/pricing.js` jest jego
identyczna kopia dystrybucyjna dla statycznej strony, nie osobnym cennikiem.

- `catalog.basePrice`: cena referencyjna, obecnie 12500 PLN.
- `catalog.currency`: PLN.
- `catalog.version`: wersja cennika, obecnie 2026-11-27.1.
- `catalog.fields[nazwaPola].values[identyfikatorOpcji]`: modyfikator.
- `catalog.neutralFields`: pola bez wplywu na cene, wartosc 0.
- `catalog.rules` i `modifier()`: zaleznosci aktywnych opcji.

Po zmianie kwot podnies wersje, skopiuj pricing.js do public/configurator,
uruchom testy i build. Wszystkie setupy liczone sa dynamicznie; ich JSON-y
nie zostaly zmienione. Przy zmianie cen zaktualizuj oczekiwane wyniki testow.

## Integracja

Cena jest widoczna przy kontrolkach podgladu, na kartach setupow, w ich
specyfikacjach oraz w podsumowaniu formularza. Etykiety pokazuje sie tylko
dla ujemnych modyfikatorow. Pickupy pokazuja laczna kwote dla aktywnej liczby.
Na telefonie cena znajduje sie pod suwakami, poza obszarem modelu.

Do JSON-a wysylanego e-mailem i zapisywanego w archiwum dodano `pricing`:
pricingVersion, currency, basePrice, adjustments, totalAdjustments, totalPrice,
requiresIndividualQuote i warnings. Zapisane ceny nie sa importowane jako
wiazace. Backend ignoruje cene klienta i ponownie liczy wedlug selections.
Stare JSON-y bez pricing nadal sa obslugiwane. Niekompletne lub nieznane
opcje cenowe otrzymuja domyslne wartosci; nie kumuluje sie poprzednich zmian.

Dodatkowe modyfikacje nie zmieniaja kwoty i uruchamiaja komunikat o osobnej
wycenie. Podsumowanie zawiera orientacyjny charakter ceny, a mail zachowuje
zastrzezenie, ze wyslanie formularza nie jest zamowieniem.

## Ceny setupow

| Setup | PLN |
| --- | ---: |
| Blacky | 11600 |
| Classy | 11550 |
| Desert Sun | 11800 |
| Green Lung | 11800 |
| Grey Machine | 11300 |
| Purple Haze | 11800 |
| Red Devil | 11100 |

Stan po resecie (takze szary podglad z domyslna specyfikacja): 11600 PLN.
Szary wyglad nie oznacza darmowych ani usunietych komponentow.

## Zakres cen

Minimum: **9950 PLN**. Lauder / jeden humbucker bez puszki, jednolity top
i boki, czarna glowka, olejowosk, palisander lub amarant, Binding 2 czysty
bez dodatkowego markera, chrom lub nikiel, standardowe Gotoh SG 381,
progi niklowane. Pozostale wybory neutralne.

Maksimum: **12500 PLN**. Weirdo lub Classy / dwa humbuckery, klon albo
topola na topie i bokach, glowka jak top/boki, czarny metalik na korpusie,
heban, Binding 1 lub Binding 2 z okraglymi markerami, platny ujemnie brak
markera niewybrany, zloty osprzet, otwarta ramka lub zlote puszki,
blokowane klucze i stalowe progi.

Zakres dotyczy obecnie poprawnych konfiguracji, bez indywidualnych modyfikacji.

## Mapowanie i uwagi

- Wszystkie kategorie ze specyfikacji maja odpowiedniki; nie dodano produktu.
- Orzech amerykanski istnieje, lecz jest chwilowo niedostepny wedlug
  materials.inventory.json. Kwoty sa przygotowane; niedostepna opcja nie
  jest naliczana. Import uzywa dostepnego materialu z ostrzezeniem kalkulatora.
- Weirdo ma ID `Standard Weirdo`, Classy ma ID `Opcja 2`.
- Czarny Metallic matowy ma ID `Czarny metalik`.
- Klucze blokowane: Gotoh SG381 MG i MG-T; nieblokowane: Gotoh SG 381.
- `Domyslny` (w kodzie z polska litera) jest kontekstowy: Binding 2 z kropkami
  oznacza trzy kolka (0), czysty Binding 2 oznacza brak markera (-100).
  Binding 1 nie udostepnia braku markera. Ukryte bindingDots nie obniza ceny.
- Brak osobnego wyboru wykonczenia dla kazdego pickupu: wspolny modyfikator
  jest mnozony przez 1 lub 2, bez dodatkowego naliczania liczby humbuckerow.
- Istniejaca wizualizacja Killer nadal ma zapowiedz pozniejszego dodania;
  nie zmieniano geometrii w zadaniu dotyczacym cen.
- Nie zmieniano kolejnosci sekcji, obrazow ani specyfikacji gotowych setupow.

## Weryfikacja

- `npm run test:pricing`: 11/11 grup testow, w tym wszystkie warianty
  elektroniki, aktywne pickupy, markery, reset, stare/tamperowane dane,
  wszystkie setupy, wielokrotne zmiany, nieznane ID, opcje neutralne,
  dostepnosc drewna, granice cen i identycznosc kalkulatora browser/server.
- Test backendu wykonuje POST na atrapach Resend i Vercel Blob; sprawdza
  przeliczona cene w mailu, zalaczniku JSON i archiwum. Nie wyslano prawdziwego
  maila ani nie zapisano testowych danych klienta w produkcji.
- `npx tsc --noEmit`: OK. `npm run build`: OK po uruchomieniu z dostepem
  do fontow Google (pierwszy build ograniczony sieciowo nie mogl ich pobrac).
- Przegladarka: karty setupow, otwarcie Blacky, zmiana na 1 humbucker
  i pickup bez puszki, natychmiastowe zmiany ceny; desktop 1440x900.
- Widok 390x844: cena i kontrolki poza modelem, formularz zaczyna sie ponizej
  kontrolek. To test responsywny, nie test na fizycznym iPhonie/Safari.
- Brak publikacji produkcyjnej w ramach tego zadania.

## Pliki zadania

- pricing.js, pricing.d.ts: centralny kalkulator i typy backendu.
- app.js: aktualizacja ceny, etykiety, normalizacja importu i payload.
- index.html: miejsce ceny, podsumowanie i ladowanie kalkulatora.
- styles.css: prezentacja cen na desktopie i mobile.
- setup-gallery.js: ceny kart i specyfikacji.
- public/configurator/{pricing.js,app.js,index.html,styles.css,setup-gallery.js}:
  kopie plikow do publikacji.
- app/api/send-configuration/route.ts: ponowne liczenie, mail, JSON i archiwum.
- scripts/pricing.test.cjs: testy kalkulatora i backendu.
- scripts/check-configurator-assets.mjs: kontrola pliku cennika na serwerze.
- package.json: polecenie test:pricing.
- PRICING-REPORT.md: ten raport.

W katalogu roboczym pozostaja tez wczesniejsze nieopublikowane zmiany tla
Wnetrze oraz PHOTO-BACKGROUNDS.md. Nie sa czescia logiki cennika.
