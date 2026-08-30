/**
 * Service Worker – der Grund, warum Foxi im Laden funktioniert.
 *
 * Im Supermarkt ist das Netz schlecht oder gar nicht da; im Keller eines
 * Getränkemarktes ist es zuverlässig weg. Deshalb liegt die ganze App im
 * Zwischenspeicher, und geladen wird zuerst von dort – nicht aus dem Netz
 * mit dem Zwischenspeicher als Notnagel, sondern umgekehrt.
 *
 * Das ist gefahrlos, weil Foxi keine fremden Inhalte anzeigt: Es gibt nichts
 * Aktuelleres im Netz als das, was hier liegt. Neue Fassungen kommen über
 * eine neue `CACHE`-Nummer herein.
 */

const CACHE = 'foxi-v0.1.0';

const SCHALE = [
    './',
    'index.html',
    'manifest.webmanifest',
    'src/styles/stamm/variables.css',
    'src/styles/farben.css',
    'src/styles/stamm/base.css',
    'src/styles/foxi.css',
    'src/app.js',
    'src/texte.js',
    'src/logik.js',
    'src/db.js',
    'src/zustand.js',
    'src/version.js',
    'src/ui/schale.js',
    'src/ui/liste.js',
    'src/ui/katalog.js',
    'src/ui/mehr.js',
    'src/daten/katalog.json',
    'src/daten/rezepte.json',
    'icons/foxi.svg',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/maskable-512.png',
    'icons/apple-touch-icon.png'
];

self.addEventListener('install', (ereignis) => {
    ereignis.waitUntil(
        caches.open(CACHE)
            .then((speicher) => speicher.addAll(SCHALE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (ereignis) => {
    ereignis.waitUntil(
        caches.keys()
            .then((namen) => Promise.all(
                namen.filter((name) => name !== CACHE).map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (ereignis) => {
    const anfrage = ereignis.request;
    if (anfrage.method !== 'GET') return;

    const adresse = new URL(anfrage.url);
    /* Fremde Adressen gehen Foxi nichts an. Es stellt keine – und wenn doch
       einmal eine entstünde, soll sie jedenfalls nicht auch noch hier
       zwischengespeichert werden. */
    if (adresse.origin !== self.location.origin) return;

    /* Ein Seitenaufruf ohne Netz landet auf der zwischengespeicherten
       Startseite; alles andere ist bei einer Ein-Seiten-App ein Fehler. */
    if (anfrage.mode === 'navigate') {
        ereignis.respondWith(
            caches.match('index.html').then((treffer) => treffer || fetch(anfrage))
        );
        return;
    }

    ereignis.respondWith(
        caches.match(anfrage).then((treffer) => {
            if (treffer) return treffer;
            return fetch(anfrage).then((antwort) => {
                if (antwort && antwort.ok && antwort.type === 'basic') {
                    const kopie = antwort.clone();
                    caches.open(CACHE).then((speicher) => speicher.put(anfrage, kopie));
                }
                return antwort;
            });
        })
    );
});
