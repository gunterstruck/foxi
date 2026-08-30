/**
 * Alle sichtbaren Texte an einem Ort.
 *
 * Foxi spricht Deutsch. Eine Übersetzung ist heute nicht gebaut – aber sie
 * soll später keine Suche durch dreißig Dateien werden. Deshalb steht hier
 * jeder Satz, den ein Mensch zu sehen bekommt, und nirgendwo sonst.
 *
 * Eine Ausnahme, bewusst: „Foxi" wird nicht übersetzt. Der Name ist der Name.
 */

export const SPRACHE = 'de';

const DE = {
    app: {
        name: 'Foxi',
        anspruch: 'Einkauf',
        titel: 'Foxi – Einkaufsliste'
    },

    tiefe: {
        basis: '🌱 Basis',
        experte: '🛠️ Experte',
        beschriftung: 'Ansichtstiefe wählen',
        hinweis: 'Basis zeigt nur Liste und Katalog · Experte blendet zusätzliche Angaben ein',
        gewechseltZuBasis: 'Basis. Nichts geht verloren – es wird nur weniger angezeigt.',
        /* Der Satz nennt nur, was es schon gibt. Rezepte, Teilen und Statistik
           kommen dazu, sobald sie gebaut sind – bis dahin verspricht der
           Schalter sie nicht. */
        gewechseltZuExperte: 'Experte. Mengen und Notizen sind jetzt da.'
    },

    bereiche: {
        liste: 'Liste',
        katalog: 'Katalog',
        mehr: 'Mehr',
        beschriftung: 'Bereiche'
    },

    liste: {
        titel: 'Einkaufsliste',
        leerTitel: 'Noch nichts auf der Liste',
        leerText: 'Tipp im Katalog auf eine Kachel – der Artikel steht sofort hier.',
        leerKnopf: 'Zum Katalog',
        erledigt: 'Erledigt',
        erledigtAufraeumen: 'Erledigte entfernen',
        erledigteEntfernt: 'Erledigte entfernt',
        abgehakt: (name) => `${name} abgehakt`,
        zurueckgeholt: (name) => `${name} zurück auf der Liste`,
        entfernt: (name) => `${name} entfernt`,
        offeneAnzahl: (n) => (n === 1 ? '1 Artikel offen' : `${n} Artikel offen`),
        artikelEntfernen: 'Von der Liste nehmen',
        /* Für Vorlesehilfen: Die Zeile ist ein Knopf, und was er tut, hängt
           davon ab, ob der Artikel schon abgehakt ist. */
        stimmeOffen: (name) => `${name} – antippen zum Abhaken`,
        stimmeErledigt: (name) => `${name} – erledigt, antippen zum Zurückholen`,
        stimmeMenge: (name) => `Menge und Notiz für ${name}`
    },

    katalog: {
        titel: 'Katalog',
        suche: 'Artikel suchen…',
        sucheBeschriftung: 'Im Katalog suchen',
        oftGebraucht: 'Oft gebraucht',
        keinTreffer: 'Nichts gefunden.',
        keinTrefferAnlegen: (name) => `„${name}" anlegen`,
        angelegt: (name) => `${name} angelegt und auf der Liste`,
        hinzugefuegt: (name) => `${name} auf der Liste`,
        entfernt: (name) => `${name} von der Liste genommen`,
        aufDerListe: 'auf der Liste'
    },

    mehr: {
        titel: 'Mehr',
        ueberTitel: 'Über Foxi',
        ueberText:
            'Foxi ist eine Einkaufsliste für den Haushalt. Alles, was du eingibst, ' +
            'bleibt auf diesem Gerät: kein Konto, kein Login, keine Cloud, keine Werbung, ' +
            'keine Auswertung. Foxi funktioniert ohne Internet.',
        datenTitel: 'Deine Daten',
        listeLeeren: 'Liste leeren',
        listeLeerenFrage: 'Alle Artikel von der Liste nehmen?',
        listeGeleert: 'Liste ist leer',
        allesZuruecksetzen: 'Foxi zurücksetzen',
        allesZuruecksetzenFrage:
            'Liste, Kaufhistorie und eigene Artikel löschen und den Katalog neu aufsetzen?',
        allesZurueckgesetzt: 'Foxi ist zurückgesetzt',
        version: (v) => `Version ${v}`,
        lizenz: 'MIT-Lizenz · frei zu benutzen und weiterzugeben'
    },

    menge: {
        beschriftung: 'Menge',
        platzhalter: 'z. B. 1 kg',
        notizBeschriftung: 'Notiz',
        notizPlatzhalter: 'z. B. die kleinen',
        fertig: 'Fertig'
    },

    allgemein: {
        abbrechen: 'Abbrechen',
        schliessen: 'Schließen',
        rueckgaengig: 'Rückgängig',
        laedt: 'Foxi startet…'
    }
};

const KATALOGE = { de: DE };

/**
 * Text holen. `t('liste.leerTitel')`.
 * Funktionen im Katalog werden mit den übergebenen Argumenten aufgerufen:
 * `t('liste.abgehakt', 'Milch')`.
 */
export function t(pfad, ...werte) {
    const wurzel = KATALOGE[SPRACHE] || DE;
    let wert = wurzel;
    for (const teil of pfad.split('.')) {
        if (wert == null) break;
        wert = wert[teil];
    }
    if (wert == null) return pfad;
    return typeof wert === 'function' ? wert(...werte) : wert;
}

export default DE;
