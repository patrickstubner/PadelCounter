# Sicherheitsprüfung Padel Counter 1.1.0

**Datum:** 2026-10-13  
**Umfang:** Quelltext, Build, GitHub-Actions-Workflow, Abhängigkeiten (`npm audit`), statische Ausgabe in `dist/`. Gegenüber 1.0.0 neu: optionales Aufschlag-Feld und lokales Ereignisprotokoll (Schema 2, höchstens 500 Ereignisse).  
**Art der App:** statische PWA, nur Client, kein Backend, kein Login, keine Cookies, keine Tracker, keine externen Schriftarten oder Skripte.

## Angriffsfläche

| Fläche | Was sie kann | Was sie nicht kann |
| --- | --- | --- |
| Statische Dateien auf GitHub Pages | HTML, CSS, JS, Manifest, Icons, Service Worker unter `/PadelCounter/` | Keine serverseitige Ausführung, keine geheimen Header, die wir selbst setzen könnten |
| `localStorage` (`padel-counter.v1`) | Spielstand, Teamnamen und bis zu 500 Ereignisse nur in diesem Browser | Kein Zugriff von anderen Origins; Inhalt ist kein Geheimnis |
| Service Worker | Precache derselben Origin, Navigation-Fallback auf `index.html` | Kein `importScripts` von einem CDN, kein Runtime-Caching fremder Hosts |
| Screen Wake Lock | Bildschirm wach halten, wenn der Browser es erlaubt | Kein Mikrofon, keine Kamera, kein Standort |
| Teamnamen | Freitext, höchstens 20 Zeichen, nur als React-Text | Kein HTML, keine URLs, die die App lädt |

Es gibt keine Formulare mit Server-Ziel, keine Abfrage von `location.search` oder `location.hash`, keine `eval`-Pfade und keine Telemetrie.

## Befunde

