# STATUS.md – Stand 27.11.2026, Branch `chore/node-26`, Basis main 1903b20ab1df212601dc1be36784648510ee98b2

## Nachtrag 27.11.2026: Umstellung auf Node 26
Branch `chore/node-26` (PR, Basis main 1903b20ab1df212601dc1be36784648510ee98b2, nicht mergen bis Stabschef-Ok). Kein App-Code, kein Versionsbump (1.2.13 bleibt).
- Node in CI und `engines` von 22 auf 26 gehoben. `@types/node` 22.20.5 → 26.6.6 (nimmt Dependabot-PR #28 auf; neuere 26.6.7–26.6.11 sind jünger als 4 Tage und bleiben deshalb aussen vor).
- Quelle der LTS-Prüfung: [nodejs/Release `schedule.json`](https://github.com/nodejs/Release) (v26 Active LTS «Lithium» seit 2026-10-28, Maintenance 2027-10-20, EOL 2029-04-30) und [nodejs.org/dist/index.json](https://nodejs.org/dist/index.json) (neueste 26.x: 26.13.1, LTS, Security-Release vom 2026-11-10).
- Lokal mit Node 26.13.1 und pnpm 10.34.9: Lint, Typecheck, 147 Tests, Build, `verify-build` und `pnpm audit --audit-level=moderate` sind grün (0 Schwachstellen).
- Der in älteren STATUS-Abschnitten beschriebene rote CI-Stand vor #39 ist erledigt: Audit ist seit dem Merge von #39 (22.11.2026) auf `main` grün.

## Nachtrag 22.11.2026 (Nachmittag): Audit-Fix und pnpm
Branch `chore/pnpm-audit-fix` (Draft-PR, Basis main b985b4f, nicht mergen bis Stabschef-Ok und Ja des Projektinhabers). Kein App-Code, kein Versionsbump.
- Umstellung auf pnpm 10.34.9 (`packageManager`, `pnpm-lock.yaml`, `.npmrc` ignore-scripts), CI mit pnpm. `package-lock.json` entfällt.
- Audit: 11 moderate Funde auf 0 (eslint 10.15.0, typescript-eslint 8.73.0, Override glob 14.0.2). Damit wird die CI auf `main` und allen PRs wieder grün.
- AGENTS.md: Regel «nur pnpm». Offene Dependabot-PRs müssen danach neu gebaut werden.
- Mindestalter neuer Paketversionen 4 Tage: `pnpm-workspace.yaml` mit `minimumReleaseAge: 5760`, Regel in `AGENTS.md` und Sicherheitsnotiz, Dependabot-`cooldown` (mindestens 4 Tage). Lockfile geprüft: alle Pakete älter als 4 Tage (jüngstes: minimatch 11.0.9, 5,7 Tage). **Übergangsausnahmen in `minimumReleaseAgeExclude` (Kommentar «Übergang Einführung 4-Tage-Regel, entfernen ab 26.11.2026»): keine, weil kein bestehendes Paket jünger als 4 Tage ist.** Sicherheits-Ausnahmen: keine nötig.

## Nachtrag 22.11.2026 (Abend): Korrekturen nach Stabschef-Prüfung
Commit `a70276f`. Nur Doku, kein App-Code, kein Cloud Agent.
- Abschnitt «Zusammenarbeit mehrerer Agents»: vor dem Merge geht der Head-SHA an Stabschef, auf dessen Ok warten, Merge erst nach dem Ja des Projektinhabers.
- Vornamen in `AGENTS.md` durch «Projektinhaber» ersetzt.

## Nachtrag 22.11.2026: Vorbereitung für lokale Arbeit mit Google Antigravity
Branch `docs/antigravity-setup` (PR offen, nicht mergen bis Stabschef-Ok und Ja des Projektinhabers). Nur Doku und `.gitignore`, kein App-Code, kein Cloud Agent. `.cursor/` und `.cursorignore` unverändert.
- `AGENTS.md`: neuer Abschnitt «Zusammenarbeit mehrerer Agents» (ein Branch pro Aufgabe und Agent, nur PRs, Sicherheitsprüfung nach jeder Änderung, STATUS.md mit Commit, keine Secrets, keine Kosten ohne Ja, empfohlene lokale MCP-Server) und Projektregel «Version 1 bleibt eigenständig neben v2». Antigravity liest `AGENTS.md` automatisch; keine zweite Regel-Datei.
- `README.md`: Abschnitt «Mit Agents arbeiten» (der lokale Start stand schon dort). `.gitignore`: `.agents/mcp_config.json`.
- Stand `npm audit` (22.11.2026, `package-lock.json`): 11 Funde, alle moderat. Offene Dependabot-PRs (#28, #34–#36 u. a.) warten; nicht Teil dieses PRs.

## Nachtrag 20.11.2026: MCP-Allowlist für Cloud-Agent-Umgebung
Branch `chore/mcp-allowlist` (Draft-PR, Basis main 23de4a9, nicht mergen bis Stabschef-Ok und Ja des Projektinhabers). Kein Versionsbump.
- `.cursor/environment.json`: neu `mcpServerAllowlist` mit genau einem Eintrag, dem gehosteten Graphify-MCP (`https://api.graphify.com/mcp`). Alle anderen User- und Team-MCP-Server sind für Agents dieser Umgebung gesperrt, Cursor-eigene MCP-Server nicht. Feldnamen laut https://cursor.com/schemas/environment.schema.json; die Datei wurde gegen das Schema geprüft.
- AGENTS.md (Cloud-Abschnitt): Regel «MCP-Liste schlank halten; Serena nur nach positivem lokalem Test, dann ersetzt es codebase-memory-mcp».
- Die Datei wirkt nur, wenn «environment.json location» der Umgebung auf cursor.com auf dieses Repo zeigt. Sonst gleichen Eintrag im Dashboard von Hand setzen (Abschnitt «MCP servers» der Umgebung). Ungetestet: kein Cloud Agent gestartet (Kontingent bis 27.11.2026 erschöpft).

## Nachtrag 16.11.2026: Cloud-Agent-Setup
Branch `chore/cloud-agent-setup` (Draft-PR, nicht mergen bis Stabschef und Projektinhaber Ja sagen).
- Nur Agent-Konfiguration, keine Änderung am Anwendungscode. Der Projektinhaber hat das ausdrücklich verlangt (AGENTS.md von V1 bzw. V2 sah vor, den V1-Code nicht anzufassen).
- `.cursor/environment.json` und `.cursor/install-dev-tools.sh`: ripgrep 14.1.1, ast-grep 0.51.2, codebase-memory-mcp 0.12.1, Versionen und SHA-256 gepinnt. Bei `package-lock.json`: `npm ci --ignore-scripts` (Node >= 22).
- Binaries nur unter `~/.local/bin` (kein `sudo`); PATH setzt das Skript in `~/.profile` und `~/.bashrc`.
- `.cursorignore`, `.codebase-memory/` in `.gitignore` und `.cursorignore`. `.gitignore`: `.cursor/`-Ausnahme für die Setup-Dateien.
- Abschnitt «Cursor Cloud specific instructions» in AGENTS.md ergänzt.

## Aktuelles Ziel
Pflege: Abhängigkeiten aktuell halten. Node-26-Umstellung liegt in `chore/node-26` (ersetzt #28) und wartet auf Stabschef-Ok.

## Erledigt
- 1.2.13 live (Changelog 27.10.2026).
- Audit auf `main` seit #39 (22.11.2026) grün (`pnpm audit`: 0 Funde). Der frühere rote CI-Stand vor #39 ist erledigt.
- AGENTS.md, ARCHITECTURE.md, STATUS.md (PR #32 gemergt, live seit 16.11.2026).
- P2-03, P2-04, P2-05 erledigt (auf `main` umgesetzt, in `docs/SECURITY.md` als behoben geführt):
  - P2-03 icon-1024 nicht precachen: `rsbuild.config.ts` (`globIgnores`), `scripts/verify-build.mjs` verlangt die Datei in `dist/` und verbietet sie in `sw.js`
  - P2-04 Status-Bar-Style: `src/index.html` `apple-mobile-web-app-status-bar-style` = `black-translucent`
  - P2-05 keine Guillemets in der englischen UI: `«` `»` kommen in `src/` nur noch in `src/security.test.ts` als verbotene Zeichen vor

## Plan ab 27.11.2026
1. Audit-Fix: erledigt und auf `main` seit #39 (22.11.2026); `pnpm audit` ist grün (0 Funde). Der frühere rote CI-Stand vor #39 ist damit erledigt.
2. Node 26: dieser PR (`chore/node-26`, ersetzt #28). Merge erst nach Stabschef-Ok; #28 erst danach schliessen.
3. Weitere Dependabot-Majors je Paket ein PR.

## Offen / Entscheide nötig (wer?)
- keine

## Offene PRs (27.11.2026)
- dieser PR: `chore/node-26` (Node 26 in CI/`engines`, `@types/node` 26.6.6; ersetzt #28, #28 bleibt offen bis nach dem Merge).
- #28 @types/node 22 → 26 (Dependabot) – wird durch `chore/node-26` ersetzt, noch nicht schliessen.

## Bekannte Probleme / Risiken
- Kein Ruleset auf `main` (keine Pflicht-Checks).
- `@types/node` 26.6.7–26.6.11 sind jünger als 4 Tage (`minimumReleaseAge`); deshalb bleibt 26.6.6. Nach Ablauf der Wartezeit kann Dependabot nachziehen.

## Genutzte lokale Tools & vermiedene Cloud-Agent-Nutzung
- 27.11. (Node 26): lokal Node 26.13.1, pnpm 10.34.9, `rg`, gitleaks; kein Cloud Agent.
- codebase-memory-mcp: Aufrufer von `useMatch`, `replay`, `matchReducer`.
- rg: Speicher-Schlüssel, P2-Punkte im Code nachgeprüft.
- `pnpm audit` lokal gegen `pnpm-lock.yaml` (bis 22.11.2026 `npm audit`).
- Geschätzt 1 kurzer Cloud-Agent-Lauf vermieden (Doku-Paket).
- 16.11. (Cloud-Agent-Setup): nur Agent-Konfiguration, lokal geprüft, kein Cloud Agent.
