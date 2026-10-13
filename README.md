# Padel Counter

Games-Zähler für Padel. Die App läuft als installierbare Web-App vollständig im Browser: offline, ohne Konto und ohne Server.

**Live:** https://patrickstubner.github.io/PadelCounter/

Der GitHub-Pages-Pfad ist `/PadelCounter/`, passend zum Repository-Namen.

## Zählen

Oben Team A, unten Team B. Es werden nur Games gezählt, keine Punkte innerhalb eines Games.

- **Querformat:** alle drei Sätze groß nebeneinander.
- **Hochformat:** der laufende Satz groß, gespielte und kommende Sätze klein.
- Plus und Minus sind die großen Flächen links und rechts. Ein angetippter Satz wird zum aktiven Satz, damit sich ein Stand korrigieren lässt.
- Ein Satz ist gewonnen bei 6 Games mit zwei Vorsprung, bei 7:5, oder nach einem Tiebreak bei 6:6 als 7:6. Das Match ist Best of 3. Die Regeln begrenzen nur unsinnige Stände (zum Beispiel 8:6 oder 7:0); Minus und ein gezieltes Plus bleiben immer möglich.
- Teamnamen antippen, ändern (höchstens 20 Zeichen) und auf diesem Gerät behalten. „Neues Spiel“ setzt den Stand nach einer Rückfrage zurück und lässt die Namen stehen.
- Aufschlag ist optional. Der Ball neben dem Teamnamen setzt Team A oder B: bei 0:0 im Satz für das erste Game, nach einem bereits gezählten Game für das nächste. Danach wechselt der Aufschlag jedes Game, innerhalb eines Teams zwischen Spieler 1 und 2 (A1, B1, A2, B2). Nochmal antippen überschreibt das, ein dritter Tipp auf dasselbe Team lässt den Aufschlag wieder offen. Bei 6:6 steht dezent, wer den Tiebreak beginnt.
- «Rückgängig» nimmt die letzte Änderung zurück, auch mehrfach: Games, Aufschlag, Namen, «Neues Spiel» und «Spiel beenden». «Verlauf» zeigt die letzten Einträge mit Uhrzeit, an einem anderen Tag auch mit Datum.
- «Spiel beenden» lässt den Endstand stehen und sperrt Plus, Minus, Aufschlag und Namen. «Fortsetzen» spielt am selben Stand weiter.

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

Der Spielstand liegt unter dem Schlüssel `padel-counter.v1` in `localStorage`. Schema-Version 2 speichert einen Basisstand plus höchstens 500 Ereignisse (`game/increment`, `game/decrement`, `set/select`, `team/rename`, `match/reset`, `serve/set`, `match/end`, `match/resume`). Version 1 wird beim Laden übernommen, ohne Aufschlag und ohne Verlauf. Ungültige Daten werden verworfen, nicht angezeigt. Zustand und Ereignisse sind reine Funktionen mit `matchId`, `revision` und Zeitstempel. Eine spätere Live-Ansicht kann dieselben Ereignisse an ein Backend hängen; diese Version spricht keinen Server an.

## Build

Rsbuild erzeugt die statische App. Vitest führt die Tests aus und ist nicht der Bundler der App. Der Service Worker wird beim Produktionsbuild mit Workbox lokal erzeugt, ohne CDN.
