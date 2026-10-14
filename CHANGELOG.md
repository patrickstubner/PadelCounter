# Changelog

## 1.2.6 – 2026-10-14

- «Add to Home Screen» steht als letzter Punkt ganz unten im Menü. Auf Chromium und Android öffnet der Tipp die Installationsfrage. Auf iOS Safari steht «Share → Add to Home Screen». Läuft die App bereits eigenständig, fehlt der Punkt.

## 1.2.5 – 2026-10-13

- Der Verlauf zeigt den neuesten Eintrag oben, bei den Ereignissen des laufenden Matches und bei den gespeicherten Matches.
- «New match» setzt die Teamnamen auf Team A und Team B zurück. Ein gespeicherter New-match-Schritt aus 1.2.4 behält die Namen, auch wenn man darüber hinaus rückgängig macht.
- Die geänderte Zahl im Verlauf steht in `<mark>`.

## 1.2.4 – 2026-10-13

- Plus-Knöpfe haben dieselbe Umrandung wie Minus und behalten das Pluszeichen. Der Blick bleibt auf den Ziffern.
- Querformat: Satzziffern, auch 0, 6 und zweistellige Stände, werden rechts nicht mehr abgeschnitten.
- Jeder Verlaufseintrag zeigt den ganzen neuen Satzstand, zum Beispiel «6:3 5:1». Hervorgehoben ist nur die Zahl, die sich geändert hat. Uhrzeit und Text bleiben.
- Gespeicherte Verläufe werden seit 1.2.2 mit der aktuellen Aufschlaglogik neu berechnet. Ältere Matches können deshalb einen anderen Aufschlag zeigen, die Spielstände bleiben unverändert.

## 1.2.3 – 2026-10-13

- Gewinnt ein Team das nächste Game, während nach einem Tiebreak nur das Team vorausgewählt ist, wechselt die Vorauswahl auf das andere Team. Das gilt für beide Sieger gleich. Der Spieler bleibt offen («Choose the player»).

## 1.2.2 – 2026-10-13

- Kopfzeile oben, gleich in Hoch- und Querformat: links «Padel Counter», in der Mitte Set 1, Set 2 oder Set 3, rechts das Menü. Die Satzbezeichnung zwischen den Teams entfällt.
- Im Hochformat und auf schmalem Querformat liegen Undo, History, End match und New match im Menü oben rechts. Die Zeilen sind mindestens 56px hoch. Ab 900px Breite im Querformat bleiben die Knöpfe sichtbar. Escape schliesst das Menü.
- Die gewonnenen Fläche geht in die Ziffern: der laufende Satz im Hochformat und alle drei Sätze im Querformat.
- Der Aufschlag im Regeltext: «Serve is optional and rotates between teams and partners.»
- Nach einem Tiebreak bleibt das Team gegenüber dem Tiebreak-Aufschlag vorausgewählt. Die Frage ist nur noch, welcher Spieler aufschlägt («Choose the player»). Das andere Team lässt sich in dieser Frage nicht wählen.
- Ein angetippter Satz behält den Aufschlag.

## 1.2.1 – 2026-10-13

- Der Regeltext beschreibt diesen Zähler: ein Satz endet hier bei 6 Games mit zwei Vorsprung, bei 7:5 oder bei 7:6 nach 6:6. Ein Match ist Best of 3. Ein Satz wird angetippt, um ihn auszuwählen.
- Ein neuer Service Worker, der einen bereits aktiven Worker ablöst, zeigt «Update ready». Der erste Installationsvorgang lädt nicht neu und zeigt den Hinweis nicht. Neu laden passiert einmal, und nur nach Antippen.
- Ein Tiebreak zählt als ein Game. Punkte darin werden nicht rotiert. Nach diesem Game, und nach einem manuellen Satzwechsel, wird ein gesetzter Aufschlag geleert und «Choose the server» erscheint. Minus geht in derselben Rotation einen Schritt zurück und fragt nicht neu.

## 1.2.0 – 2026-10-13

- Hochformat: die grosse Satzzahl nutzt mehr von der freien Fläche und bleibt vollständig sichtbar, auch zweistellig.
- Der Aufschlag steht als 1 oder 2 direkt am Ball. Die kleine Zeile in der Mitte entfällt. Beginnt Team A, ist die Folge A1, B1, A2, B2. Beginnt Team B, ist sie B1, A1, B2, A2. Ein später gesetzter Aufschlag (zum Beispiel bei 1:0) bestimmt dieselbe Folge rückwärts.
- History ist eine eigene Seite, kein Overlay. «Match» führt zum laufenden Spiel zurück, der Browser-Zurück-Button ebenfalls. Oben steht der kompakte Spielstand. Darunter die Ereignisse des laufenden Matches, ältestes zuerst, von links nach rechts: Uhrzeit, wer das Game gewonnen hat, Stand danach (1:0, dann 1:1). Wechselt der Satz, steht auch der Satzstand dabei. Weitere Matches lassen sich ansehen, nicht fortsetzen.
- `icon-1024.png` bleibt im Manifest, liegt aber nicht im Service-Worker-Precache. Die iOS-Statusleiste ist `black-translucent`. Englische Texte ohne deutsche Guillemets.