| ID | Bereich | Schwere | Status | Befund |
| --- | --- | --- | --- | --- |
| F-01 | XSS über Teamnamen | Info | Behoben | Namen werden als React-Kinder gerendert. `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML` und `insertAdjacentHTML` sind per ESLint verboten und per Test im Quelltext ausgeschlossen. |
| F-02 | Gespeicherter Spielstand | Info | Behoben | Laden prüft Schema-Version 2 (Basisstand plus Ereignisliste) und übernimmt Version 1 als Stand ohne Aufschlag und ohne Verlauf. UUID, Zeitstempel, Satzstände, Aufschlag (`null` oder Team a/b mit Spieler 1/2) und Namen werden geprüft. Ein ungültiges Ereignis verwirft das ganze Dokument. Unmögliche Scores (z. B. 7:4), zu lange Namen, Steuerzeichen, mehr als 500 Ereignisse und Payloads über 96000 Zeichen werden verworfen. Felder werden in ein neues Objekt kopiert. |
| F-03 | Prototype Pollution | Info | Behoben | `JSON.parse` wird nicht in Prototypen gemischt. Ein Test prüft, dass `__proto__` im Payload `Object.prototype` nicht verändert. Werfer in Gettern liefern `null`. |
| F-04 | Bidi- und Steuerzeichen | Info | Behoben | Beim Speichern und beim Laden gilt `/[\p{Cc}\p{Cf}\u2028\u2029]/gu` (Steuerzeichen inklusive C1, Formatzeichen, Zeilen- und Absatztrenner). Nach dem Kürzen auf 20 Codepoints wird erneut getrimmt und ein einzelnes Surrogate entfernt. Gespeicherte Namen mit diesen Zeichen werden abgelehnt, nicht repariert. |
| F-05 | Content-Security-Policy | Info | Umgesetzt | Meta-CSP: `default-src 'self'` und konkrete Direktiven ohne `unsafe-inline` und ohne `unsafe-eval`. Keine externen Hosts. |
| F-06 | Clickjacking | Niedrig | Akzeptiert | `frame-ancestors` wirkt nicht in einem CSP-Meta-Tag (Browser warnen und ignorieren es). Die Direktive steht deshalb nicht im Meta-Tag. GitHub Pages setzt hier keine Security-Header. Die App hat kein Konto und keine Geheimnisse. |
| F-07 | Fehlende Response-Header | Niedrig | Akzeptiert | `X-Content-Type-Options`, `Referrer-Policy` als Header und eine Header-CSP kann Pages im Workflow-Modus hier nicht setzen. `Referrer-Policy` steht zusätzlich als Meta-Tag (`no-referrer`). Es gibt keine fremden Requests, die einen Referrer tragen würden. |
| F-08 | Geheimnisse | Info | Keine | Keine Tokens, API-Keys oder privaten URLs im Repository. Der Service Worker enthält keine Zugangsdaten. |
| F-09 | GitHub Actions | Info | Umgesetzt | Workflow-Permission ist `contents: read`. `pages: write` und `id-token: write` gelten nur für den Deploy-Job, und nur bei Push auf `main`. Actions sind per Commit-SHA gepinnt. |
| F-10 | Abhängigkeiten | Info | Sauber | `npm audit --audit-level=moderate` am 2026-10-13: 0 Info, 0 Low, 0 Moderate, 0 High, 0 Critical. Direktabhängigkeiten sind exakt gepinnt, der Lockfile wird mit `npm ci` installiert. |
| F-11 | `glob@11.1.0` | Niedrig | Akzeptiert | Transitive Dev-Abhängigkeit von `workbox-build@7.4.1`, vom Maintainer als veraltet markiert. `npm audit` meldet dafür keine Schwachstelle. Das Paket läuft nur beim Build und landet nicht im Browser-Bundle. Ein Override auf glob 13 würde den Build von Workbox riskieren, ohne die ausgelieferte App zu ändern. |
| F-12 | Fehlermeldungen | Info | Umgesetzt | Speicherfehler und Wake-Lock-Fehler werden geschluckt oder als allgemeiner Satz angezeigt. Die Fehlergrenze zeigt keinen Stack und keine Exception-Message. Ungültiger Speicherinhalt wird nicht in die Konsole geschrieben. |
| F-13 | Service Worker | Info | Umgesetzt | Workbox-Runtime ist inline (`inlineWorkboxRuntime: true`). Der Willkommenskommentar mit `goo.gl`-Links wird entfernt. `verify-build` verbietet bekannte CDNs in `dist/`. |
| F-14 | Supply Chain der App | Info | Gering | Produktionsabhängigkeiten sind nur `react` und `react-dom`. Vitest (und damit Vite) dient ausschließlich als Testläufer und ist nicht der Bundler. |
| F-15 | Texte mit URLs im Bundle | Info | Akzeptiert | Der React-Produktionsbuild enthält `https://react.dev/errors/…` nur als Text in Minified-Error-Meldungen. Die App ruft die Adresse nicht auf; `connect-src 'self'` würde einen Abruf blockieren. `xmlns="http://www.w3.org/2000/svg"` ist ein XML-Namensraum, kein Request. Der Workbox-Hinweis `bit.ly` wird beim Build aus `sw.js` entfernt. |
| F-16 | Aufschlag | Info | Behoben | `serve` ist `null` oder `{ team: a\|b, player: 1\|2 }`. Freitext gibt es dort nicht. Ein halbes Paar (Team ohne Spieler) wird weder angewendet noch geladen. Die Anzeige «Serve A1» setzt React als Text. |
| F-17 | Ereignisprotokoll und Rückgängig | Info | Behoben | Es werden nur bekannte Ereignistypen mit geprüften Feldern gespeichert. «Rückgängig» entfernt das letzte gespeicherte Ereignis und spielt die Liste neu ab; es gibt keinen Index und keinen Typ aus der Oberfläche, der Code ausführt. Die Verlaufsliste rendert feste Sätze und den bereits geprüften Teamnamen als Text. Die Liste ist auf 500 Ereignisse und 96000 Zeichen begrenzt. |
| P1-01 | Namensfilter | Info | Behoben | `sanitizeTeamName` und `isValidStoredName` nutzen dieselbe Klasse `/[\p{Cc}\p{Cf}\u2028\u2029]/gu`. Tests prüfen C0, C1, Formatzeichen und U+2028/U+2029, und dass `lastIndex` die zweite Prüfung nicht überspringt. |
| P1-02 | Kürzung | Info | Behoben | Nach dem Schnitt auf 20 Codepoints wird getrimmt und ein halbes Surrogate entfernt, danach noch einmal getrimmt. Ein fast-check-Lauf (200 Zeichenketten, auch einzelne Surrogates) erwartet, dass das Ergebnis die Ladeprüfung besteht. |
| P1-04 | Längenmaß | Info | Behoben | Die Grenze ist 20 Codepoints. Das Eingabefeld erlaubt 40 UTF-16-Einheiten, damit 20 Emoji hineinpassen, und schneidet danach nach Codepoints. Roh-Namen im Ereignisprotokoll sind auf 80 Codepoints begrenzt. |
| P1-05 | Basis-Pfad | Info | Behoben | `index.html` setzt die Links über `assetPrefix`, der aus `PAGE_BASE` kommt. Das ausgelieferte Manifest bekommt `id`, `start_url`, `scope` und Icon-Pfade aus `PAGE_BASE`. Die Service-Worker-Ausnahme maskiert denselben Pfad. `verify-build` liest `PAGE_BASE` aus `src/base.ts`. |
| P1-06 | Dependabot | Info | Umgesetzt | `.github/dependabot.yml` prüft npm und GitHub Actions wöchentlich. Updates laufen durch dieselbe CI; der Pages-Deploy bleibt auf `main` beschränkt. |

Keine Befunde mit Schwere Hoch oder Kritisch.

## Eingabevalidierung

