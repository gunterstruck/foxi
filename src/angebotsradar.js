/**
 * Der Angebotsradar-Pilot: ein klar abgegrenzter Versuch zwischen Foxis
 * lokalem Gedächtnis und einem frei gewählten Recherche-Agenten.
 *
 * Foxi ruft selbst keine Händlerseite auf. Es erzeugt nur einen Auftrag und
 * nimmt später ein streng geprüftes Ergebnis entgegen. Das Demo-Profil trägt
 * erfundene Kaufgewohnheiten; der echte Wohnort gehört nicht in ein
 * öffentliches Repository. Für regionale Angebote genügen PLZ/Ort und die
 * ausgewählten Märkte.
 */

export const ANGEBOTSPROFIL_TYP = 'foxi-angebotsprofil';
export const ANGEBOTSPROFIL_VERSION = 1;
export const ANGEBOTSERGEBNIS_TYP = 'foxi-angebote';
export const ANGEBOTSERGEBNIS_VERSION = 1;

const OFFIZIELLE_HOSTS = ['aldi-nord.de', 'aldi-sued.de', 'rewe.de'];
const TREFFERARTEN = new Set(['genau', 'alternative']);

const DEMO_MAERKTE = [
    {
        id: 'aldi-nord-schuermannstrasse',
        haendler: 'ALDI Nord',
        markt: 'Schürmannstraße 43b, 45136 Essen',
        angebotsseite: 'https://www.aldi-nord.de/angebote.html'
    },
    {
        id: 'aldi-nord-steeler-strasse',
        haendler: 'ALDI Nord',
        markt: 'Steeler Straße 187, 45138 Essen',
        angebotsseite: 'https://www.aldi-nord.de/angebote.html'
    },
    {
        id: 'rewe-rellinghauser-strasse',
        haendler: 'REWE',
        markt: 'Rellinghauser Straße 239, 45136 Essen',
        angebotsseite:
            'https://www.rewe.de/marktseite/essen-bergerhausen/1940413/rewe-markt-rellinghauser-str-239/'
    },
    {
        id: 'aldi-sued-humboldtring',
        haendler: 'ALDI Süd',
        markt: 'Humboldtring 5, 45472 Mülheim an der Ruhr',
        angebotsseite: 'https://www.aldi-sued.de/angebote'
    }
];

/* Erfunden, aber absichtlich alltäglich. Die Zahlen sind keine vorgetäuschte
 * Historie, sondern nur Gewichte für den ersten Praxisversuch. */
const DEMO_ARTIKEL = [
    ['milch', 'Milch', 'oft', 18],
    ['kaffeebohnen', 'Kaffeebohnen', 'oft', 14],
    ['butter', 'Butter', 'oft', 12],
    ['eier', 'Eier', 'oft', 11],
    ['vollkornbrot', 'Vollkornbrot', 'oft', 10],
    ['gouda', 'Gouda', 'regelmäßig', 9],
    ['naturjoghurt', 'Naturjoghurt', 'regelmäßig', 9],
    ['spaghetti', 'Spaghetti', 'regelmäßig', 8],
    ['aepfel', 'Äpfel', 'regelmäßig', 8],
    ['bananen', 'Bananen', 'regelmäßig', 7],
    ['tomaten', 'Tomaten', 'regelmäßig', 6],
    ['mineralwasser', 'Mineralwasser', 'regelmäßig', 6],
    ['toilettenpapier', 'Toilettenpapier', 'gelegentlich', 5],
    ['waschmittel', 'Waschmittel', 'gelegentlich', 4],
    ['olivenoel', 'Olivenöl', 'gelegentlich', 4]
].map(([id, name, haeufigkeit, gewicht]) => ({ id, name, haeufigkeit, gewicht }));

export function demoAngebotsprofil(datum = new Date()) {
    return {
        typ: ANGEBOTSPROFIL_TYP,
        version: ANGEBOTSPROFIL_VERSION,
        profilId: 'demo-45136-essen',
        demo: true,
        erzeugt: datum.toISOString(),
        region: '45136 Essen',
        hinweis:
            'Alle Kaufgewohnheiten sind erfunden. Die Wohnadresse ist nicht Bestandteil dieses Profils.',
        maerkte: DEMO_MAERKTE.map((markt) => ({ ...markt })),
        artikel: DEMO_ARTIKEL.map((artikel) => ({ ...artikel }))
    };
}

/**
 * Ein Auftrag statt freier Prosa. Der Agent bekommt seinen Eingabevertrag,
 * die erlaubten Quellen und den Ausgabevertrag in einem Block. Dadurch kann
 * derselbe Text manuell oder als wiederkehrende Cowork-Aufgabe laufen.
 */
