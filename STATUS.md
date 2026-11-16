# STATUS.md – Stand 16.11.2026, Basis main 214a865 (1.2.13), Branch `chore/cloud-agent-setup`

## Nachtrag 16.11.2026: Cloud-Agent-Setup
Branch `chore/cloud-agent-setup` (Draft-PR, nicht mergen bis Stabschef und Projektinhaber Ja sagen).
- Nur Agent-Konfiguration, keine Änderung am Anwendungscode. Der Projektinhaber hat das ausdrücklich verlangt (AGENTS.md von V1 bzw. V2 sah vor, den V1-Code nicht anzufassen).
- `.cursor/environment.json` und `.cursor/install-dev-tools.sh`: ripgrep 14.1.1, ast-grep 0.51.2, codebase-memory-mcp 0.12.1, Versionen und SHA-256 gepinnt. Bei `package-lock.json`: `npm ci --ignore-scripts` (Node >= 22).
- Binaries nur unter `~/.local/bin` (kein `sudo`); PATH setzt das Skript in `~/.profile` und `~/.bashrc`.
- `.cursorignore`, `.codebase-memory/` in `.gitignore` und `.cursorignore`. `.gitignore`: `.cursor/`-Ausnahme für die Setup-Dateien.
- Abschnitt «Cursor Cloud specific instructions» in AGENTS.md ergänzt.

## Aktuelles Ziel
Pflege: Audit auf `main` grün machen, Abhängigkeiten aktuell halten.

## Erledigt
- 1.2.13 live (Changelog 27.10.2026).
- AGENTS.md, ARCHITECTURE.md, STATUS.md (PR #32 gemergt, live seit 16.11.2026).
- P2-03, P2-04, P2-05 erledigt (auf `main` umgesetzt, in `docs/SECURITY.md` als behoben geführt):
  - P2-03 icon-1024 nicht precachen: `rsbuild.config.ts` (`globIgnores`), `scripts/verify-build.mjs` verlangt die Datei in `dist/` und verbietet sie in `sw.js`
  - P2-04 Status-Bar-Style: `src/index.html` `apple-mobile-web-app-status-bar-style` = `black-translucent`
  - P2-05 keine Guillemets in der englischen UI: `«` `»` kommen in `src/` nur noch in `src/security.test.ts` als verbotene Zeichen vor

## Plan ab 27.11.2026
1. Audit-Fix auf `main`: `npm audit` zeigt am 16.11.2026 13 Funde (11 moderat, 2 niedrig). Deshalb ist die CI auf `main` und auf allen PRs rot (Schritt `npm audit --audit-level=moderate`).
2. Danach Dependabot-PRs und Majors, je Paket ein PR.

## Offen / Entscheide nötig (wer?)
- keine

## Offene PRs (16.11.2026)
- #28 @types/node 22 → 26 (Dependabot, Major) – wartet bis 27.11.
- dieser Draft-PR: Cloud-Agent-Setup (`chore/cloud-agent-setup`)

## Bekannte Probleme / Risiken
- CI rot wegen `npm audit` auf `main` (nicht durch Docs-PRs verursacht).
- Kein Ruleset auf `main` (keine Pflicht-Checks).

## Genutzte lokale Tools & vermiedene Cloud-Agent-Nutzung
- codebase-memory-mcp: Aufrufer von `useMatch`, `replay`, `matchReducer`.
- rg: Speicher-Schlüssel, P2-Punkte im Code nachgeprüft.
- `npm audit` lokal gegen `package-lock.json`.
- Geschätzt 1 kurzer Cloud-Agent-Lauf vermieden (Doku-Paket).
- 16.11. (Cloud-Agent-Setup): nur Agent-Konfiguration, lokal geprüft, kein Cloud Agent.