## 1.1.0 – 2026-10-13

- Aufschlag optional: Ball bei Team A oder B, der Start darf offen bleiben. Bei 0:0 gilt die Angabe für das erste Game, nach einem Game für das nächste. Danach Rotation A1, B1, A2, B2, jederzeit manuell überschreibbar. Bei 6:6 ein dezenter Tiebreak-Hinweis (erster Aufschlag, danach je 2 Punkte).
- Jede Änderung (Games, Aufschlag, Namen, neues Spiel) liegt als Ereignis am Match. «Rückgängig» nimmt mehrere Schritte zurück, eine kurze Verlaufsliste zeigt die letzten Einträge. Höchstens 500 Ereignisse, Prüfung beim Laden. Ein Speicherstand von 1.0.0 wird übernommen.
- Namensfilter `/[\p{Cc}\p{Cf}\u2028\u2029]/gu` in beiden Prüfungen. Nach dem Kürzen wird erneut getrimmt und ein einzelnes Surrogate entfernt. Längengrenze in Codepoints. Seitenpfad aus `PAGE_BASE`. Wöchentliches Dependabot für npm und GitHub Actions.
- Der Verlauf zeigt die lokale Uhrzeit, an anderen Tagen auch das Datum. «Spiel beenden» sperrt den Endstand nach einer Rückfrage. «Fortsetzen» und «Rückgängig» nehmen das Spiel wieder auf.
- Installations-Icons sind die freigegebenen Dateien (192, 512, 1024, maskable 192 und 512, Apple-Touch 180, Favicon 16, 32 und ICO). Theme-Farbe `#0a1a3f`.
- Querformat wie in 1.0, ohne die Satznummern an den Satzzahlen: links Satz 1, Mitte Satz 2, rechts Satz 3. Antippen wechselt den Satz und liegt im Verlauf.
- Hochformat: der laufende Satz bleibt groß. Die Satzstände von Team A stehen am unteren Rand, die von Team B am oberen Rand, einander gegenüber und ohne Satznummern. «Satz N» in der Mitte ist dort groß.
- Unten rechts steht dezent die App-Version aus `package.json` (`v1.1.0`). Sie liegt über der Fußzeile und verkleinert die Zählflächen nicht.
- Die Oberfläche ist Englisch: Texte, Beschriftungen, Dialoge, Verlauf (Zeitformat `MM/DD/YYYY`) und die Manifest-Beschreibung. Standardnamen sind Team A und Team B. `html lang` ist `en`. Es gibt keinen Sprachumschalter.
- Im Hochformat bleiben die grossen Satzzahlen vollständig sichtbar, auch zweistellig. Plus schiebt die alte Zahl nach oben, Minus holt die neue von oben und schiebt die alte nach unten.
- «Padel Counter» oben links öffnet die gespeicherten Matches (neueste zuerst) und daraus die Ereignisliste eines Matches. «Back» und der Browser-Zurück-Button schliessen eine Ebene. Höchstens 100 abgeschlossene Matches, Prüfung beim Laden.
- Siegerfeier über dem Zählfeld, wenn ein Team zwei Sätze gewinnt oder «End match» einen Sieger hat: Konfetti, Lottie-Pokal und grosser Name («Team A wins!»). Antippen schliesst sie. Danach bleibt der Endstand auf dem Zählfeld stehen («Final score»), Undo in der Kopfzeile bleibt möglich. Bei `prefers-reduced-motion` ohne Konfetti, der Pokal steht still. Kein Ton. Unentschieden und Abbruch ohne Sieger bleiben still. Der Pokal ist «Free Trophy Animation» von LottieFiles (Lottie Simple License, Quelle in `NOTICE`), abgespielt mit `lottie-web` 5.13.0 light, gebündelt und offline.

## 1.0.0 – 2026-10-13

- Erste Version: Offline-PWA zum Zählen von Padel-Games (Best of 3).
- Quer- und Hochformat, Split-Flap-Animation, Wake Lock, lokaler Spielstand und editierbare Teamnamen.
- GitHub Actions prüft Lint, Typen, Tests, Build und `npm audit`; Pages-Deploy nur von `main`.
