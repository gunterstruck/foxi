/**
 * Die Prüfstrecke: fährt Foxi in einem echten Browser durch und prüft die
 * Abnahmekriterien, die man nicht mit Unit-Tests erreicht.
 *
 *   1. Von „App geöffnet" bis „erster Artikel auf der Liste" sind es
 *      höchstens zwei Tipps.
 *   2. Im Netzwerk-Tab steht im Normalbetrieb keine fremde Adresse.
 *   3. Nach zehn simulierten Einkäufen stehen die häufigsten Artikel oben
 *      im Katalog.
 *
 * Nebenbei entstehen die Bilder in `docs/bilder/`. Der Lauf endet mit
 * Rückgabewert 1, wenn eine Prüfung fällt – damit taugt er als Tor.
 *
 *   npm i --no-save playwright && npx playwright install chromium
 *   node tools/durchlauf.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium, devices } from 'playwright';

const hier = dirname(fileURLToPath(import.meta.url));
const wurzel = join(hier, '..');
const bilder = join(wurzel, 'docs', 'bilder');
const HAFEN = Number(process.env.PORT || 8123);
const ADRESSE = `http://localhost:${HAFEN}/`;

mkdirSync(bilder, { recursive: true });

const befunde = [];
function pruefe(bedingung, satz) {
    befunde.push({ gut: Boolean(bedingung), satz });
    console.log(`${bedingung ? '✓' : '✗'} ${satz}`);
}

const server = spawn(process.execPath, [join(hier, 'server.mjs')], {
    env: { ...process.env, PORT: String(HAFEN) },
    stdio: 'ignore'
});
process.on('exit', () => server.kill());

/* Kurz warten, bis der Server steht – ohne feste Pause, sondern indem man
   fragt. */
