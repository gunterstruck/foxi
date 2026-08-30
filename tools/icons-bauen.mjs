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
const icons = join(hier, '..', 'icons');

const AUFTRAEGE = [
    { quelle: 'foxi.svg',          ziel: 'icon-192.png',         groesse: 192 },
    { quelle: 'foxi.svg',          ziel: 'icon-512.png',         groesse: 512 },
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
