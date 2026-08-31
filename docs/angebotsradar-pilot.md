# Angebotsradar-Pilot ausprobieren

Der Pilot prüft eine einzige Frage:

> Findet ein wiederkehrender Recherche-Agent verlässlich die Angebote, die zu
> den Gewohnheiten eines Haushalts passen?

Er ist bewusst noch keine automatische Händleranbindung. EinkaufsFuchs ruft
keine Händlerseite auf und sendet keine Daten. Der Mensch kopiert einen
Auftrag zu einem frei gewählten Agenten und fügt dessen Ergebnis wieder ein.

## Was im Demo-Profil steht

- Region `45136 Essen`
- zwei ALDI-Nord-Filialen in Essen
- ein REWE-Markt in Essen-Bergerhausen
- eine ALDI-Süd-Filiale in Mülheim an der Ruhr
- 15 erfundene, alltägliche Stammartikel mit groben Gewichten

Die Kaufgewohnheiten sind vollständig erfunden. Eine Wohnadresse steht weder
im Auftrag noch im Repository. Die Region und die ausgewählten Märkte reichen
für den Angebotsabgleich aus.

## Einmal manuell testen

1. EinkaufsFuchs öffnen und auf **Experte** schalten.
2. Unter **Mehr → Angebotsradar – Versuch** auf
   **Demo-Auftrag kopieren** tippen.
3. Den Text in Claude Cowork oder einen anderen recherchefähigen Agenten
   einfügen und ausführen lassen.
4. Der Auftrag verlangt ausschließlich JSON. Den gesamten JSON-Text kopieren.
5. In EinkaufsFuchs auf **Ergebnis einfügen** tippen, einsetzen und
   **Angebote übernehmen** wählen.
6. Aktuell gültige Treffer erscheinen direkt in derselben Karte.

Alternativ kann der Agent das JSON als Datei speichern. Diese wird über
**Ergebnisdatei einlesen** übernommen.

## Als wiederkehrende Claude-Aufgabe

Claude Cowork unterstützt geplante Aufgaben. Der einmal kopierte Auftrag kann
als wöchentliche Aufgabe gespeichert werden, beispielsweise montagmorgens.

Der reine Web-Auftrag kann remote laufen. Soll Claude das Ergebnis dagegen in
einen lokalen Ordner auf dem Mac schreiben, muss die Aufgabe lokal laufen und
der Rechner mit Claude Desktop erreichbar sein. Anthropic beschreibt die
jeweils aktuelle Funktionsweise hier:

https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork

Empfohlene erste Einstellung:

- Name: `Foxi-Angebotsradar – Wochenangebote`
- Rhythmus: wöchentlich, Montagmorgen
- Freigabemodus: Änderungen und externe Aktionen bestätigen lassen
- Auftrag: unverändert aus EinkaufsFuchs übernehmen

## Warum das Ergebnis streng geprüft wird

EinkaufsFuchs nimmt nur Dateien mit der Kennung `foxi-angebote`, Version 1,
an. Jeder Treffer muss unter anderem enthalten:

- Foxi-Artikel und konkretes Händlerprodukt
- Händler und Markt
- Preis, Packungsgröße und Grundpreis
- Beginn und Ende der Gültigkeit
- Kennzeichnung als genauer Treffer oder Alternative
- eine öffentliche HTTPS-Quelle von `aldi-nord.de`, `aldi-sued.de` oder
  `rewe.de`

Freier Text, fremde Quellen, ungültige Preise und widersprüchliche
Gültigkeitsdaten werden nicht übernommen. Alle sichtbaren Inhalte werden als
Text eingesetzt; importiertes HTML wird niemals ausgeführt.

## Was der Pilot ausdrücklich noch nicht beweist

Ein Wochenangebot ist nicht automatisch der günstigste Gesamtpreis. Für einen
echten Preisvergleich wären auch reguläre Preise, unterschiedliche Marken,
Packungsgrößen sowie App- und Couponbedingungen zu berücksichtigen.

Der Pilot sagt deshalb nur:

> Diese für dich interessanten Artikel wurden aktuell als Angebote gefunden.

Er sagt nicht:

> Dieser Händler ist garantiert am günstigsten.

