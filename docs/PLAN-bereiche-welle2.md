# Plan — Bereiche Welle 2 (Katalog 2025 + offene Queue)

**Stand:** 2026-10-14 · folgt auf `PLAN-bereiche-welle1.md`  
**Scope:** `_online/index.html`, Spec, CHANGELOG · dann Commit + Deploy + Live-HTTP

## Ziele

1. **Katalog 2025 bereinigen:** AP1-Stoff ohne SQL, RAID, NoSQL, Struktogramm/PAP, Vererbung (als Fokus) entfernen oder ersetzen — relationale Grundlagen (ERM, NF, Schlüssel) behalten.
2. **Formate für neue Bereiche:** FEHLER + TASKS für `ablauf` und `barriere` (Chips nicht mehr dauerhaft disabled).
3. **RAID-Rechenaufgabe** (`id: 'raid'`) ersetzen durch prüfungsnahe Übertragung/IPv6-Rechnung.
4. **Verify:** `npm run check`, Bias-Stichprobe neuer Items, Live https://ap1-trainer.pages.dev/ + `/ap1/health`.
5. **Commit + Push** (User: alles Offene erledigen) — nur relevante Dateien, keine Secrets/Backups.

## Nicht-Ziele

- Vollständige KI-ML-Kürzung (nur Label Welle 1; Deep-Learning-Bulk = eigene Welle)
- Root-`index.html` außerhalb `_online/` spiegeln
- API-/Backend-Vertragsänderung

## UI

Bestehende Varianten-Leiste / Tokens unverändert; ggf. Fokus/Chips nur wenn Regression. Kein neues Designsystem.

## Akzeptanz

- [x] Keine dedizierten SQL-SELECT/DDL-Fehlerblöcke mehr in AP1-FEHLER
- [x] Kein TASK `raid`
- [x] `ablauf` + `barriere` haben ≥1 FEHLER und ≥1 TASK
- [x] `npm run check` grün (55/55, vor Deploy)
- [x] Live HTTP 200 auf Pages + health ok (wrangler direct upload; Git-Push allein triggert kein Pages-Deploy)
