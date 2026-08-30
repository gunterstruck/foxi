/**
 * Der Zustand von Foxi: einmal aus der Datenbank gelesen, im Speicher
 * gehalten, bei jeder Änderung zurückgeschrieben.
 *
 * Warum eine Kopie im Speicher? Der Katalog hat rund 480 Artikel, und die
 * Kachelwand wird bei jedem Tipp neu sortiert. Ein IndexedDB-Lauf pro
 * Bildaufbau wäre auf einem älteren Telefon sichtbar. Geschrieben wird
 * trotzdem sofort – wer im Laden abhakt, darf die App jederzeit wegwischen.
 */

import * as db from './db.js';

const zuhoerer = new Set();

export const zustand = {
    artikel: new Map(),      // id → { id, name, kategorieId, icon, zaehler, letzteKaeufe[] }
    kategorien: [],          // [{ id, name, icon, position }]
    liste: new Map(),        // artikelId → { artikelId, menge, notiz, erledigt, erledigtAm }
    rezepte: [],             // [{ id, name, artikelIds[] }]
    einstellungen: { modus: 'basis' },
    bereit: false
};

/** Änderungen anmelden. Gibt eine Funktion zum Abmelden zurück. */
export function beiAenderung(rueckruf) {
    zuhoerer.add(rueckruf);
    return () => zuhoerer.delete(rueckruf);
}

function melde(grund) {
    for (const rueckruf of zuhoerer) rueckruf(grund);
}

/* ────────────────────────────────────────────────────────────────────────
   Start
   ──────────────────────────────────────────────────────────────────────── */

/**
 * Erststart: Katalog und Beispielrezepte aus den mitgelieferten JSON-Dateien
 * in die Datenbank legen. Danach werden diese Dateien nie wieder gelesen –
 * ab dem zweiten Start läuft Foxi ohne eine einzige Anfrage.
 */
async function erstbefuellung(basisPfad) {
    const [katalog, rezepte] = await Promise.all([
        fetch(`${basisPfad}src/daten/katalog.json`).then((a) => a.json()),
        fetch(`${basisPfad}src/daten/rezepte.json`).then((a) => a.json())
    ]);

    const artikel = katalog.artikel.map((a) => ({
        id: a.id,
        name: a.name,
        kategorieId: a.kategorieId,
        icon: a.icon,
        zaehler: 0,
        letzteKaeufe: [],
        eigen: false
    }));

    await db.legeViele(db.SPEICHER.KATEGORIEN, katalog.kategorien);
    await db.legeViele(db.SPEICHER.ARTIKEL, artikel);
    await db.legeViele(db.SPEICHER.REZEPTE, rezepte.rezepte);
    await db.lege(db.SPEICHER.EINSTELLUNGEN, { schluessel: 'modus', wert: 'basis' });
    await db.lege(db.SPEICHER.EINSTELLUNGEN, { schluessel: 'katalogVersion', wert: katalog.version });
}

export async function starte(basisPfad = './') {
    let kategorien = await db.alle(db.SPEICHER.KATEGORIEN);
    if (kategorien.length === 0) {
        await erstbefuellung(basisPfad);
        kategorien = await db.alle(db.SPEICHER.KATEGORIEN);
    }

    const [artikel, liste, rezepte, einstellungen] = await Promise.all([
        db.alle(db.SPEICHER.ARTIKEL),
        db.alle(db.SPEICHER.LISTE),
        db.alle(db.SPEICHER.REZEPTE),
        db.alle(db.SPEICHER.EINSTELLUNGEN)
    ]);

    zustand.kategorien = kategorien.sort((a, b) => a.position - b.position);
    zustand.artikel = new Map(artikel.map((a) => [a.id, a]));
    zustand.liste = new Map(liste.map((e) => [e.artikelId, e]));
    zustand.rezepte = rezepte;
    for (const eintrag of einstellungen) zustand.einstellungen[eintrag.schluessel] = eintrag.wert;
    if (zustand.einstellungen.modus !== 'experte') zustand.einstellungen.modus = 'basis';
    zustand.bereit = true;
    melde('start');
}

/* ────────────────────────────────────────────────────────────────────────
   Liste
   ──────────────────────────────────────────────────────────────────────── */

export function aufDerListe(artikelId) {
    return zustand.liste.has(artikelId);
}

export function offeneEintraege() {
    return [...zustand.liste.values()].filter((e) => !e.erledigt);
}

export function erledigteEintraege() {
    return [...zustand.liste.values()]
        .filter((e) => e.erledigt)
        .sort((a, b) => (b.erledigtAm || 0) - (a.erledigtAm || 0));
}

export async function aufListeSetzen(artikelId) {
    if (!zustand.artikel.has(artikelId)) return null;
    const eintrag = { artikelId, menge: '', notiz: '', erledigt: false, erledigtAm: null };
    zustand.liste.set(artikelId, eintrag);
    await db.lege(db.SPEICHER.LISTE, eintrag);
    melde('liste');
    return eintrag;
}

export async function vonListeNehmen(artikelId) {
    if (!zustand.liste.has(artikelId)) return;
    zustand.liste.delete(artikelId);
    await db.loesche(db.SPEICHER.LISTE, artikelId);
    melde('liste');
}

/** Kachel im Katalog: drauf oder runter. Ein Tipp, zwei Richtungen. */
export async function umschalten(artikelId) {
    if (aufDerListe(artikelId)) {
        await vonListeNehmen(artikelId);
        return false;
    }
    await aufListeSetzen(artikelId);
    return true;
}

/**
 * Abhaken – der einzige Ort, an dem Foxi etwas lernt.
 *
 * Der Zeitstempel wandert in `letzteKaeufe` des Artikels; daraus speist sich
 * die Reihenfolge im Katalog. Die Historie wird bei 60 Einträgen gekappt:
 * Was zwei Jahre zurückliegt, wiegt nach der Halbwertszeit ohnehin nichts
 * mehr, kostet aber Platz in jeder Sicherung.
 */
