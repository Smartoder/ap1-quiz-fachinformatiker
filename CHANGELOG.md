# Änderungen

Das Format folgt *Keep a Changelog*. Bruchstellen sind ausdrücklich gekennzeichnet.

## [Nicht veröffentlicht]

### Hinzugefügt — Anmeldung, Schwächen-Fokus und vier Lernwege (2026-10-08)

**Anmeldung als Anmeldebogen.** Die bisherige „Wer lernt hier?"-Auswahl ist ein
zweiblättriger Anmeldebogen: links das Deckblatt (Wortzeichen, Teil, Stand),
rechts das Formular mit nummerierten Feldern. Zwei Wege führen zum selben
Ergebnis – ein Profil mit Kennung:

- **Konto mit E-Mail und Passwort** (sobald ein Anmeldedienst verbunden ist).
  „Passwort vergessen" schickt einen Reset-Link per Mail. Der Dienst ist
  Supabase Auth; die Projekt-Adresse und der öffentliche Schlüssel kommen beim
  Ausliefern über `<meta name="ap1-auth-url">` und `<meta name="ap1-auth-key">`
  — **kein fremder Schlüssel im Repository**.
- **Name ohne Passwort** bleibt immer möglich. Ohne Anmeldedienst ist der
  Trainer voll nutzbar.

Damit ist die Profil-Kennung (der primary key) dauerhaft gespeichert und der
Fortschritt hängt am Profil, nicht am Rechner.

**Schwächen-Fokus.** Der Trainer zählt je Prüfungsteil und Bereich richtig und
falsch. Daraus entsteht ein Handlungsbedarf (siehe Entscheidung 0013):

- Sichtbar auf der neuen Seite **„Meine Schwächen"** — ein Korrekturbogen, der
  Schwaches nach oben sortiert, mit Balken und Antwortzahl je Bereich.
- Ein Schalter **„Schwächere Bereiche öfter zeigen"** wirkt in Quiz und
  Karteikarten: schwache Bereiche kommen häufiger, sichere seltener.
- Wenige Antworten zählen wenig (Gewicht), unbekannte Bereiche bleiben neutral.

**Vier Lernwege statt zwei Schalter.** Teil und Jahrgang sind keine zwei
Entscheidungen mehr, sondern eine Wahl:

| Weg | Inhalt |
|---|---|
| **Teil 1 · Ausbildung** | AP1, gefiltert nach Ausbildungsjahr |
| **Prüfungsvorbereitung 1** | AP1, alle Jahrgänge gemischt |
| **Teil 2 · Ausbildung** | AP2, vier Prüfungsbereiche |
| **Prüfungsvorbereitung 2** | AP2, schriftliche Vorbereitung |

Der Knopf in der Kopfzeile heißt jetzt **„Weg"**; die Wahl liegt in der
Seitenleiste, die Marke AP1/AP2 bleibt und folgt dem Weg.

**Backend:** `trainer_profile` bekommt zwei freiwillige Spalten `email` und
`auth_id` (je ein eindeutiger Teilindex), und `POST /ap1/profile` prüft und
speichert sie. 7 neue Prüfungen im Wegetest (38 statt 31).

**Geprüft am 2026-10-08:**

- Oberflächen-Tor `npm run check`: **49/49 bestanden.**
- Backend-Tor `npm run check`: **24/24 Struktur + 38/38 Wege.**
- Im Browser: Anmeldebogen, alle vier Wege, „Meine Schwächen" (14 Bereiche),
  Fokus-Gewichtung und die Erfassung aus Quiz, Karten, Lückentext, Fehlersuche,
  Fallstudie und Rechenaufgabe durchgeklickt — ohne Fehler.
- Mobil (390 × 844): der Korrekturbogen bricht auf zwei Zeilen je Bereich um.

**Noch nicht verdrahtet (siehe Entscheidung 0013, offene Punkte):**
Anmeldedienst verbinden, Migration auf der laufenden Datenbank, RLS-Regeln,
und den Lernstand ins Profil schreiben.

### Hinzugefügt — alle vier Lernlücken nach Katalog geschlossen (2026-10-08)

Vier Bereiche, die der amtliche Prüfungskatalog nennt und die im Trainer noch
dünn waren, sind ausgebaut: **Angebotsvergleich (PK-02/03)**, **Qualitätssicherung
(PK-05)**, **Verträge & Leistungserbringung (PK-07)** und — neu als eigener
Bereich — **Englische Fachtexte (PK-02/03)**.

| Bereich | vorher | jetzt |
|---|---|---|
| Angebotsvergleich | 10 | **36** |
| Qualitätssicherung | 10 | **30** |
| Verträge & Leistungserbringung | 31 | **55** |
| Kundenberatung & Kommunikation | 22 | **38** |
| Englische Fachtexte (neu) | – | **24** |

