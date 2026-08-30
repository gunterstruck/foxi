/**
 * IndexedDB – der einzige Ort, an dem Foxi etwas ablegt.
 *
 * Kein localStorage: Der Katalog ist rund 40 KB und wächst mit jeder
 * Kaufhistorie; localStorage ist dafür zu klein und blockiert außerdem den
 * Hauptfaden. Kein Server: siehe README.
 *
 * Die Zugriffe sind bewusst schlicht gehalten – `getAll`, `put`, `delete` –,
 * weil WebKit bei allem Ausgefalleneren (Cursor über Indizes in
 * verschachtelten Transaktionen) über die Jahre am meisten Eigenheiten
 * gezeigt hat.
 */

export const DB_NAME = 'foxi';
export const DB_VERSION = 1;

export const SPEICHER = {
    ARTIKEL: 'artikel',
    LISTE: 'liste',
    KATEGORIEN: 'kategorien',
    REZEPTE: 'rezepte',
    EINSTELLUNGEN: 'einstellungen'
};

let verbindung = null;

export function oeffne() {
    if (verbindung) return Promise.resolve(verbindung);
    return new Promise((erfuellen, ablehnen) => {
        const anfrage = indexedDB.open(DB_NAME, DB_VERSION);
        anfrage.onupgradeneeded = () => {
            const db = anfrage.result;
            if (!db.objectStoreNames.contains(SPEICHER.ARTIKEL)) {
                db.createObjectStore(SPEICHER.ARTIKEL, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SPEICHER.LISTE)) {
                db.createObjectStore(SPEICHER.LISTE, { keyPath: 'artikelId' });
            }
            if (!db.objectStoreNames.contains(SPEICHER.KATEGORIEN)) {
                db.createObjectStore(SPEICHER.KATEGORIEN, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SPEICHER.REZEPTE)) {
                db.createObjectStore(SPEICHER.REZEPTE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SPEICHER.EINSTELLUNGEN)) {
                db.createObjectStore(SPEICHER.EINSTELLUNGEN, { keyPath: 'schluessel' });
            }
        };
        anfrage.onsuccess = () => {
            verbindung = anfrage.result;
            /* Ein zweiter Tab, der eine neuere Fassung öffnen will, hängt sonst
               ewig an dieser Verbindung fest. */
            verbindung.onversionchange = () => { verbindung.close(); verbindung = null; };
            erfuellen(verbindung);
        };
        anfrage.onerror = () => ablehnen(anfrage.error);
        anfrage.onblocked = () => ablehnen(new Error('Datenbank durch ein anderes Fenster blockiert'));
    });
}

async function transaktion(speicher, modus, arbeit) {
    const db = await oeffne();
    return new Promise((erfuellen, ablehnen) => {
        const tx = db.transaction(speicher, modus);
        let ergebnis;
        tx.oncomplete = () => erfuellen(ergebnis);
        tx.onerror = () => ablehnen(tx.error);
        tx.onabort = () => ablehnen(tx.error || new Error('Transaktion abgebrochen'));
        ergebnis = arbeit(tx);
    });
}

function alsVersprechen(anfrage) {
    return new Promise((erfuellen, ablehnen) => {
        anfrage.onsuccess = () => erfuellen(anfrage.result);
        anfrage.onerror = () => ablehnen(anfrage.error);
    });
}

export async function alle(speicher) {
    const db = await oeffne();
    return alsVersprechen(db.transaction(speicher, 'readonly').objectStore(speicher).getAll());
}

export async function hole(speicher, schluessel) {
    const db = await oeffne();
    return alsVersprechen(db.transaction(speicher, 'readonly').objectStore(speicher).get(schluessel));
}

export function lege(speicher, wert) {
    return transaktion(speicher, 'readwrite', (tx) => { tx.objectStore(speicher).put(wert); });
}

export function legeViele(speicher, werte) {
    return transaktion(speicher, 'readwrite', (tx) => {
        const store = tx.objectStore(speicher);
        for (const wert of werte) store.put(wert);
    });
}

export function loesche(speicher, schluessel) {
    return transaktion(speicher, 'readwrite', (tx) => { tx.objectStore(speicher).delete(schluessel); });
}

export function leere(speicher) {
    return transaktion(speicher, 'readwrite', (tx) => { tx.objectStore(speicher).clear(); });
}

/** Nur für „Foxi zurücksetzen". Löscht die Datenbank vollständig. */
export function loescheDatenbank() {
    if (verbindung) { verbindung.close(); verbindung = null; }
    return new Promise((erfuellen, ablehnen) => {
        const anfrage = indexedDB.deleteDatabase(DB_NAME);
        anfrage.onsuccess = () => erfuellen();
        anfrage.onerror = () => ablehnen(anfrage.error);
        anfrage.onblocked = () => erfuellen(); // andere Tabs schließen sie später
    });
}
