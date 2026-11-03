/* Comeback: kleine IndexedDB-wrapper */
window.DB = (() => {
  const NAME = 'comeback';
  const VERSION = 1;
  const STORES = ['checks', 'workouts', 'activities', 'settings'];
  let dbPromise;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('checks')) db.createObjectStore('checks', { keyPath: 'date' });
        if (!db.objectStoreNames.contains('workouts')) {
          db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
        }
        if (!db.objectStoreNames.contains('activities')) {
          db.createObjectStore('activities', { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
        }
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function tx(store, mode, fn) {
    return open().then(db => new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      let result;
      if (req) req.onsuccess = () => { result = req.result; };
      t.oncomplete = () => resolve(result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    }));
  }

  return {
    stores: STORES,
    all: store => tx(store, 'readonly', s => s.getAll()),
    get: (store, key) => tx(store, 'readonly', s => s.get(key)),
    put: (store, value) => tx(store, 'readwrite', s => s.put(value)),
    del: (store, key) => tx(store, 'readwrite', s => s.delete(key)),
    clear: store => tx(store, 'readwrite', s => { s.clear(); }),
    bulkPut: (store, values) => tx(store, 'readwrite', s => { values.forEach(v => s.put(v)); }),
    bulkDel: (store, keys) => tx(store, 'readwrite', s => { keys.forEach(k => s.delete(k)); }),
    setSetting: (key, value) => tx('settings', 'readwrite', s => s.put({ key, value }))
  };
})();
