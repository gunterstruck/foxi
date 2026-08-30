/**
 * Foxi – Start und Zusammenspiel.
 *
 * Diese Datei kennt alle drei Bildschirme und sonst niemand kennt sie. Sie
 * macht genau drei Dinge: den Zustand laden, die Oberfläche verdrahten und
 * bei jeder Änderung das Nötige neu zeichnen – nicht mehr.
 */

import { starte, beiAenderung } from './zustand.js';
import { schaleVerdrahten, zeigeBereich, aktiverBereich, beiBereichswechsel } from './ui/schale.js';
import { listeVerdrahten, zeichneListe } from './ui/liste.js';
import { katalogVerdrahten, zeichneKatalog, synchronisiereKacheln } from './ui/katalog.js';
import { mehrVerdrahten, zeichneMehr } from './ui/mehr.js';

/* Welcher Bildschirm ist gegenüber dem Zustand veraltet? Ein Bereich, den
   niemand ansieht, wird nicht gezeichnet – er merkt sich nur, dass er es
   nachholen muss. Das ist der Unterschied zwischen „flüssig" und „hakt beim
   Abhaken", sobald der Katalog 480 Kacheln hat. */
const veraltet = { liste: true, katalog: true, mehr: true };

function zeichneWennSichtbar() {
    const bereich = aktiverBereich();
    if (!veraltet[bereich]) return;
    if (bereich === 'liste') zeichneListe();
    else if (bereich === 'katalog') zeichneKatalog();
    else if (bereich === 'mehr') zeichneMehr();
    veraltet[bereich] = false;
}

function alsVeraltetMarkieren(...bereiche) {
    for (const bereich of bereiche) veraltet[bereich] = true;
}

async function los() {
    schaleVerdrahten();
    listeVerdrahten();
    katalogVerdrahten();
    mehrVerdrahten();

    beiBereichswechsel(() => queueMicrotask(zeichneWennSichtbar));

    beiAenderung((grund) => {
        if (grund === 'liste') {
            /* Ein Artikel kam auf die Liste oder ging herunter. Für den
               Katalog heißt das nur: eine Kachel wechselt die Farbe. */
            alsVeraltetMarkieren('liste');
            if (aktiverBereich() === 'katalog') synchronisiereKacheln();
        } else {
            /* Abhaken, Modus, eigene Artikel, neue Reihenfolge: Hier kann
               sich auch die Sortierung ändern. Alles neu. */
            alsVeraltetMarkieren('liste', 'katalog', 'mehr');
        }
        zeichneWennSichtbar();
    });

    await starte('./');
    alsVeraltetMarkieren('liste', 'katalog', 'mehr');
    zeigeBereich('liste');
    zeichneWennSichtbar();
}

los().catch((fehler) => {
    console.error('[Foxi] Start fehlgeschlagen', fehler);
    const inhalt = document.getElementById('liste-inhalt');
    if (inhalt) {
        inhalt.textContent = 'Foxi konnte nicht starten. Bitte die Seite neu laden.';
    }
});

/* Der Service Worker macht Foxi offlinefähig und installierbar. Über
   `file://` gibt es keinen – dann läuft die App trotzdem, nur ohne
   Zwischenspeicher. */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((fehler) => {
            console.warn('[Foxi] Service Worker nicht registriert', fehler);
        });
    });
}
