/**
 * Bildschirm 1: die Liste.
 *
 * Nach Kategorie gruppiert, in der eingestellten Reihenfolge. Ein Tipp auf
 * eine Zeile hakt ab; ein Tipp auf eine abgehakte Zeile holt sie zurück.
 * Mehr Gesten gibt es nicht – kein Wischen, kein langes Drücken, kein
 * Kontextmenü. Wer im Laden steht, soll nicht raten müssen.
 */

import { t } from '../texte.js';
import { gruppiereListe } from '../logik.js';
import { angeboteFuerArtikel, preisDeutsch } from '../angebotsradar.js';
import {
    zustand, offeneEintraege, erledigteEintraege, abhaken, zurueckholen,
    erledigteAufraeumen, eintragAendern, istExperte, angebotsergebnis
} from '../zustand.js';
import { melde, zeigeBereich } from './schale.js';

let behaelter = null;
/** Kennung des Eintrags, dessen Menge/Notiz gerade offen ist (Experte). */
let offenerEditor = null;

export function listeVerdrahten() {
    behaelter = document.getElementById('liste-inhalt');
}

export function zeichneListe() {
    if (!behaelter) return;
    behaelter.textContent = '';

    const offen = offeneEintraege();
    const erledigt = erledigteEintraege();

    if (offen.length === 0 && erledigt.length === 0) {
        behaelter.append(leererZustand());
        return;
    }

    const gruppen = gruppiereListe(offen, zustand.artikel, zustand.kategorien);
    for (const gruppe of gruppen) behaelter.append(gruppeZeichnen(gruppe));

    if (erledigt.length > 0) behaelter.append(erledigtBlock(erledigt));
}

function leererZustand() {
    const block = document.createElement('div');
    block.className = 'leer';

    const icon = document.createElement('div');
    icon.className = 'leer-icon';
    icon.textContent = '🧺';

    const titel = document.createElement('h2');
    titel.textContent = t('liste.leerTitel');

    const text = document.createElement('p');
    text.textContent = t('liste.leerText');

    const knopf = document.createElement('button');
    knopf.type = 'button';
    knopf.className = 'primary';
    knopf.textContent = t('liste.leerKnopf');
    knopf.addEventListener('click', () => zeigeBereich('katalog'));

    block.append(icon, titel, text, knopf);
    return block;
}

function gruppeZeichnen(gruppe) {
    const block = document.createElement('section');
    block.className = 'gruppe';

    const kopf = document.createElement('h2');
    kopf.className = 'gruppe-kopf';
    const icon = document.createElement('span');
    icon.className = 'gruppe-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = gruppe.kategorie.icon || '🛒';
    const name = document.createElement('span');
    name.textContent = gruppe.kategorie.name;
    kopf.append(icon, name);

    const liste = document.createElement('ul');
    liste.className = 'listenliste';
    for (const eintrag of gruppe.eintraege) liste.append(zeileZeichnen(eintrag));

    block.append(kopf, liste);
    return block;
}

function zeileZeichnen(eintrag, erledigt = false) {
    const zeile = document.createElement('li');

    const karte = document.createElement('button');
    karte.type = 'button';
    karte.className = 'listenkarte' + (erledigt ? ' ist-erledigt' : '');
    karte.dataset.artikelId = eintrag.artikelId;

    const icon = document.createElement('span');
    icon.className = 'karte-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = eintrag.artikel.icon || '🛒';

    const text = document.createElement('span');
    text.className = 'karte-text';
    const name = document.createElement('span');
    name.className = 'karte-name';
    name.textContent = eintrag.artikel.name;
    text.append(name);

    /* Menge und Notiz stehen nur im Expertenmodus im Bild. In der Datenbank
       stehen sie immer – wer zurück auf Basis schaltet, verliert nichts. */
    const zusatz = [eintrag.menge, eintrag.notiz].filter(Boolean).join(' · ');
    if (zusatz && istExperte()) {
        const zeileZusatz = document.createElement('span');
        zeileZusatz.className = 'karte-zusatz';
        zeileZusatz.textContent = zusatz;
        text.append(zeileZusatz);
    }

    /* Der Angebotscheck wird dort nützlich, wo die Kaufentscheidung fällt:
       direkt am offenen Artikel. Dieselben Händlerangebote aus mehreren
       Filialen sind hier bereits zusammengefasst. */
    let angebotHinweis = '';
    if (!erledigt) {
        const angebote = angeboteFuerArtikel(angebotsergebnis(), eintrag.artikelId);
        if (angebote.length > 0) {
            const guenstigster = angebote.reduce(
                (bisher, angebot) => angebot.preis < bisher.preis ? angebot : bisher
            );
            angebotHinweis = angebote.length === 1
                ? t(
                    guenstigster.treffer === 'alternative'
                        ? 'angebote.listenAlternative'
                        : 'angebote.listenTreffer',
                    preisDeutsch(guenstigster.preis),
                    guenstigster.haendler
                )
                : t('angebote.listenMehrere', angebote.length, preisDeutsch(guenstigster.preis));
            const marke = document.createElement('span');
            marke.className = 'karte-angebot';
            marke.textContent = angebotHinweis;
            text.append(marke);
            karte.classList.add('hat-angebot');
        }
    }

    const haken = document.createElement('span');
    haken.className = 'haken';
    haken.setAttribute('aria-hidden', 'true');
    haken.textContent = '✓';

    karte.append(icon, text, haken);
    const stimmtext = erledigt
        ? t('liste.stimmeErledigt', eintrag.artikel.name)
        : t('liste.stimmeOffen', eintrag.artikel.name);
    karte.setAttribute('aria-label', angebotHinweis ? `${stimmtext}. ${angebotHinweis}` : stimmtext);

    karte.addEventListener('click', async () => {
        if (erledigt) {
            await zurueckholen(eintrag.artikelId);
            return;
        }
        await abhaken(eintrag.artikelId);
        melde(t('liste.abgehakt', eintrag.artikel.name), {
            text: t('allgemein.rueckgaengig'),
            tun: () => zurueckholen(eintrag.artikelId)
        });
    });

    zeile.append(karte);

    if (!erledigt) zeile.append(...mengenTeil(eintrag));

    return zeile;
}

