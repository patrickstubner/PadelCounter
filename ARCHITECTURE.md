# ARCHITECTURE.md – Padel Counter

Stand 16.11.2026, abgeleitet aus `main` = `37959ba` (Version 1.2.13) mit codebase-memory-mcp und rg.

## Überblick
```
src/index.tsx → App.tsx (+ ErrorBoundary)
                 │ useMatch (hooks/useMatch.ts)
                 ▼
src/domain: reducer.ts (matchReducer) · log.ts (Ereignis-Log, replay, undo) · session.ts
            persistence.ts (padel-counter.v1) · archive.ts (padel-counter.matches, höchstens 100)
            celebration.ts (padel-counter.celebrated) · history.ts · rules.ts · names.ts · id.ts · types.ts
                 ▼
src/components: CourtHeader · TeamPanel · TeamName · SetScore · SplitFlap · HistoryPage · Victory · ConfirmDialog · UpdateReady
```

## Module
| Ort | Inhalt |
|---|---|
| `src/domain/` | Reine Logik: Zählregeln, Ereignisse, Replay, Laden/Speichern mit Validierung |
| `src/hooks/` | `useMatch` (Zustand, Speichern), `useInstallOffer` |
| `src/components/` | Darstellung |
| `src/registerServiceWorker.ts`, `src/wakeLock.ts`, `src/installOffer.ts`, `src/url.ts`, `src/archiveNav.ts` | Browser-Anbindung |
| `scripts/verify-build.mjs` | Prüft `dist/` (Service Worker, Icons, CSP) |
| `public/` | Manifest, Icons, NOTICE |

## Datenfluss
- Tippen → Ereignis (`game/increment`, `set/select`, `serve/set`, `match/end` …) → `appendEvent` → `replay` (`matchReducer`) → Anzeige.
- `useMatch` speichert nach jeder Änderung mit `saveLog` (Basisstand plus höchstens 500 Ereignisse, Schema 2) und abgeschlossene Matches mit `saveArchive`.
- Laden: `loadLog` → `parsePersisted` prüft jedes Feld. Schema 1 wird übernommen, Ungültiges verworfen (Details in README.md und docs/SECURITY.md).
- Kein Netzwerk. Der Service Worker (Workbox, beim Build erzeugt) cacht die App derselben Origin.

## Weitere Doku
- `README.md` (Bedienung, Datenformat), `CHANGELOG.md`, `docs/SECURITY.md`.