- **Teamname:** Unicode NFC, Trim, keine Zeichen aus `/[\p{Cc}\p{Cf}\u2028\u2029]/gu`, höchstens 20 Codepoints. Nach dem Kürzen wird erneut getrimmt und ein einzelnes Surrogate entfernt. Leer wird zu „Team A“ oder „Team B“. Das Eingabefeld begrenzt auf 40 UTF-16-Einheiten und schneidet auf 20 Codepoints. Zeichen wie `<` bleiben erlaubt, weil React sie als Text escaped; ein Test speichert `<b>Hi</b>` und erwartet genau diese Zeichenkette.
- **Satzstand:** nur ganze Zahlen, plausibel für Padel (0–6 beliebig, 7 nur neben 5 oder 6). 7:0, 7:4, 8:6 und Brüche werden weder erzeugt noch aus dem Speicher geladen.
- **Ereignisse:** der Reducer ignoriert ungültige Zeitstempel, Teams, Satzindizes, Aufschlag-Paare und Match-IDs. Er wirft dabei nicht. Beim Laden gilt dasselbe: ein unbekanntes oder unvollständiges Ereignis verwirft den gespeicherten Stand.
- **Aufschlag:** nur die Paare A1, A2, B1, B2 oder ausdrücklich offen (`null`). Die Rotation leitet den nächsten Aufschlag daraus ab und nimmt keinen Text entgegen.
- **Spielende:** `ended` ist ein Boolean. Fehlt das Feld in einem älteren Stand, gilt das Spiel als laufend. `match/end` und `match/resume` haben keinen Freitext. Solange `ended` wahr ist, ignoriert der Reducer Zähl-, Aufschlag- und Namensereignisse.
- **Match-ID:** UUID. `crypto.randomUUID`, sonst 16 Bytes aus `crypto.getRandomValues`.
- **Protokoll:** höchstens 500 Ereignisse. Ältere Ereignisse werden in den Basisstand gerechnet, nicht verworfen ohne Faltung. «Rückgängig» kann nur Ereignisse entfernen, die noch in der Liste stehen.

## XSS und Injection

Die Oberfläche besteht aus React-Elementen und Textknoten. SVG-Icons sind JSX, kein HTML-String. Es gibt kein `dangerouslySetInnerHTML`. CSS liegt in `src/app.css` und wird als Datei ausgeliefert, nicht als Inline-Style. Die CSP blockt Inline-Skripte und fremde Origins. Ein Test liest `src/` und `public/` (ohne die Testdateien selbst) und verbietet die typischen Senken und CDN-Hosts.

## Geheimnisse

Im Repository liegen Quelltext, Lockfile, Icons und Workflow. Keine `.env`, keine Schlüssel. `localStorage` enthält nur den Spielstand.

## Berechtigungen

**Browser:** Wake Lock (`navigator.wakeLock.request('screen')`) mit Fallback auf `null`. Service Worker nur für `/PadelCounter/`. Keine anderen Permissions.

**GitHub Actions:** siehe F-09. Der Deploy-Job baut das Artefakt aus `dist/` und lädt es mit den offiziellen Pages-Actions hoch. Pull Requests führen Lint, Typprüfung, Tests, Build, Build-Prüfung und `npm audit` aus, ohne Pages-Schreibrecht.

## Abhängigkeiten

Direkt, exakt, Stand 2026-10-13:

| Paket | Version | Rolle |
| --- | --- | --- |
| react | 19.3.0 | UI |
| react-dom | 19.3.0 | UI |
| typescript | 6.0.3 | Typprüfung (6.0.x liegt im Peer-Bereich von typescript-eslint; TypeScript 7 noch nicht) |
| @rsbuild/core | 2.2.13 | Bundler |
| @rsbuild/plugin-react | 2.1.1 | React-Plugin |
| vitest | 5.0.4 | Tests |
| workbox-build | 7.4.1 | Service Worker, nur Build |
| eslint | 10.12.0 | Lint |
| typescript-eslint | 8.71.2 | Lint |
| eslint-plugin-react-hooks | 7.1.1 | Hooks |
| fast-check | 4.10.2 | Property-Tests für Teamnamen, nur Testlauf, nicht im Browser-Bundle |

`npm audit` (vollständig, inklusive Dev-Dependencies): **0 Schwachstellen**. Wiederholen mit:

```bash
npm ci
npm audit --audit-level=moderate
npm run build
npm run verify-build
```

## Fehlermeldungen

- Speicher voll oder blockiert: „Speichern auf diesem Gerät ist fehlgeschlagen.“
- Render-Fehler: „Padel Counter konnte die Anzeige nicht laden.“ Der Knopf löscht nur den eigenen Speicher-Schlüssel und lädt neu. Der Hinweis sagt, dass der lokale Spielstand dabei gelöscht wird.
- Wake Lock und Service-Worker-Registrierung: stiller Fallback, die Anzeige bleibt bedienbar.

## Restrisiko

Jemand mit Zugriff auf das GitHub-Repository oder auf den Rechner des Spielers kann die App beziehungsweise den lokalen Speicher ändern. Das ist die Grenze einer statischen, lokalen PWA. Ein kompromittierter Deploy würde vom Service Worker gecacht, bis der nächste Deploy `skipWaiting` auslöst; deshalb deployed nur `main` nach grüner Prüfung.

Die Prüfung ersetzt kein unabhängiges Pentest-Gutachten. Sie ist die Review des Stands 1.1.0 vom 2026-10-13 gegen den Quelltext und `npm audit` dieses Commits. Abhängigkeiten sind gegenüber 1.0.0 unverändert.
