import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const lies = (pfad) => readFileSync(join(wurzel, pfad), 'utf8');

describe('PWA-Aktualisierung', () => {
    it('hält Anwendung, Manifest, Cache und Icon-Adressen auf derselben Version', () => {
        const paket = JSON.parse(lies('package.json'));
        const version = lies('src/version.js').match(/VERSION = '([^']+)'/)?.[1];
        const cache = lies('sw.js').match(/einkaufsfuchs-v([\d.]+)/)?.[1];
        const manifest = lies('manifest.webmanifest');
        const index = lies('index.html');

        expect(version).toBe(paket.version);
        expect(cache).toBe(paket.version);
        expect(manifest).toContain(`?v=${paket.version}`);
        expect(index).toContain(`?v=${paket.version}`);
    });

    it('prüft sofort, bei Rückkehr und regelmäßig ohne HTTP-Zwischenspeicher', () => {
        const client = lies('src/pwa-update.js');
        expect(client).toContain("updateViaCache: 'none'");
        expect(client).toContain('void pruefeAufUpdate();');
        expect(client).toContain("window.addEventListener('focus'");
        expect(client).toContain("document.addEventListener('visibilitychange'");
        expect(client).toContain('window.setInterval');
    });

    it('aktiviert den neuen Worker und lädt Fenster einer alten Fassung neu', () => {
        const worker = lies('sw.js');
        expect(worker).toContain('self.skipWaiting()');
        expect(worker).toContain('self.clients.claim()');
        expect(worker).toContain("type: 'window'");
        expect(worker).toContain('client.navigate(client.url)');
        expect(worker.indexOf('fetch(anfrage)')).toBeLessThan(worker.indexOf("caches.match('index.html')"));
    });
});

describe('Fuchs-Familienzeichen', () => {
    it('verwendet die gemeinsame Palette und drei Listenstriche', () => {
        const manifest = JSON.parse(lies('manifest.webmanifest'));
        const farben = lies('src/styles/stamm/variables.css');
        const icon = lies('icons/foxi.svg');

        expect(manifest.theme_color).toBe('#0d9488');
        expect(manifest.background_color).toBe('#f8fafc');
        expect(farben).toContain('--color-primary: #0d9488');
        expect(icon).toContain('fill="#0d9488"');
        expect(icon.match(/<rect x="36" y="(?:10|16|22)"/g)).toHaveLength(3);
        expect(icon).toContain('M50 32 C64 32 76 42 76 54');
    });
});