**Angebotsvergleich:** quantitativer vs. qualitativer Vergleich, Nutzwertanalyse
(5 Schritte), TCO über die Nutzungsdauer, Beschaffungsformen (Kauf, Leasing,
Finanzierung, Pay-per-Use), Lasten-/Pflichtenheft, direkter/indirekter Vertrieb,
AIDA, Produktlebenszyklus, Outsourcing vs. Offshoring, Preis-/Konditionsvergleich.
Dazu eine neue Fallstudie „Angebote vergleichen und auswählen" und die neue
Rechenaufgabe **Nutzwertanalyse durchrechnen** (gewichten, bewerten, gewichtete
Summe, Sieger bestimmen).

**Qualitätssicherung:** PDCA, Qualitätsplanung vs. -lenkung, QM-Systeme/Normen/
Zertifizierung, Testprotokoll, Teststufen (V-Modell), Black-Box vs. White-Box,
QS vs. QK, Soll-Ist-Vergleich, Abweichungsanalyse.

**Verträge & Leistungserbringung:** Aufbauorganisation (Einlinien, Mehrlinien,
Matrix), Vollmachten (i.V., i.A., ppa., Prokura, Handlungsvollmacht), Abnahme-
protokoll, drei Mängelarten, Werk- vs. Dienstvertrag, Gewährleistung vs. Garantie,
SLA, Soll-Ist/Nachkalkulation/Lessons Learned, Umsetzungsvarianten,
Change-Management (Widerstandsursachen, Stakeholder-Typen).

**Englische Fachtexte (neuer Bereich):** 20 Quizfragen zu typischen
Kunden-E-Mails und IT-Fachbegriffen (quote, invoice, downtime, redundancy,
bandwidth, rollback plan, data breach, end of life …) plus 4 Vokabelkarten.
Eigener Abschnitt auf der Startseite mit Direkteinstieg in Quiz und Karten.
Damit ist die im Katalog verlangte Fähigkeit „englischsprachige Texte auswerten"
übbar — ohne eine zweite Render-Logik: das Format nutzt den bestehenden
Quiz- und Kartenmechanismus.

**Geprüft am 2026-10-08:**

- Qualitätstor `npm run check`: **49/49 bestanden.**
- Inhaltsanalyse: **keine Dubletten** im selben Format, **kein doppelter Titel**
  (fünf doppelte neu eingefügte Einträge wurden bereinigt/umbenannt).
- Teil 1: 521 → **629 Einträge** (QUIZ 251→313 · KARTEN 206→245 · LUECKEN 21→24
  · FEHLER 10→12 · FAELLE 12→13 · TASKS 21→22).
- Alle neuen Formate und die zwei Rechenaufgaben im Browser gestartet, ohne
  Fehler; Generatorzahlen über je 400 Läufe endlich.

### Hinzugefügt — Netzwerktechnik und IT-Sicherheit ausgebaut (2026-10-08)

Die Inhaltsanalyse wies `netzwerk` (10 Einträge) und `sicherheit` (8) als die
zwei dünnsten Bereiche aus — beide sind prüfungskritisch (PK-03, PK-04, PK-06).
Sie sind jetzt auf Prüfungstiefe gebracht.

| Bereich | vorher | jetzt |
|---|---|---|
| Netzwerktechnik | 10 | **57** |
| IT-Sicherheit & Verfügbarkeit | 8 | **46** |

**Neu — Netzwerktechnik:** OSI- und TCP/IP-Modell, Schichten-Zuordnung von
Router/Switch, TCP vs. UDP, 3-Way-Handshake, DHCP/DNS, Netzwerkkomponenten
(Switch, Router, Gateway, Access Point, LWL), Konsolenbefehle (ipconfig,
traceroute/tracert, nslookup, arp), APIPA, VPN-Topologien (Site-to-Site,
End-to-Site, End-to-End) und -Protokolle (IPsec, L2TP), WLAN-Sicherheit
(WEP/WPA2/WPA3, PSK/Enterprise), Firewall-Arten, DMZ, IPv4/IPv6, Subnetting,
Ethernet- und WLAN-Standards, Übertragungszeit, VLAN und Virtualisierung.

**Neu — IT-Sicherheit:** CIA-Trio, Maßnahmen-Trias (technisch/organisatorisch/
personell), Schutzbedarfskategorien und ISMS, Verschlüsselungs-Trio, Hash/
Zertifikat/Signatur, Security by Design und Default, 2FA und Passwort-Policy,
Backup-Verfahren, Angriffsarten (Phishing, Sniffing, Spoofing, Man-in-the-Middle,
DoS/DDoS), Schadprogramm-Familien, Hacker-Typen, Least Privilege,
Ransomware-Abwehr.