/**
 * Menge und Notiz (Experte).
 *
 * Kein Dialog, keine zweite Ebene: ein Stift neben der Zeile, und das Feld
 * klappt darunter auf. Ein Dialog für zwei Textfelder wäre mehr Apparat als
 * Inhalt – und im Laden eine Ebene zu viel.
 */
function mengenTeil(eintrag) {
    const stift = document.createElement('button');
    stift.type = 'button';
    stift.className = 'experte-nur karte-stift';
    stift.textContent = eintrag.menge || eintrag.notiz ? '✏️' : '＋';
    stift.setAttribute('aria-label', t('liste.stimmeMenge', eintrag.artikel.name));
    stift.addEventListener('click', () => {
        offenerEditor = offenerEditor === eintrag.artikelId ? null : eintrag.artikelId;
        zeichneListe();
    });

    const teile = [stift];
    if (offenerEditor === eintrag.artikelId) teile.push(editor(eintrag));
    return teile;
}

function editor(eintrag) {
    const form = document.createElement('form');
    form.className = 'experte-nur mengen-editor';

    const menge = document.createElement('input');
    menge.type = 'text';
    menge.value = eintrag.menge || '';
    menge.placeholder = t('menge.platzhalter');
    menge.setAttribute('aria-label', t('menge.beschriftung'));
    menge.enterKeyHint = 'done';

    const notiz = document.createElement('input');
    notiz.type = 'text';
    notiz.value = eintrag.notiz || '';
    notiz.placeholder = t('menge.notizPlatzhalter');
    notiz.setAttribute('aria-label', t('menge.notizBeschriftung'));
    notiz.enterKeyHint = 'done';

    const fertig = document.createElement('button');
    fertig.type = 'submit';
    fertig.className = 'primary';
    fertig.textContent = t('menge.fertig');

    form.addEventListener('submit', async (ereignis) => {
        ereignis.preventDefault();
        offenerEditor = null;
        await eintragAendern(eintrag.artikelId, { menge: menge.value, notiz: notiz.value });
    });

    form.append(menge, notiz, fertig);
    /* Direkt tippen können, ohne ein zweites Mal zu zielen. */
    setTimeout(() => menge.focus(), 0);
    return form;
}

function erledigtBlock(erledigt) {
    const block = document.createElement('section');
    block.className = 'erledigt-block';

    const kopf = document.createElement('div');
    kopf.className = 'erledigt-kopf';

    const titel = document.createElement('h2');
    titel.textContent = `${t('liste.erledigt')} (${erledigt.length})`;

    const aufraeumen = document.createElement('button');
    aufraeumen.type = 'button';
    aufraeumen.textContent = t('liste.erledigtAufraeumen');
    aufraeumen.addEventListener('click', async () => {
        const anzahl = await erledigteAufraeumen();
        if (anzahl > 0) melde(t('liste.erledigteEntfernt'));
    });

    kopf.append(titel, aufraeumen);

    const liste = document.createElement('ul');
    liste.className = 'listenliste';
    for (const eintrag of erledigt) {
        const artikel = zustand.artikel.get(eintrag.artikelId);
        if (!artikel) continue;
        liste.append(zeileZeichnen({ ...eintrag, artikel }, true));
    }

    block.append(kopf, liste);
    return block;
}
