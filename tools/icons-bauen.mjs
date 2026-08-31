/**
 * Rastert die beiden SVG-Zeichen zu PNG.
 *
 * Warum überhaupt PNG, wenn es das SVG gibt? Android nimmt SVG im Manifest
 * inzwischen an, iOS nicht: `apple-touch-icon` muss ein PNG sein, sonst
 * bekommt die installierte App auf dem Startbildschirm einen Screenshot der
 * Seite statt eines Zeichens. Und ein „maskable"-Zeichen muss ohnehin eigens
 * gebaut werden.
 *
 * Playwright steht bewusst nicht in `package.json`: Ein normales
 * `npm install` soll keinen Browser herunterladen. Wer die Zeichen neu bauen
 * will, holt es sich einmalig dazu.
 *
 *   npm i --no-save playwright && npx playwright install chromium
 *   node tools/icons-bauen.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = join(hier, '..');
const icons = join(hier, '..', 'icons');

const AUFTRAEGE = [
    { quelle: 'foxi.svg',          ziel: 'icon-192.png',         groesse: 192 },
    { quelle: 'foxi.svg',          ziel: 'icon-512.png',         groesse: 512 },
    { quelle: 'foxi.svg',          ziel: 'favicon-64.png',       groesse: 64 },
    { quelle: 'foxi.svg',          ziel: 'apple-touch-icon.png', groesse: 180 },
    { quelle: 'foxi-maskable.svg', ziel: 'maskable-512.png',     groesse: 512 }
];

/* `FOXI_CHROMIUM` erlaubt einen bereits vorhandenen Browser (z. B. in einer
   Umgebung, die Playwright-Downloads unterbindet). Ohne die Variable nimmt
   Playwright seinen eigenen. */
const browser = await chromium.launch(
    process.env.FOXI_CHROMIUM ? { executablePath: process.env.FOXI_CHROMIUM } : {}
);

for (const auftrag of AUFTRAEGE) {
    const svg = readFileSync(join(icons, auftrag.quelle), 'utf8');
    const seite = await browser.newPage({
        viewport: { width: auftrag.groesse, height: auftrag.groesse },
        deviceScaleFactor: 1
    });
    await seite.setContent(
        `<!doctype html><meta charset="utf-8">
         <style>html,body{margin:0;padding:0;width:${auftrag.groesse}px;height:${auftrag.groesse}px;overflow:hidden}
                svg{display:block;width:100%;height:100%}</style>
         ${svg}`
    );
    const bild = await seite.screenshot({ omitBackground: true });
    writeFileSync(join(icons, auftrag.ziel), bild);
    await seite.close();
    console.log(`${auftrag.ziel} (${auftrag.groesse}×${auftrag.groesse})`);
}

await browser.close();

/* Klassische Crawler und einige Dashboards fragen weiterhin direkt
   `/favicon.ico` ab, selbst wenn HTML und Manifest moderne SVG-/PNG-Icons
   nennen. ICO darf ein PNG enthalten: Der kleine Container hält deshalb
   dieselben 64×64-Pixel ohne zweite Bildquelle oder Qualitätsverlust. */
const faviconPng = readFileSync(join(icons, 'favicon-64.png'));
const icoKopf = Buffer.alloc(22);
icoKopf.writeUInt16LE(0, 0);                 // reserviert
icoKopf.writeUInt16LE(1, 2);                 // Bildtyp ICO
icoKopf.writeUInt16LE(1, 4);                 // genau ein Bild
icoKopf.writeUInt8(64, 6);                   // Breite
icoKopf.writeUInt8(64, 7);                   // Höhe
icoKopf.writeUInt8(0, 8);                    // keine Palette
icoKopf.writeUInt8(0, 9);                    // reserviert
icoKopf.writeUInt16LE(1, 10);                // Farbebenen
icoKopf.writeUInt16LE(32, 12);               // Farbtiefe
icoKopf.writeUInt32LE(faviconPng.length, 14);
icoKopf.writeUInt32LE(icoKopf.length, 18);    // Bild beginnt nach Verzeichnis
writeFileSync(join(wurzel, 'favicon.ico'), Buffer.concat([icoKopf, faviconPng]));
console.log('favicon.ico (64×64 PNG im ICO-Container)');
