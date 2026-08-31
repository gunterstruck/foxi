import { describe, expect, it } from 'vitest';
import {
    aktiveAngebote,
    alsAngebotsauftrag,
    demoAngebotsprofil,
    preisDeutsch,
    pruefeAngebotsergebnis
} from '../src/angebotsradar.js';

function ergebnis(angebote = []) {
    return {
        typ: 'foxi-angebote',
        version: 1,
        profilId: 'demo-45136-essen',
        demo: true,
        erzeugt: '2026-08-31T07:00:00.000Z',
        angebote
    };
}

function angebot(aenderung = {}) {
    return {
        artikelId: 'milch',
        artikelName: 'Milch',
        haendler: 'ALDI Nord',
        markt: 'Schürmannstraße 43b, 45136 Essen',
        produkt: 'MILSANI Frische Vollmilch',
        preis: 0.99,
        waehrung: 'EUR',
        menge: '1 l',
        grundpreis: '0,99 €/l',
        gueltigVon: '2026-08-31',
        gueltigBis: '2026-09-05',
        treffer: 'genau',
        hinweis: '',
        quelle: 'https://www.aldi-nord.de/angebote.html',
        ...aenderung
    };
}

describe('Angebotsprofil-Demo', () => {
    it('enthält erfundene Gewohnheiten und keine Wohnadresse', () => {
        const profil = demoAngebotsprofil(new Date('2026-08-31T07:00:00Z'));
        expect(profil.demo).toBe(true);
        expect(profil.region).toBe('45136 Essen');
        expect(profil.artikel.length).toBeGreaterThanOrEqual(12);
        expect(profil).not.toHaveProperty('wohnadresse');
        expect(profil).not.toHaveProperty('koordinaten');
    });

    it('nennt Nord, Süd und den konkreten REWE-Markt', () => {
        const namen = demoAngebotsprofil().maerkte.map((markt) => markt.haendler);
        expect(namen).toContain('ALDI Nord');
        expect(namen).toContain('ALDI Süd');
        expect(namen).toContain('REWE');
    });
});

describe('Agentenauftrag', () => {
    it('fordert offizielles, reines JSON und trägt das Profil mit', () => {
        const auftrag = alsAngebotsauftrag(
            demoAngebotsprofil(new Date('2026-08-31T07:00:00Z'))
        );
        expect(auftrag).toContain('Antworte ausschließlich mit gültigem JSON');
        expect(auftrag).toContain('aldi-nord.de');
        expect(auftrag).toContain('rewe.de');
        expect(auftrag).toContain('demo-45136-essen');
    });
});

describe('Angebotsergebnis', () => {
    it('nimmt ein vollständiges Ergebnis von offizieller Quelle an', () => {
        expect(pruefeAngebotsergebnis(ergebnis([angebot()])))
            .toEqual({ gueltig: true, grund: null });
    });

    it('weist fremde Quellen, erfundene Preise und falsche Datumsfolgen ab', () => {
        expect(pruefeAngebotsergebnis(ergebnis([angebot({
            quelle: 'https://angebote.example.com/milch'
        })])).gueltig).toBe(false);
        expect(pruefeAngebotsergebnis(ergebnis([angebot({ preis: 0 })])).gueltig).toBe(false);
        expect(pruefeAngebotsergebnis(ergebnis([angebot({
            gueltigVon: '2026-09-06', gueltigBis: '2026-09-05'
        })])).gueltig).toBe(false);
    });

    it('zeigt nur heute gültige Treffer und sortiert nachvollziehbar', () => {
        const daten = ergebnis([
            angebot({ artikelId: 'butter', artikelName: 'Butter', preis: 1.49 }),
            angebot({ preis: 1.09 }),
            angebot({
                artikelId: 'alt',
                artikelName: 'Kaffee',
                gueltigVon: '2026-08-24',
                gueltigBis: '2026-08-30'
            })
        ]);
        const aktiv = aktiveAngebote(daten, new Date('2026-09-01T12:00:00Z'));
        expect(aktiv.map((eintrag) => eintrag.artikelName)).toEqual(['Butter', 'Milch']);
    });

    it('formatiert Preise deutsch', () => {
        expect(preisDeutsch(1.5)).toBe('1,50 €');
    });
});
