# Konventionen für Assistenten — Oberfläche des AP1-Trainers

Diese Datei liest ein Assistent, der in **diesem** Repository arbeitet. Sie gilt
nur hier. Das Backend hat seine eigene: `HofZeitV12/ap1-trainer-api` bzw. lokal
`AP1-Trainer-api` → `AGENTS.md`.

**Stand:** 2026-10-13 · Option R Phase 1 (Agent-OS)

## Projekt in Kürze

**Oberfläche** des AP1-Trainers — Lern-App zur Vorbereitung auf die
IHK-Abschlussprüfung Teil 1 und Teil 2 für Kaufleute für IT-System-Management.
Eine einzige Datei `index.html` (Stil- und Skriptblock inline) plus die Prüfwerkzeuge
in `tools/`.

| IST | NICHT |
|-----|--------|
| Öffentliches Frontend-Repo | HofZeit / speisekarte / Control-Tower |
| Live https://ap1-trainer.vercel.app/ | Leckerbissen / WinOrder / Hotfolder / Stripe |
| Vercel-Projekt **`ap1-trainer`** | Fremde DB-Refs anderer Produkte |
| Inhalte + UI + Client-Vertrag zu `/ap1/*` | Backend-Compose, Server-Pfade, Geheimnisse |

Lokaler Arbeitsordner (Hilfsskripte, `Trainer starten.cmd`) kann neben diesem
Repo unter `Desktop\ordner\AP1-Trainer` liegen — Coding-Grenzen bleiben: Web ≠ API.

## Die harten Regeln dieses Repositories

| Regel | Warum |
|---|---|
| **Dieses Repository ist ÖFFENTLICH.** | Nichts hineinschreiben, was Server, Ports, Pfade, Instanz-Kennungen, Schlüssel oder Zugangsdaten nennt — auch nicht in Kommentare, Doku oder den CHANGELOG |
| **Kein echter Wert in einer getrackten Datei.** | Auch kein Ausschnitt, kein Präfix, keine Länge. Nur Platzhalter |
| **Ein Skriptblock, ein Stilblock.** | Zwei Skriptblöcke hießen zwei Ladephasen und zwei Fehlerquellen; das Tor erzwingt genau einen |
| **Vor jeder Änderung an `index.html`: `npm run check`** | Die Syntaxprüfung parst den gesamten Anwendungscode und findet Tippfehler schneller als jedes Auge |
| **Der Vertrag darf nicht brechen** | `API`, `STORE`, `JAHR_STORE`, `PROFIL_STORE`, `KARTEN_STORE`, `TEIL_STORE`, `LERNSTAND_STORE`, `GESEHEN_STORE` — eine Änderung bricht das Backend oder verwirft den Fortschritt aller Nutzer, ohne Fehlermeldung. Das Tor prüft sie |
| **Kennungen im Inhalt (`id` eines Eintrags) nie ohne Grund ändern** | Sie stehen in Zitaten und in gespeicherten Fortschritten |
| **Der Code gewinnt** | Widerspricht eine Aussage dem Code, wird die Aussage korrigiert — nicht relativiert |
| **Nicht HofZeit, nicht Leckerbissen** | Keine Restaurant-DB, keine Kasse, kein Stripe aus anderen Produkten |

## Skill-Router (Stubs)

| Aufgabe | Must-use (Stub) | When-matches | Do-not-use |
|---|---|---|---|
| Quiz-Inhalte / Formate / Jahrgang | `quiz-content` | Einträge, Bereiche, AP1/AP2 | HofZeit-Menü-Skills |
| Deploy / Live | `deploy` | Vercel `ap1-trainer`, Preview | Leckerbissen-Deploy als Vorlage ohne Anpassung |
| API-Vertrag Client | `api-contract` | Stores, Profile, Fortschritt | Secrets/Compose hierher kopieren |
| UI / a11y | Plugin frontend-design / web-design-guidelines | Layout, Kontrast | Domain-Logik dort lösen |

## Befehle

| Zweck | Befehl |
|---|---|
| Alles prüfen (identisch zur CI) | `npm run check` |
| Inhaltsanalyse (Dubletten, Abdeckung) | `npm run analyse` |

## Session-Start + Pipeline

- Rules unter `.cursor/rules/` (`session-start`, `feature-pipeline`, `token-playbook`).
- Einstieg: [`docs/START.md`](docs/START.md).
- Control-Plane (Betriebs-OS, außerhalb dieses Repos):
  `Desktop\Projekte\control-plane\2026-10-13-radikal-system-dienste.md`

## MCP / Verify

| Behauptung | Pflicht-Check |
|---|---|
| Oberfläche live | HTTP https://ap1-trainer.vercel.app/ |
| API über Rewrite | HTTP `/ap1/health` (keine Secrets loggen) |
| Vercel | Projektname **`ap1-trainer`** via Vercel-MCP/CLI |

### `user-ap1` MCP — derzeit broken

Stand 2026-10-13: `user-ap1` schlägt bei der Tool-Discovery fehl (`namespaceStatus: error`).
**Später fixen** (Auth/Reload). Bis dahin Vercel-MCP + HTTP; Backend-Abnahme nur im
API-Repo.

## Nach jeder Änderung

- [ ] `npm run check` grün
- [ ] Bei Änderung an `index.html`: **alle sechs Formate** und alle drei Jahre im
      Browser durchklicken — die Prüfung kennt die Fachlichkeit nicht
- [ ] `CHANGELOG.md` ergänzt
- [ ] Bei Änderung des Vertrags: Entscheidungseintrag im **Backend**-Repository
      (`docs/entscheidungen/`), **vor** der Umsetzung

## Wo die Langform steht

Die führende Dokumentation liegt im **Backend**-Repository (privat), nicht hier:

| Was | Wo (Backend-Repo) |
|---|---|
| Einstieg und aktueller Stand | `docs/START.md` |
| Zweck, Umfang, Kerntabellen, Schnittstelle | `docs/PROJEKT.md` |
| Welche Daten zum AP1-Projekt gehören — und wo | `docs/DATEN-ORTE.md` |
| Betrieb, Störfälle, Rückrollweg | `docs/RUNBOOK.md` |
| Zugangsdaten (nur **Fundorte**, keine Werte) | `docs/ZUGANGSREGISTER.md` |
| Warum es so ist | `docs/entscheidungen/` |

**Nur-Orte, keine Werte.** Diese Tabelle nennt Dateinamen, keine Inhalte — wer in
diesem öffentlichen Repository arbeitet, findet hier den Weg zur Langform, aber
**keine** Instanz-Kennung und **keinen** Schlüssel.

## Grenzen (hart)

- **Nichts aus dem Backend-Repository hierher kopieren**, was Server, Ports,
  Pfade, Instanz-Kennungen oder Zugangsdaten nennt.
- **Der Anmeldedienst (Supabase Auth) ist nicht verbunden.** Die meta-Werte
  `ap1-auth-url` und `ap1-auth-key` bleiben leer, solange das so ist. Der
  Name-Weg ist immer vollwertig nutzbar.
- **Kein Hosting-Wechsel ohne Absprache.** Die Oberfläche wird über das
  Rewrite in `vercel.json` an das Backend angebunden; ein Wechsel der
  Backend-Adresse ist eine Architekturentscheidung.
- **Shared Server:** Backend teilt Hosting mit anderen Diensten — Änderungen
  nur im API-Repo und nur an AP1-eigenen Units/Pfaden.
