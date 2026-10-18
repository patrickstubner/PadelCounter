# Padel Counter

Games-Zähler für Padel. Die App läuft als installierbare Web-App vollständig im Browser: offline, ohne Konto und ohne Server.

**Live:** https://patrickstubner.github.io/PadelCounter/

Der GitHub-Pages-Pfad ist `/PadelCounter/`, passend zum Repository-Namen.

## Zählen

Oben Team A, unten Team B. Es werden nur Games gezählt, keine Punkte innerhalb eines Games.

- **Kopfzeile:** links «Padel Counter», in der Mitte Set 1, Set 2 oder Set 3, rechts die Aktionen. Im Hochformat und auf schmalem Querformat stecken Undo, History, End match und New match in einem Menü. Ganz unten im Menü steht «Add to Home Screen». Auf Chromium und Android öffnet der Tipp die Installationsfrage; schlägt sie fehl, bleibt der Punkt stehen. Auf iOS Safari steht der Hinweis gedämpft und ohne Rahmen unter dem Menü (`role="note"`), vollständig «Share → Add to Home Screen». Läuft die App bereits eigenständig, fehlt der Punkt. Die Zeilen sind groß. Escape schliesst es. Ab 900px Breite im Querformat bleiben die Knöpfe in der Zeile, ohne «Add to Home Screen».
- **Querformat:** die drei Sätze stehen groß nebeneinander, links Satz 1, in der Mitte Satz 2, rechts Satz 3, auch zweistellig vollständig. Es gibt keine Satznummern an den Zahlen.
- **Hochformat:** die große Zahl des laufenden Satzes füllt die freie Fläche zwischen Name, Ball und den Satzständen, ohne in Kopfzeile, Plus oder Minus zu ragen. Plus schiebt die alte Zahl nach oben, Minus die alte nach unten. Die Satzstände von Team A stehen am unteren Rand, die von Team B am oberen Rand, direkt gegenüber an der Mitte, ohne Satznummern.
- Plus und Minus sind die großen Flächen links und rechts, beide mit derselben Umrandung. Im Hochformat sind sie etwas breiter, über die volle Höhe, und das Plus- bzw. Minuszeichen ist groß, fett und hell. Die Ziffern bleiben der Blickfang. Jede Satzzahl hat eine Tippfläche (`Set 1` bis `Set 3`) und macht diesen Satz aktiv, damit sich der Stand korrigieren lässt. Der Wechsel steht im Verlauf und lässt sich rückgängig machen.
- Dieser Zähler beendet einen Satz bei 6 Games mit zwei Vorsprung, bei 7:5, oder nach einem Tiebreak bei 6:6 als 7:6. Das Match ist Best of 3. Die Prüfung begrenzt nur unsinnige Stände (zum Beispiel 8:6 oder 7:0); Minus und ein gezieltes Plus bleiben immer möglich.
- Teamnamen antippen, ändern (höchstens 20 Zeichen) und auf diesem Gerät behalten. „New match“ setzt den Stand nach einer Rückfrage zurück und die Namen auf Team A und Team B. Die Oberfläche ist Englisch.
- Aufschlag ist optional. Der Ball neben dem Teamnamen setzt Team A oder B, die Ziffer 1 oder 2 steht direkt am Ball. Bei 0:0 gilt die Angabe für das erste Game, nach einem bereits gezählten Game für das nächste. Beginnt A, folgt A1, B1, A2, B2. Beginnt B, folgt B1, A1, B2, A2. Ein später gesetzter Aufschlag leitet dieselbe Folge rückwärts ab. Nochmal antippen überschreibt das, ein dritter Tipp auf dasselbe Team lässt den Aufschlag wieder offen. Bei 6:6 steht, wer dieses eine Game aufschlägt. Punkte im Tiebreak werden nicht gezählt und der Aufschlag wechselt dort nicht alle zwei Punkte. Nach dem Tiebreak-Game ist das andere Team vorausgewählt und es wird nur der Spieler gefragt («Choose the player»). Gewinnt ein Team das nächste Game, bevor der Spieler gewählt ist, gilt die Vorauswahl für das andere Team, egal wer das Game gewonnen hat. Ein angetippter Satz lässt den Aufschlag stehen. Minus geht in derselben Folge einen Schritt zurück. War nie ein Aufschlag gesetzt, erscheint die Frage nicht.
- «Undo» nimmt die letzte Änderung zurück, auch mehrfach: Games, Satzwechsel, Aufschlag, Namen, «New match» und «End match».
- «History» und der Titel öffnen eine eigene Seite. Oben steht der kompakte Spielstand, darunter die Ereignisse des laufenden Matches (neuestes zuerst, Uhrzeit, Text, und der ganze Satzstand danach, zum Beispiel 6:3 5:1; nur die geänderte Zahl ist hervorgehoben) und die Liste der übrigen Matches, ebenfalls neuestes zuerst. «Match» und der Browser-Zurück-Button kehren zum laufenden Spiel zurück. Ein anderes Match lässt sich ansehen. Abgeschlossene Matches bleiben auf dem Gerät, höchstens 100, die ältesten fallen weg.
- «End match» lässt den Endstand stehen und sperrt Plus, Minus, Aufschlag und Namen. «Resume» spielt am selben Stand weiter. Gewinnt ein Team zwei Sätze, oder steht nach «End match» ein Sieger fest, liegt eine Feier darüber («Team A wins!», Konfetti und Pokal). Sie erscheint nur einmal pro Sieg, auch nach einem Neuladen nicht noch einmal. Ein weiteres Game bei schon gewonnenem Match startet sie nicht neu. Nimmt man den Sieg zurück und er fällt erneut, darf sie wieder erscheinen. Ein Match, das vor dem Update schon gewonnen war, bleibt still. Antippen schliesst sie. Der Endstand bleibt danach auf dem Zählfeld sichtbar («Final score»), «Undo» nimmt den letzten Schritt zurück. Bei reduzierter Bewegung gibt es keinen Konfetti-Regen; der Pokal steht still.

Der Bildschirm bleibt nach Möglichkeit an (Screen Wake Lock). Fehlt die API oder lehnt das System ab, zählt die App trotzdem weiter.

## Lokal

Voraussetzung ist Node.js 22.

```bash
npm ci
npm run dev
```

Die Entwicklungsserver-Adresse ist `http://localhost:4173/PadelCounter/`.

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run preview
```

## Daten

Der Spielstand liegt unter dem Schlüssel `padel-counter.v1` in `localStorage`. Schema-Version 2 speichert einen Basisstand plus höchstens 500 Ereignisse (`game/increment`, `game/decrement`, `set/select`, `team/rename`, `match/reset`, `match/new`, `serve/set`, `match/end`, `match/resume`). `match/reset` ist der New-match-Schritt bis 1.2.4 und behält die Namen. `match/new` setzt sie auf Team A und Team B. Version 1 wird beim Laden übernommen, ohne Aufschlag und ohne Verlauf. Ungültige Daten werden verworfen, nicht angezeigt. Zustand und Ereignisse sind reine Funktionen mit `matchId`, `revision` und Zeitstempel. Eine spätere Live-Ansicht kann dieselben Ereignisse an ein Backend hängen; diese Version spricht keinen Server an.

## Build

Rsbuild erzeugt die statische App. Vitest führt die Tests aus und ist nicht der Bundler der App. Der Service Worker wird beim Produktionsbuild mit Workbox lokal erzeugt, ohne CDN.
