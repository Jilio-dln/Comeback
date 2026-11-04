/* Comeback: kleine IndexedDB-wrapper.
 * De lokale database blijft altijd de bron waarmee de app werkt (ook offline).
 * Elke schrijfactie meldt welke records veranderd zijn (DB.onChange), zodat de
 * synchronisatie ze later naar Supabase kan sturen. Voorbeelddata (sample) telt nooit mee. */
window.DB = (() => {
  const NAME = 'comeback';
  const VERSION = 2;
  const STORES = ['checks', 'workouts', 'activities', 'settings'];
  // Workouts en activiteiten hebben een lokaal volgnummer (id) én een wereldwijd unieke sleutel (uid)
  const UID_STORES = ['workouts', 'activities'];
  let dbPromise;
  let hook = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result, t = req.transaction;
        if (!db.objectStoreNames.contains('checks')) db.createObjectStore('checks', { keyPath: 'date' });
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
        }
        if (!db.objectStoreNames.contains('activities')) {
          db.createObjectStore('activities', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
        }
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        // v2: uid-index en een wachtrij van nog te synchroniseren wijzigingen
        UID_STORES.forEach(s => { const os = t.objectStore(s); if (!os.indexNames.contains('uid')) os.createIndex('uid', 'uid'); });
        if (!db.objectStoreNames.contains('outbox')) db.createObjectStore('outbox', { keyPath: 'k' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('Sluit de app in andere tabbladen en probeer opnieuw.'));
    });
    return dbPromise;
  }

  const newUid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  // De sleutel waaronder een record gesynchroniseerd wordt
  const syncKey = (store, v) => store === 'checks' ? v.date : store === 'settings' ? v.key : v.uid;
  function prep(store, v) {
    if (UID_STORES.includes(store) && v && !v.uid && !v.sample) v.uid = newUid();
    return v;
  }

  function tx(store, mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      let result;
      const req = fn(t.objectStore(store), r => { result = r; });
      if (req) req.onsuccess = () => { result = req.result; };
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }

  // Meld veranderde records (zonder voorbeelddata) aan de synchronisatie
  function notify(store, recs) {
    if (!hook) return;
    const keys = recs.filter(r => r && !r.sample).map(r => syncKey(store, r)).filter(k => k != null);
    if (keys.length) { try { hook(store, keys); } catch (_) { /* sync mag de app nooit breken */ } }
  }

  // Verwijderen: eerst het record lezen, zodat we de sync-sleutel kennen
  function delMany(store, keys) {
    return tx(store, 'readwrite', (s, set) => {
      const gone = [];
      set(gone);
      keys.forEach(k => {
        const g = s.get(k);
        g.onsuccess = () => { if (g.result) gone.push(g.result); s.delete(k); };
      });
    });
  }

  const api = {
    stores: STORES,
    uidStores: UID_STORES,
    newUid,
    syncKey,
    onChange: fn => { hook = fn; },
    all: store => tx(store, 'readonly', s => s.getAll()),
    get: (store, key) => tx(store, 'readonly', s => s.get(key)),
    put: async (store, value) => { prep(store, value); const id = await tx(store, 'readwrite', s => s.put(value)); notify(store, [value]); return id; },
    del: async (store, key) => { const gone = await delMany(store, [key]); notify(store, gone); },
    clear: async store => {
      const gone = await tx(store, 'readwrite', (s, set) => { const all = s.getAll(); all.onsuccess = () => { set(all.result); s.clear(); }; });
      notify(store, gone || []);
    },
    bulkPut: async (store, values) => { values.forEach(v => prep(store, v)); await tx(store, 'readwrite', s => { values.forEach(v => s.put(v)); }); notify(store, values); },
    bulkDel: async (store, keys) => { const gone = await delMany(store, keys); notify(store, gone); },
    setSetting: async (key, value) => { await tx('settings', 'readwrite', s => s.put({ key, value })); notify('settings', [{ key }]); },

    // Zonder melding aan de sync (gebruikt door de sync zelf, bij het binnenhalen)
    raw: {
      put: (store, value) => tx(store, 'readwrite', s => s.put(value)),
      del: (store, key) => tx(store, 'readwrite', s => s.delete(key)),
      clear: store => tx(store, 'readwrite', s => { s.clear(); }),
      byUid: (store, uid) => tx(store, 'readonly', s => s.index('uid').get(uid))
    },

    // Wachtrij: { k: 'store|sleutel', store, key, n (tijdstempel van de laatste wijziging) }
    outbox: {
      add: entries => tx('outbox', 'readwrite', s => { entries.forEach(e => s.put({ k: `${e.store}|${e.key}`, store: e.store, key: e.key, n: Date.now() + Math.random() })); }),
      all: () => tx('outbox', 'readonly', s => s.getAll()),
      count: () => tx('outbox', 'readonly', s => s.count()),
      // Alleen weghalen als er intussen geen nieuwere wijziging bijkwam
      done: entries => tx('outbox', 'readwrite', s => {
        entries.forEach(e => { const g = s.get(e.k); g.onsuccess = () => { if (g.result && g.result.n === e.n) s.delete(e.k); }; });
      }),
      remove: ks => tx('outbox', 'readwrite', s => { ks.forEach(k => s.delete(k)); }),
      clear: () => tx('outbox', 'readwrite', s => { s.clear(); })
    }
  };
  return api;
})();
