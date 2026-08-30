/**
 * Ein Webserver in fünfzig Zeilen, ohne Abhängigkeit.
 *
 * Foxi braucht keinen Bauschritt – aber `file://` reicht trotzdem nicht:
 * ES-Module und der Service Worker verlangen beide eine echte Herkunft
 * (origin). Deshalb dieses Minimum. Für die Veröffentlichung genügt jeder
 * statische Webspace; kopiert wird der Ordner, wie er ist.
 *
 *   node tools/server.mjs        →  http://localhost:8080
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
const hafen = Number(process.env.PORT || 8080);

const TYPEN = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

createServer(async (anfrage, antwort) => {
    try {
        const adresse = new URL(anfrage.url, `http://localhost:${hafen}`);
        /* `normalize` allein reicht nicht – erst der Vergleich mit der Wurzel
           schließt „../" zuverlässig aus. */
        let pfad = join(wurzel, normalize(decodeURIComponent(adresse.pathname)));
        if (!pfad.startsWith(wurzel)) { antwort.writeHead(403).end('Verboten'); return; }

        const angaben = await stat(pfad).catch(() => null);
        if (angaben?.isDirectory()) pfad = join(pfad, 'index.html');

        const inhalt = await readFile(pfad);
        antwort.writeHead(200, {
            'Content-Type': TYPEN[extname(pfad)] || 'application/octet-stream',
            /* Beim Entwickeln nie aus dem Zwischenspeicher – sonst debuggt
               man eine Fassung, die es nicht mehr gibt. */
            'Cache-Control': 'no-store'
        });
        antwort.end(inhalt);
    } catch {
        antwort.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        antwort.end('Nicht gefunden');
    }
}).listen(hafen, () => {
    console.log(`Foxi läuft auf http://localhost:${hafen}`);
});
