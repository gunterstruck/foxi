import { describe, it, expect } from 'vitest';
import {
    alsAustauschdatei, pruefeAustauschdatei, vergleicheImport,
    kaufStatistik, datumFuerDateiname, DATEI_TYP, DATEI_VERSION, TAG_MS
} from '../src/logik.js';

const JETZT = new Date('2026-08-30T10:00:00Z').getTime();

const artikelNachId = new Map([
    ['milch', { id: 'milch', name: 'Milch', kategorieId: 'molkerei', icon: '🥛', letzteKaeufe: [] }],
    ['brot', { id: 'brot', name: 'Brot', kategorieId: 'backwaren', icon: '🍞', letzteKaeufe: [] }]
]);
const kategorienNachId = new Map([
    ['molkerei', { id: 'molkerei', name: 'Milch, Käse & Eier', icon: '🧀', position: 0 }],
    ['backwaren', { id: 'backwaren', name: 'Brot & Backwaren', icon: '🥖', position: 1 }]
]);

describe('Austauschdatei', () => {
    const eintraege = [
        { artikelId: 'milch', menge: '2', notiz: 'laktosefrei' },
        { artikelId: 'brot', menge: '', notiz: '' }
    ];

    it('trägt alles mit, was das andere Gerät zum Anzeigen braucht', () => {
        const datei = alsAustauschdatei(eintraege, artikelNachId, kategorienNachId, new Date(JETZT));
        expect(datei.typ).toBe(DATEI_TYP);
        expect(datei.version).toBe(DATEI_VERSION);
        expect(datei.artikel[0]).toMatchObject({
            id: 'milch', name: 'Milch', kategorieId: 'molkerei',
            kategorieName: 'Milch, Käse & Eier', icon: '🥛', menge: '2', notiz: 'laktosefrei'
        });
    });

    /* Die Kaufhistorie ist das Gedächtnis eines Haushalts, keine Beilage zu
       einer Einkaufsliste. Wer eine Liste teilt, teilt nicht mit, wie oft er
       Bier kauft. */
    it('gibt die Kaufhistorie nicht mit weiter', () => {
        const mitHistorie = new Map(artikelNachId);
        mitHistorie.set('milch', { ...artikelNachId.get('milch'), letzteKaeufe: [JETZT, JETZT - TAG_MS] });
        const datei = alsAustauschdatei(eintraege, mitHistorie, kategorienNachId, new Date(JETZT));
        const alsText = JSON.stringify(datei);
        expect(alsText).not.toContain('letzteKaeufe');
        expect(alsText).not.toContain('zaehler');
    });

    it('überspringt Einträge ohne Artikel, statt null zu schreiben', () => {
        const datei = alsAustauschdatei(
            [...eintraege, { artikelId: 'gibtsnicht', menge: '', notiz: '' }],
            artikelNachId, kategorienNachId, new Date(JETZT)
        );
        expect(datei.artikel).toHaveLength(2);
    });

    it('benennt die Datei nach dem Tag, sortierbar', () => {
        expect(datumFuerDateiname(new Date('2026-08-05T12:00:00'))).toBe('2026-08-05');
    });
});

describe('Prüfung eingelesener Dateien', () => {
    it('nimmt eine echte Foxi-Datei an', () => {
        expect(pruefeAustauschdatei({ typ: DATEI_TYP, version: 1, artikel: [] }).gueltig).toBe(true);
    });

    it('weist eine fremde Datei mit Grund ab', () => {
        expect(pruefeAustauschdatei({ typ: 'irgendwas', artikel: [] }))
            .toEqual({ gueltig: false, grund: 'fremd' });
    });

    it('weist Unsinn ab, ohne zu werfen', () => {
        expect(pruefeAustauschdatei(null).gueltig).toBe(false);
        expect(pruefeAustauschdatei('nur ein Text').gueltig).toBe(false);
        expect(pruefeAustauschdatei({ typ: DATEI_TYP, artikel: 'keine Liste' }).gueltig).toBe(false);
    });

    /* Eine Datei aus einer neueren Foxi-Fassung könnte Felder tragen, die
       diese hier still verlöre. Lieber ehrlich ablehnen. */
    it('weist eine Datei aus einer neueren Fassung ab', () => {
        expect(pruefeAustauschdatei({ typ: DATEI_TYP, version: 99, artikel: [] }))
            .toEqual({ gueltig: false, grund: 'zuNeu' });
    });
});

describe('Zusammenführung', () => {
    const eigeneListe = new Map([
        ['milch', { artikelId: 'milch', menge: '', notiz: '' }],
        ['brot', { artikelId: 'brot', menge: '1', notiz: '' }]
    ]);

    const fremd = [
        { id: 'milch', name: 'Milch', menge: '', notiz: '' },        // identisch
        { id: 'brot', name: 'Brot', menge: '2', notiz: '' },         // andere Menge
        { id: 'butter', name: 'Butter', menge: '', notiz: '' }       // neu
    ];

    it('trennt neu, unverändert und abweichend', () => {
        const ergebnis = vergleicheImport(fremd, eigeneListe);
        expect(ergebnis.neu.map((a) => a.id)).toEqual(['butter']);
        expect(ergebnis.doppelt.map((a) => a.id)).toEqual(['milch']);
        expect(ergebnis.abweichend.map((a) => a.id)).toEqual(['brot']);
    });

    it('zählt eine abweichende Notiz genauso als Abweichung wie eine Menge', () => {
        const ergebnis = vergleicheImport(
            [{ id: 'milch', menge: '', notiz: 'die kleinen' }],
            eigeneListe
        );
        expect(ergebnis.abweichend).toHaveLength(1);
        expect(ergebnis.doppelt).toHaveLength(0);
    });

    it('behandelt fehlende und leere Angaben gleich', () => {
        const ergebnis = vergleicheImport([{ id: 'milch', name: 'Milch' }], eigeneListe);
        expect(ergebnis.doppelt).toHaveLength(1);
    });

    it('meldet bei leerer Datei nichts als neu', () => {
        expect(vergleicheImport([], eigeneListe)).toEqual({ neu: [], doppelt: [], abweichend: [] });
    });
});

describe('Statistik', () => {
    const artikel = [
        { id: 'a', name: 'Milch', icon: '🥛', letzteKaeufe: [JETZT, JETZT - TAG_MS, JETZT - 2 * TAG_MS] },
        { id: 'b', name: 'Brot', icon: '🍞', letzteKaeufe: [JETZT - TAG_MS] },
        { id: 'c', name: 'Kapern', icon: '🫙', letzteKaeufe: [] }
    ];

    it('zählt roh und sortiert absteigend', () => {
        const zeilen = kaufStatistik(artikel);
        expect(zeilen.map((z) => z.artikel.name)).toEqual(['Milch', 'Brot']);
        expect(zeilen[0].anzahl).toBe(3);
    });

    it('lässt nie Gekauftes weg statt es mit null zu zeigen', () => {
        expect(kaufStatistik(artikel).some((z) => z.artikel.id === 'c')).toBe(false);
    });

    it('merkt sich den jüngsten Kauf', () => {
        expect(kaufStatistik(artikel)[0].zuletzt).toBe(JETZT);
    });

    it('deckelt auf die gewünschte Anzahl', () => {
        const viele = Array.from({ length: 40 }, (_, i) => ({
            id: `a${i}`, name: `Artikel ${i}`, letzteKaeufe: [JETZT]
        }));
        expect(kaufStatistik(viele, 15)).toHaveLength(15);
    });
});
