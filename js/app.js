/* Comeback: app-logica */
(() => {
  'use strict';

  const C = window.APP_CONFIG;
  const APP_VERSION = '2.0.0';
  const MAX_PAIN = C.painRule.maxDuring;
  const S = {
    checks: [], workouts: [], activities: [], settings: {},
    ui: { woView: null, statsWeek: 7, calMonth: null, lineRange: 30, weightEx: null, editProfile: false, summary: null, undo: null }
  };
  const main = document.getElementById('app');

  /* ================= Hulpfuncties ================= */
  const $ = (sel, el = document) => el.querySelector(sel);
  const pad = n => String(n).padStart(2, '0');
  const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const startOfWeek = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const weekKey = d => dkey(startOfWeek(d));
  const daysBetween = (a, b) => Math.round((b - a) / 86400000);
  const isoWeek = d => {
    const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 86400000 + 1) / 7);
  };
  const DAY = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  const DAY_S = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
  const DAY_LETTER = ['Z', 'M', 'D', 'W', 'D', 'V', 'Z'];
  const MONTH = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  const MON = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const fmtLong = d => `${DAY[d.getDay()]} ${d.getDate()} ${MONTH[d.getMonth()]}`;
  const fmtShort = k => { const d = typeof k === 'string' ? parseKey(k) : k; return `${d.getDate()} ${MON[d.getMonth()]}`; };
  const fmtDay = k => { const d = parseKey(k); return `${DAY[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
  const fmtFull = k => { const d = parseKey(k); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`; };
  const relDay = k => {
    const diff = daysBetween(parseKey(k), today());
    return diff === 0 ? 'vandaag' : diff === 1 ? 'gisteren' : diff === -1 ? 'morgen' : fmtShort(k);
  };
  const relLong = k => {
    const diff = daysBetween(today(), parseKey(k));
    if (diff === 0) return 'Vandaag';
    if (diff === 1) return 'Morgen';
    if (diff === -1) return 'Gisteren';
    return diff > 0 ? `Over ${diff} dagen` : `${-diff} dagen geleden`;
  };
  const fmtTime = ts => { const d = new Date(ts); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fmtSec = s => s >= 60 ? `${Math.floor(s / 60)}:${pad(s % 60)}` : `${s} s`;
  const fmtClock = s => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => { if (v === null || v === undefined || v === '') return null; const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
  const fmtNum = n => n == null ? '–' : String(Math.round(n * 100) / 100).replace('.', ',');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const sum = arr => arr.reduce((a, b) => a + (b || 0), 0);
  const level = v => v <= 2 ? 'low' : v <= 4 ? 'mid' : 'high';
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ================= Iconen ================= */
  const I = {
    home: '<path d="M3.5 10.5L12 4l8.5 6.5V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    dumbbell: '<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
    chart: '<path d="M5 20V11M11 20V5M17 20v-6M3 20h18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.5-4 3.8-6 8-6s7.5 2 8 6"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    chevL: '<path d="M15 18l-6-6 6-6"/>',
    chevR: '<path d="M9 18l6-6-6-6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    alert: '<path d="M12 3.5L2.5 20h19z"/><path d="M12 10v4.5M12 17.5h.01"/>',
    ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5l3.8 2.8-1.4 4.4H9.6l-1.4-4.4zM12 3v4.5M15.8 10.3l4.5-1.4M14.4 14.7l2.7 3.8M9.6 14.7l-2.7 3.8M8.2 10.3L3.7 8.9"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    bolt: '<path d="M13 2.5L4.5 14H11l-1 7.5L19.5 10H13z"/>',
    hold: '<rect x="6" y="5" width="4" height="14" rx="1.5"/><rect x="14" y="5" width="4" height="14" rx="1.5"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    move: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M9 15.5h6M13 13.5l2 2-2 2"/>',
    skip: '<path d="M5 5l9 7-9 7zM18 5v14"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    magic: '<path d="M5 19L17 7M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 12l.7 1.3L21 14l-1.3.7L19 16l-.7-1.3L17 14l1.3-.7z"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M7.5 15h9"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    paste: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    flame: '<path d="M12 21c-4 0-6.5-2.6-6.5-6 0-3.5 3-5.5 3.5-9 2 1.5 3 3.5 3 5 1-1 1.5-2 1.5-3.5 2.5 2 5 4.5 5 7.5 0 3.4-2.5 6-6.5 6z"/>',
    whistle: '<circle cx="9" cy="14" r="5"/><path d="M12.5 10.5L20 5v4l-6 4"/>'
  };
  const icon = (n, cls = '') => `<svg class="ic ${n === 'play' ? 'fill' : ''} ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[n] || ''}</svg>`;
  const iconBtn = (name, action, label, extra = '') =>
    `<button class="icon-btn" data-action="${action}" aria-label="${esc(label)}" ${extra}>${icon(name)}</button>`;

  /* ================= Thema (light / dark) ================= */
  const darkQuery = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function themePref() { try { return localStorage.getItem('comeback-theme') || 'auto'; } catch (_) { return 'auto'; } }
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  function applyTheme() {
    const p = themePref();
    const dark = p === 'dark' || (p === 'auto' && darkQuery && darkQuery.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0a0a0b' : '#e9eff3');
  }
  function setTheme(p) {
    try { localStorage.setItem('comeback-theme', p); } catch (_) { }
    applyTheme();
    render({ keepScroll: true });
  }
  if (darkQuery) {
    const onChange = () => { if (themePref() === 'auto') { applyTheme(); } };
    darkQuery.addEventListener ? darkQuery.addEventListener('change', onChange) : darkQuery.addListener(onChange);
  }
  applyTheme();

  /* ================= Data ================= */
  async function loadAll() {
    const [checks, workouts, activities, settings] = await Promise.all(DB.stores.map(s => DB.all(s)));
    S.checks = checks;
    S.workouts = workouts;
    S.activities = activities;
    S.settings = Object.fromEntries(settings.map(r => [r.key, r.value]));
  }
  async function setSetting(key, value) {
    S.settings[key] = value;
    await DB.setSetting(key, value);
  }
  const profile = () => ({ ...C.profile, rbfaName: C.rbfa.player, ...(S.settings.profile || {}) });
  const phaseObj = id => C.phases.find(p => p.id === id) || C.phases[0];
  const currentPhase = () => S.settings.phase || C.phases[0].id;
  const checkFor = k => S.checks.find(c => c.date === k);
  const lastCheck = () => S.checks.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  const workoutsOn = k => S.workouts.filter(w => w.date === k);
  const activitiesOn = k => S.activities.filter(a => a.date === k);
  const inWeek = (k, wk) => weekKey(parseKey(k)) === wk;

  /* ================= RBFA-wedstrijden ================= */
  const fixtures = () => S.settings.fixtures || [];
  const fixtureOn = k => fixtures().find(f => f.date === k);
  function fixtureSpan() {
    const f = fixtures();
    if (!f.length) return null;
    return { first: f[0].date, last: f[f.length - 1].date };
  }
  const isMine = name => name && name.toLowerCase().includes(C.rbfa.team.toLowerCase());
  const played = f => f.hs != null && f.as != null;
  function fixtureResult(f) {
    if (!played(f)) return null;
    const mine = isMine(f.home) ? f.hs : f.as, other = isMine(f.home) ? f.as : f.hs;
    return mine > other ? 'win' : mine < other ? 'loss' : 'draw';
  }
  const opponent = f => isMine(f.home) ? f.away : f.home;
  const nice = s => s.replace(/\b([A-ZÀ-Ý]{2,})\b/g, w => w.length <= 4 ? w : w.charAt(0) + w.slice(1).toLowerCase());

  /* ================= Schema ================= */
  const satMatchWeek = d => (S.settings.satMatchWeeks || []).includes(weekKey(d));
  const itemKey = it => it.type === 'session' ? `session:${it.id}` : it.type;
  const overrides = () => S.settings.overrides || {};

  // Standaardschema van een dag (zonder jouw eigen wijzigingen)
  function basePlan(date, phaseId = currentPhase(), opts = {}) {
    const useFixtures = opts.fixtures !== false;
    const wd = date.getDay(), k = dkey(date);
    const span = useFixtures ? fixtureSpan() : null;
    const covered = !!(span && k >= span.first && k <= span.last);
    let sat = opts.satMatch;
    if (sat === undefined) sat = satMatchWeek(date) || (covered && !!fixtureOn(dkey(addDays(startOfWeek(date), 5))));
    const alt = sat && C.weekWithSaturdayMatch && C.weekWithSaturdayMatch[wd];
    let items = (alt || C.week[wd] || []).filter(it => !it.phases || it.phases.includes(phaseId)).map(it => ({ ...it }));
    if (covered) {
      const f = fixtureOn(k);
      items = items.filter(it => it.type !== 'match');
      if (f) items.push({ type: 'match', fixture: f });
    }
    const daily = (C.daily && C.daily[phaseId]) || [];
    daily.slice().reverse().forEach(id => {
      if (!items.some(it => it.type === 'session' && it.id === id)) items = [{ type: 'session', id, note: 'Dagelijks in deze fase' }, ...items];
    });
    if (!items.length) items =[{ type: 'rest', note: covered && wd === 0 ? 'Geen match dit weekend' : undefined }];
    return items;
  }

  // Schema inclusief verplaatste, overgeslagen en toegevoegde items
  function planDetail(date) {
    const k = dkey(date);
    const base = basePlan(date);
    const ov = overrides()[k] || {};
    const removed = ov.removed || {};
    const items = base.filter(it => !removed[itemKey(it)]);
    (ov.added || []).forEach(a => { if (!items.some(x => itemKey(x) === itemKey(a))) items.push({ ...a }); });
    const off = base.filter(it => removed[itemKey(it)]).map(it => ({ item: it, reason: removed[itemKey(it)] }));
    const order = { session: 0, training: 1, match: 2, rest: 3 };
    items.sort((a, b) => order[a.type] - order[b.type]);
    return { items: items.filter(it => it.type !== 'rest' || items.length === 1), off };
  }
  const planFor = date => planDetail(date).items;

  function plyoStep() {
    const steps = C.sessions.PLYO.steps.length;
    const s = S.settings.plyoStep;
    if (s && s !== 'auto') return clamp(+s, 1, steps);
    const since = (currentPhase() === 'f3' && S.settings.phaseSince) || phaseObj('f3').start;
    return clamp(Math.floor(daysBetween(parseKey(since), today()) / 7) + 1, 1, steps);
  }

  function sessionItems(key, phaseId = currentPhase(), step = plyoStep()) {
    const s = C.sessions[key];
    if (!s) return [];
    if (s.steps) return s.steps[clamp(step, 1, s.steps.length) - 1].items;
    return s.items.filter(it => !it.phases || it.phases.includes(phaseId));
  }
  const setCount = it => Array.isArray(it.sets) ? it.sets[0] : it.sets;
  const sessionTitle = key => key === 'PLYO' ? `Plyo · stap ${plyoStep()}` : C.sessions[key].name;
  function sessionStats(key) {
    const items = sessionItems(key);
    let sets = 0, secs = 0;
    items.forEach(x => {
      const ex = C.exercises[x.ex];
      const n = setCount(x) * (ex.perSide ? 2 : 1);
      sets += n;
      secs += n * ((ex.rest || C.defaultRest) + (ex.kind === 'hold' ? ex.duration : 35));
    });
    return { exercises: items.length, sets, minutes: Math.max(5, Math.round(secs / 60 / 5) * 5) };
  }

  function prescription(it, ex) {
    const sets = Array.isArray(it.sets) ? `${it.sets[0]}–${it.sets[1]}` : it.sets;
    let amount;
    if (ex.kind === 'reps') amount = ex.repsText || (ex.reps[0] === ex.reps[1] ? ex.reps[0] : `${ex.reps[0]}–${ex.reps[1]}`);
    else if (ex.kind === 'distance') amount = `${ex.distance} m`;
    else { const d = ex.duration; amount = Array.isArray(d) ? `${d[0]}–${d[1]} s` : `${d} s`; }
    let s = `${sets} × ${amount}`;
    if (ex.perSide) s += ` per ${ex.sideWord || 'kant'}`;
    if (it.setLabels) s += ` (${it.setLabels.join(' → ')})`;
    if (ex.tempo) s += ` · tempo ${ex.tempo}`;
    return s;
  }

  function itemMeta(it) {
    if (it.type === 'session') {
      const s = C.sessions[it.id];
      const st = sessionStats(it.id);
      const sub = it.id === 'PLYO' ? s.steps[plyoStep() - 1].title : s.subtitle;
      return { icon: s.icon || 'dumbbell', title: sessionTitle(it.id), sub: `${sub} · ${st.exercises} oef. · ${st.sets} sets`, note: it.note, short: s.short || it.id, stats: st, subtitle: sub };
    }
    if (it.type === 'training') return { icon: 'whistle', title: 'Clubtraining', sub: it.time || '', note: it.note, short: 'TR' };
    if (it.type === 'match') {
      const f = it.fixture;
      if (f) {
        const score = played(f) ? ` · ${f.hs} - ${f.as}` : '';
        return { icon: 'ball', title: `${isMine(f.home) ? 'Thuis' : 'Uit'} tegen ${nice(opponent(f))}`, sub: `${f.time || ''}${score}${f.comp ? ' · ' + f.comp : ''}`, note: it.note, short: '⚽', cls: 'match' };
      }
      return { icon: 'ball', title: 'Match', sub: 'Log je minuten en hoe het voelde', note: it.note, short: '⚽', cls: 'match' };
    }
    return { icon: 'moon', title: 'Rustdag', sub: 'Wandelen, mobiliteit en goed slapen', note: it.note, short: 'rust' };
  }

  function itemDone(it, k) {
    if (it.type === 'session') return workoutsOn(k).some(w => w.sessionKey === it.id);
    if (it.type === 'training' || it.type === 'match') return activitiesOn(k).some(a => a.type === it.type);
    return false;
  }

  // Gemiste sessies van de afgelopen 7 dagen (niet gedaan, niet later ingehaald, niet overgeslagen)
  function missedItems() {
    const t = today(), tk = dkey(t), out = [];
    for (let i = 7; i >= 1; i--) {
      const d = addDays(t, -i), k = dkey(d);
      planFor(d).forEach(it => {
        if (it.type !== 'session') return;
        const s = C.sessions[it.id];
        if (!s || s.catchUp === false || itemDone(it, k)) return;
        if (S.workouts.some(w => w.sessionKey === it.id && w.date > k && w.date <= tk)) return;
        out.push({ date: k, item: it });
      });
    }
    return out;
  }

  function morningWarning() {
    const t = checkFor(dkey(today()));
    const y = checkFor(dkey(addDays(today(), -1)));
    if (!t || !y) return null;
    const out = [];
    if (t.left > y.left) out.push(`links ${y.left} → ${t.left}`);
    if (t.right > y.right) out.push(`rechts ${y.right} → ${t.right}`);
    return out.length ? out : null;
  }

  function warningHtml(w) {
    return `<div class="alert">${icon('alert')}<div><strong>Ochtendscore hoger dan gisteren</strong>
      ${esc(w.join(' · '))}. Zet vandaag een stap terug: minder gewicht of volume, geen plyo of sprints, en kies de lichtere variant.
      Blijft de score hoger, neem dan een rustdag en overleg met je kinesist.</div></div>`;
  }

  /* ================= Plannen wijzigen ================= */
  async function saveOverrides(all, msg, undoable = true) {
    const before = clone(overrides());
    await setSetting('overrides', all);
    S.ui.undo = undoable ? before : null;
    render({ keepScroll: true });
    if (msg) toast(msg, undoable ? { action: 'undo', label: 'Ongedaan' } : null);
  }
  function editOv(all, k, fn) {
    const o = all[k] ? { removed: { ...(all[k].removed || {}) }, added: [...(all[k].added || [])] } : { removed: {}, added: [] };
    fn(o);
    if (!Object.keys(o.removed).length && !o.added.length) delete all[k]; else all[k] = o;
  }
  const cleanItem = it => { const c = { type: it.type }; if (it.id) c.id = it.id; if (it.time) c.time = it.time; return c; };

  function findItem(k, key) { return planFor(parseKey(k)).find(x => itemKey(x) === key); }

  function moveItem(fromK, key, toK) {
    const it = findItem(fromK, key);
    if (!it) return;
    const all = clone(overrides());
    if (it.extra) {
      editOv(all, fromK, o => { o.added = o.added.filter(a => itemKey(a) !== key); });
      editOv(all, toK, o => { o.added.push({ ...cleanItem(it), extra: true, note: `Verplaatst van ${fmtDay(fromK)}` }); });
      closeSheet();
      saveOverrides(all, `${itemMeta(it).title} staat nu op ${fmtDay(toK)}`);
      return;
    }
    const origin = it.from || fromK;
    if (it.from) editOv(all, fromK, o => { o.added = o.added.filter(a => itemKey(a) !== key); });
    if (toK === origin) {
      editOv(all, origin, o => { delete o.removed[key]; });
    } else {
      editOv(all, origin, o => { o.removed[key] = `moved:${toK}`; });
      editOv(all, toK, o => {
        o.added = o.added.filter(a => itemKey(a) !== key);
        o.added.push({ ...cleanItem(it), from: origin, note: `Verplaatst van ${fmtDay(origin)}` });
      });
    }
    closeSheet();
    saveOverrides(all, `${itemMeta(it).title} staat nu op ${fmtDay(toK)}`);
  }

  function skipItem(k, key) {
    const it = findItem(k, key);
    if (!it) return;
    const all = clone(overrides());
    if (it.from) {
      editOv(all, k, o => { o.added = o.added.filter(a => itemKey(a) !== key); if (!o.removed) o.removed = {}; });
      editOv(all, it.from, o => { o.removed[key] = 'skip'; });
    } else if (it.extra) {
      editOv(all, k, o => { o.added = o.added.filter(a => itemKey(a) !== key); });
    } else {
      editOv(all, k, o => { o.removed[key] = 'skip'; });
    }
    closeSheet();
    saveOverrides(all, `${itemMeta(it).title} overgeslagen`);
  }

  function restoreItem(k, key) {
    const all = clone(overrides());
    const reason = ((all[k] || {}).removed || {})[key];
    if (reason && reason.startsWith('moved:')) editOv(all, reason.slice(6), o => { o.added = o.added.filter(a => itemKey(a) !== key); });
    editOv(all, k, o => { delete o.removed[key]; });
    saveOverrides(all, 'Terug in de planning gezet');
  }

  function addSessionTo(k, id) {
    const all = clone(overrides());
    if (planFor(parseKey(k)).some(x => itemKey(x) === `session:${id}`)) { toast('Die sessie staat al op deze dag'); return; }
    editOv(all, k, o => { o.added.push({ type: 'session', id, extra: true, note: 'Extra toegevoegd' }); });
    closeSheet();
    saveOverrides(all, `${sessionTitle(id)} toegevoegd op ${fmtDay(k)}`);
  }

  // Slimme planner: geeft voor de komende 7 dagen een score en een korte reden
  function suggestDays(key, fromK) {
    const t = today();
    // 's Avonds (vanaf 18 u) plant hij niet meer op vandaag
    const first = new Date().getHours() >= 18 ? addDays(t, 1) : t;
    const start = parseKey(fromK) < first ? first : addDays(parseKey(fromK), 1);
    const id = key.startsWith('session:') ? key.slice(8) : null;
    const heavy = !!(id && C.sessions[id] && C.sessions[id].heavy);
    const out = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i), k = dkey(d);
      const items = planFor(d);
      const sessions = items.filter(x => x.type === 'session' && x.id !== 'ISO');
      const hasMatch = items.some(x => x.type === 'match');
      const nextMatch = planFor(addDays(d, 1)).some(x => x.type === 'match');
      const training = items.some(x => x.type === 'training');
      let score = 0;
      const why = [];
      if (items.some(x => itemKey(x) === key)) { score -= 100; why.push('staat er al'); }
      if (hasMatch) { score -= heavy ? 60 : 25; why.push('matchdag'); }
      if (heavy && nextMatch) { score -= 40; why.push('dag voor match'); }
      if (sessions.length) { score -= 18 * sessions.length; why.push(`al ${sessions.map(x => C.sessions[x.id].short).join('+')}`); }
      if (heavy && training) { score -= 6; why.push('clubtraining'); }
      if (!sessions.length && !hasMatch) { score += 20; why.push(training ? 'alleen training' : 'vrije dag'); }
      score -= i * 3;
      const items2 = items.filter(x => x.type !== 'rest').map(x => itemMeta(x).short).join(' + ');
      out.push({ k, d, score, why, label: items2 || 'rust' });
    }
    const best = out.reduce((a, b) => b.score > a.score ? b : a, out[0]);
    out.forEach(o => { o.best = o === best && o.score > -40; });
    return out;
  }

  function smartMove(fromK, key) {
    const best = suggestDays(key, fromK).find(o => o.best);
    if (!best) { toast('Geen goede dag gevonden. Kies zelf een dag.'); openMoveSheet(fromK, key); return; }
    moveItem(fromK, key, best.k);
  }

  function openMoveSheet(k, key) {
    const it = findItem(k, key);
    if (!it) return;
    const m = itemMeta(it);
    const days = suggestDays(key, k);
    openSheet(`<div class="sheet-head"><div><h3>${esc(m.title)} verplaatsen</h3><p>Nu op ${fmtDay(k)}. De slimme planner houdt rekening met matchen en je andere sessies.</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="day-pick">${days.map(o => `<button class="${o.best ? 'best' : ''}" data-action="move-to" data-from="${k}" data-key="${esc(key)}" data-to="${o.k}">
        <b>${DAY_S[o.d.getDay()]} ${o.d.getDate()} ${MON[o.d.getMonth()]}</b>
        <span>${esc(o.label)}</span>
        <span class="tag ${o.score >= 0 ? 'good' : 'bad'}">${o.best ? '★ Aanbevolen' : esc(o.why[0] || 'ok')}</span>
      </button>`).join('')}</div>
      <label class="flabel" for="move-date">Of kies een andere datum</label>
      <div class="row"><input class="input" type="date" id="move-date" min="${dkey(today())}"><button class="btn primary small" data-action="move-custom" data-from="${k}" data-key="${esc(key)}">Zet</button></div>
      <button class="btn danger block" data-action="skip-item" data-k="${k}" data-key="${esc(key)}">${icon('skip')} Overslaan</button>`);
  }

  function openItemSheet(k, key) {
    const it = findItem(k, key);
    if (!it) return;
    const m = itemMeta(it);
    const done = itemDone(it, k);
    const isToday = k === dkey(today());
    openSheet(`<div class="sheet-head"><div><h3>${esc(m.title)}</h3><p>${cap(fmtDay(k))} · ${esc(m.sub)}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="menu-list">
        ${it.type === 'session' && !done ? `<button data-action="start-session" data-key="${it.id}"><span class="li-icon">${icon('play')}</span><div>${isToday ? 'Nu starten' : 'Nu toch starten'}<small>Start de workout vandaag</small></div></button>` : ''}
        ${it.type !== 'session' ? `<button data-action="open-log" data-type="${it.type}" data-date="${k}"><span class="li-icon">${icon('edit')}</span><div>Loggen<small>Minuten, ondergrond, schoenen en pijn</small></div></button>` : ''}
        <button data-action="smart-move" data-k="${k}" data-key="${esc(key)}"><span class="li-icon">${icon('magic')}</span><div>Slim verplaatsen<small>Naar de beste dag in de komende week</small></div></button>
        <button data-action="open-move" data-k="${k}" data-key="${esc(key)}"><span class="li-icon">${icon('move')}</span><div>Kies zelf een dag<small>Met advies per dag</small></div></button>
        <button data-action="skip-item" data-k="${k}" data-key="${esc(key)}"><span class="li-icon amber">${icon('skip')}</span><div>Overslaan<small>${it.from ? 'Haalt hem uit de planning' : 'Telt niet als gemist'}</small></div></button>
      </div>`);
  }

  /* ================= Router ================= */
  const ROUTES = {
    vandaag: { label: 'Home', icon: 'home', render: renderToday },
    workout: { label: 'Workout', icon: 'dumbbell', render: renderWorkout },
    statistieken: { label: 'Stats', icon: 'chart', render: renderStats },
    profiel: { label: 'Profiel', icon: 'user', render: renderProfile }
  };
  let lastRoute = null;
  const currentRoute = () => { const r = location.hash.slice(1); return ROUTES[r] ? r : 'vandaag'; };

  function render({ keepScroll = false } = {}) {
    const r = currentRoute();
    const y = window.scrollY;
    if (r !== lastRoute && r === 'workout') S.ui.woView = null;
    ROUTES[r].render();
    renderTabbar(r);
    if (keepScroll || r === lastRoute) window.scrollTo(0, y);
    else window.scrollTo(0, 0);
    lastRoute = r;
  }

  function renderTabbar(active) {
    $('#tabbar').innerHTML = Object.entries(ROUTES).map(([key, r]) =>
      `<a class="tab ${key === active ? 'active' : ''}" href="#${key}" aria-label="${r.label}" ${key === active ? 'aria-current="page"' : ''}>${icon(r.icon)}<span class="lbl">${r.label}</span></a>`
    ).join('');
  }

  /* ================= Home (vandaag) ================= */
  function renderToday() {
    const t = today(), k = dkey(t), ph = phaseObj(currentPhase()), p = profile();
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'Goeiemorgen' : hr < 18 ? 'Goeiemiddag' : 'Goeienavond';
    const plan = planFor(t);
    const warn = morningWarning();
    const chk = checkFor(k);
    const base = chk || lastCheck() || { left: 0, right: 0 };
    const missed = missedItems();

    // Hoofditem voor de hero-kaart: eerste open sessie, anders match, anders iets anders
    const open = plan.filter(it => !itemDone(it, k));
    const heroItem = open.find(it => it.type === 'session') || open.find(it => it.type === 'match') || plan.find(it => it.type === 'session') || plan[0];
    const others = plan.filter(it => it !== heroItem);

    const wk = weekKey(t);
    const weekActs = S.activities.filter(a => inWeek(a.date, wk));
    const mins = sum(weekActs.map(a => +a.minutes));
    const last = lastCheck();
    const start = startOfWeek(t);
    let planned = 0, doneCount = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i), dk = dkey(d);
      const ss = planFor(d).filter(x => x.type === 'session');
      planned += ss.length;
      doneCount += ss.filter(x => itemDone(x, dk)).length;
    }

    main.innerHTML = `
      <header class="greet">
        <button class="avatar" data-action="go" data-to="profiel" aria-label="Profiel">${esc((p.name || '?').charAt(0).toUpperCase())}</button>
        <div class="greet-text"><h1>Hallo ${esc(p.name)}!</h1><p>${greet} · ${fmtLong(t)}</p></div>
        ${iconBtn(isDark() ? 'sun' : 'moon', 'toggle-theme', isDark() ? 'Lichte modus' : 'Donkere modus')}
        ${iconBtn('menu', 'open-menu', 'Menu')}
      </header>

      ${warn ? warningHtml(warn) : ''}
      ${heroHtml(heroItem, k)}

      ${missed.length ? `<section class="card">
        <div class="card-head"><div><h3>Gemist</h3><p class="muted small">Haal in of sla over. "Slim" kiest de beste dag.</p></div><span class="chip warn">${missed.length}</span></div>
        ${missed.slice(0, 3).map(m => {
          const mm = itemMeta(m.item), key = itemKey(m.item);
          return `<div class="plan-item">
            <div class="pi-icon match">${icon(mm.icon)}</div>
            <div class="pi-body"><strong>${esc(mm.title)}</strong><span>${cap(fmtDay(m.date))}</span></div>
            <div class="pi-actions">
              <button class="btn tiny soft" data-action="smart-move" data-k="${m.date}" data-key="${key}">${icon('magic')} Slim</button>
              <button class="more-btn" data-action="item-menu" data-k="${m.date}" data-key="${key}" aria-label="Meer opties">${icon('dots')}</button>
            </div>
          </div>`;
        }).join('')}
        ${missed.length > 3 ? `<p class="muted small" style="margin:4px">+ ${missed.length - 3} andere. Bekijk ze in de kalender.</p>` : ''}
      </section>` : ''}

      <section class="card tile tile-wide">
        <div class="left">
          <div class="tile-head">${icon('flame')} Sessies</div>
          <div class="v">${doneCount}<small>/ ${planned}</small></div>
          <span class="muted small">deze week · wk ${isoWeek(t)}</span>
        </div>
        <div class="mini-bars">${weekBarsHtml(t)}</div>
      </section>

      <section class="tile-grid">
        <button class="card tile" data-action="scroll-check" style="margin:0;text-align:left;color:inherit;font:inherit">
          <div class="tile-head">${icon('heart')} Ochtend</div>
          <div class="v">${last ? `${last.left}<small>/ ${last.right}</small>` : '–'}</div>
          <div class="s">${last ? `links / rechts, ${relDay(last.date)}` : 'nog geen check'}</div>
        </button>
        <button class="card tile" data-action="go" data-to="statistieken" style="margin:0;text-align:left;color:inherit;font:inherit">
          <div class="tile-head">${icon('clock')} Minuten</div>
          <div class="v">${mins}<small>min</small></div>
          <div class="s">gespeeld deze week</div>
        </button>
      </section>

      <section class="card" id="check-card">
        <div class="card-head">
          <div><h3>Ochtendcheck</h3><p class="muted small">Stijfheid bij het opstaan (achillespees en kuit)</p></div>
          ${chk ? `<span class="chip ok">${icon('check')} Ingevuld</span>` : ''}
        </div>
        <div class="check-grid">
          ${slider('L', 'Links', base.left)}
          ${slider('R', 'Rechts', base.right)}
        </div>
        <div class="scale-hint"><span>0 · niets</span><span>10 · heel stijf</span></div>
        <button class="btn primary block" data-action="save-check">${chk ? 'Bijwerken' : 'Opslaan'}</button>
      </section>

      <div class="section-title"><span>Ook vandaag</span><button class="card-link" data-action="open-day" data-k="${k}">Dagplanning ${icon('chevR')}</button></div>
      <section class="card">
        ${others.length ? others.map(it => planItemHtml(it, k)).join('') : `<p class="muted small" style="margin-bottom:4px">Niets anders gepland.</p>`}
        <label class="switch-row">
          <span><strong>Match op zaterdag deze week</strong><small>Sessie C schuift dan naar donderdag${fixtures().length ? ' (gebeurt automatisch met de RBFA-kalender)' : ''}</small></span>
          <input type="checkbox" class="switch" data-change="satmatch" ${satMatchWeek(t) ? 'checked' : ''}>
        </label>
      </section>
    `;
  }

  function heroHtml(it, k) {
    if (!it) return '';
    const m = itemMeta(it);
    const key = itemKey(it);
    const done = itemDone(it, k);
    const more = `<button class="btn ghost" style="flex:0 0 50px;padding:0" data-action="item-menu" data-k="${k}" data-key="${key}" aria-label="Plan aanpassen">${icon('dots')}</button>`;
    if (it.type === 'session') {
      const st = m.stats;
      return `<section class="hero-card">
        <div class="hero-art">${icon(m.icon)}</div>
        <p class="eyebrow">Training van vandaag · ${esc(phaseObj(currentPhase()).label)}</p>
        <h2>${esc(m.title)}</h2>
        <p>${esc(m.subtitle)}</p>
        <div class="chips"><span class="chip">${icon('dumbbell')} ${st.exercises} oefeningen</span><span class="chip">${icon('clock')} ±${st.minutes} min</span>${m.note ? `<span class="chip dark">${esc(m.note)}</span>` : ''}</div>
        <div class="hero-actions">
          ${done ? `<span class="hero-done">${icon('check')} Afgewerkt</span><button class="btn ghost" data-action="start-session" data-key="${it.id}">Opnieuw</button>`
            : `<button class="btn primary" data-action="start-session" data-key="${it.id}">${icon('play')} Start workout</button>${more}`}
        </div>
      </section>`;
    }
    if (it.type === 'match') {
      const f = it.fixture;
      return `<section class="hero-card">
        <div class="hero-art">${icon('ball')}</div>
        <p class="eyebrow">Matchdag${f && f.time ? ' · ' + esc(f.time) : ''}</p>
        <h2>${f ? esc(nice(opponent(f))) : 'Match'}</h2>
        <p>${f ? `${isMine(f.home) ? 'Thuis' : 'Uit'}${f.comp ? ' · ' + esc(f.comp) : ''}` : 'Log na de match je minuten en hoe het voelde.'}</p>
        <div class="chips">${f && played(f) ? `<span class="chip dark">${f.hs} - ${f.as}</span>` : ''}<span class="chip">${icon('heart')} pijn achteraf noteren</span></div>
        <div class="hero-actions">
          ${done ? `<span class="hero-done">${icon('check')} Gelogd</span>` : `<button class="btn primary" data-action="${f && played(f) ? 'open-minutes' : 'open-log'}" data-type="match" data-date="${k}">${icon('edit')} ${f && played(f) ? 'Minuten importeren' : 'Match loggen'}</button>${more}`}
        </div>
      </section>`;
    }
    if (it.type === 'training') {
      return `<section class="hero-card">
        <div class="hero-art">${icon('whistle')}</div>
        <p class="eyebrow">Vandaag</p><h2>Clubtraining</h2><p>${esc(it.time || '')}</p>
        <div class="chips"></div>
        <div class="hero-actions">${done ? `<span class="hero-done">${icon('check')} Gelogd</span>` : `<button class="btn primary" data-action="open-log" data-type="training" data-date="${k}">${icon('edit')} Training loggen</button>${more}`}</div>
      </section>`;
    }
    return `<section class="hero-card">
      <div class="hero-art">${icon('moon')}</div>
      <p class="eyebrow">Vandaag</p><h2>Rustdag</h2><p>${esc(m.note || 'Herstel is ook training: wandelen, mobiliteit en goed slapen.')}</p>
      <div class="chips"></div>
      <div class="hero-actions"><button class="btn ghost" data-action="open-day" data-k="${k}">${icon('plus')} Toch iets plannen</button></div>
    </section>`;
  }

  function slider(side, label, v) {
    return `<div class="slider-block">
      <div class="slider-top"><span>${label}</span><strong class="score ${level(v)}" id="chk-${side}-v">${v}</strong></div>
      <input type="range" min="0" max="10" step="1" value="${v}" id="chk-${side}" data-out="chk-${side}-v" data-score aria-label="Stijfheid ${label.toLowerCase()}" style="--p:${v * 10}%">
    </div>`;
  }

  function planItemHtml(it, k, { actions = true } = {}) {
    const m = itemMeta(it), done = itemDone(it, k), key = itemKey(it);
    const isPast = k < dkey(today());
    let btn = '';
    if (actions) {
      if (it.type === 'session') {
        btn = done ? `<span class="play-btn done" aria-label="Gedaan">${icon('check')}</span>`
          : `<button class="play-btn" data-action="start-session" data-key="${it.id}" aria-label="Start ${esc(m.title)}">${icon('play')}</button>`;
      } else if (it.type === 'training' || it.type === 'match') {
        btn = done ? `<span class="play-btn done">${icon('check')}</span>`
          : `<button class="btn tiny soft" data-action="open-log" data-type="${it.type}" data-date="${k}">Loggen</button>`;
      }
      if (it.type !== 'rest' && !done) btn += `<button class="more-btn" data-action="item-menu" data-k="${k}" data-key="${key}" aria-label="Plan aanpassen">${icon('dots')}</button>`;
    }
    const status = done ? '' : (isPast && it.type === 'session' && C.sessions[it.id].catchUp !== false ? '<em class="warn">Gemist</em>' : '');
    return `<div class="plan-item ${done ? 'is-done' : ''}">
      <div class="pi-icon ${m.cls || ''}">${icon(m.icon)}</div>
      <div class="pi-body"><strong>${esc(m.title)}</strong><span>${esc(m.sub)}</span>${m.note ? `<em>${esc(m.note)}</em>` : ''}${status}</div>
      <div class="pi-actions">${btn}</div>
    </div>`;
  }

  function weekBarsHtml(t) {
    const start = startOfWeek(t), tk = dkey(t);
    let html = '';
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i), k = dkey(d);
      const ss = planFor(d).filter(x => x.type === 'session');
      const did = workoutsOn(k).length;
      const val = Math.max(ss.length, did, 0.4);
      const missed = k < tk && ss.some(x => C.sessions[x.id].catchUp !== false && !itemDone(x, k));
      const cls = [did ? 'done' : '', missed && !did ? 'missed' : '', k === tk ? 'today' : ''].join(' ');
      html += `<button class="mini-bar ${cls}" data-action="open-day" data-k="${k}" aria-label="${fmtDay(k)}"><i style="height:${Math.round(val / 3 * 72) + 8}%"></i><span>${DAY_LETTER[d.getDay()]}</span></button>`;
    }
    return html;
  }

  async function saveCheck() {
    const k = dkey(today());
    const rec = { date: k, left: +$('#chk-L').value, right: +$('#chk-R').value, savedAt: Date.now(), sample: false };
    await DB.put('checks', rec);
    S.checks = S.checks.filter(c => c.date !== k).concat(rec);
    render({ keepScroll: true });
    toast(morningWarning() ? 'Opgeslagen. Je score is hoger dan gisteren: zet een stap terug.' : 'Ochtendcheck opgeslagen');
  }

  /* ================= Dagdetail (kalender) ================= */
  function openDay(k) {
    const d = parseKey(k);
    const { items, off } = planDetail(d);
    const f = fixtureOn(k);
    const chk = checkFor(k);
    const ws = workoutsOn(k), acts = activitiesOn(k);
    const isPastOrToday = k <= dkey(today());
    openSheet(`<div class="sheet-head"><div><h3>${cap(fmtDay(k))}</h3><p>${relLong(k)}${(S.settings.satMatchWeeks || []).includes(weekKey(d)) ? ' · week met zaterdagmatch' : ''}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>

      ${f ? `<div class="plan-item">
        <div class="pi-icon match">${icon('ball')}</div>
        <div class="pi-body"><strong>${esc(nice(f.home))} – ${esc(nice(f.away))}</strong><span>${esc(f.time || '')}${f.comp ? ' · ' + esc(f.comp) : ''}</span></div>
        ${played(f) ? `<span class="score-pill ${fixtureResult(f)}">${f.hs} - ${f.as}</span>` : ''}
      </div>
      ${played(f) && !acts.some(a => a.type === 'match') ? `<button class="btn soft block" style="margin:0 0 8px" data-action="open-minutes" data-date="${k}">${icon('paste')} Mijn minuten importeren</button>` : ''}` : ''}

      <div class="sheet-section">Planning</div>
      ${items.filter(it => !(f && it.type === 'match')).map(it => planItemHtml(it, k)).join('') || '<p class="muted small">Niets gepland.</p>'}
      ${off.map(o => {
        const m = itemMeta(o.item);
        const txt = o.reason === 'skip' ? 'Overgeslagen' : `Verplaatst naar ${fmtDay(o.reason.slice(6))}`;
        return `<div class="plan-item is-off"><div class="pi-icon">${icon(m.icon)}</div><div class="pi-body"><strong>${esc(m.title)}</strong><span>${esc(txt)}</span></div>
          <div class="pi-actions"><button class="btn tiny ghost" data-action="restore-item" data-k="${k}" data-key="${esc(itemKey(o.item))}">${icon('undo')} Herstel</button></div></div>`;
      }).join('')}

      ${chk || ws.length || acts.length ? `<div class="sheet-section">Gelogd</div>` : ''}
      ${chk ? `<div class="plan-item"><div class="pi-icon">${icon('heart')}</div><div class="pi-body"><strong>Ochtendcheck</strong><span>Links ${chk.left} · rechts ${chk.right}</span></div></div>` : ''}
      ${ws.map(w => `<div class="plan-item"><div class="pi-icon">${icon('dumbbell')}</div><div class="li-body pi-body" data-action="show-entry" data-store="workouts" data-id="${w.id}"><strong>${esc(w.title)}</strong><span>${sum((w.exercises || []).map(e => e.sets.length))} sets${w.finishedAt ? ' · ' + fmtTime(w.finishedAt) : ''}</span></div></div>`).join('')}
      ${acts.map(a => `<div class="plan-item"><div class="pi-icon ${a.type === 'match' ? 'match' : ''}">${icon(a.type === 'match' ? 'ball' : 'whistle')}</div><div class="li-body pi-body" data-action="show-entry" data-store="activities" data-id="${a.id}"><strong>${a.type === 'match' ? 'Match' : 'Clubtraining'}</strong><span>${a.minutes} min · ${esc(a.surface)} · pijn ${a.pain}</span></div></div>`).join('')}

      <div class="sheet-section">Toevoegen</div>
      <div class="chips">
        ${Object.keys(C.sessions).map(id => `<button class="chip" style="border:0" data-action="add-session" data-k="${k}" data-id="${id}">${icon('plus')} ${esc(C.sessions[id].short || id)}</button>`).join('')}
        ${isPastOrToday ? `<button class="chip" style="border:0" data-action="open-log" data-type="training" data-date="${k}">${icon('edit')} Training loggen</button><button class="chip" style="border:0" data-action="open-log" data-type="match" data-date="${k}">${icon('edit')} Match loggen</button>` : ''}
      </div>`);
  }

  /* ================= Workout ================= */
  const draft = () => S.settings.activeWorkout;
  let draftTimer = null;
  function saveDraft(now = false) {
    clearTimeout(draftTimer);
    const run = () => DB.setSetting('activeWorkout', S.settings.activeWorkout || null);
    if (now) return run();
    draftTimer = setTimeout(run, 300);
  }

  function lastPerformance(exId) {
    const ws = S.workouts.slice().sort((a, b) => (b.date.localeCompare(a.date)) || ((b.finishedAt || 0) - (a.finishedAt || 0)));
    for (const w of ws) {
      const e = (w.exercises || []).find(x => x.exId === exId && x.sets && x.sets.length);
      if (e) return { date: w.date, sets: e.sets };
    }
    return null;
  }

  function progressionReady(e, sets) {
    if (e.kind !== 'reps' || !e.target || e.load === 'band') return false;
    if (!e.progressAt && e.target[0] === e.target[1]) return false;
    const top = e.progressAt || e.target[1];
    const done = sets.filter(s => s.done);
    return done.length >= 2 && done.every(s => (num(s.reps) || 0) >= top && (num(s.pain) || 0) <= MAX_PAIN);
  }

  function buildExercise(it) {
    const ex = C.exercises[it.ex];
    const e = {
      exId: it.ex, name: ex.name, kind: ex.kind, load: ex.load, perSide: !!ex.perSide,
      presc: prescription(it, ex), cue: ex.cue || '', rest: ex.rest || C.defaultRest,
      target: ex.reps || null, repsText: ex.repsText || null, progressAt: ex.progressAt || null,
      duration: Array.isArray(ex.duration) ? ex.duration[0] : (ex.duration || null),
      distance: ex.distance || null, increment: ex.increment || 2.5,
      setLabels: it.setLabels || null, sets: [], bump: 0
    };
    const prev = lastPerformance(it.ex);
    e.prevReady = !!(prev && progressionReady(e, prev.sets.map(s => ({ ...s, done: true }))));
    if (e.prevReady && e.load === 'kg') e.bump = e.increment;
    const sides = e.perSide ? ['L', 'R'] : [null];
    for (let i = 0; i < setCount(it); i++) for (const side of sides) e.sets.push(newSet(e, i, side, prev));
    return e;
  }

  function newSet(e, idx, side, prev) {
    let weight = '';
    if (prev && (e.load === 'kg' || e.load === 'bw')) {
      const ws = prev.sets.filter(s => s.side === side).map(s => num(s.weight)).filter(v => v != null);
      if (ws.length) weight = String(Math.max(...ws) + e.bump).replace('.', ',');
    }
    return {
      idx, side, label: e.setLabels ? e.setLabels[idx] || null : null,
      reps: '', weight, duration: e.kind === 'hold' ? String(e.duration) : '',
      dist: e.kind === 'distance' ? String(e.distance) : '', pain: '', done: false
    };
  }

  async function startSession(key) {
    closeSheet();
    const cur = draft();
    if (cur) {
      if (cur.sessionKey === key && cur.date === dkey(today())) { S.ui.woView = 'active'; go('workout'); return; }
      if (!confirm(`Je hebt nog een workout bezig (${cur.title}). Die stoppen en een nieuwe starten?`)) return;
    }
    const w = {
      sessionKey: key, title: sessionTitle(key), phase: currentPhase(),
      date: dkey(today()), startedAt: Date.now(), current: 0,
      exercises: sessionItems(key).map(buildExercise)
    };
    S.settings.activeWorkout = w;
    await saveDraft(true);
    S.ui.summary = null;
    S.ui.woView = 'active';
    requestWakeLock();
    if (currentRoute() === 'workout') render(); else go('workout');
  }

  function renderWorkout() {
    const w = draft();
    if (w && S.ui.woView !== 'picker') return renderActive(w);
    const t = today(), k = dkey(t);
    const todays = planFor(t).filter(it => it.type === 'session');
    const firstOpen = todays.find(it => !itemDone(it, k)) || todays[0];
    const warn = morningWarning();
    const sm = S.ui.summary;

    main.innerHTML = `
      <header class="topbar">
        ${iconBtn('back', 'go', 'Terug', 'data-to="vandaag"')}
        <div class="topbar-title"></div>
        ${iconBtn('timer', 'rest-start', 'Rusttimer starten')}
      </header>
      <h1 class="page-title">Workout</h1>

      ${sm ? `<div class="alert ok">${icon('check')}<div><strong>Goed gedaan! ${esc(sm.title)} is opgeslagen</strong>
        ${sm.sets} sets in ${sm.minutes} min · hoogste pijn ${sm.maxPain ?? '–'}/10.
        ${sm.maxPain > MAX_PAIN ? 'Je pijn kwam boven 3: vul morgen zeker je ochtendcheck in.' : 'Vergeet morgen je ochtendcheck niet.'}</div></div>` : ''}

      ${w ? `<section class="card">
        <div class="card-head"><div><h3>Bezig: ${esc(w.title)}</h3><p class="muted small">Gestart om ${fmtTime(w.startedAt)} · oefening ${w.current + 1} van ${w.exercises.length}</p></div></div>
        <div class="row"><button class="btn ghost" data-action="wo-cancel">${icon('trash')} Stoppen</button><button class="btn primary" data-action="wo-resume">${icon('play')} Ga verder</button></div>
      </section>` : ''}

      ${warn ? warningHtml(warn) : ''}
      ${firstOpen && !w ? heroHtml(firstOpen, k) : ''}

      <div class="section-title"><span>Alle sessies</span><span class="muted small">${esc(phaseObj(currentPhase()).label)}</span></div>
      <section class="card">
        ${Object.keys(C.sessions).map(key => {
          const s = C.sessions[key];
          const st = sessionStats(key);
          const off = key === 'PLYO' && currentPhase() !== 'f3';
          return `<div class="session-row">
            <div class="pi-icon">${icon(s.icon || 'dumbbell')}</div>
            <div class="pi-body"><strong>${esc(sessionTitle(key))}</strong><span>${off ? 'Pas vanaf fase 3' : `${st.exercises} oef. · ${st.sets} sets · ±${st.minutes} min`}</span></div>
            <button class="play-btn" data-action="start-session" data-key="${key}" aria-label="Start ${esc(s.name)}">${icon('play')}</button>
          </div>`;
        }).join('')}
      </section>

      <div class="alert info">${icon('info')}<div><strong>Pijnregel</strong>${esc(C.painRule.text)} Krachtwerk doe je op ${esc(C.rpe)}.</div></div>
    `;
  }

  function fieldsFor(e) {
    const pain = { f: 'pain', l: 'Pijn', ph: '0', mode: 'numeric' };
    if (e.kind === 'reps') {
      const f = [{ f: 'reps', l: 'Herh.', ph: e.repsText || (e.target[0] === e.target[1] ? String(e.target[0]) : `${e.target[0]}–${e.target[1]}`), mode: 'numeric' }];
      if (e.load === 'kg') f.push({ f: 'weight', l: 'kg', ph: '0', mode: 'decimal' });
      if (e.load === 'bw') f.push({ f: 'weight', l: '+ kg', ph: '–', mode: 'decimal' });
      return f.concat(pain);
    }
    if (e.kind === 'hold') return [{ f: 'duration', l: 'sec', ph: String(e.duration), mode: 'numeric' }, { f: 'weight', l: 'kg', ph: '–', mode: 'decimal' }, pain];
    if (e.kind === 'time') return [{ f: 'duration', l: 'sec', ph: String(e.duration), mode: 'numeric' }, pain];
    return [{ f: 'dist', l: 'meter', ph: String(e.distance), mode: 'numeric' }, pain];
  }
  const hasTimer = e => e.kind === 'hold' || e.kind === 'time';

  function setsHtml(e) {
    const fields = fieldsFor(e);
    return e.sets.map((s, i) => `
      <div class="set-row ${s.done ? 'done' : ''}" style="--cols:${fields.length}">
        <div class="set-idx"><span>${esc(s.label || s.idx + 1)}</span>${s.side ? `<small>${s.side}</small>` : ''}</div>
        ${fields.map(fd => `<div class="field"><label>${fd.l}</label><input type="text" inputmode="${fd.mode}" autocomplete="off"
          data-set="${i}" data-f="${fd.f}" value="${esc(s[fd.f] ?? '')}" placeholder="${esc(fd.ph)}"
          class="${fd.f === 'pain' && num(s.pain) > MAX_PAIN ? 'pain-high' : ''}" aria-label="${fd.l} set ${s.idx + 1}${s.side ? ' ' + s.side : ''}"></div>`).join('')}
        <div class="set-actions">
          ${hasTimer(e) ? `<button class="round-sm" data-action="hold-start" data-i="${i}" aria-label="Timer starten">${icon('timer')}</button>` : ''}
          <button class="round-sm ${s.done ? 'on' : ''}" data-action="set-done" data-i="${i}" aria-label="Set afvinken">${icon('check')}</button>
        </div>
      </div>`).join('');
  }

  function setText(s, kind) {
    const w = num(s.weight);
    if (kind === 'reps') return `${num(s.reps) ?? '–'}${w ? ` × ${fmtNum(w)} kg` : ''}`;
    if (kind === 'hold' || kind === 'time') return `${num(s.duration) ?? '–'} s${w ? ` · ${fmtNum(w)} kg` : ''}`;
    return `${num(s.dist) ?? '–'} m`;
  }

  function prevHtml(e) {
    const prev = lastPerformance(e.exId);
    if (!prev) return e.load === 'kg' ? `<div class="prev"><span class="prev-l">Eerste keer</span>Kies een gewicht waarbij je nog 2–3 herhalingen over hebt (${esc(C.rpe)}).</div>` : '';
    const chips = prev.sets.map(s => {
      const p = num(s.pain);
      return `<span>${s.label ? esc(s.label) + ' ' : s.side ? s.side + ' ' : ''}${setText(s, e.kind)}${p != null ? ` <i class="${p > MAX_PAIN ? 'hi' : ''}">p${p}</i>` : ''}</span>`;
    }).join('');
    let tip = '';
    if (e.prevReady && e.load === 'kg') tip = `<p>Vorige keer haalde je overal ${e.progressAt || e.target[1]} herhalingen met pijn ≤ ${MAX_PAIN}. Het gewicht staat al +${fmtNum(e.bump)} kg hoger ingevuld.</p>`;
    else if (e.prevReady) tip = `<p>Vorige keer ging het vlot en pijnarm: maak het vandaag iets zwaarder.</p>`;
    return `<div class="prev"><span class="prev-l">Vorige keer · ${relDay(prev.date)}</span><div class="prev-chips">${chips}</div>${tip}</div>`;
  }

  function feedbackHtml(e) {
    let html = '';
    if (e.sets.some(s => num(s.pain) > MAX_PAIN)) {
      html += `<div class="alert">${icon('alert')}<div><strong>Pijn boven ${MAX_PAIN}/10</strong>
        Maak de oefening lichter (minder gewicht, minder herhalingen of een kleinere range) of stop ermee voor vandaag.</div></div>`;
    }
    if (progressionReady(e, e.sets)) {
      const top = e.progressAt || e.target[1];
      html += `<div class="alert ok">${icon('trend')}<div><strong>Klaar voor meer</strong>
        Je haalt ${top} herhalingen met pijn ≤ ${MAX_PAIN}. ${e.load === 'kg'
          ? `Verhoog volgende keer het gewicht met ${fmtNum(e.increment)} kg en begin weer rond ${e.target[0]} herhalingen.`
          : 'Maak het volgende keer zwaarder: houd een dumbbell vast of kies een moeilijkere variant.'}</div></div>`;
    }
    return html;
  }

  function renderActive(w) {
    w.current = clamp(w.current, 0, w.exercises.length - 1);
    const e = w.exercises[w.current], n = w.exercises.length;
    const allSets = w.exercises.flatMap(x => x.sets);
    const doneSets = allSets.filter(s => s.done).length;
    const kindLabel = { reps: 'Herhalingen', hold: 'Isometrische hold', time: 'Op tijd', distance: 'Afstand' }[e.kind];
    const kindIcon = { reps: 'dumbbell', hold: 'hold', time: 'timer', distance: 'bolt' }[e.kind];
    const warn = morningWarning();
    const last = w.current === n - 1;
    main.innerHTML = `
      <header class="topbar">
        ${iconBtn('back', 'wo-pause', 'Terug naar overzicht')}
        <div class="topbar-title"><strong>${esc(w.title)}</strong><small>Gestart om ${fmtTime(w.startedAt)}</small></div>
        ${iconBtn('dots', 'wo-menu', 'Opties')}
      </header>
      ${warn && w.current === 0 ? warningHtml(warn) : ''}

      <section class="wo-hero">
        <div class="hero-art">${icon(kindIcon)}</div>
        <p class="eyebrow">Oefening ${w.current + 1} van ${n} · ${kindLabel}</p>
        <h2>${esc(e.name)}</h2>
        <p class="presc">${esc(e.presc)}</p>
        ${e.cue ? `<p class="cue">${esc(e.cue)}</p>` : ''}
        <div class="chips">
          ${e.kind === 'reps' && e.load === 'kg' ? `<span class="chip dark">${esc(C.rpe)}</span>` : ''}
          <span class="chip">${icon('timer')} rust ${fmtSec(e.rest)}</span>
          <span class="chip">${icon('heart')} pijn max ${MAX_PAIN}</span>
        </div>
        <div class="progress-line"><i style="width:${allSets.length ? doneSets / allSets.length * 100 : 0}%"></i></div>
        <div class="wo-progress-top"><span>${doneSets}/${allSets.length} sets</span><span>${Math.round(allSets.length ? doneSets / allSets.length * 100 : 0)}%</span></div>
      </section>

      <section class="card">
        ${prevHtml(e)}
        <div id="ex-feedback">${feedbackHtml(e)}</div>
        <div class="sets" id="sets">${setsHtml(e)}</div>
        <div class="ex-tools"><button class="btn ghost small" data-action="wo-add-set">${icon('plus')} Set toevoegen</button></div>
      </section>

      <div class="wo-controls">
        <button class="ctrl" data-action="wo-prev" ${w.current === 0 ? 'disabled' : ''}>${icon('arrowL')}Vorige</button>
        <button class="ctrl main" data-action="rest-start">${icon('timer')}Rust</button>
        ${last ? `<button class="ctrl" data-action="wo-finish">${icon('check')}Afronden</button>`
          : `<button class="ctrl" data-action="wo-next">${icon('arrowR')}Volgende</button>`}
      </div>

      <section class="card overview">
        <div class="card-head"><h3>Oefeningen</h3><span class="chip">${n}</span></div>
        <ul>${w.exercises.map((x, i) => `<li class="${i === w.current ? 'cur' : ''}"><button data-action="wo-goto" data-i="${i}">${i + 1}. ${esc(x.name)}</button><span class="muted">${x.sets.filter(s => s.done).length}/${x.sets.length}</span></li>`).join('')}</ul>
        <button class="btn primary block" style="margin-top:12px" data-action="wo-finish">${icon('check')} Workout afronden</button>
      </section>
    `;
  }

  function onSetInput(inp) {
    const w = draft(); if (!w) return;
    const e = w.exercises[w.current];
    const s = e.sets[+inp.dataset.set];
    if (!s) return;
    s[inp.dataset.f] = inp.value.trim();
    if (inp.dataset.f === 'pain') inp.classList.toggle('pain-high', num(inp.value) > MAX_PAIN);
    $('#ex-feedback').innerHTML = feedbackHtml(e);
    saveDraft();
  }

  function toggleSet(i) {
    const w = draft(), e = w.exercises[w.current], s = e.sets[i];
    s.done = !s.done;
    if (s.done) {
      if (e.kind === 'reps' && s.reps === '' && e.target && e.target[0] === e.target[1]) s.reps = String(e.target[0]);
      if (hasTimer(e) && s.duration === '') s.duration = String(e.duration);
      if (!w.exercises.every(x => x.sets.every(y => y.done))) startRest(e.rest);
      if (num(s.pain) > MAX_PAIN) toast(`Pijn ${num(s.pain)}/10: maak de volgende set lichter of stop`);
    }
    saveDraft();
    render({ keepScroll: true });
  }

  function addSet() {
    const w = draft(), e = w.exercises[w.current];
    const last = e.sets[e.sets.length - 1];
    const idx = last ? last.idx + 1 : 0;
    (e.perSide ? ['L', 'R'] : [null]).forEach(side => {
      const s = newSet(e, idx, side, null);
      const same = e.sets.filter(x => x.side === side).pop();
      if (same) s.weight = same.weight;
      e.sets.push(s);
    });
    saveDraft();
    render({ keepScroll: true });
  }

  function gotoExercise(i) {
    const w = draft();
    w.current = clamp(i, 0, w.exercises.length - 1);
    saveDraft();
    render();
  }

  async function finishWorkout() {
    const w = draft(); if (!w) return;
    const all = w.exercises.flatMap(x => x.sets);
    const done = all.filter(s => s.done);
    if (!done.length) { if (!confirm('Je hebt nog geen sets afgevinkt. Toch opslaan als afgewerkte sessie?')) return; }
    else if (done.length < all.length && !confirm(`${all.length - done.length} sets zijn niet afgevinkt. Workout toch afronden?`)) return;
    const clean = s => ({
      idx: s.idx, side: s.side, label: s.label || null,
      reps: num(s.reps), weight: num(s.weight), duration: num(s.duration), dist: num(s.dist), pain: num(s.pain), done: true
    });
    const rec = {
      date: w.date, sessionKey: w.sessionKey, title: w.title, phase: w.phase,
      startedAt: w.startedAt, finishedAt: Date.now(), sample: false,
      exercises: w.exercises.map(x => ({ exId: x.exId, name: x.name, kind: x.kind, load: x.load, perSide: x.perSide, sets: x.sets.filter(s => s.done).map(clean) })).filter(x => x.sets.length)
    };
    rec.id = await DB.put('workouts', rec);
    S.workouts.push(rec);
    const pains = done.map(s => num(s.pain)).filter(v => v != null);
    S.ui.summary = { title: w.title, sets: done.length, minutes: Math.max(1, Math.round((rec.finishedAt - w.startedAt) / 60000)), maxPain: pains.length ? Math.max(...pains) : null };
    S.settings.activeWorkout = null;
    await saveDraft(true);
    stopRest();
    releaseWakeLock();
    S.ui.woView = 'picker';
    render();
    toast('Workout opgeslagen 💪');
  }

  async function cancelWorkout() {
    if (!confirm('Deze workout stoppen zonder op te slaan?')) return;
    S.settings.activeWorkout = null;
    await saveDraft(true);
    stopRest();
    releaseWakeLock();
    S.ui.woView = 'picker';
    render();
  }

  /* ---------- Rusttimer ---------- */
  const rest = { endAt: 0, total: 0, iv: null };
  const RING_S = 2 * Math.PI * 19;
  function startRest(sec = C.defaultRest) {
    rest.total = sec;
    rest.endAt = Date.now() + sec * 1000;
    const el = $('#rest-timer');
    el.innerHTML = `<div class="rest-inner">
      <svg class="rest-ring" viewBox="0 0 44 44"><circle class="ring-bg" cx="22" cy="22" r="19"/><circle class="ring-fg" id="rest-ring" cx="22" cy="22" r="19" stroke-dasharray="${RING_S}" stroke-dashoffset="0"/></svg>
      <div class="rest-txt"><small>Rust</small><strong id="rest-time">${fmtClock(sec)}</strong></div>
      <button class="chip-btn" data-action="rest-adj" data-d="-15">−15</button>
      <button class="chip-btn" data-action="rest-adj" data-d="15">+15</button>
      <button class="round-sm" data-action="rest-skip" aria-label="Rust overslaan">${icon('x')}</button>
    </div>`;
    el.hidden = false;
    clearInterval(rest.iv);
    rest.iv = setInterval(tickRest, 250);
    tickRest();
  }
  function tickRest() {
    const rem = rest.endAt - Date.now();
    if (rem <= 0) { stopRest(); signal(2); toast('Rust voorbij: volgende set!'); return; }
    const t = $('#rest-time'), ring = $('#rest-ring');
    if (t) t.textContent = fmtClock(Math.ceil(rem / 1000));
    if (ring) ring.setAttribute('stroke-dashoffset', String(RING_S * (1 - rem / (rest.total * 1000))));
  }
  function stopRest() { clearInterval(rest.iv); rest.iv = null; $('#rest-timer').hidden = true; }

  /* ---------- Hold-timer (isometrisch / op tijd) ---------- */
  let hold = null;
  function startHold(i) {
    const w = draft(), e = w.exercises[w.current], s = e.sets[i];
    const dur = num(s.duration) || e.duration || 45;
    stopRest();
    hold = { i, dur, phase: 'lead', endAt: Date.now() + 3000, startAt: 0, iv: null };
    const side = s.side === 'L' ? 'links' : s.side === 'R' ? 'rechts' : '';
    const ov = document.createElement('div');
    ov.className = 'hold-overlay';
    ov.id = 'hold';
    ov.innerHTML = `
      <p class="hold-label">${esc(e.name)}</p>
      <p class="hold-sub">Set ${s.idx + 1}${side ? ' · ' + side : ''} · pijn max ${MAX_PAIN}/10</p>
      <div class="hold-center"><div class="hold-time" id="hold-time">00:03</div><div class="hold-phase" id="hold-phase">Klaar maken…</div></div>
      <div class="hold-track"><i id="hold-bar"></i></div>
      <div class="hold-meta"><span id="hold-el">00:00</span><span id="hold-tot">${fmtClock(dur)}</span></div>
      <div class="wo-controls">
        <button class="ctrl" data-action="hold-cancel">${icon('x')}Stoppen</button>
        <button class="ctrl main" data-action="hold-done">${icon('check')}Klaar</button>
        <button class="ctrl" data-action="hold-add">${icon('plus')}+10 s</button>
      </div>`;
    document.body.appendChild(ov);
    hold.iv = setInterval(tickHold, 100);
    tickHold();
  }
  function tickHold() {
    if (!hold) return;
    const now = Date.now();
    let rem = hold.endAt - now;
    if (hold.phase === 'lead' && rem <= 0) {
      hold.phase = 'hold'; hold.startAt = now; hold.endAt = now + hold.dur * 1000; rem = hold.dur * 1000;
      signal(1);
      $('#hold-phase').textContent = 'Vasthouden';
    }
    if (hold.phase === 'hold' && rem <= 0) { completeHold(hold.dur); return; }
    $('#hold-time').textContent = fmtClock(Math.ceil(rem / 1000));
    if (hold.phase === 'hold') {
      const el = Math.floor((now - hold.startAt) / 1000);
      $('#hold-bar').style.width = `${Math.min(100, (now - hold.startAt) / (hold.dur * 10))}%`;
      $('#hold-el').textContent = fmtClock(el);
    }
  }
  function completeHold(seconds) {
    const w = draft(), e = w.exercises[w.current], s = e.sets[hold.i];
    closeHold();
    s.duration = String(seconds);
    s.done = true;
    signal(3);
    saveDraft();
    render({ keepScroll: true });
    if (!w.exercises.every(x => x.sets.every(y => y.done))) startRest(e.rest);
  }
  function closeHold() {
    if (hold) clearInterval(hold.iv);
    hold = null;
    const ov = $('#hold'); if (ov) ov.remove();
  }

  /* ---------- Geluid, trillen, scherm aan ---------- */
  let actx = null;
  function unlockAudio() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (_) { /* geen audio */ }
  }
  function signal(times = 1) {
    try { navigator.vibrate && navigator.vibrate(times === 1 ? 150 : [180, 90, 180, 90, 180].slice(0, times * 2 - 1)); } catch (_) { }
    if (!actx) return;
    for (let i = 0; i < times; i++) {
      const t0 = actx.currentTime + i * 0.22;
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = times === 1 ? 660 : 880;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(g).connect(actx.destination);
      o.start(t0); o.stop(t0 + 0.18);
    }
  }
  let wakeLock = null;
  async function requestWakeLock() {
    try { if ('wakeLock' in navigator && draft()) wakeLock = await navigator.wakeLock.request('screen'); } catch (_) { }
  }
  function releaseWakeLock() { try { wakeLock && wakeLock.release(); } catch (_) { } wakeLock = null; }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      if (draft()) requestWakeLock();
      if (rest.iv) tickRest();
      if (hold) tickHold();
    }
  });

  /* ================= Statistieken ================= */
  function renderStats() {
    const t = today();
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const ws = addDays(startOfWeek(t), -7 * i), k = dkey(ws);
      weeks.push({ start: ws, key: k, label: `W${isoWeek(ws)}`, value: S.workouts.filter(w => inWeek(w.date, k)).length });
    }
    const sel = clamp(S.ui.statsWeek, 0, 7);
    const sw = weeks[sel];
    const swActs = S.activities.filter(a => inWeek(a.date, sw.key));
    const swTrain = swActs.filter(a => a.type === 'training').length;
    const swMatch = swActs.filter(a => a.type === 'match').length;
    const swMin = sum(swActs.map(a => +a.minutes));

    const range = S.ui.lineRange;
    const labels = [], Lv = [], Rv = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = addDays(t, -i), c = checkFor(dkey(d));
      labels.push(fmtShort(d)); Lv.push(c ? c.left : null); Rv.push(c ? c.right : null);
    }
    const hasChecks = Lv.some(v => v != null) || Rv.some(v => v != null);
    const avg = arr => { const v = arr.filter(x => x != null); return v.length ? fmtNum(Math.round(sum(v) / v.length * 10) / 10) : '–'; };

    const exWithWeight = {};
    S.workouts.forEach(w => (w.exercises || []).forEach(e => {
      if (e.sets.some(s => num(s.weight) > 0)) exWithWeight[e.exId] = (C.exercises[e.exId] && C.exercises[e.exId].name) || e.name;
    }));
    const exIds = Object.keys(exWithWeight);
    if (!exIds.includes(S.ui.weightEx)) S.ui.weightEx = exIds[0] || null;
    let weightChart = `<p class="empty">Nog geen gewichten gelogd.</p>`, weightInfo = '';
    if (S.ui.weightEx) {
      const pts = S.workouts
        .map(w => { const e = (w.exercises || []).find(x => x.exId === S.ui.weightEx); if (!e) return null; const ws = e.sets.map(s => num(s.weight)).filter(v => v > 0); return ws.length ? { date: w.date, ts: w.finishedAt || 0, v: Math.max(...ws) } : null; })
        .filter(Boolean).sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts).slice(-20);
      const vals = pts.map(p => p.v);
      const lo = Math.max(0, Math.floor((Math.min(...vals) - 2) / 5) * 5), hi = Math.ceil((Math.max(...vals) + 2) / 5) * 5;
      weightChart = Charts.line({ labels: pts.map(p => fmtShort(p.date)), series: [{ name: 'kg', color: 'var(--line-1)', values: vals }], yMin: lo, yMax: hi, ticks: [lo, Math.round((lo + hi) / 2), hi], xTicks: 4 });
      const diff = vals[vals.length - 1] - vals[0];
      weightInfo = `<div class="chips" style="margin-top:12px"><span class="chip">Start ${fmtNum(vals[0])} kg</span><span class="chip dark">Nu ${fmtNum(vals[vals.length - 1])} kg</span>${diff ? `<span class="chip ok">${diff > 0 ? '+' : ''}${fmtNum(diff)} kg</span>` : ''}</div>`;
    }

    main.innerHTML = `
      <header class="topbar">
        ${iconBtn('back', 'go', 'Terug', 'data-to="vandaag"')}
        <div class="topbar-title"></div>
        ${iconBtn('calendar', 'scroll-cal', 'Naar kalender')}
      </header>
      <h1 class="page-title">Statistieken</h1>

      <section class="card">
        <div class="card-head"><div><h3>Sessies per week</h3><p class="muted small">Tik op een week voor details</p></div><span class="chip">${S.workouts.length} totaal</span></div>
        <div class="chart">${Charts.bars(weeks, { selected: sel, unit: sw.value === 1 ? 'sessie' : 'sessies' })}</div>
        <div class="week-detail">
          <span class="chip dark">${fmtShort(sw.start)} – ${fmtShort(addDays(sw.start, 6))}</span>
          <span class="chip">${sw.value} workouts</span><span class="chip">${swTrain} trainingen</span><span class="chip">${swMatch} matchen</span><span class="chip">${swMin} min</span>
        </div>
      </section>

      <section class="card" id="cal-card">${calendarHtml()}</section>

      ${seasonHtml()}

      <section class="card">
        <div class="card-head"><div><h3>Ochtendscore</h3><p class="muted small">Gemiddeld L ${avg(Lv)} · R ${avg(Rv)}</p></div>
          <div class="seg-mini">${[14, 30, 90].map(r => `<button class="${r === range ? 'on' : ''}" data-action="line-range" data-r="${r}">${r} d</button>`).join('')}</div></div>
        ${hasChecks ? `<div class="chart">${Charts.line({ labels, series: [{ name: 'Links', color: 'var(--line-1)', values: Lv }, { name: 'Rechts', color: 'var(--line-2)', values: Rv }], yMin: 0, yMax: 10, ticks: [0, 5, 10] })}</div>
        <div class="legend" style="margin-top:10px"><span><i style="background:var(--line-1)"></i>Links</span><span><i style="background:var(--line-2)"></i>Rechts</span></div>` : `<p class="empty">Nog geen ochtendchecks in deze periode.</p>`}
      </section>

      <section class="card">
        <div class="card-head"><div><h3>Gewicht per oefening</h3><p class="muted small">Zwaarste set per sessie</p></div></div>
        ${exIds.length ? `<select class="select" data-change="weight-ex" aria-label="Kies oefening">${exIds.map(id => `<option value="${id}" ${id === S.ui.weightEx ? 'selected' : ''}>${esc(exWithWeight[id])}</option>`).join('')}</select>` : ''}
        <div class="chart">${weightChart}</div>
        ${weightInfo}
      </section>

      <section class="card">
        <div class="card-head"><h3>Recent</h3><span class="chip">Workouts, trainingen, matchen</span></div>
        ${recentHtml(15)}
      </section>
    `;
  }

  function seasonHtml() {
    const fx = fixtures();
    const matches = S.activities.filter(a => a.type === 'match');
    const span = fixtureSpan();
    const seasonMatches = span ? matches.filter(a => a.date >= span.first && a.date <= span.last) : matches;
    const total = sum(seasonMatches.map(a => +a.minutes));
    const playedFx = fx.filter(played);
    const rows = playedFx.slice(-6).reverse().map(f => {
      const a = matches.find(m => m.date === f.date);
      return `<div class="list-item">
        <div class="li-icon ${fixtureResult(f) === 'win' ? 'green' : fixtureResult(f) === 'loss' ? 'amber' : ''}">${icon('ball')}</div>
        <div class="li-body" data-action="open-day" data-k="${f.date}"><strong>${esc(nice(opponent(f)))}</strong><span>${fmtShort(f.date)} · ${isMine(f.home) ? 'thuis' : 'uit'} · ${a ? `${a.minutes} min gespeeld` : 'nog geen minuten'}</span></div>
        <span class="score-pill ${fixtureResult(f)}">${f.hs} - ${f.as}</span>
      </div>`;
    }).join('');
    return `<section class="card">
      <div class="card-head"><div><h3>Seizoen ${esc(C.rbfa.teamLabel)}</h3><p class="muted small">${fx.length ? `${playedFx.length} van ${fx.length} matchen gespeeld` : 'Importeer de RBFA-kalender in je profiel'}</p></div>
        ${fx.length ? '' : `<button class="btn tiny soft" data-action="open-rbfa">Importeren</button>`}</div>
      <div class="tile-grid" style="margin-bottom:${rows ? 8 : 0}px">
        <div class="tile" style="background:var(--card-2);padding:12px"><div class="tile-head">${icon('clock')} Mijn minuten</div><div class="v" style="font-size:28px">${total}</div><div class="s">in ${seasonMatches.length} matchen</div></div>
        <div class="tile" style="background:var(--card-2);padding:12px"><div class="tile-head">${icon('trend')} Gemiddeld</div><div class="v" style="font-size:28px">${seasonMatches.length ? Math.round(total / seasonMatches.length) : 0}<small>min</small></div><div class="s">per match</div></div>
      </div>
      ${rows}
    </section>`;
  }

  function calendarHtml() {
    const t = today(), tk = dkey(t);
    const m = S.ui.calMonth || new Date(t.getFullYear(), t.getMonth(), 1);
    const start = startOfWeek(m);
    const wSet = new Set(S.workouts.map(w => w.date));
    const mSet = new Set(S.activities.filter(a => a.type === 'match').map(a => a.date).concat(fixtures().map(f => f.date)));
    const tSet = new Set(S.activities.filter(a => a.type === 'training').map(a => a.date));
    let cells = ['M', 'D', 'W', 'D', 'V', 'Z', 'Z'].map(d => `<div class="cal-wd">${d}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      if (i >= 35 && d.getMonth() !== m.getMonth()) break;
      const k = dkey(d);
      const sessions = planFor(d).filter(x => x.type === 'session' && x.id !== 'ISO');
      const missed = k < tk && sessions.some(x => !itemDone(x, k));
      const future = k > tk && sessions.length;
      const cls = [d.getMonth() !== m.getMonth() ? 'out' : '', wSet.has(k) ? 'w' : '', k === tk ? 'today' : ''].join(' ');
      cells += `<button class="cal-day ${cls}" data-action="open-day" data-k="${k}" aria-label="${fmtDay(k)}">${d.getDate()}<div class="cal-dots">${mSet.has(k) ? '<span class="d-m"></span>' : ''}${tSet.has(k) ? '<span class="d-t"></span>' : ''}${future ? '<span class="d-p"></span>' : ''}${missed ? '<span class="d-x"></span>' : ''}</div></button>`;
    }
    const doneDays = new Set([...wSet, ...S.activities.map(a => a.date)].filter(k => { const d = parseKey(k); return d.getMonth() === m.getMonth() && d.getFullYear() === m.getFullYear(); })).size;
    return `<div class="cal-head">
        ${iconBtn('chevL', 'cal-prev', 'Vorige maand')}
        <div style="text-align:center"><strong>${MONTH[m.getMonth()]} ${m.getFullYear()}</strong><div class="muted small">${doneDays} actieve ${doneDays === 1 ? 'dag' : 'dagen'} · tik op een dag</div></div>
        ${iconBtn('chevR', 'cal-next', 'Volgende maand')}
      </div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-legend"><span><i class="w"></i>Workout</span><span><i class="d-t"></i>Training</span><span><i class="d-m"></i>Match</span><span><i class="d-p"></i>Gepland</span><span><i class="d-x"></i>Gemist</span></div>`;
  }

  function entries() {
    const list = [];
    S.workouts.forEach(w => {
      const sets = sum((w.exercises || []).map(e => e.sets.length));
      const pains = (w.exercises || []).flatMap(e => e.sets.map(s => num(s.pain))).filter(v => v != null);
      list.push({
        store: 'workouts', id: w.id, date: w.date, ts: w.finishedAt || 0, icon: (C.sessions[w.sessionKey] || {}).icon || 'dumbbell', cls: '',
        title: w.title, sub: `${relDay(w.date)} · ${(w.exercises || []).length} oef. · ${sets} sets${pains.length ? ` · pijn max ${Math.max(...pains)}` : ''}`, sample: w.sample
      });
    });
    S.activities.forEach(a => list.push({
      store: 'activities', id: a.id, date: a.date, ts: a.createdAt || 0, icon: a.type === 'match' ? 'ball' : 'whistle', cls: a.type === 'match' ? 'amber' : 'green',
      title: a.type === 'match' ? (a.opponent ? `Match tegen ${nice(a.opponent)}` : 'Match') : 'Clubtraining',
      sub: `${relDay(a.date)} · ${a.minutes} min · ${a.surface} · ${a.shoes} · pijn ${a.pain}${a.note ? ' · ' + a.note : ''}`, sample: a.sample
    }));
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
  }

  function recentHtml(limit) {
    const list = entries().slice(0, limit);
    if (!list.length) return `<p class="empty">Nog niets gelogd.</p>`;
    return list.map(x => `<div class="list-item">
      <div class="li-icon ${x.cls}">${icon(x.icon)}</div>
      <div class="li-body" data-action="show-entry" data-store="${x.store}" data-id="${x.id}"><strong>${esc(x.title)}${x.sample ? '<span class="sample-tag">voorbeeld</span>' : ''}</strong><span>${esc(x.sub)}</span></div>
      <button class="li-del" data-action="del-entry" data-store="${x.store}" data-id="${x.id}" aria-label="Verwijderen">${icon('trash')}</button>
    </div>`).join('');
  }

  function showEntry(store, id) {
    const rec = S[store].find(x => x.id === id);
    if (!rec) return;
    if (store === 'activities') {
      openSheet(`<div class="sheet-head"><div><h3>${rec.type === 'match' ? (rec.opponent ? 'Tegen ' + esc(nice(rec.opponent)) : 'Match') : 'Clubtraining'}</h3><p>${cap(fmtDay(rec.date))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
        <div class="chips"><span class="chip dark">${rec.minutes} min</span>${rec.score ? `<span class="chip">${esc(rec.score)}</span>` : ''}${rec.role ? `<span class="chip">${esc(rec.role)}</span>` : ''}<span class="chip">${esc(rec.surface)}</span><span class="chip">${esc(rec.shoes)}</span><span class="chip">Pijn achteraf ${rec.pain}/10</span>${rec.source === 'rbfa' ? '<span class="chip ok">via RBFA</span>' : ''}</div>
        ${rec.note ? `<p class="note">${esc(rec.note)}</p>` : ''}`);
      return;
    }
    openSheet(`<div class="sheet-head"><div><h3>${esc(rec.title)}</h3><p>${cap(fmtDay(rec.date))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="chips" style="margin-bottom:8px">${rec.finishedAt && rec.startedAt ? `<span class="chip dark">${Math.round((rec.finishedAt - rec.startedAt) / 60000)} min</span>` : ''}<span class="chip">${esc(phaseObj(rec.phase).label)}</span></div>
      ${(rec.exercises || []).map(e => `<div class="detail-ex"><strong>${esc(e.name)}</strong><div class="prev-chips">${e.sets.map(s => `<span>${s.label ? esc(s.label) + ' ' : s.side ? s.side + ' ' : ''}${setText(s, e.kind)}${s.pain != null ? ` <i class="${s.pain > MAX_PAIN ? 'hi' : ''}">p${s.pain}</i>` : ''}</span>`).join('')}</div></div>`).join('') || '<p class="empty">Geen sets gelogd.</p>'}`);
  }

  async function deleteEntry(store, id) {
    if (!confirm('Dit item verwijderen?')) return;
    await DB.del(store, id);
    S[store] = S[store].filter(x => x.id !== id);
    render({ keepScroll: true });
    toast('Verwijderd');
  }

  /* ================= Profiel ================= */
  function renderProfile() {
    const p = profile(), ph = currentPhase(), crit = S.settings.criteria || {};
    const critDone = C.criteria.filter(c => crit[c.id]).length;
    const ed = S.ui.editProfile;
    const since = S.settings.phaseSince;
    const sampleCount = ['checks', 'workouts', 'activities'].reduce((n, s) => n + S[s].filter(x => x.sample).length, 0);
    const fx = fixtures();
    const tk = dkey(today());
    const next = fx.find(f => f.date >= tk && !played(f));
    const lastPlayed = fx.filter(played).pop();
    const theme = themePref();

    main.innerHTML = `
      <header class="topbar">
        ${iconBtn('back', 'go', 'Terug', 'data-to="vandaag"')}
        <div class="topbar-title"></div>
        <button class="icon-btn ${ed ? 'on' : ''}" data-action="toggle-edit" aria-label="Gegevens bewerken">${icon(ed ? 'x' : 'edit')}</button>
      </header>
      <h1 class="page-title">Profiel</h1>

      <section class="card">
        ${ed ? `<form id="profile-form">
          <div class="form-grid">
            <div class="full"><label class="flabel" for="pf-name">Naam</label><input class="input" id="pf-name" name="name" value="${esc(p.name)}" required></div>
            <div><label class="flabel" for="pf-age">Leeftijd</label><input class="input" id="pf-age" name="age" inputmode="numeric" value="${esc(p.age)}"></div>
            <div><label class="flabel" for="pf-pos">Positie</label><input class="input" id="pf-pos" name="position" value="${esc(p.position)}"></div>
            <div><label class="flabel" for="pf-h">Lengte (cm)</label><input class="input" id="pf-h" name="height" inputmode="numeric" value="${esc(p.height)}"></div>
            <div><label class="flabel" for="pf-w">Gewicht (kg)</label><input class="input" id="pf-w" name="weight" inputmode="decimal" value="${esc(fmtNum(num(p.weight)))}"></div>
            <div class="full"><label class="flabel" for="pf-team">Ploeg</label><input class="input" id="pf-team" name="team" value="${esc(p.team)}"></div>
            <div class="full"><label class="flabel" for="pf-rbfa">Naam op het wedstrijdblad (RBFA)</label><input class="input" id="pf-rbfa" name="rbfaName" value="${esc(p.rbfaName)}"></div>
            <div class="full"><label class="flabel" for="pf-c">Klachten</label><textarea class="input" id="pf-c" name="complaints" rows="2">${esc(p.complaints)}</textarea></div>
          </div>
          <button class="btn primary block" type="submit" style="margin-top:14px">${icon('check')} Opslaan</button>
        </form>` : `
          <div class="profile-top">
            <div class="avatar lg">${esc((p.name || '?').charAt(0).toUpperCase())}</div>
            <div><h2>${esc(p.name)}</h2><p class="muted">${esc(p.position)} · ${esc(p.team)}</p></div>
          </div>
          <div class="kv-grid">
            <div class="kv"><span>Leeftijd</span><strong>${esc(p.age)}</strong></div>
            <div class="kv"><span>Lengte</span><strong>${esc(p.height)}<small> cm</small></strong></div>
            <div class="kv"><span>Gewicht</span><strong>${esc(fmtNum(num(p.weight)))}<small> kg</small></strong></div>
          </div>
          <p class="note">${icon('heart')}<span>${esc(p.complaints)}</span></p>`}
      </section>

      <div class="section-title"><span>Weergave</span></div>
      <section class="card">
        <div class="seg" role="radiogroup" aria-label="Thema">
          ${[['auto', 'Automatisch'], ['light', 'Licht'], ['dark', 'Donker']].map(([v, l]) => `<label><input type="radio" name="theme" value="${v}" data-change="theme" ${theme === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
        </div>
        <p class="muted small" style="margin:8px 4px 0">Automatisch volgt de instelling van je gsm.</p>
      </section>

      <div class="section-title"><span>Herstelfase</span></div>
      <section class="card">
        ${C.phases.map(f => `<label class="phase-opt ${f.id === ph ? 'on' : ''}">
          <input type="radio" name="phase" value="${f.id}" data-change="phase" ${f.id === ph ? 'checked' : ''}>
          <div class="po-body"><strong>${esc(f.label)} · ${esc(f.title)}</strong><span>Standaard vanaf ${fmtFull(f.start)}</span><p>${esc(f.summary)}</p></div>
          <span class="radio-dot"></span>
        </label>`).join('')}
        <p class="muted small" style="margin:6px 4px 0">Je wisselt zelf van fase; de app doet dat niet automatisch.${since ? ` Huidige fase actief sinds ${fmtFull(since)}.` : ''}</p>
        ${ph === 'f3' ? `<label class="flabel" for="plyo-step" style="margin-top:14px">Plyo-stap (elke week een stap)</label>
          <select class="select" id="plyo-step" data-change="plyo-step">
            <option value="auto" ${!S.settings.plyoStep || S.settings.plyoStep === 'auto' ? 'selected' : ''}>Automatisch (nu stap ${plyoStep()})</option>
            ${C.sessions.PLYO.steps.map((s, i) => `<option value="${i + 1}" ${String(S.settings.plyoStep) === String(i + 1) ? 'selected' : ''}>Stap ${i + 1}: ${esc(s.title)}</option>`).join('')}
          </select>` : ''}
      </section>

      <div class="alert info">${icon('info')}<div><strong>Pijnregel</strong>${esc(C.painRule.text)} Is je ochtendscore hoger dan gisteren, dan zet je een stap terug.</div></div>

      <div class="section-title"><span>Klaar om volledig te spelen</span><span class="muted small">${critDone}/${C.criteria.length}</span></div>
      <section class="card">
        <div class="progress-bar"><i style="width:${(critDone / C.criteria.length) * 100}%"></i></div>
        ${C.criteria.map(c => `<label class="crit ${crit[c.id] ? 'on' : ''}">
          <input type="checkbox" data-change="crit" value="${c.id}" ${crit[c.id] ? 'checked' : ''}>
          <span class="box">${icon('check')}</span>
          <span class="crit-t">${esc(c.text)}${crit[c.id] ? `<small>Gehaald op ${fmtFull(crit[c.id])}</small>` : ''}</span>
        </label>`).join('')}
      </section>

      <div class="section-title"><span>${esc(C.rbfa.teamLabel)} via RBFA</span></div>
      <section class="card">
        ${fx.length ? `
          ${next ? `<div class="plan-item"><div class="pi-icon match">${icon('ball')}</div><div class="pi-body" data-action="open-day" data-k="${next.date}" style="cursor:pointer"><strong>Volgende: ${esc(nice(opponent(next)))}</strong><span>${cap(fmtDay(next.date))} · ${esc(next.time || '')} · ${isMine(next.home) ? 'thuis' : 'uit'}</span></div></div>` : ''}
          ${lastPlayed ? `<div class="plan-item"><div class="pi-icon">${icon('ball')}</div><div class="pi-body" data-action="open-day" data-k="${lastPlayed.date}" style="cursor:pointer"><strong>Laatste: ${esc(nice(opponent(lastPlayed)))}</strong><span>${cap(fmtDay(lastPlayed.date))}</span></div><span class="score-pill ${fixtureResult(lastPlayed)}">${lastPlayed.hs} - ${lastPlayed.as}</span></div>` : ''}
          <p class="muted small" style="margin:4px 4px 12px">${fx.length} matchen in je kalender${S.settings.fixturesAt ? `, bijgewerkt ${relDay(dkey(new Date(S.settings.fixturesAt)))}` : ''}. Matchdagen komen automatisch in je schema.</p>`
          : `<p class="muted small" style="margin-bottom:12px">Zet de kalender van ${esc(C.rbfa.teamLabel)} in de app. Matchdagen komen dan automatisch in je schema, en je importeert na elke match je eigen minuten van het wedstrijdblad.</p>`}
        <div class="row">
          <button class="btn primary" data-action="open-rbfa">${icon('calendar')} ${fx.length ? 'Bijwerken' : 'Kalender'}</button>
          <button class="btn ghost" data-action="open-minutes">${icon('clock')} Minuten</button>
        </div>
      </section>

      <div class="section-title"><span>Matchen en trainingen</span></div>
      <section class="card">
        <div class="row">
          <button class="btn primary" data-action="open-log" data-type="match">${icon('ball')} Match</button>
          <button class="btn ghost" data-action="open-log" data-type="training">${icon('whistle')} Training</button>
        </div>
      </section>

      <div class="section-title"><span>Back-up</span></div>
      <section class="card">
        <p class="muted small" style="margin-bottom:12px">Je data staat alleen op dit toestel. Maak geregeld een back-up als JSON-bestand.</p>
        <div class="row">
          <button class="btn primary" data-action="export">${icon('download')} Exporteren</button>
          <button class="btn ghost" data-action="import">${icon('upload')} Importeren</button>
        </div>
        <input type="file" id="import-file" accept="application/json,.json" hidden data-change="import">
      </section>

      <div class="section-title"><span>Voorbeelddata</span></div>
      <section class="card">
        <p class="muted small" style="margin-bottom:12px">${sampleCount
          ? `Er staan ${sampleCount} voorbeeldrecords in de app, zodat je kan zien hoe de statistieken eruitzien. Je eigen data blijft staan als je ze wist.`
          : 'Er staat geen voorbeelddata meer in de app.'}</p>
        ${sampleCount
          ? `<button class="btn danger block" data-action="clear-sample">${icon('trash')} Voorbeelddata wissen</button>`
          : `<button class="btn ghost block" data-action="load-sample">${icon('flask')} Voorbeelddata opnieuw laden</button>`}
        <button class="btn ghost block" style="margin-top:8px" data-action="clear-all">Alle data wissen</button>
      </section>

      <p class="footer-note">${esc(C.appName)} v${APP_VERSION} · werkt offline · data lokaal op je toestel</p>
    `;
  }

  async function saveProfile(form) {
    const f = new FormData(form);
    const p = {
      name: (f.get('name') || '').trim() || C.profile.name,
      age: num(f.get('age')) ?? '', position: (f.get('position') || '').trim(),
      height: num(f.get('height')) ?? '', weight: num(f.get('weight')) ?? '',
      team: (f.get('team') || '').trim(), complaints: (f.get('complaints') || '').trim(),
      rbfaName: (f.get('rbfaName') || '').trim() || C.rbfa.player
    };
    await setSetting('profile', p);
    S.ui.editProfile = false;
    render({ keepScroll: true });
    toast('Gegevens opgeslagen');
  }

  /* ================= RBFA: kalender en minuten (kopiëren en plakken) ================= */
  const MONTHS_RE = MONTH.join('|');
  const isScore = l => /^\d{1,2}\s*-\s*\d{1,2}$/.test(l);
  const isTime = l => /^\d{1,2}:\d{2}$/.test(l);
  const isRef = l => /^\(ref/i.test(l);
  const isNoise = l => isScore(l) || isTime(l) || isRef(l) || /^strafschoppen$/i.test(l);

  // Leest de tekst van de RBFA-ploegkalender (of het competitieoverzicht) en houdt de matchen van je ploeg over
  function parseCalendar(text) {
    const lines = text.split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const head = new RegExp(`^(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag),?\\s+(\\d{1,2})\\s+(${MONTHS_RE})(?:\\s+(\\d{4}))?(?:\\s*-\\s*(\\d{1,2}:\\d{2}))?$`, 'i');
    const t = today();
    const seasonStart = t.getMonth() >= 5 ? t.getFullYear() : t.getFullYear() - 1;
    const found = new Map();
    let i = 0;
    while (i < lines.length) {
      const h = lines[i].match(head);
      if (!h) { i++; continue; }
      const month = MONTH.indexOf(h[3].toLowerCase());
      const year = h[4] ? +h[4] : (month >= 6 ? seasonStart : seasonStart + 1);
      const date = dkey(new Date(year, month, +h[2]));
      let j = i + 1;
      const block = [];
      while (j < lines.length && !head.test(lines[j]) && !/^(sorteer|kalender afdrukken|podium|volledige)/i.test(lines[j])) { block.push(lines[j]); j++; }
      let comp = null;
      for (let b = 0; b < block.length; b++) {
        const next = block[b + 1];
        if (isNoise(block[b]) || !next || !(isScore(next) || isTime(next) || /^(afgelast|uitgesteld|ff|forfait)/i.test(next))) {
          if (b === 0 && !isNoise(block[b])) comp = block[b];
          continue;
        }
        const home = block[b];
        let k2 = b + 1, hs = null, as = null, time = h[5] || null, status = null;
        if (isScore(block[k2])) { [hs, as] = block[k2].split('-').map(x => +x.trim()); }
        else if (isTime(block[k2])) time = block[k2];
        else status = block[k2];
        k2++;
        while (k2 < block.length && (isScore(block[k2]) || /^strafschoppen$/i.test(block[k2]))) k2++;
        const away = block[k2];
        if (!away) break;
        if (isMine(home) || isMine(away)) {
          const f = { date, time, home, away, hs, as, comp: comp && !isMine(comp) ? comp : null, status };
          found.set(`${date}|${home.toLowerCase()}|${away.toLowerCase()}`, f);
        }
        b = k2;
        while (b + 1 < block.length && isRef(block[b + 1])) b++;
      }
      i = j;
    }
    return [...found.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  // Leest een wedstrijdblad en berekent alleen JOUW minuten. Andere namen worden niet bewaard.
  function parseMatchSheet(text, player) {
    const lines = text.split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const surname = player.trim().split(' ').slice(1).join(' ') || player.trim();
    const lower = s => s.toLowerCase();
    const res = { ok: false };
    const dm = text.match(new RegExp(`\\b(?:ma|di|wo|do|vr|za|zo)\\w*\\.?\\s+(\\d{1,2})\\s+(${MONTHS_RE})\\s+(\\d{4})(?:\\s*-\\s*(\\d{1,2}:\\d{2}))?`, 'i'));
    if (dm) res.date = dkey(new Date(+dm[3], MONTH.indexOf(dm[2].toLowerCase()), +dm[1]));
    const iOp = lines.findIndex(l => /^opstellingen$/i.test(l));
    const iBench = lines.findIndex(l => /^wisselspelers$/i.test(l));
    const iStaff = lines.findIndex(l => /^staf$/i.test(l));
    const iRep = lines.findIndex(l => /^wedstrijdverslag$/i.test(l));
    const iInfo = lines.findIndex(l => /^wedstrijdinfo$/i.test(l));
    if (iOp < 0) return { ok: false, error: 'Geen opstellingen gevonden. Kopieer de volledige matchpagina (Alles selecteren).' };
    res.home = lines[iOp + 1]; res.away = lines[iOp + 2];
    const sm = lines.slice(Math.max(0, iOp - 6), iOp).find(isScore);
    if (sm) [res.hs, res.as] = sm.split('-').map(x => +x.trim());
    const hasName = l => lower(l).includes(lower(player));
    const starter = lines.slice(iOp + 1, iBench > 0 ? iBench : undefined).some(hasName);
    const bench = iBench > 0 && lines.slice(iBench + 1, iStaff > 0 ? iStaff : undefined).some(hasName);
    res.role = starter ? 'basisspeler' : bench ? 'wisselspeler' : 'niet in de selectie';
    // Wedstrijdverslag: per minuut de namen. Bij wissels staan ze in paren (in, uit).
    const groups = [];
    if (iRep > 0) {
      let cur = null;
      for (const l of lines.slice(iRep + 1, iInfo > 0 ? iInfo : undefined)) {
        const mm = l.match(/^(\d{1,3})\s*[‘'’`´]?\+?\d*$/);
        if (mm && /[‘'’`´]/.test(l)) { cur = { min: +mm[1], names: [] }; groups.push(cur); }
        else if (/^(aftrap|einde van de wedstrijd|rust)$/i.test(l)) cur = null;
        else if (cur) cur.names.push(l);
      }
    }
    let inMin = null, outMin = null;
    groups.slice().reverse().forEach(g => {
      const idx = g.names.findIndex(n => lower(n) === lower(surname) || lower(n) === lower(player));
      if (idx < 0 || g.names.length % 2) return;
      if (idx % 2 === 0 && inMin == null && !starter) inMin = g.min;
      else if (idx % 2 === 1 && outMin == null) outMin = g.min;
    });
    const total = C.rbfa.matchMinutes;
    if (starter) res.minutes = outMin != null ? outMin : total;
    else if (bench) res.minutes = inMin != null ? Math.max(0, (outMin != null ? outMin : total) - inMin) : 0;
    else res.minutes = 0;
    res.inMin = inMin; res.outMin = outMin;
    res.ok = true;
    return res;
  }

  function openRbfa() {
    openSheet(`<div class="sheet-head"><div><h3>RBFA-kalender</h3><p>${esc(C.rbfa.teamLabel)}: matchen, uren en uitslagen</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <ol class="steps">
        <li>Open de <a href="${esc(C.rbfa.calendarUrl)}" target="_blank" rel="noopener">kalender van ${esc(C.rbfa.teamLabel)}</a> op rbfa.be.</li>
        <li>Selecteer alles: op gsm lang drukken op tekst → <b>Alles selecteren</b>, op computer Ctrl+A. Kopieer.</li>
        <li>Kom terug en tik op <b>Plakken</b> (of plak in het vak).</li>
      </ol>
      <label class="flabel" for="rbfa-text">Gekopieerde tekst</label>
      <textarea class="input paste" id="rbfa-text" placeholder="ZONDAG 08 NOVEMBER - 12:30&#10;4 Provinciaal Antw D&#10;KV Bonheiden B&#10;12:30&#10;KFC LINT"></textarea>
      <div class="row" style="margin-top:10px">
        <button class="btn ghost" data-action="paste" data-target="rbfa-text">${icon('paste')} Plakken</button>
        <button class="btn primary" data-action="rbfa-import">${icon('download')} Importeren</button>
      </div>
      <p class="muted small" style="margin-top:10px">De app slaat alleen de matchen van ${esc(C.rbfa.teamLabel)} op. Werk de kalender af en toe bij voor nieuwe uitslagen en verplaatste matchen.</p>`);
  }

  async function importCalendar() {
    const text = $('#rbfa-text').value;
    const list = parseCalendar(text);
    if (!list.length) { toast(`Geen matchen van ${C.rbfa.teamLabel} gevonden in de tekst`); return; }
    await setSetting('fixtures', list);
    await setSetting('fixturesAt', Date.now());
    closeSheet();
    render({ keepScroll: true });
    const pl = list.filter(played).length;
    toast(`${list.length} matchen geïmporteerd (${pl} gespeeld, ${list.length - pl} komend)`);
  }

  function openMinutes(date) {
    const fx = fixtures().filter(played);
    const f = date ? fixtureOn(date) : null;
    openSheet(`<div class="sheet-head"><div><h3>Mijn minuten</h3><p>${f ? `${esc(nice(f.home))} – ${esc(nice(f.away))}, ${fmtShort(f.date)}` : 'Van het wedstrijdblad op rbfa.be'}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <ol class="steps">
        <li>Open de <a href="${esc(C.rbfa.calendarUrl)}" target="_blank" rel="noopener">kalender</a> en tik op de match${f ? ` van ${fmtShort(f.date)}` : ''}.</li>
        <li>Selecteer alles op de matchpagina en kopieer.</li>
        <li>Plak hieronder. De app zoekt <b>${esc(profile().rbfaName)}</b> en bewaart alleen jouw minuten.</li>
      </ol>
      <textarea class="input paste" id="sheet-text" placeholder="OPSTELLINGEN …"></textarea>
      <div class="row" style="margin-top:10px">
        <button class="btn ghost" data-action="paste" data-target="sheet-text">${icon('paste')} Plakken</button>
        <button class="btn primary" data-action="minutes-parse">${icon('clock')} Berekenen</button>
      </div>
      <div id="minutes-result"></div>
      ${!fx.length ? '' : `<p class="muted small" style="margin-top:10px">Tip: het wedstrijdblad staat er meestal pas een paar uur na de match op.</p>`}`);
  }

  function showMinutesResult() {
    const r = parseMatchSheet($('#sheet-text').value, profile().rbfaName);
    const box = $('#minutes-result');
    if (!r.ok) { box.innerHTML = `<div class="alert" style="margin-top:12px">${icon('alert')}<div>${esc(r.error || 'Kon de tekst niet lezen.')}</div></div>`; return; }
    const mineHome = isMine(r.home || '');
    const opp = mineHome ? r.away : r.home;
    const existing = S.activities.find(a => a.type === 'match' && a.date === r.date);
    const detail = r.role === 'basisspeler'
      ? (r.outMin != null ? `Basisspeler, gewisseld in de ${r.outMin}e minuut` : 'Basisspeler, de hele match gespeeld')
      : r.role === 'wisselspeler'
        ? (r.inMin != null ? `Ingevallen in de ${r.inMin}e minuut${r.outMin != null ? `, eruit in de ${r.outMin}e` : ''}` : 'Op de bank, niet ingevallen')
        : `${profile().rbfaName} staat niet op dit wedstrijdblad`;
    box.innerHTML = `<div class="result-card">
      <p class="muted small">${r.date ? cap(fmtDay(r.date)) : 'Datum onbekend'} · ${esc(nice(r.home || '?'))} ${r.hs != null ? `${r.hs} - ${r.as}` : '–'} ${esc(nice(r.away || '?'))}</p>
      <div class="big" style="margin-top:6px">${r.minutes}<small style="font-size:16px"> min</small></div>
      <p class="small" style="margin-top:4px">${esc(detail)}</p>
    </div>
    <form id="minutes-form">
      <input type="hidden" name="date" value="${esc(r.date || dkey(today()))}">
      <input type="hidden" name="opponent" value="${esc(opp || '')}">
      <input type="hidden" name="score" value="${r.hs != null ? `${r.hs} - ${r.as}` : ''}">
      <input type="hidden" name="role" value="${esc(r.role)}">
      <div class="form-grid" style="margin-top:4px">
        <div><label class="flabel" for="mf-min">Minuten (aanpasbaar)</label><input class="input" id="mf-min" name="minutes" type="number" inputmode="numeric" min="0" max="130" value="${r.minutes}"></div>
        <div><label class="flabel" for="mf-pain">Pijn achteraf (0–10)</label><input class="input" id="mf-pain" name="pain" type="number" inputmode="numeric" min="0" max="10" value="${existing ? existing.pain : 0}"></div>
      </div>
      <span class="flabel">Ondergrond</span>
      <div class="seg">${radio('surface', 'kunstgras', 'Kunstgras', existing ? existing.surface : 'kunstgras')}${radio('surface', 'natuurgras', 'Natuurgras', existing ? existing.surface : '')}</div>
      <span class="flabel">Schoenen</span>
      <div class="seg">${radio('shoes', 'AG', 'AG', existing ? existing.shoes : 'AG')}${radio('shoes', 'FG', 'FG', existing ? existing.shoes : '')}</div>
      <button class="btn primary block" type="submit">${icon('check')} ${existing ? 'Match bijwerken' : 'Opslaan als match'}</button>
    </form>`;
  }

  async function saveMinutes(form) {
    const f = new FormData(form);
    const date = f.get('date');
    const existing = S.activities.find(a => a.type === 'match' && a.date === date);
    const rec = {
      ...(existing || {}),
      type: 'match', date, minutes: +f.get('minutes') || 0, surface: f.get('surface'), shoes: f.get('shoes'),
      pain: +f.get('pain') || 0, opponent: f.get('opponent') || null, score: f.get('score') || null, role: f.get('role') || null,
      note: existing ? existing.note || '' : '', source: 'rbfa', createdAt: existing ? existing.createdAt : Date.now(), sample: false
    };
    rec.id = await DB.put('activities', rec);
    S.activities = S.activities.filter(a => a.id !== rec.id).concat(rec);
    closeSheet();
    render({ keepScroll: true });
    toast(`${rec.minutes} minuten opgeslagen`);
  }

  async function pasteInto(id) {
    try {
      const txt = await navigator.clipboard.readText();
      if (txt) { $('#' + id).value = txt; toast('Geplakt'); return; }
    } catch (_) { /* geen toestemming */ }
    $('#' + id).focus();
    toast('Plakken niet toegestaan: houd het vak ingedrukt en kies Plakken');
  }

  /* ================= Loggen ================= */
  const radio = (name, value, label, cur) =>
    `<label><input type="radio" name="${name}" value="${value}" ${value === cur ? 'checked' : ''}><span>${label}</span></label>`;

  function openLog(type = 'training', date = dkey(today())) {
    openSheet(`<form id="log-form">
      <div class="sheet-head"><h3 id="log-title">${type === 'match' ? 'Match' : 'Training'} loggen</h3>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="seg">${radio('type', 'match', 'Match', type)}${radio('type', 'training', 'Training', type)}</div>
      <div class="form-grid" style="margin-top:4px">
        <div><label class="flabel" for="lg-date">Datum</label><input class="input" type="date" id="lg-date" name="date" value="${date}" max="${dkey(today())}" required></div>
        <div><label class="flabel" for="lg-min">Minuten</label><input class="input" type="number" inputmode="numeric" id="lg-min" name="minutes" min="0" max="240" value="${type === 'match' ? 90 : 105}" required></div>
      </div>
      <span class="flabel">Ondergrond</span>
      <div class="seg">${radio('surface', 'kunstgras', 'Kunstgras', 'kunstgras')}${radio('surface', 'natuurgras', 'Natuurgras')}</div>
      <span class="flabel">Schoenen</span>
      <div class="seg">${radio('shoes', 'AG', 'AG', 'AG')}${radio('shoes', 'FG', 'FG')}</div>
      <div class="slider-top" style="margin-top:14px"><span class="flabel" style="margin:0 0 0 4px">Pijn achteraf</span><strong class="score low" id="lg-pain-v">0</strong></div>
      <input type="range" name="pain" min="0" max="10" value="0" data-out="lg-pain-v" data-score aria-label="Pijn achteraf">
      <label class="flabel" for="lg-note">Notitie</label>
      <textarea class="input" id="lg-note" name="note" rows="2" placeholder="Hoe voelde het? Bv. stijf na de rust"></textarea>
      <button class="btn primary block" type="submit">${icon('check')} Opslaan</button>
    </form>`);
  }

  async function saveLog(form) {
    const f = new FormData(form);
    const rec = {
      type: f.get('type'), date: f.get('date') || dkey(today()), minutes: +f.get('minutes') || 0,
      surface: f.get('surface'), shoes: f.get('shoes'), pain: +f.get('pain') || 0,
      note: (f.get('note') || '').trim(), createdAt: Date.now(), sample: false
    };
    const fx = rec.type === 'match' ? fixtureOn(rec.date) : null;
    if (fx) { rec.opponent = opponent(fx); if (played(fx)) rec.score = `${fx.hs} - ${fx.as}`; }
    rec.id = await DB.put('activities', rec);
    S.activities.push(rec);
    closeSheet();
    render({ keepScroll: true });
    toast(rec.pain > MAX_PAIN ? `Opgeslagen. Pijn ${rec.pain}/10: let goed op je ochtendcheck morgen.` : `${rec.type === 'match' ? 'Match' : 'Training'} opgeslagen`);
  }

  /* ================= Sheets, menu, toast ================= */
  function openSheet(html) {
    closeSheet();
    const bd = document.createElement('div');
    bd.className = 'sheet-backdrop';
    bd.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
    bd.addEventListener('click', e => { if (e.target === bd) closeSheet(); });
    document.body.appendChild(bd);
    requestAnimationFrame(() => bd.classList.add('open'));
  }
  function closeSheet() { document.querySelectorAll('.sheet-backdrop').forEach(n => n.remove()); }

  function openMenu() {
    openSheet(`<div class="sheet-head"><h3>Menu</h3>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="menu-list">
        <button data-action="open-day" data-k="${dkey(today())}"><span class="li-icon">${icon('move')}</span><div>Planning van vandaag<small>Verplaatsen, overslaan of iets toevoegen</small></div></button>
        <button data-action="menu-go" data-to="workout"><span class="li-icon">${icon('dumbbell')}</span><div>Workout starten</div></button>
        <button data-action="open-log" data-type="training"><span class="li-icon">${icon('whistle')}</span><div>Training loggen</div></button>
        <button data-action="open-log" data-type="match"><span class="li-icon amber">${icon('ball')}</span><div>Match loggen</div></button>
        <button data-action="open-minutes"><span class="li-icon">${icon('clock')}</span><div>Minuten van RBFA<small>Van het wedstrijdblad</small></div></button>
        <button data-action="open-rbfa"><span class="li-icon">${icon('calendar')}</span><div>RBFA-kalender bijwerken</div></button>
        <button data-action="export"><span class="li-icon">${icon('download')}</span><div>Back-up maken</div></button>
      </div>`);
  }

  let toastTimer = null;
  function toast(msg, action) {
    const el = $('#toast');
    el.innerHTML = `<span>${esc(msg)}</span>${action ? `<button data-action="${action.action}">${esc(action.label)}</button>` : ''}`;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, action ? 7000 : 3200);
  }

  function go(route) {
    closeSheet();
    if (currentRoute() === route) render(); else location.hash = route;
  }

  /* ================= Export, import, voorbeelddata ================= */
  async function exportData() {
    closeSheet();
    const data = {
      app: 'comeback', version: 2, exportedAt: new Date().toISOString(),
      checks: S.checks, workouts: S.workouts, activities: S.activities, settings: S.settings
    };
    const name = `comeback-backup-${dkey(today())}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const mobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (mobile && navigator.canShare) {
      try {
        const file = new File([blob], name, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Comeback back-up' }); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('Back-up gedownload');
  }

  async function importData(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch (_) { toast('Dit is geen geldig JSON-bestand'); return; }
    if (!data || !Array.isArray(data.checks) || !Array.isArray(data.workouts) || !Array.isArray(data.activities)) {
      toast('Dit lijkt geen Comeback-back-up'); return;
    }
    if (!confirm(`Back-up van ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString('nl-BE') : 'onbekende datum'} importeren? Dit vervangt alle huidige data.`)) return;
    for (const s of DB.stores) await DB.clear(s);
    await DB.bulkPut('checks', data.checks);
    await DB.bulkPut('workouts', data.workouts);
    await DB.bulkPut('activities', data.activities);
    const settings = Object.entries(data.settings || {}).map(([key, value]) => ({ key, value }));
    if (!settings.some(s => s.key === 'seeded')) settings.push({ key: 'seeded', value: true });
    await DB.bulkPut('settings', settings);
    await loadAll();
    render();
    toast('Back-up geïmporteerd');
  }

  async function seedSample() {
    const data = Sample.generate({
      C, dkey, addDays, today: today(),
      planFor: (d, phase) => basePlan(d, phase, { fixtures: false, satMatch: false }),
      sessionItems
    });
    await DB.bulkPut('checks', data.checks.filter(c => !checkFor(c.date)));
    await DB.bulkPut('workouts', data.workouts);
    await DB.bulkPut('activities', data.activities);
    await DB.setSetting('seeded', true);
    await loadAll();
  }

  async function clearSample() {
    if (!confirm('Alle voorbeelddata wissen? Je eigen gegevens blijven staan.')) return;
    await DB.bulkDel('checks', S.checks.filter(x => x.sample).map(x => x.date));
    await DB.bulkDel('workouts', S.workouts.filter(x => x.sample).map(x => x.id));
    await DB.bulkDel('activities', S.activities.filter(x => x.sample).map(x => x.id));
    await loadAll();
    render({ keepScroll: true });
    toast('Voorbeelddata gewist');
  }

  async function clearAll() {
    if (!confirm('Echt ALLE data wissen (ook je eigen workouts, checks en instellingen)? Maak eerst een back-up.')) return;
    if (!confirm('Laatste bevestiging: alles wissen?')) return;
    for (const s of DB.stores) await DB.clear(s);
    await DB.setSetting('seeded', true);
    await loadAll();
    stopRest();
    render();
    toast('Alle data gewist');
  }

  /* ================= Events ================= */
  const actions = {
    'go': el => go(el.dataset.to),
    'menu-go': el => go(el.dataset.to),
    'open-menu': openMenu,
    'close-sheet': closeSheet,
    'toggle-theme': () => setTheme(isDark() ? 'light' : 'dark'),
    'save-check': saveCheck,
    'scroll-check': () => { const c = $('#check-card'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
    'start-session': el => startSession(el.dataset.key),
    'open-log': el => openLog(el.dataset.type, el.dataset.date || undefined),
    'open-day': el => openDay(el.dataset.k),
    'item-menu': el => openItemSheet(el.dataset.k, el.dataset.key),
    'open-move': el => openMoveSheet(el.dataset.k, el.dataset.key),
    'smart-move': el => smartMove(el.dataset.k, el.dataset.key),
    'move-to': el => moveItem(el.dataset.from, el.dataset.key, el.dataset.to),
    'move-custom': el => { const v = $('#move-date').value; if (!v) { toast('Kies eerst een datum'); return; } moveItem(el.dataset.from, el.dataset.key, v); },
    'skip-item': el => skipItem(el.dataset.k, el.dataset.key),
    'restore-item': el => { const k = el.dataset.k; restoreItem(k, el.dataset.key); openDay(k); },
    'add-session': el => addSessionTo(el.dataset.k, el.dataset.id),
    'undo': async () => { if (!S.ui.undo) return; await setSetting('overrides', S.ui.undo); S.ui.undo = null; $('#toast').hidden = true; render({ keepScroll: true }); toast('Ongedaan gemaakt'); },
    'wo-pause': () => { S.ui.woView = 'picker'; render(); },
    'wo-resume': () => { S.ui.woView = 'active'; requestWakeLock(); render(); },
    'wo-menu': () => openSheet(`<div class="sheet-head"><h3>Workout</h3>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="menu-list">
        <button data-action="wo-finish"><span class="li-icon">${icon('check')}</span><div>Workout afronden</div></button>
        <button data-action="rest-start"><span class="li-icon">${icon('timer')}</span><div>Rusttimer starten</div></button>
        <button data-action="wo-cancel"><span class="li-icon amber">${icon('trash')}</span><div>Stoppen zonder opslaan</div></button>
      </div>`),
    'wo-cancel': () => { closeSheet(); cancelWorkout(); },
    'wo-goto': el => gotoExercise(+el.dataset.i),
    'wo-prev': () => gotoExercise(draft().current - 1),
    'wo-next': () => gotoExercise(draft().current + 1),
    'wo-finish': () => { closeSheet(); finishWorkout(); },
    'wo-add-set': addSet,
    'set-done': el => toggleSet(+el.dataset.i),
    'hold-start': el => startHold(+el.dataset.i),
    'hold-cancel': closeHold,
    'hold-add': () => { if (!hold) return; hold.dur += 10; hold.endAt += 10000; const t = $('#hold-tot'); if (t) t.textContent = fmtClock(hold.dur); },
    'hold-done': () => { if (!hold) return; const secs = hold.phase === 'hold' ? Math.max(1, Math.round((Date.now() - hold.startAt) / 1000)) : hold.dur; completeHold(secs); },
    'rest-start': () => {
      closeSheet();
      const w = draft();
      startRest(w && S.ui.woView !== 'picker' ? w.exercises[w.current].rest : C.defaultRest);
    },
    'rest-adj': el => { rest.endAt += (+el.dataset.d) * 1000; rest.total = Math.max(rest.total, Math.ceil((rest.endAt - Date.now()) / 1000)); tickRest(); },
    'rest-skip': stopRest,
    'bar-select': el => { S.ui.statsWeek = +el.dataset.i; render({ keepScroll: true }); },
    'line-range': el => { S.ui.lineRange = +el.dataset.r; render({ keepScroll: true }); },
    'cal-prev': () => shiftMonth(-1),
    'cal-next': () => shiftMonth(1),
    'scroll-cal': () => { const c = $('#cal-card'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
    'show-entry': el => showEntry(el.dataset.store, +el.dataset.id),
    'del-entry': el => deleteEntry(el.dataset.store, +el.dataset.id),
    'toggle-edit': () => { S.ui.editProfile = !S.ui.editProfile; render({ keepScroll: true }); },
    'open-rbfa': openRbfa,
    'rbfa-import': importCalendar,
    'open-minutes': el => openMinutes(el.dataset.date),
    'minutes-parse': showMinutesResult,
    'paste': el => pasteInto(el.dataset.target),
    'export': exportData,
    'import': () => $('#import-file').click(),
    'clear-sample': clearSample,
    'load-sample': async () => { await seedSample(); render({ keepScroll: true }); toast('Voorbeelddata geladen'); },
    'clear-all': clearAll,
    'reload': () => location.reload()
  };

  function shiftMonth(n) {
    const t = today();
    const m = S.ui.calMonth || new Date(t.getFullYear(), t.getMonth(), 1);
    S.ui.calMonth = new Date(m.getFullYear(), m.getMonth() + n, 1);
    $('#cal-card').innerHTML = calendarHtml();
  }

  document.addEventListener('click', e => {
    unlockAudio();
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = actions[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  document.addEventListener('input', e => {
    const el = e.target;
    if (el.matches('input[type=range]')) {
      el.style.setProperty('--p', `${(el.value / (el.max || 10)) * 100}%`);
      const out = el.dataset.out && document.getElementById(el.dataset.out);
      if (out) { out.textContent = el.value; if (el.hasAttribute('data-score')) out.className = `score ${level(+el.value)}`; }
    }
    if (el.matches('[data-set]')) onSetInput(el);
  });

  document.addEventListener('change', async e => {
    const el = e.target;
    const kind = el.dataset.change;
    if (el.form && el.form.id === 'log-form' && el.name === 'type') {
      $('#log-title').textContent = `${el.value === 'match' ? 'Match' : 'Training'} loggen`;
      $('#lg-min').value = el.value === 'match' ? 90 : 105;
      return;
    }
    if (!kind) return;
    if (kind === 'satmatch') {
      const wk = weekKey(today());
      const set = new Set(S.settings.satMatchWeeks || []);
      el.checked ? set.add(wk) : set.delete(wk);
      await setSetting('satMatchWeeks', [...set]);
      render({ keepScroll: true });
      toast(el.checked ? 'Zaterdagmatch: Sessie C staat nu op donderdag' : 'Standaard weekschema hersteld');
    } else if (kind === 'theme') {
      setTheme(el.value);
    } else if (kind === 'phase') {
      await setSetting('phase', el.value);
      await setSetting('phaseSince', dkey(today()));
      render({ keepScroll: true });
      toast(`Gewisseld naar ${phaseObj(el.value).label}: ${phaseObj(el.value).title}`);
    } else if (kind === 'plyo-step') {
      await setSetting('plyoStep', el.value);
      render({ keepScroll: true });
    } else if (kind === 'crit') {
      const crit = { ...(S.settings.criteria || {}) };
      if (el.checked) crit[el.value] = dkey(today()); else delete crit[el.value];
      await setSetting('criteria', crit);
      render({ keepScroll: true });
    } else if (kind === 'weight-ex') {
      S.ui.weightEx = el.value;
      render({ keepScroll: true });
    } else if (kind === 'import') {
      if (el.files && el.files[0]) await importData(el.files[0]);
      el.value = '';
    }
  });

  document.addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.id === 'log-form') saveLog(e.target);
    if (e.target.id === 'profile-form') saveProfile(e.target);
    if (e.target.id === 'minutes-form') saveMinutes(e.target);
  });

  window.addEventListener('hashchange', () => { closeSheet(); render(); });

  /* ================= Service worker ================= */
  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('./sw.js').then(reg => {
      const notify = w => w && w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) toast('Nieuwe versie beschikbaar', { action: 'reload', label: 'Herladen' });
      });
      if (reg.installing) notify(reg.installing);
      reg.addEventListener('updatefound', () => notify(reg.installing));
    }).catch(() => { });
  }

  /* ================= Start ================= */
  async function init() {
    try {
      await loadAll();
      if (!S.settings.seeded) await seedSample();
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
      if (draft()) requestWakeLock();
      render();
    } catch (err) {
      console.error(err);
      main.innerHTML = `<div class="alert" style="margin-top:40px">${icon('alert')}<div><strong>De app kon niet starten</strong>Je browser blokkeert mogelijk lokale opslag (bv. privévenster). ${esc(err && err.message)}</div></div>`;
    }
    registerSW();
  }

  // Alleen voor tests in de browserconsole
  window.__comeback = { parseCalendar, parseMatchSheet };

  init();
})();
