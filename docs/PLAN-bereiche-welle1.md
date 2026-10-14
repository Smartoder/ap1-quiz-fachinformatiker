# Plan — Bereiche Welle 1 (Ansatz B)

**Stand:** 2026-10-14 · freigegebenes Design · Produkt AP1 IHK-Trainer  
**Scope:** `_online/index.html` (+ Spec/CHANGELOG lokal) · kein API-/ID-Massenbruch · kein Commit

## Ziel

Lernende wählen einen **Bereich** und üben denselben Stoff in **mehreren Formaten** (wie in der Prüfung), ohne SaaS-Card-Grid und ohne neues Designsystem.

## Inhalt

### Neue / geänderte Bereiche (`BEREICHE`)

| id | name | haeufig / neben |
|---|---|---|
| `ablauf` | Arbeitsplatz-Ablauf | oft |
| `barriere` | Barrierefreiheit & Medien | neu |
| `ki` | **KI am Arbeitsplatz** (Rename; id bleibt `ki`) | neu |

Nicht in dieser Welle: Massen-Löschung SQL/RAID.

### Neue Einträge (AP1, stabile Felder)

- **ablauf:** Kundeneinweisung, Testprotokoll, Abnahme, Leistung dokumentieren → Quiz + Karten + 1 Fallstudie  
- **barriere:** Social Media als Kommunikationssystem; Web-Barrierefreiheit (alt-Text, Kontrast, Tastatur, Untertitel) → Quiz + Karten + Lücke  
- **software / netzwerk:** je 2–3 Quiz zu Client-Server und Dateiformate / ASCII vs. Binär (dünne Stellen)

Quiz-Regeln (`quiz-content`): Optionslängen ausgleichen; Anzeige über bestehendes `mischeArray` / `gemischteQuizOptionen`. Nach Content: Bias-Stichprobe + `npm run check`.

## UI — Varianten-Leiste (Hauptblatt)

Wenn ein Bereich gewählt ist (`…Lauf.bereich` bzw. Rechen-`task.bereich`):

1. **Format-Leiste:** Quiz · Karten · Lücken · Fehler · Fall · Rechnen mit Zählern; `disabled` bei 0  
2. **Button „Nächste Variante“:** Round-Robin zum nächsten verfügbaren Format desselben Bereichs  
3. **Hinweis:** z. B. „X Formate · wechsle ab, wie in der Prüfung“

### Visuell (bestehende Tokens)

- `--tinte` #142033, `--papier` #E8EDF4, `--blatt`, `--gruen` #0F766E  
- DM Sans + Fraunces + JetBrains Mono  
- Flache Chips/Leiste, Touch ≥ 48 px, `:focus-visible`, `prefers-reduced-motion`  
- Kein Claymorphism, keine ALL-CAPS-Eyebrows, keine purple Gradients, kein SaaS-Card-Grid  

### Einbindung

An `railZeichnen` / Bereichswechsel / `starteQuiz|Karten|Luecken|Fehler|Fall` anhängen — **eine** Hilfsfunktion für Leiste + Round-Robin, keine doppelte Format-Logik.

## UX-Guidance (ui-ux-pro-max)

- Chip-Collections: wrap, keine feste Höhe mit clipped overflow  
- Tastatur: Tab-Reihenfolge = visuelle Reihenfolge, sichtbarer Fokus  
- Stack-Hinweise nur Guidance; Tokens gewinnen  

## a11y-Check (web-design-guidelines)

- Buttons mit klaren Labels / `aria-label` wo nötig  
- `role="tablist"`/`tab` optional; mind. `aria-pressed` oder klarer Aktiv-Zustand  
- Fokus nicht verstecken; Motion respektieren  

## Verify

- `cd _online && npm run check`  
- Bias-Stichprobe neuer Quiz (`_bias-rest.cjs` oder gezielte Prüfung)  
- CHANGELOG kurz ergänzen  

## Nicht-Ziele Welle 1

- SQL/RAID-Massenbereinigung  
- API-/Backend-Vertragsänderung  
- Commit/Push  
