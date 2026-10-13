# Sicherheitsprüfung Padel Counter 1.0.0

**Datum:** 2026-10-13  
**Umfang:** Quelltext, Build, GitHub-Actions-Workflow, Abhängigkeiten (`npm audit`), statische Ausgabe in `dist/`.  
**Art der App:** statische PWA, nur Client, kein Backend, kein Login, keine Cookies, keine Tracker, keine externen Schriftarten oder Skripte.

## Angriffsfläche

| Fläche | Was sie kann | Was sie nicht kann |
| --- | --- | --- |
| Statische Dateien auf GitHub Pages | HTML, CSS, JS, Manifest, Icons, Service Worker unter `/PadelCounter/` | Keine serverseitige Ausführung, keine geheimen Header, die wir selbst setzen könnten |
| `localStorage` (`padel-counter.v1`) | Spielstand und Teamnamen nur in diesem Browser | Kein Zugriff von anderen Origins; Inhalt ist kein Geheimnis |
| Service Worker | Precache derselben Origin, Navigation-Fallback auf `index.html` | Kein `importScripts` von einem CDN, kein Runtime-Caching fremder Hosts |
| Screen Wake Lock | Bildschirm wach halten, wenn der Browser es erlaubt | Kein Mikrofon, keine Kamera, kein Standort |
| Teamnamen | Freitext, höchstens 20 Zeichen, nur als React-Text | Kein HTML, keine URLs, die die App lädt |

Es gibt keine Formulare mit Server-Ziel, keine Abfrage von `location.search` oder `location.hash`, keine `eval`-Pfade und keine Telemetrie.

## Befunde

| ID | Bereich | Schwere | Status | Befund |
| --- | --- | --- | --- | --- |
| F-01 | XSS über Teamnamen | Info | Behoben | Namen werden als React-Kinder gerendert. `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML` und `insertAdjacentHTML` sind per ESLint verboten und per Test im Quelltext ausgeschlossen. |
| F-02 | Gespeicherter Spielstand | Info | Behoben | Laden prüft Schema-Version 1, UUID, Zeitstempel, Satzstände und Namen. Ungültiges JSON, falsche Version, unmögliche Scores (z. B. 7:4), zu lange Namen, Steuerzeichen und Payloads über 8000 Zeichen werden verworfen. Felder werden in ein neues Objekt kopiert. |
| F-03 | Prototype Pollution | Info | Behoben | `JSON.parse` wird nicht in Prototypen gemischt. Ein Test prüft, dass `__proto__` im Payload `Object.prototype` nicht verändert. Werfer in Gettern liefern `null`. |
| F-04 | Bidi- und Steuerzeichen | Info | Behoben | Steuerzeichen, bidirektionale Steuerzeichen und unsichtbare Zeichen werden beim Speichern entfernt. Bereits gespeicherte Namen mit diesen Zeichen oder halben Surrogates werden abgelehnt. |
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

Keine Befunde mit Schwere Hoch oder Kritisch.

## Eingabevalidierung

- **Teamname:** Unicode NFC, Trim, keine Steuerzeichen (`U+0000`–`U+001F`, `U+007F`), keine Bidi-/Zero-Width-Zeichen, höchstens 20 Codepoints. Leer wird zu „Team A“ oder „Team B“. Das Eingabefeld setzt zusätzlich `maxLength`. Zeichen wie `<` bleiben erlaubt, weil React sie als Text escaped; ein Test speichert `<b>Hi</b>` und erwartet genau diese Zeichenkette.
- **Satzstand:** nur ganze Zahlen, plausibel für Padel (0–6 beliebig, 7 nur neben 5 oder 6). 7:0, 7:4, 8:6 und Brüche werden weder erzeugt noch aus dem Speicher geladen.
- **Ereignisse:** der Reducer ignoriert ungültige Zeitstempel, Teams, Satzindizes und Match-IDs. Er wirft dabei nicht.
- **Match-ID:** UUID. `crypto.randomUUID`, sonst 16 Bytes aus `crypto.getRandomValues`.

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

Die Prüfung ersetzt kein unabhängiges Pentest-Gutachten. Sie ist die Review des Stands vom 2026-10-13 gegen den Quelltext und `npm audit` dieses Commits.
