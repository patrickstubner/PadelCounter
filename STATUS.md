# STATUS.md – Stand 16.11.2026, Commit 37959ba, Version 1.2.13

## Aktuelles Ziel
Pflege: Audit auf `main` grün machen, Abhängigkeiten aktuell halten.

## Erledigt
- 1.2.13 live (Changelog 27.10.2026).
- AGENTS.md, ARCHITECTURE.md, STATUS.md (dieser PR, lokal ohne Cloud Agent).

## Plan ab 27.11.2026
1. Audit-Fix auf `main`: `npm audit` zeigt am 16.11.2026 13 Funde (11 moderat, 2 niedrig). Deshalb ist die CI auf `main` und auf allen PRs rot (Schritt `npm audit --audit-level=moderate`).
2. Danach Dependabot-PRs und Majors, je Paket ein PR.

## Offen / Entscheide nötig (wer?)
- P2-03 (icon-1024 nicht precachen), P2-04 (Status-Bar-Style), P2-05 (keine Guillemets in der englischen UI): laut `docs/SECURITY.md`, `rsbuild.config.ts`, `scripts/verify-build.mjs` und `src/index.html` auf `main` schon umgesetzt. Als erledigt abhaken? – Patrick

## Offene PRs (16.11.2026)
- #28 @types/node 22 → 26 (Dependabot, Major) – wartet bis 27.11.
- dieser Docs-PR

## Bekannte Probleme / Risiken
- CI rot wegen `npm audit` auf `main` (nicht durch Docs-PRs verursacht).
- Kein Ruleset auf `main` (keine Pflicht-Checks).

## Genutzte lokale Tools & vermiedene Cloud-Agent-Nutzung
- codebase-memory-mcp: Aufrufer von `useMatch`, `replay`, `matchReducer`.
- rg: Speicher-Schlüssel, P2-Punkte im Code nachgeprüft.
- `npm audit` lokal gegen `package-lock.json`.
- Geschätzt 1 kurzer Cloud-Agent-Lauf vermieden (Doku-Paket).
