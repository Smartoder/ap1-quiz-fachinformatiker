# Einstieg — AP1-Trainer (Oberfläche)

**Stand:** 2026-10-14

Dies ist die Tür für Assistenten in **diesem** öffentlichen Frontend-Repo.
Die führende Langform (Betrieb, Entscheidungen) liegt im **Backend-Repo**
(`ap1-trainer-api`) → `docs/START.md`.

## Sofort orientieren

| # | Datei | Warum |
|---|---|---|
| 1 | [../AGENTS.md](../AGENTS.md) | Grenzen, Skill-Router, MCP, Befehle |
| 2 | Backend `docs/START.md` | Aktueller Stand, Runbook, Entscheidungen |
| 3 | Control-Plane Plan | `Desktop\Projekte\control-plane\2026-10-13-radikal-system-dienste.md` |

## Live

- Oberfläche: https://ap1-trainer.pages.dev/
- Hosting: Cloudflare Pages (altes Vercel-Projekt `ap1-trainer` pausiert)
- Prüfung: `npm run check`

## Nicht verwechseln

| Dies | Nicht |
|---|---|
| AP1-Trainer Web (dieses Repo) | HofZeit speisekarte |
| AP1-Trainer API (anderes Repo) | Leckerbissen / WinOrder / Stripe |
| Cloudflare Pages Live | Vercel `ap1-trainer` (pausiert) als Host |

## MCP-Hinweis

`user-ap1` ist (Stand 2026-10-13) **broken** — Discovery-Fehler. Fix später;
Deploy/Health über HTTP auf `ap1-trainer.pages.dev` prüfen.