export function alsAngebotsauftrag(profil = demoAngebotsprofil()) {
    const beispiel = {
        typ: ANGEBOTSERGEBNIS_TYP,
        version: ANGEBOTSERGEBNIS_VERSION,
        profilId: profil.profilId,
        demo: Boolean(profil.demo),
        erzeugt: 'ISO-8601-Zeitpunkt',
        angebote: [
            {
                artikelId: 'milch',
                artikelName: 'Milch',
                haendler: 'ALDI Nord',
                markt: 'Schürmannstraße 43b, 45136 Essen',
                produkt: 'Vollständiger Produktname',
                preis: 0.99,
                waehrung: 'EUR',
                menge: '1 l',
                grundpreis: '0,99 €/l',
                gueltigVon: 'JJJJ-MM-TT',
                gueltigBis: 'JJJJ-MM-TT',
                treffer: 'genau',
                hinweis: '',
                quelle: 'https://www.aldi-nord.de/angebote.html'
            }
        ]
    };

    return [
        'WÖCHENTLICHER FOXI-ANGEBOTSRADAR',
        '',
        'Aufgabe:',
        'Prüfe die aktuell gültigen und bereits veröffentlichten Wochenangebote der unten genannten Märkte.',
        'Suche ausschließlich nach Angeboten, die zu den Artikeln im Profil passen. Andere Angebote verwerfen.',
        '',
        'Regeln:',
        '1. Verwende nur öffentlich erreichbare, offizielle Seiten von aldi-nord.de, aldi-sued.de und rewe.de.',
        '2. Keine Anmeldung, keine App-Coupons hinter Login und keine Umgehung technischer Sperren.',
        '3. Ordne nur plausible Treffer zu. Eine andere Marke ist erlaubt, muss aber als „alternative“ markiert werden.',
        '4. Übernimm Preis, Packungsgröße, Grundpreis, Gültigkeit und konkrete Quelle. Nichts erfinden.',
        '5. Falls kein passendes Angebot existiert, gib eine leere Angebotsliste zurück.',
        '6. Antworte ausschließlich mit gültigem JSON – ohne Markdown, Einleitung oder Nachsatz.',
        '',
        'Ausgabeformat:',
        JSON.stringify(beispiel, null, 2),
        '',
        'Eingabeprofil:',
        JSON.stringify(profil, null, 2)
    ].join('\n');
}

function istText(wert, max = 300) {
    return typeof wert === 'string' && wert.trim().length > 0 && wert.length <= max;
}

function istDatum(wert) {
    return /^\d{4}-\d{2}-\d{2}$/.test(wert) && !Number.isNaN(Date.parse(`${wert}T00:00:00Z`));
}

function lokalerTag(datum) {
    const zwei = (wert) => String(wert).padStart(2, '0');
    return `${datum.getFullYear()}-${zwei(datum.getMonth() + 1)}-${zwei(datum.getDate())}`;
}

function istOffizielleQuelle(wert) {
    try {
        const adresse = new URL(wert);
        if (adresse.protocol !== 'https:') return false;
        return OFFIZIELLE_HOSTS.some(
            (host) => adresse.hostname === host || adresse.hostname.endsWith(`.${host}`)
        );
    } catch {
        return false;
    }
}

function istAngebotGueltig(angebot) {
    if (!angebot || typeof angebot !== 'object') return false;
    if (!istText(angebot.artikelId, 100) || !istText(angebot.artikelName, 120)) return false;
    if (!istText(angebot.haendler, 80) || !istText(angebot.markt, 200)) return false;
    if (!istText(angebot.produkt, 240)) return false;
    if (!Number.isFinite(angebot.preis) || angebot.preis <= 0 || angebot.preis > 100000) return false;
    if (angebot.waehrung !== 'EUR') return false;
    if (!istText(angebot.menge, 80) || !istText(angebot.grundpreis, 100)) return false;
    if (!istDatum(angebot.gueltigVon) || !istDatum(angebot.gueltigBis)) return false;
    if (angebot.gueltigVon > angebot.gueltigBis) return false;
    if (!TREFFERARTEN.has(angebot.treffer)) return false;
    if (typeof angebot.hinweis !== 'string' || angebot.hinweis.length > 300) return false;
    return istOffizielleQuelle(angebot.quelle);
}

export function pruefeAngebotsergebnis(daten) {
    if (!daten || typeof daten !== 'object') return { gueltig: false, grund: 'kaputt' };
    if (daten.typ !== ANGEBOTSERGEBNIS_TYP) return { gueltig: false, grund: 'fremd' };
    const version = Number(daten.version);
    if (Number.isInteger(version) && version > ANGEBOTSERGEBNIS_VERSION) {
        return { gueltig: false, grund: 'zuNeu' };
    }
    if (!Number.isInteger(version) || version < 1) return { gueltig: false, grund: 'kaputt' };
    if (!istText(daten.profilId, 100) || !istText(daten.erzeugt, 80) ||
        Number.isNaN(Date.parse(daten.erzeugt)) || typeof daten.demo !== 'boolean') {
        return { gueltig: false, grund: 'kaputt' };
    }
    if (!Array.isArray(daten.angebote) || daten.angebote.length > 200) {
        return { gueltig: false, grund: 'kaputt' };
    }
    if (!daten.angebote.every(istAngebotGueltig)) return { gueltig: false, grund: 'kaputt' };
    return { gueltig: true, grund: null };
}

export function aktiveAngebote(daten, heute = new Date()) {
    if (!pruefeAngebotsergebnis(daten).gueltig) return [];
    const tag = lokalerTag(heute);
    return daten.angebote
        .filter((angebot) => angebot.gueltigVon <= tag && angebot.gueltigBis >= tag)
        .sort((a, b) => a.artikelName.localeCompare(b.artikelName, 'de') || a.preis - b.preis);
}

export function preisDeutsch(wert) {
    return `${Number(wert).toFixed(2).replace('.', ',')} €`;
}