**Zwei neue Rechenaufgaben (Generatoren):** Übertragungszeit & Datenvolumen
(Byte↔Bit, Nutzrate, Bandbreitenbedarf) · Verfügbarkeit, SLA & Backup-Volumen.

**Zwei neue Fallstudien:** Büro-Netzwerk planen (Trennung, Komponenten,
Adressierung, Sicherheit) · Ransomware-Angriff abwehren (Isolieren, Backup,
Ursache, ISMS).

**Geprüft am 2026-10-08:**

- Qualitätstor `npm run check`: **49/49 bestanden.**
- Inhaltsanalyse: **keine Dubletten** im selben Format, **kein doppelter Titel**.
- Teil 1: 436 → **521 Einträge** (QUIZ 204→251 · KARTEN 177→206 · LUECKEN 18→21
  · FEHLER 8→10 · FAELLE 10→12 · TASKS 19→21).
- Alle neuen Formate und beide Rechenaufgaben im Browser gestartet, ohne Fehler;
  Generator-Zahlen über 300 Läufe endlich.

### Hinzugefügt — Bereich „KI, ML & Deep Learning" im ersten Prüfungsteil (2026-10-08)

Der Trainer bekommt einen neuen Themenbereich im **ersten Prüfungsteil (AP1)**:
**KI, ML & Deep Learning** (Bereichs-ID `ki`). Er schließt die Lücke, die die
Inhaltsanalyse seit dem 2026-09-29 offen auswies — bis dahin gab es zu KI nur
einen Nebensatz in einem PM-Eintrag.

**Neue Einträge über alle sechs Formate, alle mit Jahresmarke `j`:**

| Format | Einträge im Bereich `ki` |
|---|---|
| Quizfragen | 50 |
| Karteikarten | 44 |
| Lückentexte | 5 |
| Fehlersuche-Blöcke | 4 |
| Fallstudien | 7 |
| Rechenaufgaben | 4 |
| **Summe** | **111** |

Über alle drei Jahre kumulativ: J1 = 56 · J2 = 98 · J3 = 111.

**Inhalte (neu formuliert, aus den Lerninhalten des Fidup-Wikis abgeleitet, keine
Aufgabe wörtlich übernommen):** Hierarchie KI ⊃ ML ⊃ DL · maschinelles Lernen
(überwacht, unüberwacht, bestärkend) · Perzeptron und Frank Rosenblatt · Neuron,
Gewichte, Bias, Aktivierungsfunktionen (ReLU, Sigmoid) · Backpropagation und
Lernrate · Epoche und Batch · Netztopologien (CNN, RNN/LSTM, Transformer) ·
Entscheidungsbaum (Entropie, Gini, Pruning) · Random Forest · Support Vector
Machine (Hyperplane, Margin, Kernel-Trick) · Clustering (K-Means, Dendrogramm,
Distanzmaße) · Evaluationsmetriken (Accuracy, Precision, Recall, F1 aus der
Confusion Matrix) · Overfitting und Underfitting · symbolische KI und
Expertensysteme · generative KI, LLM, Prompting, Halluzination und RAG ·
Transfer Learning · Diffusionsmodelle · KI im IT-Support · Computer Vision und
NLP · KI als Angriffswerkzeug und Prompt Injection · Ethik, Bias, EU AI Act,
Datenschutz, Energieverbrauch und „human in the loop".

**Vier Rechenaufgaben (Generatoren, neue Zahlen bei jedem Aufruf):**
Neuron vorwärts rechnen und Lernregel · Modell bewerten über die Confusion Matrix
(Accuracy/Precision/Recall/F1) · GPU-Kosten und Trainingsdauer · Nutzen und
Amortisation eines KI-Systems.

**Jahrgangszuordnung** (kumulativ, wie im Bestand): Grundlagen KI/ML/DL,
Perzeptron, Neuron, Lernarten, Clustering und KI in der Prozessanalyse →
**Jahr 1**; SVM, Metriken, Overfitting, CNN/Transformer, GenAI/LLM, RAG, Fallstudien
→ **Jahr 2**; Ethik, Datenschutz, Anwendungsgrenzen, KI-Wirtschaftlichkeit →
**Jahr 3**.

**Qualität (geprüft am 2026-10-08):**

- Qualitätstor `npm run check`: **alle 49 Prüfungen bestanden.**
- Inhaltsanalyse `npm run analyse`: Bereich `ki` mit **111 Einträgen** über alle
  drei Jahre (J1 56 · J2 98 · J3 111), **keine Dubletten** im selben Format,
  **kein doppelter Titel**.
