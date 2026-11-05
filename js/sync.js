/* Comeback: inloggen (Supabase Auth) en synchronisatie met Supabase Postgres.
 *
 * Werkwijze (offline eerst):
 *  - De app leest en schrijft altijd lokaal (IndexedDB). Elke wijziging komt in een wachtrij (outbox).
 *  - Met internet en een sessie stuurt de sync de wachtrij naar de tabel user_records (push)
 *    en haalt hij wijzigingen van je andere toestellen op (pull).
 *  - Per record wint de laatste wijziging. Een lokale wijziging die nog niet verstuurd is,
 *    wordt nooit overschreven door een oudere versie van de server.
 *  - Eerste keer inloggen op een toestel: eerst alles van de server ophalen, daarna wat
 *    alleen op dit toestel staat uploaden (zo gaat er niets verloren).
 *
 * Geen externe bibliotheek: Supabase Auth (GoTrue) en de database-API (PostgREST)
 * spreken we rechtstreeks aan met fetch. Zo blijft de app klein en werkt ze offline.
 */
window.Sync = (() => {
  const ENV = window.COMEBACK_ENV || {};
  const BASE = String(ENV.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const KEY = String(ENV.SUPABASE_ANON_KEY || '').trim();
  const TABLE = 'user_records';
  const LS_AUTH = 'comeback-auth';
  const LS_META = 'comeback-sync';
  // Instellingen die bij dit toestel horen en dus nooit gesynchroniseerd worden
  const LOCAL_ONLY = new Set(['demo', 'seeded', 'lastExport', 'backupBeforeV4', 'backupBeforeV5', 'backupBeforeV6', 'activeWorkout', 'dataVersion']);
  const STORES = ['checks', 'workouts', 'activities', 'settings'];
  const CHUNK = 200;

  const configured = () => !!(BASE && KEY);
  const lsGet = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (_) { return null; } };
  const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (_) { } };

  let session = lsGet(LS_AUTH);     // { access_token, refresh_token, expires_at, user: { id, email } }
  let meta = lsGet(LS_META) || {};  // { userId, initialDone, lastPulledAt, lastSyncAt }
  const state = { status: 'idle', error: null, pending: 0 };
  const listeners = new Set();
  let onRemoteChange = null, onAuthLost = null;
  let running = false, again = false, timer = null, started = false;

  const saveSession = s => { session = s; lsSet(LS_AUTH, s); };
  const saveMeta = () => lsSet(LS_META, meta);
  const emit = () => listeners.forEach(fn => { try { fn({ ...state }); } catch (_) { } });
  async function refreshPending() { try { state.pending = await DB.outbox.count(); } catch (_) { } emit(); }

  class AuthError extends Error { constructor(msg, code) { super(msg); this.code = code; } }

  // Foutmeldingen van Supabase in begrijpelijk Nederlands
  function nice(err, fallback) {
    const m = String((err && (err.msg || err.error_description || err.message || err.error)) || '').toLowerCase();
    if (!navigator.onLine || m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) return 'Geen verbinding. Probeer opnieuw zodra je online bent.';
    if (m.includes('invalid login credentials') || m.includes('invalid_grant')) return 'E-mailadres of wachtwoord klopt niet.';
    if (m.includes('email not confirmed')) return 'Je e-mailadres is nog niet bevestigd. Open eerst de uitnodigingsmail.';
    if (m.includes('rate limit') || m.includes('too many')) return 'Te veel pogingen. Wacht even en probeer opnieuw.';
    if (m.includes('should be different')) return 'Kies een ander wachtwoord dan je vorige.';
    if (m.includes('password') && (m.includes('at least') || m.includes('weak') || m.includes('short'))) return 'Dit wachtwoord is te zwak. Gebruik minstens 8 tekens.';
    if (m.includes('expired') || m.includes('otp')) return 'Deze link is verlopen of al gebruikt. Vraag een nieuwe aan.';
    if (m.includes('relation') && m.includes('does not exist')) return 'De tabel user_records bestaat nog niet. Voer eerst het SQL-script uit in Supabase.';
    return fallback || 'Er ging iets mis. Probeer het opnieuw.';
  }

  async function req(path, { method = 'GET', body, token, headers = {} } = {}) {
    const h = { apikey: KEY, ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    if (body !== undefined) h['Content-Type'] = 'application/json';
    const res = await fetch(BASE + path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
    let data = null;
    const text = await res.text();
    if (text) { try { data = JSON.parse(text); } catch (_) { data = { message: text }; } }
    if (!res.ok) { const e = new Error((data && (data.msg || data.error_description || data.message || data.error)) || `HTTP ${res.status}`); e.status = res.status; e.body = data; throw e; }
    return data;
  }

  function storeSession(d) {
    const expires_at = d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600);
    const user = d.user ? { id: d.user.id, email: d.user.email } : (session && session.user) || null;
    saveSession({ access_token: d.access_token, refresh_token: d.refresh_token, expires_at, user });
    return session;
  }

  /* ---------------- Auth ---------------- */
  async function signIn(email, password) {
    try {
      const d = await req('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
      return storeSession(d).user;
    } catch (e) { throw new AuthError(nice(e.body || e, 'Inloggen lukte niet.')); }
  }

  let refreshing = null;
  async function refresh() {
    if (!session || !session.refresh_token) throw new AuthError('Niet ingelogd', 'nosession');
    if (refreshing) return refreshing;
    refreshing = (async () => {
      try {
        const d = await req('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: session.refresh_token } });
        return storeSession(d);
      } catch (e) {
        // 400/401: de sessie is ingetrokken of verlopen. Netwerkfout: gewoon later opnieuw.
        if (e.status === 400 || e.status === 401 || e.status === 403) { saveSession(null); throw new AuthError('Je sessie is verlopen. Log opnieuw in.', 'expired'); }
        throw e;
      } finally { refreshing = null; }
    })();
    return refreshing;
  }

  async function token() {
    if (!session) throw new AuthError('Niet ingelogd', 'nosession');
    if (!session.expires_at || session.expires_at - 60 < Date.now() / 1000) await refresh();
    return session.access_token;
  }

  // Database-verzoek met automatische vernieuwing van het toegangstoken
  async function api(path, opts = {}) {
    try { return await req(path, { ...opts, token: await token() }); }
    catch (e) {
      if (e.status === 401) { await refresh(); return req(path, { ...opts, token: session.access_token }); }
      throw e;
    }
  }

  async function signOut() {
    const t = session && session.access_token;
    saveSession(null);
    if (t && navigator.onLine) { try { await req('/auth/v1/logout', { method: 'POST', token: t }); } catch (_) { } }
    state.status = 'idle'; state.error = null; emit();
  }

  const redirectUrl = () => location.origin + location.pathname;
  async function recover(email) {
    try { await req(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirectUrl())}`, { method: 'POST', body: { email } }); }
    catch (e) { throw new AuthError(nice(e.body || e, 'De mail kon niet verstuurd worden.')); }
  }

  async function setPassword(password) {
    try {
      const u = await req('/auth/v1/user', { method: 'PUT', body: { password }, token: await token() });
      if (u && u.id) saveSession({ ...session, user: { id: u.id, email: u.email } });
    } catch (e) { throw new AuthError(nice(e.body || e, 'Het wachtwoord kon niet bewaard worden.')); }
  }

  // Link uit een uitnodigings- of herstelmail: #access_token=…&type=invite|recovery (of #error=…)
  async function consumeRedirect() {
    const h = location.hash.slice(1);
    if (!/(^|&)(access_token|error)=/.test(h)) return null;
    const p = new URLSearchParams(h);
    history.replaceState(null, '', location.pathname + location.search + '#vandaag');
    if (p.get('error')) return { error: nice({ message: `${p.get('error_code') || ''} ${p.get('error_description') || p.get('error')}` }, 'De link werkt niet meer. Vraag een nieuwe aan.') };
    storeSession({ access_token: p.get('access_token'), refresh_token: p.get('refresh_token'), expires_at: +p.get('expires_at') || 0, expires_in: +p.get('expires_in') || 3600 });
    try {
      const u = await req('/auth/v1/user', { token: session.access_token });
      saveSession({ ...session, user: { id: u.id, email: u.email } });
    } catch (e) { saveSession(null); return { error: nice(e.body || e, 'De link werkt niet meer. Vraag een nieuwe aan.') }; }
    return { type: p.get('type') || 'magiclink', user: session.user };
  }

  /* ---------------- Lokale gegevens lezen en schrijven ---------------- */
  async function readLocal(store, key) {
    if (store === 'settings') { const r = await DB.get('settings', key); return r ? { value: r.value } : null; }
    if (store === 'checks') { const r = await DB.get('checks', key); return r && !r.sample ? r : null; }
    const r = await DB.raw.byUid(store, key);
    return r && !r.sample ? r : null;
  }
  function toRow(store, key, local) {
    let data = null;
    if (local) {
      if (store === 'settings') data = local.value === undefined ? null : local.value;
      else { data = { ...local }; if (DB.uidStores.includes(store)) delete data.id; }
    }
    return { user_id: session.user.id, store, key: String(key), data, deleted: !local };
  }
  async function applyRow(row) {
    const { store, key } = row;
    if (!STORES.includes(store)) return false;
    if (store === 'settings') {
      if (LOCAL_ONLY.has(key)) return false;
      if (row.deleted) await DB.raw.del('settings', key); else await DB.raw.put('settings', { key, value: row.data });
      return true;
    }
    if (store === 'checks') {
      if (row.deleted) await DB.raw.del('checks', key); else await DB.raw.put('checks', { ...row.data, date: key, sample: false });
      return true;
    }
    const local = await DB.raw.byUid(store, key);
    if (row.deleted) { if (local) await DB.raw.del(store, local.id); return !!local; }
    const v = { ...row.data, uid: key, sample: false };
    delete v.id;
    if (local) v.id = local.id;
    await DB.raw.put(store, v);
    return true;
  }

  /* ---------------- Push en pull ---------------- */
  async function push() {
    const items = await DB.outbox.all();
    if (!items.length) return 0;
    for (let i = 0; i < items.length; i += CHUNK) {
      const chunk = items.slice(i, i + CHUNK);
      const rows = [];
      for (const it of chunk) rows.push(toRow(it.store, it.key, await readLocal(it.store, it.key)));
      await api(`/rest/v1/${TABLE}?on_conflict=user_id,store,key`, {
        method: 'POST', body: rows, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }
      });
      await DB.outbox.done(chunk);
    }
    return items.length;
  }

  // full = alles ophalen en de server laten winnen (eerste keer op dit toestel)
  async function pull(full) {
    const pending = new Set((await DB.outbox.all()).map(o => o.k));
    // Kleine overlap tegen gelijktijdige schrijfacties; opnieuw toepassen is onschadelijk
    const since = !full && meta.lastPulledAt ? new Date(Date.parse(meta.lastPulledAt) - 10000).toISOString() : null;
    const seen = new Set(), drop = [];
    let changed = false, maxTs = meta.lastPulledAt || null, offset = 0;
    for (;;) {
      const q = `/rest/v1/${TABLE}?select=store,key,data,deleted,updated_at&order=updated_at.asc,store.asc,key.asc&limit=1000&offset=${offset}` +
        (since ? `&updated_at=gt.${encodeURIComponent(since)}` : '');
      const rows = await api(q);
      for (const row of rows) {
        const k = `${row.store}|${row.key}`;
        seen.add(k);
        if (!maxTs || row.updated_at > maxTs) maxTs = row.updated_at;
        if (pending.has(k)) { if (full) drop.push(k); else continue; }
        if (await applyRow(row)) changed = true;
      }
      if (rows.length < 1000) break;
      offset += rows.length;
    }
    if (drop.length) await DB.outbox.remove(drop);
    meta.lastPulledAt = maxTs;
    saveMeta();
    return { changed, seen };
  }

  // Eerste synchronisatie op dit toestel: server eerst, daarna wat alleen hier staat
  async function initialSync() {
    const { changed, seen } = await pull(true);
    const add = [];
    for (const store of STORES) {
      const all = await DB.all(store);
      for (const r of all) {
        if (r.sample) continue;
        if (store === 'settings' && LOCAL_ONLY.has(r.key)) continue;
        if (DB.uidStores.includes(store) && !r.uid) { r.uid = DB.newUid(); await DB.raw.put(store, r); }
        const key = DB.syncKey(store, r);
        if (key != null && !seen.has(`${store}|${key}`)) add.push({ store, key });
      }
    }
    if (add.length) await DB.outbox.add(add);
    await push();
    meta.initialDone = true;
    saveMeta();
    return changed;
  }

  async function syncNow() {
    if (!configured() || !session || !session.user) return;
    if (!navigator.onLine) { state.status = 'offline'; emit(); return; }
    if (running) { again = true; return; }
    running = true;
    state.status = 'syncing'; state.error = null; emit();
    try {
      // Gegevens van een ander account op dit toestel: nooit automatisch uploaden.
      // De app moet eerst de lokale gegevens wissen (resetLocal) na bevestiging.
      if (meta.userId && meta.userId !== session.user.id) { state.status = 'blocked'; state.error = 'Op dit toestel staan gegevens van een ander account.'; return; }
      let changed;
      if (!meta.initialDone) { meta = { userId: session.user.id }; saveMeta(); changed = await initialSync(); }
      else { await push(); changed = (await pull(false)).changed; }
      meta.lastSyncAt = Date.now(); saveMeta();
      state.status = 'ok';
      if (changed && onRemoteChange) await onRemoteChange();
    } catch (e) {
      if (e instanceof AuthError && (e.code === 'expired' || e.code === 'nosession')) {
        state.status = 'signedout'; state.error = e.message;
        if (onAuthLost) onAuthLost(e.message);
      } else {
        state.status = navigator.onLine ? 'error' : 'offline';
        state.error = nice(e.body || e, 'Synchroniseren lukte niet. De app probeert het later opnieuw.');
      }
    } finally {
      running = false;
      await refreshPending();
      if (again) { again = false; schedule(500); }
    }
  }

  function schedule(ms = 1500) {
    clearTimeout(timer);
    timer = setTimeout(syncNow, ms);
  }

  // Elke lokale wijziging komt in de wachtrij, ook vóór het inloggen
  DB.onChange((store, keys) => {
    const list = keys.filter(k => !(store === 'settings' && LOCAL_ONLY.has(k))).map(key => ({ store, key: String(key) }));
    if (!list.length || !configured()) return;
    DB.outbox.add(list).then(() => { refreshPending(); if (started && session) schedule(); });
  });

  function start(opts = {}) {
    onRemoteChange = opts.onRemoteChange || null;
    onAuthLost = opts.onAuthLost || null;
    if (!configured() || started) return;
    started = true;
    window.addEventListener('online', () => schedule(300));
    window.addEventListener('offline', () => { state.status = 'offline'; emit(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') schedule(300); });
    refreshPending();
    schedule(200);
  }

  return {
    configured,
    session: () => session,
    user: () => (session && session.user) || null,
    lastUserId: () => meta.userId || null,
    lastSyncAt: () => meta.lastSyncAt || null,
    state: () => ({ ...state }),
    subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    // Ander account op dit toestel: lokale gegevens en wachtrij wissen
    resetLocal: async () => { for (const s of STORES) await DB.raw.clear(s); await DB.outbox.clear(); meta = {}; saveMeta(); await refreshPending(); },
    signIn, signOut, recover, setPassword, consumeRedirect, syncNow, start, schedule,
    // Een Supabase Edge Function aanroepen als de ingelogde gebruiker (bv. de AI-coach)
    callFunction: async (name, body) => {
      if (!configured() || !session) throw new Error('Log in om deze functie te gebruiken.');
      if (!navigator.onLine) throw new Error('Geen verbinding. De coach werkt alleen online.');
      try { return await api(`/functions/v1/${encodeURIComponent(name)}`, { method: 'POST', body }); }
      catch (e) {
        if (e.status === 404) throw new Error('De coach is nog niet geïnstalleerd in Supabase (Edge Function "coach").');
        if (e.status === 429) throw new Error('Even te veel vragen. Probeer het zo opnieuw.');
        throw new Error((e.body && (e.body.error || e.body.message)) || nice(e.body || e, 'De coach is nu niet bereikbaar. Je planning blijft gewoon werken.'));
      }
    }
  };
})();
