# Konventionen für Assistenten — Oberfläche des AP1-Trainers

Diese Datei liest ein Assistent, der in **diesem** Repository arbeitet. Sie gilt
nur hier. Das Backend hat seine eigene: `HofZeitV12/ap1-trainer-api` bzw. lokal
`AP1-Trainer-api` → `AGENTS.md`.

**Stand:** 2026-10-14 · Option R Phase 2 (Agent-OS)

## Projekt in Kürze

**Oberfläche** — IHK-Lern-App: **AP1 für IT-Berufe** (gemeinsame Kerninhalte),
AP2 berufsbezogen (aktuell Kaufmann/-frau für IT-System-Management; weitere
Berufe geplant). Siehe Parent `docs/VISION.md` / `.agents/product-marketing.md`.
Eine einzige Datei `index.html` (Stil- und Skriptblock inline) plus die Prüfwerkzeuge
in `tools/`.

| IST | NICHT |
|-----|--------|
| Öffentliches Frontend-Repo | HofZeit / speisekarte / Control-Tower |
| Live https://ap1-trainer.pages.dev/ | Leckerbissen / WinOrder / Hotfolder / Stripe |
| Cloudflare Pages (Vercel `ap1-trainer` pausiert) | Fremde DB-Refs anderer Produkte |
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
| **MCQ/Fallstudien: kein Längen-Leak** | Richtige Option nicht eindeutig die längste; Anzeige mischen. Stichprobe reicht nicht — Rest mit `_bias-analyse.cjs` / `_bias-rest.cjs` messen. Skill `quiz-content` |
| **Der Code gewinnt** | Widerspricht eine Aussage dem Code, wird die Aussage korrigiert — nicht relativiert |
| **Nicht HofZeit, nicht Leckerbissen** | Keine Restaurant-DB, keine Kasse, kein Stripe aus anderen Produkten |

## Skill-Router (Stubs)

| Aufgabe | Must-use (Stub) | When-matches | Do-not-use |
|---|---|---|---|
| Quiz-Inhalte / Formate / Jahrgang / Längen-Bias | `quiz-content` | Einträge, Bereiche, AP1/AP2, Optionslängen | HofZeit-Menü-Skills |
| Deploy / Live | `deploy` | Pages `ap1-trainer.pages.dev`, `/ap1` | Leckerbissen-Deploy als Vorlage ohne Anpassung |
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
| Oberfläche live | HTTP https://ap1-trainer.pages.dev/ |
| API über Rewrite | HTTP `/ap1/health` (keine Secrets loggen) |
| Cloudflare Pages | HTTP Live-URL; altes Vercel `ap1-trainer` pausiert |

### `user-ap1` MCP — derzeit broken

Stand 2026-10-13: `user-ap1` schlägt bei der Tool-Discovery fehl (`namespaceStatus: error`).
**Später fixen** (Auth/Reload). Bis dahin HTTP auf `ap1-trainer.pages.dev`; Backend-Abnahme nur im
API-Repo.

## Nach jeder Änderung

- [ ] `npm run check` grün
- [ ] Bei Änderung an `index.html`: **alle sechs Formate** und alle drei Jahre im
      Browser durchklicken — die Prüfung kennt die Fachlichkeit nicht
- [ ] Bei neuen/geänderten **Quiz- oder Fallstudien-Optionen**: Bias prüfen
      (`node _bias-analyse.cjs`, Rest → `node _bias-rest.cjs`). Rest ≠ 0 → Bulk
      nachziehen (`_laengen-rest-fix.cjs` / `_laengen-einspielen.cjs`), nicht nur
      Shuffle. Details: Skill `quiz-content`
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
- **Anmeldedienst (AP1-Supabase Auth).** Git lässt `ap1-auth-*` leer. Live-Deploy
  setzt öffentlich `url=/sb` + `key=ap1-web`; Pages-Function `/sb/auth/v1/*`
  proxyt an das **eigene** AP1-Projekt (nicht HofZeit `jxq…` / Üben `mqe…`).
  `AP1_SUPABASE_URL` + `AP1_SUPABASE_SECRET` nur als Cloudflare Pages Secrets —
  kein `service_role` in Git/HTML. Alternativ später anon-Key direkt in meta.
  Ohne AUTH (lokal): Tabs Anmelden/Registrieren deaktiviert, „Ohne Konto“ aktiv.
  Name-Weg (Gast) bleibt vollwertig.
- **Kein Hosting-Wechsel ohne Absprache.** Die Oberfläche wird über das
  Rewrite in `vercel.json` an das Backend angebunden; ein Wechsel der
  Backend-Adresse ist eine Architekturentscheidung.
- **Shared Server:** Backend teilt Hosting mit anderen Diensten — Änderungen
  nur im API-Repo und nur an AP1-eigenen Units/Pfaden.