- Teil 1 wächst damit von 325 auf **436 Einträge** (QUIZ 154→204 · KARTEN
  133→177 · LUECKEN 13→18 · FEHLER 5→8 · FAELLE 5→10 · TASKS 15→19).
- **Alle sechs Formate, alle 7 Fallstudien, alle 4 Fehlersuche-Blöcke und alle
  vier Rechenaufgaben im Browser gestartet** – keine Laufzeitfehler; alle
  Generator-Zahlen über 300 Läufe endlich.
- Der neue Bereich erscheint in der Seitenleiste mit dem Hinweis „neu".

### Hinzugefügt — Zweiter Prüfungsteil (AP2), eigene Oberfläche (2026-10-06)

Der Trainer führt ab jetzt **zwei getrennte Prüfungsteile**, zwischen denen der
Nutzer oben links mit der Marke am Wortzeichen umschaltet:

- **Teil 1 (AP1)** — unverändert: derselbe Stoff, dieselben Bereiche und
  Jahrgänge. Kein Bestandseintrag wurde inhaltlich angefasst.
- **Teil 2 (AP2)** — neu: vier Prüfungsbereiche mit eigenem Stoff, eigenem
  Fortschritt und einer Startseite, die den Aufbau der Prüfung erklärt.

**Warum getrennt und nicht in einem Datenbestand mit einem Feld:** Die beiden
Prüfungen haben keine gemeinsamen Themenbereiche; ein gemeinsames b-Feld hätte
die zwölf AP1-Bereiche mit AP2-Begriffen vermischt. Außerdem filtert nur AP1
nach Ausbildungsjahr — AP2 filtert nach Prüfungsbereich. Und ein Fehler in der
einen Datensammlung kann die andere nicht treffen.

**Die Achse von Teil 2** sind die vier Prüfungsbereiche nach der
Ausbildungsordnung — mit ihrem echten Gewicht, nicht als A/B/C abgekürzt:

| Bereich | Form | Zeit | Gewicht |
|---|---|---|---|
| Abwicklung eines Kundenauftrages | Projektarbeit, Doku, Präsentation, Fachgespräch | 40 h + 30 min | **50 %** |
| Einführen einer IT-Systemlösung | schriftlich | 90 min | 10 % |
| Kaufmännische Unterstützungsprozesse | schriftlich | 90 min | 10 % |
| Wirtschafts- und Sozialkunde | schriftlich | 60 min | 10 % |

- **Eigene Marke AP1 / AP2 am Wortzeichen**, die zugleich der Umschalter ist.
  Kein zusätzlicher Knopf in der Wahlreihe; der Wechsel ist immer an derselben
  Stelle und immer sichtbar.
- **Ausbildungsjahr-Knopf in AP2 ausgeblendet** — Teil 2 kennt keine Jahrgänge.
- **Eigene Fortschrittszählung:** Aufgaben-Fortschritt und Serie von AP1 und AP2
  sind getrennt (ap2-Präfix im vorhandenen Speicher, eigener Serienzähler).
  Das Zurücksetzen betrifft nur den offenen Teil.
- **Eigene Quellen-Seite** für Teil 2 (Ausbildungsordnung, IHK-Merkblätter,
  Bewertungskriterien der Projektdokumentation).

**Inhalte Teil 2 (neu formuliert, keine Aufgabe wörtlich übernommen):**
63 Quizfragen · 36 Karteikarten · 5 Lückentexte · 4 Fehlersuche-Blöcke ·
4 Fallstudien (Kundenprojekt, Ausfallsicherung, Investitionsentscheidung,
Ausbildung und Arbeitsrecht) · 10 Rechenaufgaben (Nettokostenvergleich,
Amortisation, Break-even, Zuschlagskalkulation, Abschreibung, Verfügbarkeit,
Subnetting, Backup-Volumen, Make or Buy, Stundensatz).

### Geändert — Werkzeuge

- **Qualitätstor** (tools/pruefe-frontend.mjs): prüft zusätzlich den zweiten
  Prüfungsteil — alle sechs AP2-Sammlungen vorhanden und gefüllt, gültige
  Bereiche, Umschalter und Daten-Funktion im Anwendungscode. Der Vertrag kennt
  jetzt auch TEIL_STORE. **49 Prüfungen**, alle bestanden.
- **Inhaltsanalyse** (tools/analysiere-inhalte.mjs): wertet Teil 1 und Teil 2
  getrennt aus (Teil 2 hat keine Jahrgänge, sondern vier Bereiche). Teil 1:
  325 Einträge, keine Dubletten. Teil 2: 122 Einträge, keine Dubletten,
  Bereiche gleichmäßig belegt.