export async function abhaken(artikelId) {
    const eintrag = zustand.liste.get(artikelId);
    const artikel = zustand.artikel.get(artikelId);
    if (!eintrag || !artikel || eintrag.erledigt) return;

    const jetzt = Date.now();
    eintrag.erledigt = true;
    eintrag.erledigtAm = jetzt;
    artikel.letzteKaeufe = [...(artikel.letzteKaeufe || []), jetzt].slice(-60);
    artikel.zaehler = (artikel.zaehler || 0) + 1;

    await Promise.all([
        db.lege(db.SPEICHER.LISTE, eintrag),
        db.lege(db.SPEICHER.ARTIKEL, artikel)
    ]);
    melde('abhaken');
}

/** Rückgängig: der Zeitstempel dieses Abhakens verschwindet wieder. */
export async function zurueckholen(artikelId) {
    const eintrag = zustand.liste.get(artikelId);
    const artikel = zustand.artikel.get(artikelId);
    if (!eintrag || !artikel || !eintrag.erledigt) return;

    const zeitpunkt = eintrag.erledigtAm;
    eintrag.erledigt = false;
    eintrag.erledigtAm = null;
    if (zeitpunkt) {
        const stelle = (artikel.letzteKaeufe || []).lastIndexOf(zeitpunkt);
        if (stelle >= 0) artikel.letzteKaeufe.splice(stelle, 1);
        artikel.zaehler = Math.max(0, (artikel.zaehler || 1) - 1);
    }

    await Promise.all([
        db.lege(db.SPEICHER.LISTE, eintrag),
        db.lege(db.SPEICHER.ARTIKEL, artikel)
    ]);
    melde('liste');
}

export async function erledigteAufraeumen() {
    const erledigte = erledigteEintraege();
    for (const eintrag of erledigte) zustand.liste.delete(eintrag.artikelId);
    await Promise.all(erledigte.map((e) => db.loesche(db.SPEICHER.LISTE, e.artikelId)));
    melde('liste');
    return erledigte.length;
}

export async function listeLeeren() {
    zustand.liste.clear();
    await db.leere(db.SPEICHER.LISTE);
    melde('liste');
}

/** Menge und Notiz (Experte). Leere Zeichenketten bleiben leer, nicht `null` –
 *  so muss die Oberfläche nie zwei Abwesenheiten unterscheiden. */
export async function eintragAendern(artikelId, felder) {
    const eintrag = zustand.liste.get(artikelId);
    if (!eintrag) return;
    if ('menge' in felder) eintrag.menge = String(felder.menge || '').trim();
    if ('notiz' in felder) eintrag.notiz = String(felder.notiz || '').trim();
    await db.lege(db.SPEICHER.LISTE, eintrag);
    melde('liste');
}

/* ────────────────────────────────────────────────────────────────────────
   Artikel
   ──────────────────────────────────────────────────────────────────────── */

/** Eigener Artikel – der Ausnahmefall, wenn der Katalog etwas nicht kennt. */
export async function artikelAnlegen(name, kategorieId, icon = '🛒') {
    const sauber = String(name || '').trim();
    if (!sauber) return null;
    const id = `eigen-${Date.now().toString(36)}`;
    const artikel = {
        id,
        name: sauber,
        kategorieId: kategorieId || 'sonstiges',
        icon,
        zaehler: 0,
        letzteKaeufe: [],
        eigen: true
    };
    zustand.artikel.set(id, artikel);
    await db.lege(db.SPEICHER.ARTIKEL, artikel);
    melde('artikel');
    return artikel;
}

export function alleArtikel() {
    return [...zustand.artikel.values()];
}

/* ────────────────────────────────────────────────────────────────────────
   Einstellungen
   ──────────────────────────────────────────────────────────────────────── */

export function modus() {
    return zustand.einstellungen.modus;
}

export function istExperte() {
    return zustand.einstellungen.modus === 'experte';
}

/**
 * Umschalten zwischen Basis und Experte.
 *
 * Verlustfrei, und zwar wörtlich: Der Schalter berührt nur diesen einen Wert.
 * Mengen und Notizen, die im Expertenmodus entstanden sind, bleiben in der
 * Datenbank stehen und tauchen unverändert wieder auf – Basis zeigt sie nur
 * nicht an.
 */
export async function modusSetzen(neuerModus) {
    const wert = neuerModus === 'experte' ? 'experte' : 'basis';
    zustand.einstellungen.modus = wert;
    await db.lege(db.SPEICHER.EINSTELLUNGEN, { schluessel: 'modus', wert });
    melde('modus');
}

/** Kategorie-Reihenfolge (Experte). */
export async function kategorienNeuOrdnen(idsInReihenfolge) {
    const nachId = new Map(zustand.kategorien.map((k) => [k.id, k]));
    const neu = [];
    idsInReihenfolge.forEach((id, position) => {
        const kategorie = nachId.get(id);
        if (kategorie) { kategorie.position = position; neu.push(kategorie); nachId.delete(id); }
    });
    let position = neu.length;
    for (const rest of nachId.values()) { rest.position = position++; neu.push(rest); }
    zustand.kategorien = neu;
    await db.legeViele(db.SPEICHER.KATEGORIEN, neu);
    melde('kategorien');
}

export async function allesZuruecksetzen() {
    await db.loescheDatenbank();
    zustand.artikel.clear();
    zustand.liste.clear();
    zustand.kategorien = [];
    zustand.rezepte = [];
    zustand.einstellungen = { modus: 'basis' };
    zustand.bereit = false;
}
