---
name: quiz-content
description: AP1/AP2 Quiz-Inhalte, Formate, Jahrgang j, Eintrags-IDs, Längen-Bias-Schutz
---

# quiz-content

Gilt für Einträge in `index.html`: `QUIZ`, `QUIZ2`, `FAELLE`, `FAELLE2`, Karten,
Lücken, Fehler, Tasks. Niemals HofZeit/Leckerbissen-Inhalte vermischen.
Kennungen (`id`) nicht ohne Grund ändern.

## Pflicht: Kein Längen-/Positions-Leak

**Fehler, der schon passiert ist:** Nur Shuffle oder ein paar Beispiel-Optionen
angepasst, obwohl hunderte MCQ/Fallstudien-Schritte die richtige Antwort als
eindeutig längste Option verrieten. Stichprobe ≠ Fertig.

| Regel | Detail |
|---|---|
| Anzeige mischen | `mischeArray` / `gemischteQuizOptionen` / `gemischteFallOptionen` — Reihenfolge nie fest „A = richtig“ |
| Längen angleichen | Richtige Option darf **nicht** eindeutig die längste sein (Zeichen; Worte nur als Zusatzsignal) |
| Bulk, nicht Stichprobe | Bei Bias-Arbeit **alle** Restfälle, nicht 1–2 Beispiele |
| Messen vor „fertig“ | `node _bias-analyse.cjs` + `node _bias-rest.cjs` |
| Einspielen | Patches als `*-fixed.json` unter `_bias-chunks/`; Fallstudien-Dateien **müssen** mit `faelle` beginnen (`faelle-…-fixed.json`), sonst lädt `_laengen-einspielen.cjs` sie als Quiz |
| Generator | `_laengen-rest-fix.cjs` erzeugt Patches und ruft Einspielen auf; keine kaputten Truncate-/Punkt-Pads |

### Akzeptanz (nach Inhalts-/Equalize-Änderung)

- Quiz: „RICHTIG = längste Zeichen“ ideal **&lt; ~5 %** (Ziel nahe 0)
- `_bias-rest.cjs`: Quiz-Rest **0** (oder begründet 1 Sonderfall, z. B. Formelzeile)
- `npm run check` grün; bei Deploy: Live https://ap1-trainer.pages.dev/ stichprobenartig

### Anti-Patterns

- Nur `mischeArray` und behaupten, Bias sei weg
- Ein Eintrag handisch umschreiben, Report mit 300 Rest ignorieren
- Ablenker mit abgeschnittenen Fülltexten / Punkt-Padding aufblasen
- HTML „direkt patchen“ ohne `_laengen-einspielen.cjs`, wenn der Schreibweg ungetestet ist

## Formate / Jahrgang

- Feld `j` für Ausbildungsjahr; IDs stabil halten
- AP1- vs. AP2-Sammlungen (`QUIZ`/`QUIZ2`, …) nicht vermischen
- Nach Massenänderung: `npm run check` und gezielt `npm run analyse`