- **Jeder Eintrag trägt jetzt das Feld t** (ap1 oder ap2). Rein additiv; die
  AP1-Daten selbst sind unverändert.

### Geprüft (2026-10-06)

- Qualitätstor npm run check: **alle 49 Prüfungen bestanden.**
- **Alle sechs Formate in beiden Prüfungsteilen im Browser durchgeklickt** —
  ohne Laufzeitfehler: Rechnen · Quiz · Karteikarten · Lückentexte ·
  Fehlersuche · Fallstudien.
- **Alle 10 AP2- und 15 AP1-Rechenaufgaben** je dreimal erzeugt: jede Antwort
  ist eine endliche Zahl, jede Aufgabe hat Zeilen und Lösungsweg.
- **Mobil (390 × 844):** kein waagerechter Überlauf in irgendeinem Format.



### Geändert — Bildmarke neu gezeichnet (2026-09-30)

- **Neue Bildmarke oben links.** Vorher: dünne Kontur, Eselsohr ohne Fläche, ein
  Haken, der wie ein Häkchen aussah. Jetzt ein **Prüfungsbogen**: gefülltes Blatt,
  umgeknickte Ecke als Ton, gebundener linker Rücken und ein deutlicher
  Korrekturhaken.
- **Warum eigenes Zeichnen statt Download:** Ein Logo von einer Stock-Seite hätte
  eine fremde Lizenz, eine zweite Netzanfrage und würde offline brechen. Die
  Marke ist ein Inline-SVG im Blatt — ohne Namensnennung, ohne Abhängigkeit,
  ohne Kosten, und sie steht in jedem Browser.
- **Jeder Wert kommt aus dem eigenen Farbsystem:** Blatt Weiß mit Tinte-Kontur ·
  Ecke Papier `#EEF1F5` · Haken **Korrektur-Rot `#B32D25`** · Rücken exakt
  **3 px = `--kante`**, dasselbe Maß, das jede Fläche oben trägt und das vor
  jeder Überschrift steht. Die Marke zitiert damit wörtlich das Raster.
- **Rot als Korrekturhaken** ist die semantisch genaueste Verwendung, die diese
  Palette zulässt: Rot heißt im ganzen Blatt ausschließlich Korrektur. Zugleich
  ist es der einzige Farbtupfer in der sonst einfarbigen Kopfzeile — die eine
  Stelle, an der Farbe Aufmerksamkeit bekommt.
- **Geometrie ausgemessen, nicht geschätzt:** Inhalt 18,5 × 17,6 Einheiten im
  24er-Feld, Luft links 2,7 / rechts 2,8 und oben 3,2 / unten 3,2 — die Marke
  steht also mittig, obwohl das Blatt selbst linkslastig sitzt und deshalb
  bewusst nach rechts versetzt wurde.
- **`forced-colors` ergänzt:** Im erzwungenen Farbmodus (Windows hoher Kontrast)
  werden Füllungen verworfen — dann trägt nur noch die Kontur. Blatt, Ecke,
  Rücken und Haken fallen dort auf `Canvas` / `CanvasText` zurück.
- **Nicht mehr mit `currentColor`**, sondern mit benannten Werten: Sonst wäre der
  Haken grau statt rot geworden (der alte Haken nutzte `currentColor`).

### Geändert — Oberfläche, Umbau von Aufbau und Design (2026-09-30)

Rein darstellend. **Keine Aufgabendaten, keine Wege, keine Vertragswerte und
keine Regeln geändert** — der Inhalt und die sechs Formate sind unverändert.

- **Kopfzeile in drei Zonen getrennt.** Vorher lagen Titel, Wahl (Jahr, Profil)
  und Auskunft (Punkte, Quote, Serie) in einer undifferenzierten Reihe; das Auge
  musste über die Knöpfe steigen, um zum Stand zu kommen. Jetzt: links was das
  hier ist, rechts die Wahl, darunter der Stand. Der Speicher-Zustand ist von der
  Unterzeile in eine eigene kleine Zeile über der Wahl gewandert und damit auch
  auf dem Handy sichtbar. Das **Ausbildungsjahr hat einen eigenen Knopf in der
  Kopfzeile** bekommen; es ist die Wahl, die den sichtbaren Stoff bestimmt, und
  stand vorher nur im Menü „Mehr" (dort entfernt — ein Weg, nicht zwei).
