import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const hier = dirname(fileURLToPath(import.meta.url));
const katalog = JSON.parse(readFileSync(join(hier, '..', 'src', 'daten', 'katalog.json'), 'utf8'));
const rezepte = JSON.parse(readFileSync(join(hier, '..', 'src', 'daten', 'rezepte.json'), 'utf8'));

describe('Startkatalog', () => {
    it('bringt rund 400 Artikel mit', () => {
        expect(katalog.artikel.length).toBeGreaterThanOrEqual(400);
    });

    it('vergibt jede Kennung nur einmal', () => {
        const kennungen = katalog.artikel.map((a) => a.id);
        expect(new Set(kennungen).size).toBe(kennungen.length);
    });

    it('gibt jedem Artikel Name, Kategorie und Zeichen', () => {
        for (const eintrag of katalog.artikel) {
            expect(eintrag.name, JSON.stringify(eintrag)).toBeTruthy();
            expect(eintrag.icon, JSON.stringify(eintrag)).toBeTruthy();
            expect(eintrag.kategorieId, JSON.stringify(eintrag)).toBeTruthy();
        }
    });

    it('verweist nur auf Kategorien, die es gibt', () => {
        const bekannt = new Set(katalog.kategorien.map((k) => k.id));
        const fremd = katalog.artikel.filter((a) => !bekannt.has(a.kategorieId));
        expect(fremd.map((a) => `${a.name} → ${a.kategorieId}`)).toEqual([]);
    });

    it('nummeriert die Kategorien lückenlos durch', () => {
        const positionen = katalog.kategorien.map((k) => k.position).sort((a, b) => a - b);
        expect(positionen).toEqual(katalog.kategorien.map((_, i) => i));
    });

    /* „Sonstiges" ist der Auffangkorb für selbst angelegte Artikel. Fällt er
       weg, landen sie in der ersten Kategorie – und niemand merkt es, bis
       Batterien zwischen den Äpfeln stehen. */
    it('hält eine Auffangkategorie „Sonstiges" bereit', () => {
        const sonstiges = katalog.kategorien.find((k) => k.id === 'sonstiges');
        expect(sonstiges).toBeTruthy();
        expect(katalog.artikel.some((a) => a.kategorieId === 'sonstiges')).toBe(false);
    });
});

describe('Beispielrezepte', () => {
    it('verweisen ausschließlich auf Artikel aus dem Katalog', () => {
        const bekannt = new Set(katalog.artikel.map((a) => a.id));
        const fehlend = [];
        for (const rezept of rezepte.rezepte) {
            for (const id of rezept.artikelIds) {
                if (!bekannt.has(id)) fehlend.push(`${rezept.name} → ${id}`);
            }
        }
        expect(fehlend).toEqual([]);
    });

    it('haben Namen und mindestens eine Zutat', () => {
        for (const rezept of rezepte.rezepte) {
            expect(rezept.name).toBeTruthy();
            expect(rezept.artikelIds.length).toBeGreaterThan(0);
        }
    });
});
