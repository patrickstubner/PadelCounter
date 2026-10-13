# Changelog

## 1.1.0 – 2026-10-13

- Aufschlag optional: Ball bei Team A oder B, der Start darf offen bleiben. Bei 0:0 gilt die Angabe für das erste Game, nach einem Game für das nächste. Danach Rotation A1, B1, A2, B2, jederzeit manuell überschreibbar. Bei 6:6 ein dezenter Tiebreak-Hinweis (erster Aufschlag, danach je 2 Punkte).
- Jede Änderung (Games, Aufschlag, Namen, neues Spiel) liegt als Ereignis am Match. «Rückgängig» nimmt mehrere Schritte zurück, eine kurze Verlaufsliste zeigt die letzten Einträge. Höchstens 500 Ereignisse, Prüfung beim Laden. Ein Speicherstand von 1.0.0 wird übernommen.
- Namensfilter `/[\p{Cc}\p{Cf}\u2028\u2029]/gu` in beiden Prüfungen. Nach dem Kürzen wird erneut getrimmt und ein einzelnes Surrogate entfernt. Längengrenze in Codepoints. Seitenpfad aus `PAGE_BASE`. Wöchentliches Dependabot für npm und GitHub Actions.
- Der Verlauf zeigt die lokale Uhrzeit, an anderen Tagen auch das Datum. «Spiel beenden» sperrt den Endstand nach einer Rückfrage. «Fortsetzen» und «Rückgängig» nehmen das Spiel wieder auf.

## 1.0.0 – 2026-10-13

- Erste Version: Offline-PWA zum Zählen von Padel-Games (Best of 3).
- Quer- und Hochformat, Split-Flap-Animation, Wake Lock, lokaler Spielstand und editierbare Teamnamen.
- GitHub Actions prüft Lint, Typen, Tests, Build und `npm audit`; Pages-Deploy nur von `main`.
