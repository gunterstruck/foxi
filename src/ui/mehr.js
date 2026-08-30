/**
 * Bildschirm 3: Mehr.
 *
 * Im Basismodus steht hier nur, was jeder verstehen muss: was Foxi mit den
 * Daten macht, und wie man die Liste wieder leer bekommt. Rezepte, Teilen,
 * Export, Kategorie-Reihenfolge und Statistik kommen im Expertenmodus dazu –
 * sie tragen die Klasse `experte-nur` und sind im Basismodus nicht
 * ausgebaut, sondern nur nicht im Bild.
 */

import { t } from '../texte.js';
import { VERSION } from '../version.js';
import { listeLeeren, allesZuruecksetzen } from '../zustand.js';
import { melde } from './schale.js';

let behaelter = null;

export function mehrVerdrahten() {
    behaelter = document.getElementById('mehr-inhalt');
}

export function zeichneMehr() {
    if (!behaelter) return;
    behaelter.textContent = '';
    behaelter.append(ueberFoxi(), datenKarte(), fusszeile());
}

function ueberFoxi() {
    const karte = document.createElement('section');
    karte.className = 'karte';

    const titel = document.createElement('h2');
    titel.textContent = t('mehr.ueberTitel');

    const text = document.createElement('p');
    text.textContent = t('mehr.ueberText');

    karte.append(titel, text);
    return karte;
}

function datenKarte() {
    const karte = document.createElement('section');
    karte.className = 'karte';

    const titel = document.createElement('h2');
    titel.textContent = t('mehr.datenTitel');

    const knoepfe = document.createElement('div');
    knoepfe.className = 'karte-knoepfe';

    const leeren = document.createElement('button');
    leeren.type = 'button';
    leeren.textContent = t('mehr.listeLeeren');
    leeren.addEventListener('click', async () => {
        if (!confirm(t('mehr.listeLeerenFrage'))) return;
        await listeLeeren();
        melde(t('mehr.listeGeleert'));
    });

    /* Der harte Knopf steht bewusst im Basismodus: Er ist der einzige Weg
       zurück, wenn jemand die App weitergibt oder von vorn anfangen will –
       und er ist der Beweis dafür, dass alles auf diesem Gerät liegt. */
    const zuruecksetzen = document.createElement('button');
    zuruecksetzen.type = 'button';
    zuruecksetzen.className = 'danger';
    zuruecksetzen.textContent = t('mehr.allesZuruecksetzen');
    zuruecksetzen.addEventListener('click', async () => {
        if (!confirm(t('mehr.allesZuruecksetzenFrage'))) return;
        await allesZuruecksetzen();
        location.reload();
    });

    knoepfe.append(leeren, zuruecksetzen);
    karte.append(titel, knoepfe);
    return karte;
}

function fusszeile() {
    const fuss = document.createElement('p');
    fuss.className = 'fusszeile';
    fuss.append(
        document.createTextNode(`Foxi · ${t('mehr.version', VERSION)}`),
        document.createElement('br'),
        document.createTextNode(t('mehr.lizenz'))
    );
    return fuss;
}