for (let versuch = 0; versuch < 50; versuch++) {
    try { await fetch(ADRESSE); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
}

const browser = await chromium.launch(
    process.env.FOXI_CHROMIUM ? { executablePath: process.env.FOXI_CHROMIUM } : {}
);
const kontext = await browser.newContext({ ...devices['iPhone 13'], isMobile: true, hasTouch: true });
const seite = await kontext.newPage();

/* Jede Anfrage mitschreiben. Erwartet werden ausschließlich Adressen der
   eigenen Herkunft. */
const fremdeAnfragen = [];
seite.on('request', (anfrage) => {
    if (!anfrage.url().startsWith(ADRESSE.slice(0, -1))) fremdeAnfragen.push(anfrage.url());
});

await seite.goto(ADRESSE, { waitUntil: 'networkidle' });
await seite.waitForSelector('.leer');

pruefe(await seite.locator('.leer h2').isVisible(), 'Erststart zeigt den leeren Zustand');
await seite.screenshot({ path: join(bilder, '01-liste-leer.png') });

/* ── Zwei Tipps ─────────────────────────────────────────────────────────── */
await seite.locator('#tab-katalog').tap();                       // Tipp 1
await seite.waitForSelector('.kachel');
await seite.screenshot({ path: join(bilder, '02-katalog.png') });

await seite.locator('.kachel').first().tap();                    // Tipp 2
await seite.waitForSelector('.kachel.ist-drauf');
const nachZweiTipps = await seite.locator('#tab-liste-zahl').textContent();
pruefe(nachZweiTipps === '1', `Zwei Tipps genügen für den ersten Artikel (Zähler: ${nachZweiTipps})`);

/* ── Ein Einkauf mit mehreren Artikeln ──────────────────────────────────── */
const wunschzettel = ['Milch', 'Brot', 'Butter', 'Äpfel', 'Kaffee', 'Eier', 'Bananen', 'Nudeln'];
for (const name of wunschzettel) {
    await seite.locator('#katalog-suche').fill(name);
    const treffer = seite.locator('.kachel').first();
    if (await treffer.count()) {
        const schonDrauf = await treffer.evaluate((el) => el.classList.contains('ist-drauf'));
        if (!schonDrauf) await treffer.tap();
    }
}
await seite.locator('#katalog-suche').fill('');
await seite.locator('#tab-liste').tap();
await seite.waitForSelector('.listenkarte');
await seite.screenshot({ path: join(bilder, '03-liste-gefuellt.png') });

/* Auf `#bereich-liste` eingeschränkt: Der Katalog ist nur `hidden`, seine
   Gruppenköpfe stehen weiter im Dokument und würden mitgezählt. */
const gruppen = await seite.locator('#bereich-liste .gruppe-kopf').count();
pruefe(gruppen >= 2, `Die Liste gruppiert nach Kategorie (${gruppen} Gruppen)`);

/* ── Abhaken ────────────────────────────────────────────────────────────── */
await seite.locator('.listenkarte').first().tap();
await seite.waitForSelector('.erledigt-block');
pruefe(await seite.locator('.listenkarte.ist-erledigt').count() > 0, 'Ein Tipp hakt ab');
await seite.screenshot({ path: join(bilder, '04-abgehakt.png') });

/* ── Experte ────────────────────────────────────────────────────────────── */
await seite.locator('#modus-schalter .seg[data-modus="experte"]').tap();
await seite.waitForSelector('.karte-stift');
pruefe(await seite.locator('.karte-stift').first().isVisible(), 'Experte zeigt Menge und Notiz');
await seite.locator('.karte-stift').first().tap();
await seite.waitForSelector('.mengen-editor');
await seite.locator('.mengen-editor input').first().fill('2 Liter');
await seite.locator('.mengen-editor button').tap();
await seite.waitForSelector('.karte-zusatz');
pruefe((await seite.locator('.karte-zusatz').first().textContent())?.includes('2 Liter'),
    'Die Menge steht an der Zeile');
await seite.screenshot({ path: join(bilder, '05-experte.png') });

/* Verlustfrei zurück: Basis blendet die Menge aus, löscht sie aber nicht. */
await seite.locator('#modus-schalter .seg[data-modus="basis"]').tap();
await seite.waitForTimeout(150);
pruefe(await seite.locator('.karte-zusatz').count() === 0, 'Basis blendet die Menge aus');
await seite.locator('#modus-schalter .seg[data-modus="experte"]').tap();
await seite.waitForTimeout(150);
pruefe((await seite.locator('.karte-zusatz').first().textContent())?.includes('2 Liter'),
    'Der Rückweg nach Experte bringt sie unverändert wieder');
await seite.locator('#modus-schalter .seg[data-modus="basis"]').tap();

/* ── Zehn Einkäufe ──────────────────────────────────────────────────────── */
const haushalt = ['Milch', 'Brot', 'Butter'];
for (let einkauf = 0; einkauf < 10; einkauf++) {
    await seite.locator('#tab-katalog').tap();
    for (const name of haushalt) {
        await seite.locator('#katalog-suche').fill(name);
        const treffer = seite.locator('.kachel').first();
        const drauf = await treffer.evaluate((el) => el.classList.contains('ist-drauf'));
        if (!drauf) await treffer.tap();
    }
    await seite.locator('#katalog-suche').fill('');
    await seite.locator('#tab-liste').tap();
    await seite.waitForSelector('.listenkarte:not(.ist-erledigt)');
    let offen = await seite.locator('.listenkarte:not(.ist-erledigt)').count();
    while (offen > 0) {
        await seite.locator('.listenkarte:not(.ist-erledigt)').first().tap();
        await seite.waitForTimeout(60);
        offen = await seite.locator('.listenkarte:not(.ist-erledigt)').count();
    }
    await seite.locator('.erledigt-kopf button').tap();
    await seite.waitForTimeout(80);
}

await seite.locator('#tab-katalog').tap();
await seite.waitForSelector('.kachel');
const obenImKatalog = await seite.locator('.kachelwand').first().locator('.kachel-name')
    .evaluateAll((elemente) => elemente.slice(0, 6).map((e) => e.textContent));
const ersteGruppe = await seite.locator('#bereich-katalog .gruppe-kopf').first().textContent();
pruefe(ersteGruppe?.includes('Oft gebraucht'), 'Der Katalog führt jetzt mit „Oft gebraucht"');
pruefe(haushalt.every((name) => obenImKatalog.includes(name)),
    `Die Standardartikel des Haushalts stehen oben (${obenImKatalog.join(', ')})`);
await seite.screenshot({ path: join(bilder, '06-katalog-gelernt.png') });

await seite.locator('#tab-mehr').tap();
await seite.waitForSelector('.karte');
await seite.screenshot({ path: join(bilder, '07-mehr.png') });

/* ── Netz ───────────────────────────────────────────────────────────────── */
pruefe(fremdeAnfragen.length === 0,
    `Keine fremde Adresse im Netzwerk${fremdeAnfragen.length ? `: ${fremdeAnfragen.join(', ')}` : ''}`);

await browser.close();
server.kill();

const gefallen = befunde.filter((b) => !b.gut);
console.log(`\n${befunde.length - gefallen.length}/${befunde.length} Prüfungen bestanden.`);
console.log(`Bilder in ${bilder}`);
process.exit(gefallen.length ? 1 : 0);
