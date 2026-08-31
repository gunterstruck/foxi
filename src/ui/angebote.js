/**
 * Bedienwege des Angebotsradar-Piloten.
 *
 * Hinaus geht ein kopierter Text, herein kommt ausschließlich JSON, das die
 * reinen Regeln in `angebotsradar.js` angenommen haben. Diese Datei zeichnet
 * die Ergebniskarte nicht selbst; sie führt nur die zwei bewussten Übergaben
 * zwischen Foxi und dem frei gewählten Agenten aus.
 */

import { aktiveAngebote, alsAngebotsauftrag, demoAngebotsprofil, pruefeAngebotsergebnis } from '../angebotsradar.js';
import { angebotsergebnis, angebotsergebnisSetzen } from '../zustand.js';
import { t } from '../texte.js';
import { zeigeDialog } from './dialog.js';
import { melde } from './schale.js';
import { kopiereText } from './teilen.js';

const MAX_DATEIGROESSE = 256 * 1024;

export function demoAuftragAlsText() {
    return alsAngebotsauftrag(demoAngebotsprofil());
}

export async function demoAuftragKopieren() {
    await kopiereText(
        demoAuftragAlsText(),
        t('angebote.auftragKopiert'),
        t('angebote.auftragTitel')
    );
}

async function ergebnisUebernehmen(daten) {
    if (!pruefeAngebotsergebnis(daten).gueltig) {
        melde(t('angebote.ergebnisUngueltig'));
        return false;
    }
    await angebotsergebnisSetzen(daten);
    melde(t('angebote.ergebnisUebernommen', aktiveAngebote(daten).length));
    return true;
}

export function ergebnisEinfuegen() {
    const feld = document.createElement('textarea');
    feld.className = 'dialog-text angebote-eingabe';
    feld.rows = 12;
    feld.placeholder = t('angebote.ergebnisPlatzhalter');
    feld.setAttribute('aria-label', t('angebote.ergebnisBeschriftung'));

    zeigeDialog({
        titel: t('angebote.ergebnisTitel'),
        koerper: [feld],
        knoepfe: [{
            text: t('angebote.uebernehmen'),
            betont: true,
            wirkung: async () => {
                try {
                    await ergebnisUebernehmen(JSON.parse(feld.value));
                } catch {
                    melde(t('angebote.ergebnisUngueltig'));
                }
            }
        }]
    });
}

export function ergebnisdateiEinlesen() {
    const feld = document.createElement('input');
    feld.type = 'file';
    feld.accept = 'application/json,.json';
    feld.hidden = true;
    document.body.append(feld);

    feld.addEventListener('change', async () => {
        const datei = feld.files?.[0];
        feld.remove();
        if (!datei) return;
        if (datei.size > MAX_DATEIGROESSE) {
            melde(t('angebote.ergebnisZuGross'));
            return;
        }
        try {
            await ergebnisUebernehmen(JSON.parse(await datei.text()));
        } catch {
            melde(t('angebote.ergebnisUngueltig'));
        }
    });

    feld.click();
}

export function aktuelleAngebote() {
    return aktiveAngebote(angebotsergebnis());
}