- **Ein Fortschrittsmaß statt nur Zahlen.** Neben Punkten, Quote und Serie steht
  jetzt ein Balken mit Viertelmarken („x % bearbeitet") — der Weg ist eine
  Strecke, keine Zahl. Er zählt ausschließlich die Rechenaufgaben des gewählten
  Ausbildungsjahrs; mehr gibt der Vertrag mit zwei Tabellen nicht her.
- **Die Seitenleiste hat vier erkennbare Ebenen.** Vorher waren 43 Einträge
  13,5 px auf 38 px und unterschieden sich nur durch das Zeichen „↳". Jetzt:
  Formate als gerahmter, nummerierter Block · Bereich als Titelzeile (nicht
  anklickbar) · Aufgabe eingerückt mit Fortschrittsmarke · Quiz/Karten zum
  Bereich kleiner und weiter eingerückt, ohne Fortschrittszahl.
- **Drei Flächengewichte statt eines.** Neun Stellen trugen dieselbe Kante
  `border-top:3px solid tinte` — eine Quellenliste wog damit so schwer wie eine
  laufende Rechenaufgabe. Jetzt: ruhige Fläche (Startseite, Quellen), Blatt mit
  Gewichtskante (Kalkulation, Quiz, Karte, Fallstudie, Dialog), streng (rot).
- **Ein wiederkehrendes Zeichen.** Der kurze Querstrich vor einer Abschnitts-
  und Bereichsüberschrift bindet Kopfzeile, Liste und Blatt aneinander.
- **Startseite beginnt mit „Heute lernen"** statt zum dritten Mal den Namen des
  Programms zu wiederholen. Die sechs Formate sind als Wahl gesetzt (Nummer,
  Umfang, Name), nicht als Kartenreihe; das Raster bleibt auch auf dem Handy
  zweispaltig und fällt erst unter 380 px auf eine Spalte.
- **Tippziele mindestens 44 px**, `overscroll-behavior` gegen ungewollte
  Seitwärtsgesten, `theme-color` ergänzt.

### Behoben — Tastaturbedienung

- **Die Seitenleiste hatte keinen sichtbaren Fokusring.** Rund 50 Knöpfe, durch
  die man nur mit Tab kommt, ohne je zu sehen, wo man steht. `.rail-item` und
  `button.akt` haben jetzt `:focus-visible` (nachgeprüft: alle zwölf
  interaktiven Muster der Oberfläche tragen einen Fokusring).
- Die Kopfzeile wuchs mobil auf 234 px, weil der Speicher-Zustand die Knöpfe in
  zwei Reihen drängte. Jetzt stehen die vier Schalter in einer Reihe bei 208 px.

### Hinzugefügt

- **Inhaltsanalyse** `npm run analyse` (`tools/analysiere-inhalte.mjs`).
  Misst Verteilung über Bereiche und Jahre, findet Lücken, ähnliche Paare,
  verdächtig kurze Einträge und wortgleiche Titel. **Lexikalisch, ohne Modell** —
  Begründung in Entscheidung 0011. Läuft ohne Netzwerk, ohne Abhängigkeiten,
  ändert nichts.
- **Qualitätstor** `npm run check` (`.github/workflows/qualitaet.yml`).
  Geprüft werden: HTML-Grundgerüst · genau ein Skript- und Stilblock · **Syntax
  des Anwendungscodes** (echter Parser-Lauf, keine Klammerzählung) · Vertrag mit
  dem Backend (Adresse und vier Speicher-Namen) · Inhaltsbestand und
  Jahrgangs-Regel für alle sechs Formate · Secret-Muster · tote Verweise ·
  `vercel.json`.
- **`tools/pruefe-frontend.mjs`** — die Prüfungen als eigenständiges Skript,
  nur mit Node-Bordmitteln.
- **`package.json`** — es gab keine. Enthält nur die Prüfbefehle.
- **`.gitattributes`** — nagelt LF fest. `index.html` lag im Repository als LF,
  im Arbeitsverzeichnis aber als CRLF, weil `core.autocrlf=true` gesetzt ist.

### Geändert

- Die Signatur der Prüfung korrigiert: Die Einträge werden über die
  **Jahresmarke `j`** gezählt, nicht über öffnende Klammern. Eine Zählung der
  Klammern hätte verschachtelte Objekte mitgezählt und für `FEHLER` und `FAELLE`
  falsche Zahlen gemeldet (63 und 125 statt 5 und 5). Die Zahlen in der
  Dokumentation des Backends sind damit **belegt**, nicht behauptet.
- **Das Tor prüft jetzt die Werkzeuge selbst** (Syntax aller `.mjs` in `tools/`).
  Ein Werkzeug mit Syntaxfehler meldet keinen Fehler — es stürzt ab, und niemand
  merkt es. 34 Prüfungen.

### Befunde der Inhaltsanalyse (Lauf vom 2026-09-29)

- **Keine Lücke:** jeder der 12 Bereiche hat in jedem der 3 Jahre Einträge.
- **Keine Dubletten:** über alle 325 Einträge, 6 Formate, 3 Jahre und 12 Bereiche
  gibt es **keine zwei Einträge im selben Format**, die sich ähnlich sind. Die 12
  gefundenen Paare sind **alle** `QUIZ ↔ KARTEN` — gewollt (derselbe Stoff in zwei
  Abfrageformen).
- **Ein Verdacht:** „Kaufvertrag" erscheint als Quiz in **Jahr 2** und als
  Karteikarte in **Jahr 1** (Ähnlichkeit 71 %, Überdeckung 89 %). Eine der beiden
  Jahresmarken ist wahrscheinlich falsch. Aufgenommen als offene Aufgabe im
  Backend-Repository.
- **Beobachtung:** der Bereich `recht` liegt mit **allen 41** Einträgen in Jahr 1,
  obwohl Datenschutz und IT-Sicherheit laut Rahmenlehrplan erst ab Monat 19 dran
  sind (Jahr 2). Ebenfalls als offene Aufgabe aufgenommen.

### Nicht geändert

- `index.html` und `vercel.json` — dieser Vorgang war das Qualitätstor.
  Am Inhalt, an den Aufgaben und an der Darstellung wurde nichts angefasst.

### Hinzugefügt — Oberfläche (UX/UI-Überarbeitung 2026-09-30)

- **Rückweg zur Übersicht** (`Übersicht` in der Kopfzeile, `btn-uebersicht`).
  Erscheint nur beim Lernen und behält den Fortschritt – im Unterschied zum
  Zurücksetzen. Vorher gab es aus dem Lernfluss nur den Browser-Zurück-Knopf
  oder den prominenten „Fortschritt zurücksetzen".
- **Profil-Knopf in der Kopfzeile** (`btn-profil`). Name und Ausbildungsjahr
  waren auf dem Handy nur über die eingeklappte Seitenleiste erreichbar; jetzt
  steht „Profil: <Name>" immer sichtbar oben, mit `aria-label`.
- **Fortschrittsbalken im Quiz** (`.fortschrittsbalken`) unter dem Quizkopf –
  zeigt die Position in der Runde („Frage 3 von 12"). Der Zähler allein stand
  zu weit weg vom Geschehen.
- **Marken an der Quiz-Auflösung** (`.urteil-marke`): ✓ an der richtigen,
  ✗ an der falsch gewählten Antwort. Die Farbe allein war beim schnellen
  Durchklicken zu schwach.
- **Farbige Erklärungsbox**: grün bei richtiger, rot bei falscher Antwort
  (`#quiz-erklaerung.gut` / `.schlecht`) – vorher immer neutral.
- **Lesehilfe in der Seitenleiste** (`.rail-legende`): erklärt, dass der
  Prozentwert an einem Bereich die AP1-Häufigkeit ist und die Zahl rechts an
  einer Aufgabe der eigene Fortschritt. Beides war leicht zu verwechseln.
- **Aktiv-Markierung** für „↳ Quiz/Karteikarten zu diesem Bereich" in der
  Seitenleiste, wenn genau dieser Bereich läuft.
- **Sichere Ränder auf Geräten mit Notch** über `env(safe-area-inset-*)`
  (`.kopf`, `.blatt`, `.rail`) und `viewport-fit=cover`.

### Geändert — Oberfläche (UX/UI-Überarbeitung 2026-09-30)

- **„Formate 6"** wird jetzt als getrennte Flex-Zeile ausgegeben. Vorher
  entstand im Screenreader und in der Semantik die zusammengeklebte Zeichen-
  kette „Formate6" (die Zahl klebte am Text).
- **Quiz-Knöpfe umbenannt:** „Nächste Frage" → **„Weiter"**, „Neue Fragen" →
  **„Neues Set"**. Die alten Beschriftungen klangen fast gleich.
- **Zurücksetzen-Warnung** nennt jetzt die Folge: „…betrifft alle Aufgaben,
  Quizfragen und Karten dieses Profils und lässt sich nicht rückgängig machen."

### Geändert — Barrierefreiheit und Verweise (2026-09-30, Nachmittag)

- **Seitenleiste ist keine Dokumentgliederung mehr.** Die Bereichsnamen standen
  als `<h2>` in der Navigation. Ein Screenreader las damit zwölf
  Navigationsgruppen als Inhaltsüberschriften vor. Sie sind jetzt `<div
  class="rail-kopf">` mit unveränderter Darstellung; im Navigationsbaum sind
  **0 Überschriften**, vorher 12.
- **Fortschritt wird angesagt, nicht nur gezeigt.** Eine Zahl wie „84“ klang für
  Vorleser wie eine bloße Ziffer. Jeder Eintrag trägt jetzt
  `aria-label="…, 84 Prozent Fortschritt"`, ohne Versuch „…, noch kein Versuch".
- **Position im Baum.** Die Navigation hat
  `aria-label="Aufgabenbereiche – Position 3 von 51"` – ein Anker in einer
  51 Punkte langen Liste.
- **Quiz-Fortschritt live** (`.quiz-fortschritt`): Der Zähler „Frage 3 von 12 ·
  1 richtig“ steht in einer `role="status"`-Fläche und wird nach jeder Antwort
  neu gesetzt. Der Balken allein war für Vorleser unsichtbar.
- **Eigene Bestätigungsfläche statt `confirm()`** (`.bestaetig`, `<dialog>`).
  Betrifft „Fortschritt zurücksetzen“ und „Kartenfortschritt zurücksetzen“.
  Eigener Dialog bringt Fokusfang, Escape und `::backdrop` mit; `confirm()`
  blockiert den Hauptfaden und ist nicht gestaltbar. „Abbrechen“ ist
  vorfokussiert, der Fokus kehrt zum Auslöser zurück.
- **Tippziele auf Fingerbedienung.** `.rail-toggle` und `.heim` waren 33 px hoch
  und lagen unter dem Richtwert von 44 px; sie sind jetzt mindestens 44 px
  (`@media (pointer:coarse)`), Navigationseinträge 38 px, auf Touch 44 px.
- **Reihenfolge auf dem Handy.** Die Lesehilfe schob sich zwischen Kopfzeile und
  ersten Lernschritt; sie steht jetzt am Ende der Leiste (`.rail-legende`,
  `order:9`). Dabei einen Spezifitätsfehler behoben: `body.rail-offen .rail`
  überschrieb das nötige `display:flex`.

### Hinzugefügt — Verweise auf einen Bereich (2026-09-30, Nachmittag)

- **`?bereich=<id>` in der Adresse.** Ein Link zeigt direkt in einen Bereich:
  `…/?bereich=netzwerk` öffnet das Quiz zur Netzwerktechnik. Der Parameter wird
  über `history.replaceState` gepflegt — kein Neuladen, der Zurück-Knopf bleibt
  innerhalb des Trainers nutzbar, und ein Lesezeichen landet wieder im richtigen
  Bereich (`adresseSetzen`, `starteBereich`).
- **Gemerkter Wunsch über die Anmeldung hinweg** (`wunschBereich`). Wer einen
  Bereichslink öffnet und noch kein Profil hat, sieht erst die Anmeldung und
  landet danach trotzdem im gewünschten Bereich. Ohne dieses Merken liefe ein
  geteilter Link ins Leere.
- Einstieg wählt automatisch die passende Form: Quiz, wenn es Fragen zum Bereich
  gibt, sonst die erste Rechenaufgabe des Bereichs.

**Bewusst nicht** in die Adresse aufgenommen: die einzelnen Aufgaben. Sie werden
bei jedem Aufruf neu erzeugt und sind damit nicht verlinkbar — ein Nachbau der
Oberfläche in der Adresse wäre irreführend.

### Geprüft (2026-09-30)

- Qualitätstor `npm run check`: **alle 34 Prüfungen bestanden.** Der Vertrag
  (`API`, `STORE`, `JAHR_STORE`, `PROFIL_STORE`, `KARTEN_STORE`) blieb unverändert.
- **Alle sechs Formate am Handy (390 × 844) durchgeklickt** — kein waagerechter
  Überlauf (`scrollWidth` bleibt 390 px):
  Rechnen · Quiz · Karteikarten · Lückentexte · Fehlersuche · Fallstudien.
- Interaktionen geprüft: Quiz antworten und weiterblättern (Zähler zählt mit),
  Karte umdrehen, Lückentext prüfen, Fehlersuche markieren, Rechnung prüfen und
  Lösungsweg anzeigen, Fallstudie auswählen.

## [1.0.0] — bis 2026-09-29

### Hinzugefügt

- Oberfläche mit sechs Formaten: Quiz (154), Karteikarten (133), Lückentexte (13),
  Fehlersuche (5), Fallstudien (5), Rechenaufgaben (15) — zusammen 325 Einträge.
- **Jahrgangs-System:** ein Feld `j` je Eintrag, kumulative Sicht (Jahr 1 → Jahr 2
  → Prüfung), Auswahl beim ersten Start, „Jahr wechseln" in der Seitenleiste.
- **Info-Button** an jeder Aufgabe — erklärt die Aufgabe, nicht die Lösung.
- **Profile und Fortschritt** über ein eigenes Backend auf dem Hetzner-Server.
  Der Fortschritt überlebt einen Rechnerwechsel.
- Rückfallweg: Antwortet der Server nicht, bleibt der Fortschritt im Browser
  liegen und wird später nachgereicht.
