/* Comeback: app-logica */
(() => {
  'use strict';

  const C = window.APP_CONFIG;
  const APP_VERSION = '5.5.1';
  const S = {
    checks: [], workouts: [], activities: [], settings: {},
    ui: { woView: null, statsWeek: 7, calMonth: null, lineRange: 30, weightEx: null, summary: null, undo: null }, raw: { checks: [], workouts: [], activities: [] }
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
    home: '<path d="M4 10.5L12 4l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    dumbbell: '<path d="M3 12h18M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4"/>',
    chart: '<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c.8-3.8 3.8-5.6 7.5-5.6s6.7 1.8 7.5 5.6"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    chevL: '<path d="M15 18l-6-6 6-6"/>',
    chevR: '<path d="M9 18l6-6-6-6"/>',
    more: '<circle cx="5.5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    timer: '<circle cx="12" cy="13" r="7.5"/><path d="M12 9.5V13l2.5 2M9.5 3h5"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    ball: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8l3.3 2.4-1.3 3.9h-4l-1.3-3.9zM12 3.5V8M15.3 10.4l4-1.3M14 14.3l2.5 3.5M10 14.3l-2.5 3.5M8.7 10.4l-4-1.3"/>',
    whistle: '<circle cx="9" cy="14" r="5"/><path d="M12.5 10.5L20 5v4l-6 4"/>',
    moon: '<path d="M19.5 14.5A7.5 7.5 0 1 1 9.5 4.5a6 6 0 0 0 10 10z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M4.6 4.6L6 6M18 18l1.4 1.4M3 12h2M19 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    alert: '<path d="M12 4L3 19.5h18z"/><path d="M12 10v4M12 17h.01"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    move: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15h6M13 13l2 2-2 2"/>',
    skip: '<path d="M6 6l8 6-8 6zM17 6v12"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
    download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
    paste: '<rect x="6" y="4" width="12" height="17" rx="1.5"/><path d="M9 4V3h6v1M9 10h6M9 14h6"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.5 4.5 4.5 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
    pulse: '<path d="M3 12h4l2-5 4 10 2-5h6"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    coach: '<path d="M4 5.5h16v10H9l-5 4z"/><path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" stroke-width="2.4"/>',
    shield: '<path d="M12 3.5l7 2.8v5.2c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6.3z"/><path d="M9 12l2 2 4-4"/>',
    magic: '<path d="M5 19L17 7M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" stroke-width="2.6"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
    sync: '<path d="M20 11a8 8 0 0 0-14.3-4.3L4 9M4 4v5h5M4 13a8 8 0 0 0 14.3 4.3L20 15M20 20v-5h-5"/>',
    // Sessie-iconen
    legs: '<path d="M9.5 3.5v6.5L7 15l2.5 5.5M14.5 3.5v6.5L17 15l-2.5 5.5M9.5 9h5"/>',
    barbell: '<path d="M2.5 12h19M6 7.5v9M18 7.5v9M3.5 9.5v5M20.5 9.5v5"/>',
    torso: '<circle cx="12" cy="5" r="2"/><path d="M6.5 21v-6.5L4.5 10l3.5-2h8l3.5 2-2 4.5V21M9.5 13h5"/>',
    hold: '<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/>',
    calf: '<path d="M9 3v10.5L6 17h10.5l-1.5-2.5L14 14V3"/><path d="M4.5 20.5h15"/>',
    bolt: '<path d="M13 2.5L4.5 14H11l-1 7.5L19.5 10H13z"/>'
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
    // Gekozen thema wint van de systeeminstelling, ook voor de statusbalk
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    document.querySelectorAll('meta[name="theme-color"]').forEach(m => { m.setAttribute('content', bg); m.removeAttribute('media'); });
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
  // Voorbeelddata (sample: true) staat apart in de database en telt alleen mee in de demostand.
  async function loadAll() {
    const [checks, workouts, activities, settings] = await Promise.all(DB.stores.map(s => DB.all(s)));
    S.settings = Object.fromEntries(settings.map(r => [r.key, r.value]));
    S.raw = { checks, workouts, activities };
    const keep = r => !!S.settings.demo || !r.sample;
    S.checks = checks.filter(keep);
    S.workouts = workouts.filter(keep);
    S.activities = activities.filter(keep);
  }
  async function setSetting(key, value) {
    S.settings[key] = value;
    await DB.setSetting(key, value);
  }
  const profile = () => ({ ...C.profile, rbfaName: C.rbfa.player, ...(S.settings.profile || {}) });
  const phaseObj = id => C.phases.find(p => p.id === id) || C.phases[0];
  const currentPhase = () => S.settings.phase || C.phases[0].id;
  const checkFor = k => S.checks.find(c => c.date === k);
  const workoutsOn = k => S.workouts.filter(w => w.date === k);
  const activitiesOn = k => S.activities.filter(a => a.date === k);
  const inWeek = (k, wk) => weekKey(parseKey(k)) === wk;

  /* ---------- Hersteltrajecten ---------- */
  // Een traject: { id, location, label, side, status, start, end, notes, program, painLimit,
  //               agreements: [{ id, date, text }], evals: [{ id, date, label }],
  //               checklist: [{ id, text, done }], maintenance: [sessie-ids], linked: [sessie-ids] }
  const LOC_LABEL = { kuit: 'Kuit', achillespees: 'Achillespees', hamstring: 'Hamstring', lies: 'Lies', knie: 'Knie', enkel: 'Enkel', voet: 'Voet', heup: 'Heup', rug: 'Rug', schouder: 'Schouder', andere: 'Andere' };
  const SIDE_LABEL = { links: 'links', rechts: 'rechts', beide: 'links en rechts', nvt: 'niet van toepassing' };
  const STATUS_LABEL = { actief: 'Actief', opbouw: 'In opbouw', afgerond: 'Afgerond' };
  const GOAL_LABEL = { herstellen: 'Herstellen', conditie: 'Voetbalconditie opbouwen', fit: 'Fit blijven' };
  const injuries = () => S.settings.injuries || [];
  const injuryById = id => injuries().find(i => i.id === id);
  const activeInjuries = () => injuries().filter(i => i.status !== 'afgerond');
  const injuryLabel = i => i ? (i.label || LOC_LABEL[i.location] || 'Klacht') : '';
  const injurySideText = i => i && i.side && i.side !== 'nvt' ? SIDE_LABEL[i.side] : '';
  const injurySides = i => i.side === 'beide' ? ['L', 'R'] : i.side === 'links' ? ['L'] : i.side === 'rechts' ? ['R'] : ['X'];
  const sideShort = s => s === 'L' ? 'links' : s === 'R' ? 'rechts' : '';
  // Een programma (bv. 'kuitpees') zet zijn sessies in het schema zolang het traject loopt.
  // Na afronden blijven alleen de sessies die je zelf als onderhoud koos.
  function programOn(program, keepId) {
    if (!program) return true;
    return injuries().some(i => i.program === program && (i.status !== 'afgerond' || (keepId && (i.maintenance || []).includes(keepId))));
  }
  const goal = () => ({ type: 'herstellen', text: '', evalDate: '', ...(S.settings.goal || {}) });
  // Persoonlijke afspraak over pijn tijdens oefenen (de strengste van de lopende trajecten); null = geen afspraak
  function painMax() {
    const ls = activeInjuries().map(i => num(i.painLimit)).filter(v => v != null);
    return ls.length ? Math.min(...ls) : null;
  }
  const overLimit = v => { const m = painMax(); return m != null && v != null && v > m; };

  // Dagelijkse check: { date, inj: { [trajectId]: { stiff: {L,R,X}, pain: {L,R,X}, reaction } }, fatigue, note }
  const checkEntry = (c, injId) => (c && c.inj && c.inj[injId]) || null;
  const checkVal = (c, injId, kind, side) => { const e = checkEntry(c, injId); const v = e && e[kind] ? e[kind][side] : null; return v == null ? null : v; };
  function lastCheckFor(injId, before) {
    return S.checks.filter(c => (!before || c.date < before) && checkEntry(c, injId)).sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  }
  // Wat is vandaag hoger dan bij de vorige meting (alleen als er vandaag gemeten is)
  function checkRise(inj) {
    const tk = dkey(today()), c = checkFor(tk), prev = lastCheckFor(inj.id, tk);
    if (!checkEntry(c, inj.id) || !prev) return [];
    const out = [];
    ['stiff', 'pain'].forEach(kind => injurySides(inj).forEach(s => {
      const a = checkVal(prev, inj.id, kind, s), b = checkVal(c, inj.id, kind, s);
      if (a != null && b != null && b > a) out.push(`${kind === 'stiff' ? 'stijfheid' : 'pijn'}${sideShort(s) ? ' ' + sideShort(s) : ''} ${a} → ${b}`);
    }));
    return out;
  }
  const latestAgreement = inj => (inj.agreements || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0] || null;
  const valsText = (c, inj, kind) => injurySides(inj).map(s => { const v = checkVal(c, inj.id, kind, s); return `${sideShort(s) ? sideShort(s).charAt(0).toUpperCase() + ' ' : ''}${v == null ? '–' : v}`; }).join(' · ');

  /* ================= RBFA-wedstrijden ================= */
  // Een match: { id, date, time, opponent, home (true = thuis), gf, ga (doelpunten voor/tegen),
  //              comp, src: 'rbfa' | 'manual', key (voor het samenvoegen bij een nieuwe import), edited }
  const isMine = name => typeof name === 'string' && name.toLowerCase().includes(C.rbfa.team.toLowerCase());
  // HOOFDLETTERNAMEN netjes maken ("SV AARTSELAAR" → "SV Aartselaar"); afkortingen zoals KFC en K.VV blijven
  const nice = s => String(s || '').replace(/(^|[\s-])([A-ZÀ-Ý]{4,})(?=$|[\s-])/g, (m, pre, w) => pre + w.charAt(0) + w.slice(1).toLowerCase());
  const fxKey = f => `${String(f.opponent).toLowerCase().replace(/[^a-z0-9]/g, '')}|${f.home ? 'H' : 'U'}|${String(f.comp || '').toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Zet een match uit het oude formaat (home/away/hs/as) om naar het nieuwe
  function normFx(f) {
    if (f && 'opponent' in f) return f;
    const homeMine = isMine(f.home);
    const n = {
      id: f.id || newId(), date: f.date, time: f.time || null,
      opponent: nice(homeMine ? f.away : f.home), home: homeMine,
      gf: homeMine ? f.hs ?? null : f.as ?? null, ga: homeMine ? f.as ?? null : f.hs ?? null,
      comp: f.comp || null, src: 'rbfa', edited: false
    };
    n.key = fxKey(n);
    return n;
  }
  const fixtures = () => (S.settings.fixtures || []).map(normFx).sort((a, b) => a.date.localeCompare(b.date) || String(a.time || '').localeCompare(String(b.time || '')));
  const fixtureOn = k => fixtures().find(f => f.date === k);
  function fixtureSpan() {
    const f = fixtures();
    if (!f.length) return null;
    return { first: f[0].date, last: f[f.length - 1].date };
  }
  const played = f => f.gf != null && f.ga != null;
  function fixtureResult(f) {
    if (!played(f)) return null;
    return f.gf > f.ga ? 'win' : f.gf < f.ga ? 'loss' : 'draw';
  }
  const opponent = f => f.opponent;
  const fxTitle = f => f.home ? `${C.rbfa.teamLabel} – ${f.opponent}` : `${f.opponent} – ${C.rbfa.teamLabel}`;
  const fxScore = f => played(f) ? (f.home ? `${f.gf} - ${f.ga}` : `${f.ga} - ${f.gf}`) : '';

  /* ================= Schema ================= */
  const satMatchWeek = d => (S.settings.satMatchWeeks || []).includes(weekKey(d));
  // Soorten in de planning: session (fitness of herstel uit je schema, of een eigen workout), training (voetbal),
  // match, kine, recovery (herstel & mobiliteit), custom (eigen type met naam) en rest
  const slug = v => String(v || 'eigen').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'eigen';
  const itemKey = it => it.type === 'session' ? `session:${it.id}` : it.type === 'custom' ? `custom:${slug(it.label)}` : it.type;
  const overrides = () => S.settings.overrides || {};
  // Reden van een weggehaald item: 'skip' of 'skip:<reden>', 'del', 'moved:<datum>' of 'replaced:<sleutel>'
  const isSkip = r => typeof r === 'string' && r.startsWith('skip');
  const skipReason = r => isSkip(r) && r.length > 5 ? r.slice(5) : '';

  // Vaste planning (herhalingen) die je zelf instelt: { id, item: { type, id?, label? }, days: [0–6], time?, min?, since, until? }
  const planRules = () => S.settings.schedule || [];
  // Basisplanning van een dag: standaard leeg. Alleen jouw herhalingen en de weekplanning van een herstelplan.
  // (Het vaste weekschema uit config.js en de RBFA-matchen staan niet meer automatisch in de kalender.)
  function basePlan(date, phaseId = currentPhase(), opts = {}) {
    const wd = date.getDay(), k = dkey(date);
    const items = [];
    if (opts.mine !== false) planRules().forEach(r => {
      if (!(r.days || []).includes(wd) || (r.since && k < r.since) || (r.until && k > r.until)) return;
      if (r.item.type === 'session' && !C.sessions[r.item.id]) return;
      const it = { ...r.item, rule: r.id, mine: true, note: 'Vaste planning' };
      if (r.time) it.time = r.time;
      if (r.min) it.min = r.min;
      if (!items.some(x => itemKey(x) === itemKey(it))) items.push(it);
    });
    // Herstelplannen: wekelijks ingeplande workouts van een lopende blessure (of als onderhoud na herstel)
    if (opts.rehab !== false) injuries().forEach(inj => {
      const done = inj.status === 'afgerond';
      (inj.schedule || []).forEach(sc => {
        if (!C.sessions[sc.id] || !(sc.days || []).includes(wd)) return;
        if (sc.since && k < sc.since) return;
        if (inj.start && k < inj.start) return;
        if (done && inj.end && k > inj.end && !(inj.maintenance || []).includes(sc.id)) return;
        if (!items.some(it => it.type === 'session' && it.id === sc.id)) items.push({ type: 'session', id: sc.id, note: done && inj.end && k > inj.end ? `Onderhoud · ${injuryLabel(inj)}` : `Herstel · ${injuryLabel(inj)}` });
      });
    });
    return items;
  }

  // Schema inclusief verplaatste, overgeslagen en toegevoegde items
  function planDetail(date) {
    const k = dkey(date);
    const base = basePlan(date);
    const ov = overrides()[k] || {};
    const removed = ov.removed || {}, confirmed = ov.confirmed || {}, edits = ov.edits || {};
    const exists = it => it.type !== 'session' || !!C.sessions[it.id];
    const items = base.filter(it => !removed[itemKey(it)]);
    const offAdded = [];
    (ov.added || []).forEach(a => {
      if (!exists(a)) return;
      if (a.skipped) { offAdded.push({ item: { ...a }, reason: a.skipped }); return; }
      if (!items.some(x => itemKey(x) === itemKey(a))) items.push({ ...a });
    });
    // Per dag: bevestigd of nog voorgesteld, en je eigen uur, duur en notitie
    items.forEach(it => {
      const key = itemKey(it), ed = edits[key];
      it.confirmed = !!(confirmed[key] || it.from || it.extra || it.fixture || it.mine);
      if (ed) { if (ed.time) it.time = ed.time; if (ed.min) it.min = ed.min; if (ed.note) it.userNote = ed.note; }
    });
    const off = base.filter(it => removed[itemKey(it)] && exists(it)).map(it => ({ item: it, reason: removed[itemKey(it)] })).concat(offAdded);
    const order = { session: 0, kine: 1, recovery: 1, custom: 1, training: 2, match: 3, rest: 4 };
    items.sort((a, b) => (order[a.type] ?? 1) - (order[b.type] ?? 1));
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
    return s.items.filter(it => (!it.phases || it.phases.includes(phaseId)) && (!it.program || programOn(it.program, `${key}:${it.ex}`)));
  }
  const setCount = it => Array.isArray(it.sets) ? it.sets[0] : it.sets;
  const sessionTitle = key => (C.sessions[key] && C.sessions[key].name) || key;
  // Naam van een opgeslagen workout: altijd de huidige naam uit de config (oude workouts heetten "Sessie A")
  const woTitle = w => (C.sessions[w.sessionKey] && C.sessions[w.sessionKey].name) || w.title;
  const sessionDesc = key => key === 'PLYO' ? `Stap ${plyoStep()} van 4: ${C.sessions.PLYO.steps[plyoStep() - 1].title}` : ((C.sessions[key] && (C.sessions[key].desc || C.sessions[key].subtitle)) || '');
  // Standaardduur van een workout (schatting, gelogde snelle "Gedaan" en voorinvulling)
  const DEFAULT_WORKOUT_MIN = 60;
  function sessionStats(key) {
    const items = sessionItems(key);
    let sets = 0, secs = 0;
    items.forEach(x => {
      const ex = C.exercises[x.ex];
      const n = setCount(x) * (ex.perSide ? 2 : 1);
      sets += n;
      secs += n * ((ex.rest || C.defaultRest) + (ex.kind === 'hold' ? ex.duration : 35));
    });
    return { exercises: items.length, sets, minutes: DEFAULT_WORKOUT_MIN };
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
      const sub = sessionDesc(it.id);
      return { icon: s.icon || 'dumbbell', title: sessionTitle(it.id), sub: `${s.place ? cap(s.place) + ' · ' : ''}${st.exercises} oefeningen · ±${st.minutes} min`, note: it.note, short: s.short || it.id, stats: st, subtitle: sub };
    }
    if (it.type === 'training') return { icon: 'whistle', title: 'Voetbaltraining', sub: it.time || '', note: it.note, short: 'Training' };
    if (it.type === 'run') return { icon: 'bolt', title: 'Lopen', sub: [it.time, it.min && `${it.min} min`].filter(Boolean).join(' · '), note: it.note, short: 'Lopen' };
    if (it.type === 'kine') return { icon: 'heart', title: it.label ? `Kine · ${it.label}` : 'Kine', sub: [it.time, it.min && `${it.min} min`].filter(Boolean).join(' · '), note: it.note, short: 'Kine' };
    if (it.type === 'recovery') return { icon: 'pulse', title: it.label || 'Herstel & mobiliteit', sub: [it.time, `${it.min || 25} min`].filter(Boolean).join(' · '), note: it.note, short: 'Herstel' };
    if (it.type === 'custom') return { icon: 'list', title: it.label || 'Eigen activiteit', sub: [it.time, it.min && `${it.min} min`].filter(Boolean).join(' · '), note: it.note, short: it.label || 'Eigen' };
    if (it.type === 'match') {
      const f = it.fixture;
      if (f) {
        const score = played(f) ? ` · ${fxScore(f)}` : "";
        return { icon: 'ball', title: `${f.home ? 'Thuis' : 'Uit'} tegen ${nice(opponent(f))}`, sub: `${f.time || ''}${score}${f.comp ? ' · ' + f.comp : ''}`, note: it.note, short: 'Match', cls: 'match' };
      }
      return { icon: 'ball', title: 'Match', sub: 'Log je minuten en hoe het voelde', note: it.note, short: 'Match', cls: 'match' };
    }
    return { icon: 'moon', title: 'Rustdag', sub: 'Wandelen, mobiliteit en goed slapen', note: it.note, short: 'rust' };
  }

  const SIMPLE = ['kine', 'recovery', 'custom'];
  // Een activiteit hoort bij een gepland item als het type (en bij een eigen type de naam) overeenkomt
  const actMatches = (a, it) => a.type === it.type && (it.type !== 'custom' || slug(a.label) === slug(it.label));
  function itemDone(it, k) {
    if (it.type === 'session') return workoutsOn(k).some(w => w.sessionKey === it.id);
    if (it.type === 'training' || it.type === 'match' || it.type === 'run' || SIMPLE.includes(it.type)) return activitiesOn(k).some(a => actMatches(a, it));
    return false;
  }

  // Gemiste sessies van de afgelopen 7 dagen (niet gedaan, niet later ingehaald, niet overgeslagen)
  function missedItems() {
    const t = today(), tk = dkey(t), out = [];
    for (let i = 7; i >= 1; i--) {
      const d = addDays(t, -i), k = dkey(d);
      if (k < planStart()) continue; // vóór de start van de huidige fase telt niets als gemist
      planFor(d).forEach(it => {
        if (it.type !== 'session') return;
        const s = C.sessions[it.id];
        if (!s || !it.confirmed || it.extra || s.catchUp === false || itemDone(it, k)) return;
        if (S.workouts.some(w => w.sessionKey === it.id && w.date > k && w.date <= tk)) return;
        out.push({ date: k, item: it });
      });
    }
    return out;
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
    const a = all[k] || {};
    const o = { removed: { ...(a.removed || {}) }, added: [...(a.added || [])], confirmed: { ...(a.confirmed || {}) }, edits: { ...(a.edits || {}) } };
    fn(o);
    ['confirmed', 'edits'].forEach(f => { if (!Object.keys(o[f]).length) delete o[f]; });
    if (!Object.keys(o.removed).length && !o.added.length && !o.confirmed && !o.edits) delete all[k]; else all[k] = o;
  }
  const cleanItem = it => { const c = { type: it.type }; ['id', 'time', 'label', 'min'].forEach(f => { if (it[f]) c[f] = it[f]; }); return c; };
  // Uur, duur en notitie verhuizen mee met een item; verplaatst = bevestigd
  function carryEdits(all, fromK, toK, key) {
    const ed = ((all[fromK] || {}).edits || {})[key];
    editOv(all, fromK, o => { delete o.edits[key]; delete o.confirmed[key]; });
    editOv(all, toK, o => { if (ed) o.edits[key] = ed; o.confirmed[key] = true; });
  }

  function findItem(k, key) { return planFor(parseKey(k)).find(x => itemKey(x) === key); }

  function moveItem(fromK, key, toK) {
    const it = findItem(fromK, key);
    if (!it) return;
    if (it.fixture) { toast('Een match uit de RBFA-kalender pas je aan via Account → Matchen beheren'); return; }
    if (it.type === 'rest') { toast('Een rustdag verplaats je niet. Vervang op een andere dag een sessie door rust.'); return; }
    if (fromK === toK) { closeSheet(); return; }
    if (findItem(toK, key)) { toast(`${itemMeta(it).title} staat al op ${fmtDay(toK)}`); return; }
    const all = clone(overrides());
    if (it.extra) {
      editOv(all, fromK, o => { o.added = o.added.filter(a => itemKey(a) !== key); });
      editOv(all, toK, o => { o.added.push({ ...cleanItem(it), extra: true, note: `Verplaatst van ${fmtDay(fromK)}` }); });
      carryEdits(all, fromK, toK, key);
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
    carryEdits(all, fromK, toK, key);
    closeSheet();
    saveOverrides(all, `${itemMeta(it).title} staat nu op ${fmtDay(toK)}`);
  }

  // Overslaan telt nooit als gemist; een reden (geblesseerd, ziek…) is optioneel
  function skipItem(k, key, reason = '') {
    const it = findItem(k, key);
    if (!it) return;
    const all = clone(overrides());
    const code = reason ? `skip:${reason}` : 'skip';
    if (it.from || it.extra) {
      // Een verplaatst of toegevoegd item blijft op die dag zichtbaar als overgeslagen, zodat je het kan terugzetten
      editOv(all, k, o => { o.added = o.added.map(a => itemKey(a) === key ? { ...a, skipped: code } : a); });
    } else {
      editOv(all, k, o => { o.removed[key] = code; });
    }
    closeSheet();
    saveOverrides(all, `${itemMeta(it).title} overgeslagen${reason ? ` (${reason.toLowerCase()})` : ''}`);
  }

  // Vervangen door een ander type (bv. eigen fitness → kine). Het origineel blijft zichtbaar als "vervangen".
  function replaceItem(k, key, next) {
    const it = findItem(k, key);
    if (!it) return;
    const nk = itemKey(next);
    if (nk === key) { closeSheet(); return; }
    if (findItem(k, nk)) { toast(`${itemMeta(next).title} staat al op deze dag`); return; }
    const all = clone(overrides());
    const ed = ((all[k] || {}).edits || {})[key];
    const code = `replaced:${nk}`;
    let origKey = key;
    if (it.extra && it.replaces) {
      // Een vervanging opnieuw vervangen: de tussenstap verdwijnt, het origineel wijst naar de nieuwste
      origKey = it.replaces;
      editOv(all, k, o => {
        o.added = o.added.filter(a => itemKey(a) !== key).map(a => itemKey(a) === origKey && a.skipped ? { ...a, skipped: code } : a);
        if (o.removed[origKey]) o.removed[origKey] = code;
      });
    } else if (it.extra || it.from) {
      editOv(all, k, o => { o.added = o.added.map(a => itemKey(a) === key ? { ...a, skipped: code } : a); });
    } else {
      editOv(all, k, o => { o.removed[key] = code; });
    }
    editOv(all, k, o => {
      o.added.push({ ...cleanItem(next), extra: true, replaces: origKey, note: `In plaats van ${itemMeta(it).title}` });
      o.confirmed[nk] = true;
      delete o.edits[key];
      if (ed && (ed.time || ed.note)) o.edits[nk] = { time: ed.time, note: ed.note };
    });
    closeSheet();
    saveOverrides(all, `${itemMeta(it).title} vervangen door ${itemMeta(next).title}`);
  }

  // Voorgestelde items bevestigen: één item of alles van een week
  function confirmItems(list, msg) {
    if (!list.length) return;
    const all = clone(overrides());
    list.forEach(([k, key]) => editOv(all, k, o => { o.confirmed[key] = true; }));
    closeSheet();
    saveOverrides(all, msg || 'Bevestigd');
  }

  // Uur, duur en notitie van één item op één dag
  function saveItemEdit(k, key, ed, msg = 'Opgeslagen') {
    const all = clone(overrides());
    editOv(all, k, o => {
      const v = { ...(o.edits[key] || {}), ...ed };
      Object.keys(v).forEach(f => { if (v[f] === '' || v[f] == null) delete v[f]; });
      if (Object.keys(v).length) o.edits[key] = v; else delete o.edits[key];
      o.confirmed[key] = true;
    });
    saveOverrides(all, msg, false);
  }

  // Voltooid zonder sets in te vullen (bv. gedaan zonder gsm). Telt als afgewerkt.
  async function markDone(k, id) {
    if (workoutsOn(k).some(w => w.sessionKey === id)) { toast('Al afgewerkt'); return; }
    const now = Date.now();
    const rec = { date: k, sessionKey: id, title: sessionTitle(id), phase: currentPhase(), startedAt: now, finishedAt: now, exercises: [], quick: true, logged: 'quick', mode: 'volledig', sample: false };
    rec.id = await DB.put('workouts', rec);
    S.workouts.push(rec);
    S.ui.undoDone = { store: 'workouts', id: rec.id };
    closeSheet();
    render({ keepScroll: true });
    toast(`${sessionTitle(id)}: gedaan zonder details`, { action: 'undo-done', label: 'Ongedaan' });
    checkMilestones();
    askRpe('workouts', rec.id);
  }

  // Kine, herstel of een eigen type afvinken: één tik, duur vooraf ingevuld
  async function markSimpleDone(k, key) {
    const it = findItem(k, key); if (!it) return;
    if (itemDone(it, k)) { toast('Al afgewerkt'); return; }
    const rec = { type: it.type, label: it.label || null, date: k, minutes: num(it.min) || (it.type === 'recovery' ? 25 : it.type === 'kine' ? 30 : 0), participation: 'volledig', note: it.userNote || '', createdAt: Date.now(), sample: false };
    rec.id = await DB.put('activities', rec);
    S.activities.push(rec);
    S.ui.undoDone = { store: 'activities', id: rec.id };
    closeSheet();
    render({ keepScroll: true });
    toast(`${itemMeta(it).title}: gedaan`, { action: 'undo-done', label: 'Ongedaan' });
    checkMilestones();
    askRpe('activities', rec.id);
  }

  // Verwijderen: weg uit de planning (telt niet als gemist). Terugzetten kan in de planning.
  function deleteItem(k, key) {
    const it = findItem(k, key);
    if (!it) return;
    const all = clone(overrides());
    if (it.from || it.extra) {
      editOv(all, k, o => { o.added = o.added.filter(a => itemKey(a) !== key); });
      if (it.from) editOv(all, it.from, o => { o.removed[key] = 'del'; });
      if (it.extra && it.replaces) editOv(all, k, o => { if (String(o.removed[it.replaces] || '').startsWith('replaced:')) o.removed[it.replaces] = 'del'; });
    } else {
      editOv(all, k, o => { o.removed[key] = 'del'; });
    }
    editOv(all, k, o => { delete o.edits[key]; delete o.confirmed[key]; });
    closeSheet();
    saveOverrides(all, `${itemMeta(it).title} verwijderd uit de planning`);
  }

  function restoreItem(k, key) {
    const all = clone(overrides());
    const reason = ((all[k] || {}).removed || {})[key];
    if (reason && reason.startsWith('moved:')) editOv(all, reason.slice(6), o => { o.added = o.added.filter(a => itemKey(a) !== key); });
    const addedReason = (((all[k] || {}).added || []).find(a => itemKey(a) === key && a.skipped) || {}).skipped;
    if ((reason && reason.startsWith('replaced:')) || (addedReason && addedReason.startsWith('replaced:'))) editOv(all, k, o => { o.added = o.added.filter(a => a.replaces !== key); });
    editOv(all, k, o => {
      delete o.removed[key];
      o.added = o.added.map(a => { if (itemKey(a) !== key || !a.skipped) return a; const c = { ...a }; delete c.skipped; return c; });
    });
    saveOverrides(all, 'Terug in de planning gezet');
  }

  // Iets toevoegen op een dag: een sessie uit je schema/eigen workout, of een eenvoudig type
  function addItemTo(k, item, note = 'Toegevoegd') {
    const key = itemKey(item);
    if (findItem(k, key)) { closeSheet(); toast(`${itemMeta(item).title} staat al op deze dag`); return; }
    const all = clone(overrides());
    editOv(all, k, o => {
      // Stond het item er al maar was het weggehaald, zet het dan gewoon terug
      if (o.removed[key] && !String(o.removed[key]).startsWith('moved:')) { delete o.removed[key]; o.confirmed[key] = true; return; }
      o.added = o.added.filter(a => itemKey(a) !== key);
      o.added.push({ ...cleanItem(item), extra: true, note });
      o.confirmed[key] = true;
    });
    closeSheet();
    saveOverrides(all, `${itemMeta(item).title} toegevoegd op ${fmtDay(k)}`);
  }
  const addSessionTo = (k, id, note = 'Extra toegevoegd') => addItemTo(k, { type: 'session', id }, note);

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
      const items2 = items.filter(x => x.type !== 'rest').map(x => itemMeta(x).short).join(', ');
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

  // Verplaatsen: de slimme keuze bovenaan, daarna de komende 7 dagen met advies
  function openMoveSheet(k, key) {
    const it = findItem(k, key);
    if (!it) return;
    const m = itemMeta(it);
    const days = suggestDays(key, k);
    const best = days.find(o => o.best);
    openSheet(`<div class="sheet-head"><div><h3>${esc(m.title)} verplaatsen</h3><p>Nu gepland op ${fmtDay(k)}.</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${best ? `<button class="btn accent block lg" data-action="move-to" data-from="${k}" data-key="${esc(key)}" data-to="${best.k}">${icon('magic')} Beste dag: ${fmtDay(best.k)}</button>
      <p class="label" style="margin:8px 0 16px">Zware sessies komen nooit op een matchdag of de dag ervoor, en de app vermijdt dagen waarop al een sessie staat.</p>` : ''}
      <p class="label" style="margin:0 0 8px">Of kies zelf</p>
      <div class="day-pick">${days.map(o => `<button class="${o.best ? 'best' : ''}" data-action="move-to" data-from="${k}" data-key="${esc(key)}" data-to="${o.k}">
        <b>${cap(DAY_S[o.d.getDay()])} ${o.d.getDate()} ${MON[o.d.getMonth()]}</b>
        <span>${esc(o.label)}</span>
        <span class="tag ${o.best ? 'done' : o.score >= 0 ? '' : 'missed'}">${o.best ? 'Aanbevolen' : o.score >= 0 ? 'Kan' : esc(o.why[0] || 'Liever niet')}</span>
      </button>`).join('')}</div>
      <label class="field mt-16"><span>Andere datum</span>
        <div class="row"><input class="input" type="date" id="move-date" min="${dkey(today())}"><button class="btn primary" style="flex:0 0 auto" data-action="move-custom" data-from="${k}" data-key="${esc(key)}">Zet</button></div></label>`);
  }


  /* ================= Router ================= */
  // Hoofdtabs (zonder terugknop) en subschermen (met terugknop naar hun tab)
  const ROUTES = {
    vandaag: { label: 'Vandaag', icon: 'home', render: () => renderToday() },
    planning: { label: 'Planning', icon: 'calendar', render: () => renderPlanning() },
    workout: { label: 'Training', icon: 'dumbbell', render: () => renderTraining() },
    blessures: { label: 'Lichaam', icon: 'heart', render: () => renderLichaam() }
  };
  // Account open je via je avatar op Vandaag (geen eigen tab)
  const SUBS = { statistieken: { parent: 'workout', render: () => renderStats() }, account: { parent: null, render: () => renderAccount() }, matchen: { parent: 'account', render: () => renderMatches() }, blessure: { parent: 'blessures', render: () => renderInjury() } };
  const ALIASES = { profiel: 'account', kalender: 'planning', voortgang: 'statistieken', training: 'workout', lichaam: 'blessures' };
  let lastRoute = null;
  const currentRoute = () => {
    const r = location.hash.slice(1);
    if (ALIASES[r]) return ALIASES[r];
    return ROUTES[r] || SUBS[r] ? r : 'vandaag';
  };

  function render({ keepScroll = false } = {}) {
    if (S.auth) return renderAuth();
    $('#tabbar').hidden = false;
    const r = currentRoute();
    const y = window.scrollY;
    if (r !== lastRoute && r === 'workout') S.ui.woView = null;
    (ROUTES[r] || SUBS[r]).render();
    renderTabbar(SUBS[r] ? SUBS[r].parent : r);
    if (S.settings.demo) main.insertAdjacentHTML('afterbegin', `<div class="demo-bar" role="status"><span><b>Demostand</b> · voorbeelddata telt mee</span><button data-action="demo-off">Uitzetten</button></div>`);
    if (keepScroll || r === lastRoute) window.scrollTo(0, y);
    else { window.scrollTo(0, 0); enterView(); }
    lastRoute = r;
  }

  // Schermwissel: zachte fade + 8px, kaarten gestaffeld; grote cijfers tellen op (uit bij reduced motion)
  const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  function enterView() {
    if (reduceMotion()) return;
    main.classList.remove('view-enter'); void main.offsetWidth; main.classList.add('view-enter');
    clearTimeout(enterView.t); enterView.t = setTimeout(() => main.classList.remove('view-enter'), 700);
    countUp(main);
  }
  function countUp(root) {
    root.querySelectorAll('.tile-num, .stat b, .inj-pain-num b, .streak-num, .gauge-center .num, .ring b').forEach(el => {
      const tn = [...el.childNodes].find(n => n.nodeType === 3 && /^\s*\d+\s*$/.test(n.nodeValue));
      if (!tn) return;
      const to = parseInt(tn.nodeValue, 10); if (!(to > 1)) return;
      const t0 = performance.now();
      const step = t => {
        const p = Math.min(1, (t - t0) / 400), e = 1 - Math.pow(1 - p, 3);
        tn.nodeValue = String(Math.round(to * e));
        if (p < 1) requestAnimationFrame(step);
      };
      tn.nodeValue = '0'; requestAnimationFrame(step);
    });
  }

  function renderTabbar(active) {
    const keys = Object.keys(ROUTES);
    const bar = $('#tabbar');
    bar.style.gridTemplateColumns = `repeat(${keys.length + 1}, 1fr)`;
    const tabs = keys.map(key => {
      const r = ROUTES[key];
      // Alleen het icoon is zichtbaar; de naam blijft voor schermlezers en als tooltip
      return `<a class="tab ${key === active ? 'active' : ''}" href="#${key}" aria-label="${r.label}" title="${r.label}" ${key === active ? 'aria-current="page"' : ''}><span class="box">${icon(r.icon)}</span></a>`;
    });
    // Centrale "+" om alle sport te loggen
    tabs.splice(2, 0, `<button class="tab tab-plus" data-action="add-menu" data-k="${dkey(today())}" aria-label="Inplannen" title="Inplannen"><span class="box">${icon('plus')}</span></button>`);
    bar.innerHTML = tabs.join('');
  }

  // Kop voor een hoofdtab (geen terugknop) en voor een subscherm (wel een terugknop)
  const pageHead = (title, sub = '', right = '') =>
    `<header class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right}</header>`;
  const subHead = (title, back, sub = '', right = '') =>
    `<header class="sub-head">${iconBtn('back', 'go', 'Terug', `data-to="${back}"`)}<div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right || '<span></span>'}</header>`;


  /* ================= Preventie: belasting, zones en readiness ================= */
  // Belasting per sessie = zwaarte (0–10) × minuten (sRPE, Foster).
  // Ontbreekt de zwaarte (oude registraties, snelle "Gedaan"), dan schatten we per type.
  const RPE_EST = { kracht: 6, herstel: 3, training: 6, match: 8, run: 6, kine: 3, recovery: 2, sport: 6, custom: 5 };
  function loadsBetween(fromK, toK) {
    const out = [];
    S.workouts.forEach(w => {
      if (w.date < fromK || w.date > toK) return;
      const est = C.sessions[w.sessionKey] && C.sessions[w.sessionKey].program ? RPE_EST.herstel : RPE_EST.kracht;
      const r = num(w.rpe);
      out.push({ date: w.date, load: (r ?? est) * woMinutes(w), est: r == null });
    });
    S.activities.forEach(a => {
      if (a.date < fromK || a.date > toK) return;
      const r = num(a.rpe);
      out.push({ date: a.date, load: (r ?? (RPE_EST[a.type] ?? 5)) * (+a.minutes || 0), est: r == null });
    });
    return out;
  }
  // Zones op basis van de acute:chronische verhouding (ACWR, Gabbett 2016):
  //   acuut   = belasting van de laatste 7 dagen (vandaag inbegrepen)
  //   chronisch = gemiddelde weekbelasting van de 4 weken daarvoor (dag 8 t/m 35)
  //   < 0,8 te laag · 0,8–1,3 optimaal · 1,3–1,5 let op · > 1,5 piek
  //   Minder dan 14 dagen geschiedenis of geen chronische belasting: nog te weinig gegevens.
  const ZONES = { laag: 'Te laag', optimaal: 'Optimaal', letop: 'Let op', piek: 'Piek', onbekend: 'Nog te weinig gegevens' };
  function loadInfo() {
    const t = today(), tk = dkey(t);
    const acuteL = loadsBetween(dkey(addDays(t, -6)), tk), chronL = loadsBetween(dkey(addDays(t, -34)), dkey(addDays(t, -7)));
    const acute = Math.round(sum(acuteL.map(x => x.load))), chronic = Math.round(sum(chronL.map(x => x.load)) / 4);
    const all = [...S.workouts, ...S.activities].map(x => x.date).filter(Boolean).sort();
    const history = all.length ? daysBetween(parseKey(all[0]), t) : 0;
    const ratio = chronic > 0 ? acute / chronic : null;
    const zone = history < 14 || ratio == null ? 'onbekend' : ratio < 0.8 ? 'laag' : ratio <= 1.3 ? 'optimaal' : ratio <= 1.5 ? 'letop' : 'piek';
    const est = [...acuteL, ...chronL].filter(x => x.est).length;
    return { acute, chronic, ratio, zone, est };
  }
  function weeklyLoads(n = 6) {
    const ws0 = startOfWeek(today()), out = [];
    for (let i = n - 1; i >= 0; i--) {
      const ws = addDays(ws0, -7 * i);
      out.push({ label: `W${isoWeek(ws)}`, value: Math.round(sum(loadsBetween(dkey(ws), dkey(addDays(ws, 6))).map(x => x.load))) });
    }
    return out;
  }
  // Readiness: Rust (pijn boven grens, vermoeidheid 5 of piek), Opletten (stijging, pijn op de grens,
  // vermoeidheid 4 of let op), anders Klaar. Zonder check van vandaag telt alleen de belasting.
  function readiness() {
    const c = checkFor(dkey(today())), act = activeInjuries(), L = loadInfo();
    const fat = c && c.fatigue != null ? c.fatigue : null;
    const painToday = inj => { const v = injurySides(inj).map(s => checkVal(c, inj.id, 'pain', s)).filter(x => x != null); return v.length ? Math.max(...v) : null; };
    const over = act.filter(i => { const p = painToday(i), l = num(i.painLimit); return p != null && l != null && p > l; });
    const atLim = act.filter(i => { const p = painToday(i), l = num(i.painLimit); return p != null && l != null && p === l; });
    const rise = act.filter(i => checkRise(i).length);
    const has = act.length ? act.every(i => checkEntry(c, i.id)) : fat != null;
    const why = [];
    let state = 'klaar';
    if (over.length || fat === 5 || L.zone === 'piek') {
      state = 'rust';
      if (over.length) why.push(`pijn boven je grens (${over.map(injuryLabel).join(', ')})`);
      if (fat === 5) why.push('erg moe');
      if (L.zone === 'piek') why.push('piek in je belasting');
    } else if (rise.length || atLim.length || fat === 4 || L.zone === 'letop') {
      state = 'opletten';
      if (rise.length) why.push('hoger dan je vorige check');
      if (atLim.length) why.push('pijn op je grens');
      if (fat === 4) why.push('vermoeid');
      if (L.zone === 'letop') why.push('belasting hoger dan gewoonlijk');
    } else why.push(L.zone === 'optimaal' ? 'belasting in balans' : L.zone === 'laag' ? 'belasting lager dan gewoonlijk' : 'niets bijzonders');
    if (!has) why.push('check nog niet ingevuld');
    return { state, label: { klaar: 'Klaar', opletten: 'Opletten', rust: 'Rust' }[state], why: cap(why.join(' · ')) };
  }
  function readinessTile() {
    const r = readiness();
    return `<button class="card readiness ${r.state}" data-action="go" data-to="blessures" aria-label="Readiness: ${r.label}. ${esc(r.why)}. Naar Lichaam">
      <span class="label">Readiness</span><b>${r.label}</b><span class="rd-why">${esc(r.why)}</span>${icon('chevR')}</button>`;
  }
  // Belastingsmeter: vier zones op een balk, met een markering op de verhouding
  function loadCard() {
    const L = loadInfo();
    const pos = L.ratio == null ? null : Math.max(0, Math.min(1, L.ratio / 2));
    const warn = L.zone === 'letop' || L.zone === 'piek';
    return `<section class="card load-card">
      <div class="card-head"><h2>Belasting</h2><span class="label">7 d tegenover 4 weken</span></div>
      <div class="load-zone ${warn ? 'warn' : L.zone}"><b>${ZONES[L.zone]}</b>${L.ratio != null ? `<span>${fmtNum(Math.round(L.ratio * 100) / 100)}</span>` : ''}</div>
      <div class="load-meter" aria-hidden="true"><i class="z-laag"></i><i class="z-optimaal"></i><i class="z-letop"></i><i class="z-piek"></i>${pos != null ? `<em style="left:${(pos * 100).toFixed(1)}%"></em>` : ''}</div>
      <div class="load-nums"><div><b>${L.acute}</b><span>deze 7 dagen</span></div><div><b>${L.chronic}</b><span>gemiddeld per week</span></div></div>
      ${L.est ? `<p class="label mt-8">${L.est} registratie${L.est === 1 ? '' : 's'} zonder zwaarte: geschat.</p>` : ''}
    </section>`;
  }
  // Trend van de dagelijkse check (14 dagen): pijn per lopend traject, anders vermoeidheid
  function checkTrendCard() {
    const t = today(), days = [], labels = [];
    for (let i = 13; i >= 0; i--) { const d = addDays(t, -i); days.push(dkey(d)); labels.push(fmtShort(d)); }
    const act = activeInjuries();
    let body;
    if (act.length) {
      const inj = act[0], lim = num(inj.painLimit);
      const vals = days.map(k => { const c = checkFor(k); const v = injurySides(inj).map(s => checkVal(c, inj.id, 'pain', s)).filter(x => x != null); return v.length ? Math.max(...v) : null; });
      body = vals.some(v => v != null) ? `<p class="label">Pijn · ${esc(injuryLabel(inj))}</p>${Charts.line({ labels, series: [{ color: 'var(--accent)', values: vals }], step: true, height: 110, yMin: 0, yMax: 10, ticks: lim != null ? [0, lim, 10] : [0, 5, 10], warnAbove: lim })}` : '<p class="empty">Nog geen checks in deze periode.</p>';
    } else {
      const vals = days.map(k => { const c = checkFor(k); return c && c.fatigue != null ? c.fatigue : null; });
      body = vals.some(v => v != null) ? `<p class="label">Vermoeidheid (1–5)</p>${Charts.line({ labels, series: [{ color: 'var(--accent)', values: vals }], step: true, height: 110, yMin: 1, yMax: 5, ticks: [1, 3, 5] })}` : '<p class="empty">Nog geen checks in deze periode.</p>';
    }
    return `<section class="card"><div class="card-head"><h2>Dagelijkse check</h2><span class="label">14 dagen</span></div>${body}</section>`;
  }

  /* ================= Alle sport loggen ================= */
  const RUN_TYPES = { duurloop: 'Duurloop', interval: 'Interval', herstel: 'Herstelloop', sprint: 'Sprint' };
  const RUN_SURF = { gras: 'Gras', asfalt: 'Asfalt', piste: 'Piste', loopband: 'Loopband' };
  // Tempo in min/km als tekst (bv. 5:12), of '–'
  function paceText(km, min) {
    const k = num(km), m = num(min);
    if (!k || !m) return '–';
    const s = Math.round((m * 60) / k);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  function openLogMenu() {
    const tiles = [['kracht', 'dumbbell', 'Kracht', 'Workout starten'], ['run', 'bolt', 'Lopen', 'Afstand en tempo'], ['training', 'whistle', 'Voetbaltraining', 'Met de ploeg'],
      ['match', 'ball', 'Match', 'Minuten en gevoel'], ['kine', 'heart', 'Kine', 'Sessie bij je kinesist'], ['sport', 'pulse', 'Andere sport', 'Padel, fietsen, zwemmen…']];
    openSheet(`<div class="sheet-head"><div><h3>Loggen</h3><p>Wat heb je al gedaan?</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="type-grid">${tiles.map(([t, ic, l, s]) => `<button class="type-tile" data-action="log-new" data-type="${t}">${icon(ic)}<b>${l}</b><span>${s}</span></button>`).join('')}</div>`);
  }
  function logNew(type) {
    if (type === 'kracht') { closeSheet(); S.ui.trainSeg = 'kracht'; S.ui.woView = 'picker'; go('workout'); return; }
    if (type === 'run') return openRunLog();
    if (type === 'training' || type === 'match') return openLog(type);
    return openSimpleLog(type);
  }
  function openRunLog(id = null, date = null) {
    const ex = id ? S.activities.find(a => a.id === id) : null;
    const rt = (ex && ex.runType) || 'duurloop', sf = (ex && ex.surface && RUN_SURF[ex.surface] ? ex.surface : null) || (S.settings.runPrefs || {}).surface || 'gras';
    openSheet(`<form id="run-form" data-id="${ex ? ex.id : ''}">
      <div class="sheet-head"><h3>${ex ? 'Bewerken: ' : ''}Lopen</h3>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="form-grid">
        <label class="field"><span>Datum</span><input class="input" type="date" name="date" value="${ex ? ex.date : date || dkey(today())}" max="${dkey(today())}" required></label>
        <label class="field"><span>Afstand (km)</span><input class="input" type="text" inputmode="decimal" pattern="[0-9]+([.,][0-9]+)?" name="km" value="${ex && ex.distanceKm != null ? String(ex.distanceKm).replace('.', ',') : ''}" placeholder="bv. 6,5" required></label>
        <label class="field"><span>Duur (min)</span><input class="input" type="text" inputmode="decimal" pattern="[0-9]+([.,][0-9]+)?" name="minutes" value="${ex && ex.minutes != null ? String(ex.minutes).replace('.', ',') : ''}" placeholder="bv. 35" required></label>
        <div class="field"><span>Tempo</span><output class="input run-pace" id="run-pace">${ex ? paceText(ex.distanceKm, ex.minutes) : '–'} /km</output></div>
      </div>
      <p class="label">Type</p><div class="seg">${Object.entries(RUN_TYPES).map(([v, l]) => radio('runType', v, l, rt)).join('')}</div>
      <p class="label">Ondergrond</p><div class="seg">${Object.entries(RUN_SURF).map(([v, l]) => radio('surface', v, l, sf)).join('')}</div>
      <p class="label">Zwaarte · 1 = heel licht, 10 = maximaal</p>${pickGroup('rpe', ex ? ex.rpe ?? null : null, 1, 10, null)}
      <label class="field mt-12"><span>Notitie</span><textarea class="input" name="note" rows="2" placeholder="Bv. rustig tempo, kuit voelde goed">${esc((ex && ex.note) || '')}</textarea></label>
      <button class="btn accent block lg" type="submit">${icon('check')} Opslaan</button>
    </form>`);
  }
  async function saveRun(form) {
    const f = new FormData(form), id = form.dataset.id ? +form.dataset.id : null;
    const old = id ? S.activities.find(a => a.id === id) : null;
    const rec = { ...(old || {}), type: 'run', date: f.get('date') || dkey(today()), distanceKm: num(String(f.get('km')).replace(',', '.')),
      minutes: num(String(f.get('minutes')).replace(',', '.')) || 0, runType: f.get('runType') || 'duurloop', surface: f.get('surface') || 'gras',
      rpe: padValue('rpe'), note: (f.get('note') || '').trim(), participation: 'volledig', createdAt: old ? old.createdAt : Date.now(), sample: false };
    rec.id = await DB.put('activities', rec);
    S.activities = S.activities.filter(a => a.id !== rec.id).concat(rec);
    await setSetting('runPrefs', { surface: rec.surface });
    closeSheet(); render({ keepScroll: true });
    toast(old ? 'Wijzigingen opgeslagen' : `Loop opgeslagen · ${fmtNum(rec.distanceKm || 0)} km`);
    checkMilestones();
  }
  // Kine, herstel, eigen activiteit of andere sport: datum, minuten, zwaarte, notitie
  function openSimpleLog(type, id = null) {
    const ex = id ? S.activities.find(a => a.id === id) : null;
    if (ex) type = ex.type;
    const title = type === 'kine' ? 'Kine' : type === 'recovery' ? 'Herstel & mobiliteit' : type === 'sport' ? 'Andere sport' : 'Activiteit';
    openSheet(`<form id="simple-form" data-id="${ex ? ex.id : ''}" data-type="${type}">
      <div class="sheet-head"><h3>${ex ? 'Bewerken: ' : ''}${title}</h3>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${type === 'sport' || type === 'custom' ? `<label class="field"><span>${type === 'sport' ? 'Sport' : 'Naam'}</span><input class="input" name="label" value="${esc((ex && ex.label) || '')}" placeholder="Bv. padel" required></label>` : ''}
      <div class="form-grid">
        <label class="field"><span>Datum</span><input class="input" type="date" name="date" value="${ex ? ex.date : dkey(today())}" max="${dkey(today())}" required></label>
        <label class="field"><span>Duur (min)</span><input class="input" type="number" inputmode="numeric" min="0" max="600" name="minutes" value="${ex ? ex.minutes ?? '' : type === 'kine' ? 30 : ''}" required></label>
      </div>
      <p class="label">Zwaarte · 1 = heel licht, 10 = maximaal</p>${pickGroup('rpe', ex ? ex.rpe ?? null : null, 1, 10, null)}
      <label class="field mt-12"><span>Notitie</span><textarea class="input" name="note" rows="2">${esc((ex && ex.note) || '')}</textarea></label>
      <button class="btn accent block lg" type="submit">${icon('check')} Opslaan</button>
    </form>`);
  }
  async function saveSimple(form) {
    const f = new FormData(form), id = form.dataset.id ? +form.dataset.id : null;
    const old = id ? S.activities.find(a => a.id === id) : null;
    const rec = { ...(old || {}), type: form.dataset.type, date: f.get('date') || dkey(today()), minutes: +f.get('minutes') || 0,
      rpe: padValue('rpe'), note: (f.get('note') || '').trim(), participation: (old && old.participation) || 'volledig', createdAt: old ? old.createdAt : Date.now(), sample: false };
    if (f.has('label')) rec.label = (f.get('label') || '').trim() || null;
    rec.id = await DB.put('activities', rec);
    S.activities = S.activities.filter(a => a.id !== rec.id).concat(rec);
    closeSheet(); render({ keepScroll: true });
    toast(old ? 'Wijzigingen opgeslagen' : `${actTitle(rec)} opgeslagen`);
    checkMilestones();
  }
  // Na een snelle "Gedaan": kort de zwaarte vragen (overslaan mag)
  function askRpe(store, id) {
    const rec = S[store].find(x => x.id === id); if (!rec) return;
    openSheet(`<form id="rpe-form" data-store="${store}" data-id="${id}">
      <div class="sheet-head"><div><h3>Hoe zwaar was het?</h3><p>${esc(store === 'workouts' ? woTitle(rec) : actTitle(rec))} · nodig voor je belasting</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${pickGroup('rpe', null, 1, 10, null)}
      <div class="row mt-16"><button type="button" class="btn" data-action="close-sheet">Overslaan</button><button class="btn accent" type="submit">Opslaan</button></div>
    </form>`);
  }
  async function saveRpe(form) {
    const store = form.dataset.store, rec = S[store].find(x => x.id === +form.dataset.id), v = padValue('rpe');
    closeSheet();
    if (!rec || v == null) return;
    rec.rpe = v; await DB.put(store, rec);
    render({ keepScroll: true });
    toast(`Zwaarte ${v}/10 opgeslagen`);
  }

  /* ================= Training: Overzicht, Kracht, Lopen, Voetbal ================= */
  const TRAIN_SEGS = [['overzicht', 'Overzicht'], ['kracht', 'Kracht'], ['lopen', 'Lopen'], ['voetbal', 'Voetbal']];
  function renderTraining() {
    const w = draft();
    const seg = S.ui.trainSeg || 'overzicht';
    if (w && (S.ui.woView === 'active' || (seg === 'kracht' && S.ui.woView !== 'picker'))) return renderActive(w);
    const body = { overzicht: trainOverview, kracht: krachtHtml, lopen: runsHtml, voetbal: footballHtml }[seg]();
    main.innerHTML = `
      ${pageHead('Training', activeInjuries().length ? `${esc(phaseObj(currentPhase()).label)} · ${esc(phaseObj(currentPhase()).title)}` : esc(GOAL_LABEL[goal().type]))}
      <div class="seg" role="tablist">${TRAIN_SEGS.map(([k, l]) => `<button class="${k === seg ? 'on' : ''}" role="tab" aria-selected="${k === seg}" data-action="train-seg" data-s="${k}">${l}</button>`).join('')}</div>
      ${body}`;
  }
  // Tijdlijn per dag
  function timelineHtml(list, max = 12) {
    if (!list.length) return `<section class="card"><p class="empty">Nog niets gelogd.</p></section>`;
    const shown = S.ui.timelineAll ? list : list.slice(0, max);
    let html = '', last = '';
    shown.forEach(x => {
      if (x.date !== last) { html += `<p class="tl-day">${cap(relDay(x.date))}</p>`; last = x.date; }
      html += recentRows([x]);
    });
    return `<section class="card timeline">${html}
      ${list.length > max ? `<button class="btn block sm mt-12" data-action="timeline-all">${S.ui.timelineAll ? 'Minder tonen' : `Alles tonen (${list.length})`}</button>` : ''}</section>`;
  }
  function trainOverview() {
    const w = draft();
    return `${statsHero()}
      ${w ? `<section class="card resume"><div class="card-head"><h2>Onafgewerkte workout</h2><span class="tag adapted">Bewaard</span></div>
        <p class="small"><b>${esc(woTitle(w))}</b> · gestart ${relDay(w.date)}</p>
        <div class="row mt-12"><button class="btn" data-action="wo-leave">Opties</button><button class="btn accent" data-action="wo-resume">${icon('play')} Hervatten</button></div></section>` : ''}
      <button class="btn ${w ? '' : 'accent'} block lg mb-12" data-action="log-menu">${icon('plus')} Loggen</button>
      <div class="section"><span>Tijdlijn</span><button class="link-btn" data-action="go" data-to="statistieken">Alle voortgang ${icon('chevR')}</button></div>
      ${timelineHtml(entries())}`;
  }
  function runsHtml() {
    const runs = S.activities.filter(a => a.type === 'run');
    const t = today(), wk = weekKey(t), mStart = dkey(new Date(t.getFullYear(), t.getMonth(), 1));
    const km = l => fmtNum(Math.round(sum(l.map(a => +a.distanceKm || 0)) * 10) / 10);
    const thisWeek = runs.filter(a => inWeek(a.date, wk)), thisMonth = runs.filter(a => a.date >= mStart);
    const ws = startOfWeek(t); let planned = 0, ran = 0;
    for (let i = 0; i < 7; i++) { const d = addDays(ws, i), k = dkey(d); planFor(d).filter(it => it.type === 'run').forEach(it => { planned++; if (doneOrCaughtUp(it, k)) ran++; }); }
    return `<div class="tiles">
        <div class="tile"><span class="label">Deze week</span><div class="num">${km(thisWeek)}<span class="unit">km</span></div><p>${thisWeek.length} loop${thisWeek.length === 1 ? '' : 'jes'}</p></div>
        <div class="tile"><span class="label">Deze maand</span><div class="num">${km(thisMonth)}<span class="unit">km</span></div><p>${thisMonth.length} loop${thisMonth.length === 1 ? '' : 'jes'}</p></div>
      </div>
      ${planned ? `<p class="run-plan"><b>${ran}/${planned}</b> geplande loopjes deze week gelopen</p>` : ''}
      <button class="btn accent block lg mb-12" data-action="log-new" data-type="run">${icon('plus')} Loop loggen</button>
      ${runs.length ? timelineHtml(entries().filter(x => x.store === 'activities' && x.type === 'run')) : `<section class="card"><p class="empty">Nog geen loopjes gelogd.</p></section>`}`;
  }
  function footballHtml() {
    const acts = S.activities.filter(a => a.type === 'training' || a.type === 'match');
    const since = dkey(addDays(today(), -29));
    const tr = acts.filter(a => a.type === 'training' && a.date >= since), ma = acts.filter(a => a.type === 'match' && a.date >= since);
    return `<div class="tiles">
        <div class="tile"><span class="label">Trainingen · 30 d</span><div class="num">${tr.length}</div><p>${sum(tr.map(a => +a.minutes || 0))} min</p></div>
        <div class="tile"><span class="label">Matchen · 30 d</span><div class="num">${ma.length}</div><p>${sum(ma.map(a => +a.minutes || 0))} min</p></div>
      </div>
      <div class="row mb-12"><button class="btn" data-action="log-new" data-type="training">${icon('plus')} Training</button><button class="btn" data-action="log-new" data-type="match">${icon('plus')} Match</button></div>
      <div class="section"><span>Gelogd</span><button class="link-btn" data-action="go" data-to="matchen">Matchen beheren ${icon('chevR')}</button></div>
      ${timelineHtml(entries().filter(x => x.store === 'activities' && (x.type === 'training' || x.type === 'match')))}`;
  }

  /* ================= Lichaam: Preventie en Herstel ================= */
  function renderLichaam() {
    renderInjuries();
    const prev = `<div class="section"><span>Preventie</span></div>
      ${loadCard()}
      <section class="card"><div class="card-head"><h2>Belasting per week</h2><span class="label">zwaarte × minuten</span></div>${Charts.bars(weeklyLoads(), { selected: 5, action: null, height: 120 })}</section>
      ${checkTrendCard()}
      <div class="section"><span>Herstel</span></div>`;
    const head = main.querySelector('.page-photo, .page-head');
    if (head) head.insertAdjacentHTML('afterend', prev);
    main.insertAdjacentHTML('beforeend', `<p class="footer-note">Indicatie, geen medisch advies.</p>`);
  }

  /* ================= Home (vandaag) ================= */
  // Info over een sessie zoals de gebruiker ze ziet
  function sessInfo(id) {
    const s = C.sessions[id] || {};
    const st = sessionStats(id);
    return {
      name: sessionTitle(id), desc: sessionDesc(id), place: s.place || '',
      type: actKindOf(id), icon: s.icon || 'dumbbell', ...st
    };
  }
  const dayLabel = k => {
    const diff = daysBetween(today(), parseKey(k));
    if (diff === 0) return 'Vandaag';
    if (diff === 1) return 'Morgen';
    if (diff === -1) return 'Gisteren';
    const d = parseKey(k);
    return `${cap(DAY_S[d.getDay()])} ${d.getDate()}`;
  };
  // Soort: herstel, kracht, eigen workout, clubtraining, match of rust
  // Een eigen workout die bij een blessure hoort, telt als herstel
  const isRehab = id => injuries().some(i => (i.linked || []).includes(id));
  const actKindOf = id => { const s = C.sessions[id] || {}; return s.program || isRehab(id) ? 'Herstel' : s.custom ? 'Eigen workout' : 'Kracht'; };
  // Kleurgroep (stip en label): kracht, herstel, training, match, rust
  const itemType = it => it.type === 'session' ? (C.sessions[it.id] && (C.sessions[it.id].program || isRehab(it.id)) ? 'herstel' : 'kracht')
    : it.type === 'rest' ? 'rust' : it.type === 'run' ? 'kracht' : SIMPLE.includes(it.type) ? 'herstel' : it.type;
  const actKind = it => it.type === 'session' ? (actKindOf(it.id) === 'Kracht' ? 'Fitness' : actKindOf(it.id))
    : ({ training: 'Voetbal', match: 'Match', run: 'Lopen', rest: 'Rust', kine: 'Kine', recovery: 'Herstel', custom: 'Eigen' }[it.type] || '');
  // Titel van een gelogde training, match of eenvoudige activiteit
  const actTitle = a => a.type === 'match' ? (a.opponent ? `Match tegen ${a.opponent}` : 'Match') : a.type === 'training' ? 'Voetbaltraining'
    : a.type === 'kine' ? 'Kine' : a.type === 'recovery' ? 'Herstel & mobiliteit' : a.type === 'run' ? (RUN_TYPES[a.runType] || 'Lopen')
    : a.type === 'sport' ? (a.label || 'Andere sport') : (a.label || 'Activiteit');
  const actIcon = a => ({ match: 'ball', training: 'whistle', kine: 'heart', recovery: 'pulse', run: 'bolt', sport: 'pulse' }[a.type] || 'list');

  // De sessie die de grote startknop krijgt: eerst open krachtwerk, anders herstel
  function relevantSession(items, k) {
    const open = items.filter(it => it.type === 'session' && C.sessions[it.id] && !doneOrCaughtUp(it, k));
    return open.find(it => !C.sessions[it.id].program) || open[0] || null;
  }

  function dayDotsHtml(d) {
    const k = dkey(d), tk = dkey(today());
    const types = {};
    planFor(d).forEach(it => {
      if (it.type === 'rest') return;
      const t = itemType(it), done = doneOrCaughtUp(it, k);
      if (!types[t] || done) types[t] = done ? 'done' : k < tk ? 'missed' : 'planned';
    });
    return Object.entries(types).slice(0, 3).map(([t, st]) => `<i class="dot t-${t} ${st === 'done' ? '' : 'planned'}"></i>`).join('');
  }

  function renderToday() {
    const t = today(), tk = dkey(t);
    const k = S.ui.homeDay && S.ui.homeDay >= dkey(addDays(t, -3)) ? S.ui.homeDay : tk;
    let strip = '';
    for (let i = -3; i <= 10; i++) {
      const d = addDays(t, i), dk = dkey(d);
      strip += `<button class="day ${dk === k ? 'on' : ''}" data-action="home-day" data-k="${dk}" aria-pressed="${dk === k}">${dayLabel(dk)}<span class="day-dots">${dayDotsHtml(d)}</span></button>`;
    }
    main.innerHTML = `
      ${homeHeader()}
      ${progressTiles()}
      ${readinessTile()}
      ${resumeCard()}
      ${checkCard()}
      <div class="section"><span>${k === tk ? 'Vandaag gepland' : cap(fmtDay(k))}</span>${k !== tk ? `<button class="link-btn" data-action="home-day" data-k="${tk}">Naar vandaag</button>` : ''}</div>
      <div class="day-strip" id="day-strip">${strip}</div>
      ${activitiesHtml(k)}
      ${quoteCard()}
      <div class="section"><span>Deze week</span><span>week ${isoWeek(t)}</span></div>
      ${weekCard()}
      ${activeInjuries().length ? '' : progressCard()}
      ${nextMatchCard()}
    `;
    const strip$ = $('#day-strip'), on = strip$ && strip$.querySelector('.day.on');
    if (on) strip$.scrollLeft += on.getBoundingClientRect().left - strip$.getBoundingClientRect().left - 44;
  }

  function avatarInner() {
    const photo = S.settings.photo;
    return photo ? `<img src="${photo}" alt="">` : esc((profile().name || '?').charAt(0).toUpperCase());
  }

  // Compacte fotoheader: sfeer, zonder de planning naar beneden te duwen
  function homeHeader() {
    const t = today(), p = profile(), hr = new Date().getHours();
    const greet = hr < 12 ? 'Goeiemorgen' : hr < 18 ? 'Goeiemiddag' : 'Goeienavond';
    const g = goal(), act = activeInjuries();
    const sub = act.length ? `${GOAL_LABEL[g.type]} · ${act.map(injuryLabel).join(', ')}` : `${GOAL_LABEL[g.type]} · geen actieve blessure`;
    return `<header class="photo-head">
      <img src="assets/hero.webp" alt="" class="photo-img" decoding="async" onerror="this.remove()">
      <div class="photo-shade"></div>
      <div class="photo-top"><span class="photo-date">${cap(fmtLong(t))}</span><button class="avatar" data-action="go" data-to="account" aria-label="Account">${avatarInner()}</button></div>
      <div class="photo-bottom"><h1 class="display">${greet}, ${esc(p.name)}</h1><p>${esc(sub)}</p></div>
    </header>`;
  }

  // Een onafgewerkte workout kun je altijd hervatten
  function resumeCard() {
    const w = draft();
    if (!w) return '';
    const all = w.exercises.flatMap(x => x.sets), done = all.filter(s => s.done).length;
    return `<section class="card resume">
      <div class="card-head"><h2>Onafgewerkte workout</h2><span class="tag adapted">Bewaard</span></div>
      <p class="small"><b>${esc(woTitle(w))}</b> · gestart ${relDay(w.date)} om ${fmtTime(w.startedAt)} · ${done} van ${all.length} sets</p>
      <div class="row mt-12"><button class="btn" data-action="wo-finish">Afronden</button><button class="btn accent" data-action="wo-resume">${icon('play')} Hervatten</button></div>
    </section>`;
  }

  // Korte dagelijkse check: per lopend traject stijfheid en pijn, zonder traject alleen vermoeidheid
  function checkCard() {
    const tk = dkey(today()), c = checkFor(tk), act = activeInjuries();
    if (!act.length) {
      const f = c && c.fatigue != null ? c.fatigue : null;
      return checkRow(f != null ? `Ingevuld · vermoeidheid ${f} van 5` : 'Hoe fris voel je je vandaag? Eén tik.', f != null);
    }
    const filled = act.every(i => checkEntry(c, i.id));
    const summary = filled
      ? act.map(inj => `${injuryLabel(inj)}: pijn ${valsText(c, inj, 'pain')}`).join(' · ')
      : `Nog niet ingevuld · ${act.length === 1 ? injuryLabel(act[0]) : `${act.length} trajecten`}`;
    const warns = act.map(inj => {
      const rise = checkRise(inj), agr = latestAgreement(inj);
      return rise.length ? `<p class="status-line warn">${esc(injuryLabel(inj))}: hoger dan de vorige meting (${esc(rise.join(', '))}). ${esc(agr ? 'Jouw afspraak: ' + agr.text : 'Bespreek met je kinesist hoe je hiermee omgaat.')}</p>` : '';
    }).join('');
    return checkRow(summary, filled, warns);
  }

  // Dagelijkse check als één rij: tekst links, kleine secundaire knop rechts
  function checkRow(sub, filled, warns = '') {
    return `<section class="card check-compact">
      <button class="check-row" data-action="open-check" aria-label="Dagelijkse check ${filled ? 'aanpassen' : 'invullen'}">
        <span class="body"><b>Dagelijkse check</b><span>${esc(sub)}</span></span>
        <span class="check-go">${filled ? 'Aanpassen' : 'Invullen'}${icon('chevR')}</span>
      </button>${warns}
    </section>`;
  }

  // Bottom sheet achter de "…"-knop van de sessiekaart: alle secundaire acties
  function openItemMenu(k, key) {
    const it = findItem(k, key); if (!it) return;
    const tk = dkey(today()), m = itemMeta(it);
    const done = it.type !== 'rest' && doneOrCaughtUp(it, k), rec = recordFor(it, k);
    const s = it.type === 'session' ? C.sessions[it.id] : null;
    const fixed = !!it.fixture;
    const canMove = !done && !fixed && it.type !== 'rest' && (!s || s.catchUp !== false);
    const row = (ic, action, title, sub, extra = '') =>
      `<button type="button" class="menu-btn" data-action="${action}" data-k="${k}" data-key="${esc(key)}" ${extra}>${icon(ic)}<span><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</span></button>`;
    const rows = [];
    if (!done && k <= tk && it.type !== 'rest') {
      rows.push(row('check', 'item-done', 'Afgerond', s ? 'Afgewerkt zonder details te loggen' : it.type === 'training' || it.type === 'match' || it.type === 'run' ? 'Opent het logformulier' : ''));
      if (it.type === 'session' || it.type === 'training' || it.type === 'match') rows.push(row('edit', 'adapted', 'Aangepast uitgevoerd', 'Anders gedaan dan gepland'));
    }
    if (!done && !it.confirmed && it.type !== 'rest') rows.push(row('check', 'confirm-item', 'Bevestigen', 'Dit staat vast in je planning'));
    if (canMove) rows.push(row('move', 'open-move', 'Verplaatsen', 'Met advies voor de beste dag'));
    if (!done && it.type !== 'rest') rows.push(row('skip', 'skip-item', 'Overslaan', 'Telt niet als gemist'));
    if (done && rec) rows.push(row('undo', 'item-undone', 'Terug naar nog te doen', 'Verwijdert de registratie van die dag'));
    if (rec) rows.push(`<button type="button" class="menu-btn" data-action="show-entry" data-store="${rec.store}" data-id="${rec.r.id}">${icon('list')}<span><b>Bekijk log</b><small>${esc(recStatus(rec).label)} · ${esc(recordLine(rec))}</small></span></button>`);
    if (it.rule && ruleById(it.rule)) {
      rows.push(`<button type="button" class="menu-btn" data-action="rp-edit" data-id="${it.rule}">${icon('sync')}<span><b>Herhaling aanpassen</b><small>${esc(ruleText(ruleById(it.rule)))}</small></span></button>`);
      rows.push(`<button type="button" class="menu-btn" data-action="rp-stop" data-id="${it.rule}" data-k="${k}">${icon('x')}<span><b>Herhaling stoppen</b><small>Vanaf ${esc(fmtDay(k))}; eerdere dagen blijven</small></span></button>`);
    }
    if (!fixed && it.type !== 'rest') rows.push(row('trash', 'del-item', 'Uit de planning halen', it.rule ? 'Alleen deze dag; de herhaling blijft' : 'Je kan het terugzetten in de kalender'));
    rows.push(row('list', 'item-actions', 'Alles aanpassen…', 'Type, dag en uur, notitie, status, overslaan met reden, verwijderen'));
    openSheet(`<div class="sheet-head"><div><span class="eyebrow">${esc(actKind(it))}</span><h3>${esc(it.type === 'session' ? sessionTitle(it.id) : m.title)}</h3><p>${cap(fmtDay(k))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="menu-list">${rows.join('')}</div>`);
  }

  // Geplande activiteiten van een dag, elk als eigen kaart
  function activitiesHtml(k) {
    const { items, off } = planDetail(parseKey(k));
    const tk = dkey(today());
    // Hoofdkaart: eerst open krachtwerk/herstel, anders het eerste openstaande item van de dag (alleen vandaag of eerder)
    const rel = k > tk ? null : relevantSession(items, k) || items.find(it => it.type !== 'rest' && !doneOrCaughtUp(it, k)) || null;
    // De hoofdkaart met de primaire knop komt bovenaan
    const ordered = rel ? [rel, ...items.filter(it => it !== rel)] : items;
    let html = ordered.map(it => actCard(it, k, it === rel)).join('');
    const skipped = off.filter(o => isSkip(o.reason));
    if (skipped.length) html += `<p class="label" style="margin:4px 0 8px">Overgeslagen: ${skipped.map(o => esc(itemMeta(o.item).title)).join(', ')} · <button class="link-btn" style="padding:0" data-action="cal-open" data-k="${k}">bekijk</button></p>`;
    return html || `<section class="card empty-row"><p>Niets gepland.</p><button class="btn sm" data-action="add-menu" data-k="${k}">${icon('plus')} Inplannen</button></section>`;
  }

  // Wat er gelogd is voor een gepland item
  function recordFor(it, k) {
    if (it.type === 'session') { const r = workoutsOn(k).find(w => w.sessionKey === it.id); return r ? { store: 'workouts', r } : null; }
    if (it.type === 'training' || it.type === 'match' || it.type === 'run' || SIMPLE.includes(it.type)) { const r = activitiesOn(k).find(a => actMatches(a, it)); return r ? { store: 'activities', r } : null; }
    return null;
  }
  function recStatus({ store, r }) {
    if (store === 'workouts') {
      if (r.mode === 'aangepast') return { cls: 'adapted', label: 'Aangepast' };
      if (r.quick || r.logged === 'quick') return { cls: 'done', label: 'Zonder details' };
      return { cls: 'done', label: 'Gelogd' };
    }
    if (r.participation === 'aangepast') return { cls: 'adapted', label: 'Aangepast' };
    if (r.participation === 'gedeeltelijk') return { cls: 'adapted', label: 'Gedeeltelijk' };
    return { cls: 'done', label: 'Gelogd' };
  }
  const woMinutes = w => w.durationMin || (w.startedAt && w.finishedAt && w.finishedAt > w.startedAt ? Math.max(1, Math.round((w.finishedAt - w.startedAt) / 60000)) : (C.sessions[w.sessionKey] ? sessionStats(w.sessionKey).minutes : 0));
  function recordLine({ store, r }) {
    const bits = [];
    if (store === 'workouts') { bits.push(`${woMinutes(r)} min`); if (r.rpe != null) bits.push(`zwaarte ${r.rpe}/10`); }
    else if (r.type === 'run') { bits.push(`${fmtNum(r.distanceKm || 0)} km`, `${fmtNum(r.minutes)} min`, `${paceText(r.distanceKm, r.minutes)} /km`); if (r.rpe != null) bits.push(`zwaarte ${r.rpe}/10`); }
    else { bits.push(`${r.minutes} min`); if (r.rpe != null) bits.push(`zwaarte ${r.rpe}/10`); }
    return bits.join(' · ');
  }

  // Snelle keuzes onder de startknop
  function quickRow(it, k) {
    const key = itemKey(it), canMove = it.type === 'session' && C.sessions[it.id].catchUp !== false;
    return `<div class="quick">
      <button data-action="mark-done" data-k="${k}" data-key="${it.id}">${icon('check')}Gedaan</button>
      <button data-action="adapted" data-k="${k}" data-key="${esc(key)}">${icon('edit')}Aangepast</button>
      ${canMove ? `<button data-action="open-move" data-k="${k}" data-key="${esc(key)}">${icon('move')}Verplaatsen</button>` : `<button data-action="skip-item" data-k="${k}" data-key="${esc(key)}">${icon('skip')}Overslaan</button>`}
      <button data-action="item-actions" data-k="${k}" data-key="${esc(key)}">${icon('list')}Aanpassen</button>
    </div>`;
  }

  // Eigen uur en notitie onder een kaart
  const userBits = it => `${it.userNote ? `<p class="act-note">${icon('edit')}<span>${esc(it.userNote)}</span></p>` : ''}`;

  function actCard(it, k, isMain) {
    const tk = dkey(today()), st = itemStatus(it, k), key = itemKey(it);
    if (it.type === 'rest') {
      return `<section class="act"><div class="act-top"><span class="act-kind t-rust">Rust</span><span class="tag rest">Volgens plan</span></div>
        <h3>Rustdag</h3><p>${esc(it.note || 'Herstel hoort erbij: wandelen, mobiliteit en goed slapen.')}</p>${userBits(it)}</section>`;
    }
    const rec = recordFor(it, k), done = doneOrCaughtUp(it, k);
    const hero = isMain && !done && k <= tk;
    const more = `<button class="btn" data-action="item-actions" data-k="${k}" data-key="${esc(key)}">Aanpassen</button>`;
    const heroBtn = (action, ic, label, extra) => `<button class="btn accent block lg" data-action="${action}" ${extra}>${icon(ic)} ${label}</button>`;
    let body = '', actions = '';
    if (it.type === 'session') {
      const s = sessInfo(it.id);
      body = `${hero ? `<div class="act-time"><b class="display">${esc(it.time || `±${s.minutes}`)}</b><span>${it.time ? `±${s.minutes} min` : 'min'}</span></div>` : ''}<h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p>
        <div class="act-meta">${it.time ? `<span>${icon('clock')} ${esc(it.time)}</span>` : ''}${hero && !it.time ? '' : `<span>${it.time ? '' : icon('clock') + ' '}±${s.minutes} min</span>`}<span>${s.exercises} oefeningen</span>${s.place ? `<span>${esc(s.place)}</span>` : ''}${it.note ? `<span>${esc(it.note)}</span>` : ''}</div>`;
      if (!done && k <= tk) {
        actions = hero
          ? heroBtn('start-session', 'play', k < tk ? 'Nu inhalen' : 'Start workout', `data-key="${it.id}"`)
          : `<div class="act-row"><button class="btn" data-action="start-session" data-key="${it.id}">${icon('play')} Start</button>${more}</div>`;
      } else if (!done) actions = `<div class="act-row">${it.confirmed ? '' : `<button class="btn" data-action="confirm-item" data-k="${k}" data-key="${esc(key)}">${icon('check')} Bevestigen</button>`}${more}</div>`;
    } else if (it.type === 'training') {
      const [from, to] = String(it.time || '').split(/[–-]/);
      body = `<div class="act-time"><b class="display">${esc(from || 'Training')}</b>${to ? `<span>tot ${esc(to)}</span>` : ''}</div>
        <h3>Voetbaltraining</h3><p>Met de ploeg${plannedMinutes(it) ? ` · gepland ${plannedMinutes(it)} min` : ''}</p>`;
      if (!done && k <= tk) actions = hero ? heroBtn('open-log', 'edit', 'Training loggen', `data-type="training" data-date="${k}"`)
        : `<div class="act-row"><button class="btn" data-action="open-log" data-type="training" data-date="${k}">${icon('edit')} Training loggen</button>${more}</div>`;
      else if (!done) actions = `<div class="act-row">${it.confirmed ? '' : `<button class="btn" data-action="confirm-item" data-k="${k}" data-key="training">${icon('check')} Bevestigen</button>`}${more}</div>`;
    } else if (it.type === 'run') {
      body = `${it.time ? `<div class="act-time"><b class="display">${esc(it.time)}</b>${it.min ? `<span>${esc(it.min)} min</span>` : ''}</div>` : ''}
        <h3>Lopen</h3><p>${esc(it.userNote || 'Log afstand, tempo en zwaarte na je loop.')}</p>`;
      if (!done && k <= tk) actions = hero ? heroBtn('open-run', 'edit', 'Loop loggen', `data-date="${k}"`)
        : `<div class="act-row"><button class="btn" data-action="open-run" data-date="${k}">${icon('edit')} Loop loggen</button>${more}</div>`;
      else if (!done) actions = `<div class="act-row">${it.confirmed ? '' : `<button class="btn" data-action="confirm-item" data-k="${k}" data-key="${esc(key)}">${icon('check')} Bevestigen</button>`}${more}</div>`;
    } else if (it.type === 'match') {
      const f = it.fixture;
      body = `${f && f.time ? `<div class="act-time"><b class="display">${esc(f.time)}</b><span>${f.home ? 'thuis' : 'uit'}</span></div>` : ''}
        <h3>${f ? esc(f.opponent) : 'Match'}</h3><p>${f && f.comp ? esc(f.comp) : 'Log na de match je minuten en hoe het voelde.'}${f && played(f) ? ` · ${f.gf}–${f.ga}` : ''}</p>`;
      if (!done && k <= tk) actions = hero ? heroBtn(f && played(f) ? 'open-minutes' : 'open-log', 'edit', 'Minuten invullen', `data-type="match" data-date="${k}"`)
        : `<div class="act-row"><button class="btn" data-action="${f && played(f) ? 'open-minutes' : 'open-log'}" data-type="match" data-date="${k}">${icon('edit')} Minuten invullen</button>${more}</div>`;
      else if (!done && !f) actions = `<div class="act-row">${more}</div>`;
    } else {
      const m = itemMeta(it);
      body = `${it.time ? `<div class="act-time"><b class="display">${esc(it.time)}</b>${it.min ? `<span>${esc(it.min)} min</span>` : ''}</div>` : ''}
        <h3>${esc(m.title)}</h3><p>${esc(it.note || (it.type === 'kine' ? 'Afspraak bij je kinesist' : it.type === 'recovery' ? 'Mobiliteit, losfietsen of wandelen' : 'Eigen activiteit'))}</p>`;
      if (!done && k <= tk) actions = hero ? heroBtn('mark-simple', 'check', 'Gedaan', `data-k="${k}" data-key="${esc(key)}"`)
        : `<div class="act-row"><button class="btn" data-action="mark-simple" data-k="${k}" data-key="${esc(key)}">${icon('check')} Gedaan</button>${more}</div>`;
      else if (!done) actions = `<div class="act-row">${it.confirmed ? '' : `<button class="btn" data-action="confirm-item" data-k="${k}" data-key="${esc(key)}">${icon('check')} Bevestigen</button>`}${more}</div>`;
    }
    const doneLine = rec ? `<button class="done-line" data-action="show-entry" data-store="${rec.store}" data-id="${rec.r.id}">${icon('check')}<span>${esc(recStatus(rec).label)} · ${esc(recordLine(rec))}</span>${icon('chevR')}</button>` : '';
    const menuBtn = hero ? `<button class="icon-btn act-more" data-action="item-menu" data-k="${k}" data-key="${esc(key)}" aria-label="Meer acties voor ${esc(actKind(it))}">${icon('more')}</button>` : '';
    return `<section class="act ${done ? 'is-done' : ''} ${hero ? 'is-main is-hero' : ''} ${!done && !it.confirmed && k >= tk && !hero ? 'is-suggested' : ''}">
      <div class="act-top"><span class="act-kind t-${itemType(it)}">${esc(actKind(it))}</span><span class="act-top-end"><span class="tag ${st.cls}">${st.label}</span>${menuBtn}</span></div>
      ${body}${userBits(it)}${doneLine}${actions}
    </section>`;
  }
  // Geplande duur van een clubtraining uit het uur (19:45–21:30 = 105 min)
  function plannedMinutes(it) {
    const m = String(it.time || '').match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
    if (!m) return it.type === 'match' ? C.rbfa.matchMinutes : null;
    return (+m[3] * 60 + +m[4]) - (+m[1] * 60 + +m[2]);
  }

  // Telt wat er deze week gepland, uitgevoerd, aangepast en overgeslagen is
  function weekStats(start = startOfWeek(today())) {
    const c = { kracht: [0, 0], herstel: [0, 0], training: [0, 0], match: [0, 0], holds: [0, 0], adapted: 0, quick: 0, skipped: 0, missed: 0 };
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i), k = dkey(d);
      const { items, off } = planDetail(d);
      items.forEach(it => {
        if (it.type === 'rest') return;
        const t = itemType(it);
        const b = t === 'herstel' && it.type === 'session' && C.sessions[it.id].catchUp === false ? 'holds' : t;
        c[b][1]++;
        if (doneOrCaughtUp(it, k)) {
          c[b][0]++;
          const rec = recordFor(it, k);
          if (rec) { const s = recStatus(rec); if (s.cls === 'adapted') c.adapted++; if (s.label === 'Zonder details') c.quick++; }
        } else if (isMissed(it, k)) c.missed++;
      });
      off.forEach(o => { if (isSkip(o.reason)) c.skipped++; });
    }
    return c;
  }

  /* ================= Streak, weekritme en mijlpalen ================= */
  // Hoe een dag telt:
  //  'active'  er is iets uitgevoerd (workout, training, match, kine, herstel…)
  //  'rest'    een geplande rust- of herstelonafhankelijke dag zonder openstaande bevestigde sessies (telt mee: rust hoort bij het plan)
  //  'neutral' alleen voorstellen niet gedaan, of alles bewust overgeslagen/verplaatst: breekt niets, telt niet mee
  //  'broken'  een bevestigde sessie die niet gedaan werd (en niets anders gedaan)
  //  'pending' vandaag, nog niets gedaan
  function firstUseDate() {
    const ds = [...S.workouts, ...S.activities, ...S.checks].filter(x => !x.sample).map(x => x.date).filter(Boolean);
    return ds.length ? ds.reduce((a, b) => a < b ? a : b) : null;
  }
  function dayStatus(d) {
    const k = dkey(d), tk = dkey(today());
    if (workoutsOn(k).length || activitiesOn(k).length) return 'active';
    const { items: all, off } = planDetail(d);
    const items = all.filter(it => it.type !== 'rest');
    // Alles bewust overgeslagen (ziek, geen tijd…): breekt niets, telt ook niet mee
    if (!items.length) return 'neutral';
    if (items.some(it => doneOrCaughtUp(it, k))) return 'active';
    if (k === tk) return 'pending';
    if (items.some(it => it.confirmed && !it.extra && !doneOrCaughtUp(it, k))) return 'broken';
    return 'neutral';
  }
  function streakInfo() {
    const first = firstUseDate();
    if (!first) return { days: 0, active: 0, broken: null };
    let days = 0, active = 0, broken = null;
    for (let i = 0; i < 400; i++) {
      const d = addDays(today(), -i), k = dkey(d);
      if (k < first) break;
      const st = dayStatus(d);
      if (st === 'broken') { broken = k; break; }
      if (st === 'active') { days++; active++; } else if (st === 'rest') days++;
    }
    return { days, active, broken };
  }
  // Weekritme: uitgevoerd tegenover gepland (zonder rust, overgeslagen of verplaatst)
  function weekProgress(ws = startOfWeek(today())) {
    let done = 0, total = 0;
    const bars = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i), k = dkey(d);
      const items = planFor(d).filter(it => it.type !== 'rest');
      items.forEach(it => { total++; if (doneOrCaughtUp(it, k)) done++; });
      bars.push(items.length ? (items.every(it => doneOrCaughtUp(it, k)) ? 'done' : items.some(it => doneOrCaughtUp(it, k)) ? 'part' : k < dkey(today()) ? 'open' : 'planned') : 'rest');
    }
    return { done, total, bars };
  }
  function progressTiles() {
    const s = streakInfo(), w = weekProgress();
    const marks = Array.from({ length: Math.min(12, Math.max(s.days, 1)) }, (_, i) => `<i class="${i < s.days ? 'on' : ''}"></i>`).join('');
    return `<div class="tiles mini">
      <button class="tile tap" data-action="go" data-to="statistieken" aria-label="Streak: ${s.days} dagen volgens plan. Naar voortgang">
        <span class="label">Streak</span><b class="tile-num">${s.days}<span class="unit">d</span></b><span class="mini-bars">${marks}</span></button>
      <button class="tile tap" data-action="go" data-to="planning" aria-label="Deze week ${w.done} van ${w.total} uitgevoerd. Naar planning">
        <span class="label">Deze week</span><b class="tile-num">${w.done}<span class="unit">/${w.total}</span></b><span class="mini-bars">${w.bars.map(b => `<i class="${b}"></i>`).join('')}</span></button>
    </div>`;
  }

  // Mijlpalen: streak en aantal uitgevoerde sessies
  const BADGES = [
    { id: 's3', kind: 'streak', n: 3, title: '3 dagen.', sub: 'Het ritme zit erin.' },
    { id: 's7', kind: 'streak', n: 7, title: '7 dagen.', sub: 'Een volle week volgens plan.' },
    { id: 's10', kind: 'streak', n: 10, title: '10 dagen.', sub: 'Geen excuses.' },
    { id: 's14', kind: 'streak', n: 14, title: '14 dagen.', sub: 'Twee weken op koers.' },
    { id: 's21', kind: 'streak', n: 21, title: '21 dagen.', sub: 'Dit is een gewoonte geworden.' },
    { id: 's30', kind: 'streak', n: 30, title: '30 dagen.', sub: 'Een maand bouwen aan je comeback.' },
    { id: 's60', kind: 'streak', n: 60, title: '60 dagen.', sub: 'Volhouden is jouw sterkte.' },
    { id: 'w10', kind: 'total', n: 10, title: '10 sessies.', sub: 'De eerste tien staan erop.' },
    { id: 'w25', kind: 'total', n: 25, title: '25 sessies.', sub: 'Elke herhaling telt.' },
    { id: 'w50', kind: 'total', n: 50, title: '50 sessies.', sub: 'Halfweg naar honderd.' },
    { id: 'w100', kind: 'total', n: 100, title: '100 sessies.', sub: 'Honderd keer gekozen voor jezelf.' }
  ];
  const totalDone = () => S.workouts.filter(w => !w.sample).length + S.activities.filter(a => !a.sample).length;
  function badgeValue(b, s = streakInfo().days, t = totalDone()) { return b.kind === 'streak' ? s : t; }
  // Na elke registratie: nieuwe mijlpaal? Kort vieren en onthouden (één keer per mijlpaal)
  async function checkMilestones() {
    const seen = { ...(S.settings.badges || {}) };
    const s = streakInfo().days, t = totalDone();
    const fresh = BADGES.filter(b => !seen[b.id] && badgeValue(b, s, t) >= b.n);
    if (!fresh.length) return;
    fresh.forEach(b => { seen[b.id] = dkey(today()); });
    await setSetting('badges', seen);
    const top = fresh[fresh.length - 1];
    // Na de felicitatie van de sessie, niet erover
    setTimeout(() => celebrate(`Mijlpaal: ${top.title}`, top.sub), document.querySelector('.celebrate') ? 1600 : 300);
  }
  function badgesHtml() {
    const seen = S.settings.badges || {};
    const s = streakInfo().days, t = totalDone();
    const got = BADGES.filter(b => seen[b.id]).sort((a, b) => String(seen[b.id]).localeCompare(String(seen[a.id])));
    const last = got[0];
    const next = BADGES.filter(b => !seen[b.id]).sort((a, b) => (a.n - badgeValue(a, s, t)) - (b.n - badgeValue(b, s, t)))[0];
    return `${last ? `<section class="badge-brand"><span class="label">Mijlpaal ontgrendeld · ${esc(fmtShort(seen[last.id]))}</span><b>${esc(last.title)} ${esc(last.sub)}</b></section>` : ''}
      <section class="card">
        <div class="card-head"><h2>Mijlpalen</h2><span class="label">${got.length} van ${BADGES.length}</span></div>
        <div class="badge-grid">${BADGES.map(b => `<div class="badge ${seen[b.id] ? 'on' : ''}" aria-label="${esc(b.title + ' ' + b.sub)}${seen[b.id] ? ', behaald' : ', nog niet behaald'}">
          <b>${b.n}</b><span>${b.kind === 'streak' ? 'dagen' : 'sessies'}</span></div>`).join('')}</div>
        ${next ? `<p class="status-line">Volgende: ${esc(next.title)} Nog ${Math.max(0, next.n - badgeValue(next, s, t))} ${next.kind === 'streak' ? 'dag' : 'sessie'}${next.n - badgeValue(next, s, t) === 1 ? '' : next.kind === 'streak' ? 'en' : 's'}.</p>` : ''}
        <p class="label mt-8">Rustdagen en bewust overgeslagen sessies breken je streak niet.</p>
      </section>`;
  }


  function weekCard() {
    const c = weekStats();
    const parts = ['kracht', 'herstel', 'training', 'match'];
    const done = sum(parts.map(p => c[p][0])), total = sum(parts.map(p => c[p][1]));
    const extra = [c.adapted && `${c.adapted} aangepast`, c.quick && `${c.quick} zonder details`, c.skipped && `${c.skipped} overgeslagen`, c.missed && `${c.missed} gemist`].filter(Boolean);
    return `<section class="card">
      <div class="gauge-wrap">${Charts.gauge(done, total)}
        <div class="gauge-center"><div class="num">${done}<span class="unit">van ${total}</span></div><span class="label">geplande activiteiten uitgevoerd</span></div>
      </div>
      <div class="week-split" style="grid-template-columns:repeat(${[['kracht'], ['herstel'], ['training'], ['match']].filter(([p]) => c[p][1]).length || 1}, minmax(0, 1fr))">
        ${[['kracht', 'kracht'], ['herstel', 'herstel'], ['training', 'trainingen'], ['match', 'matchen']].filter(([p]) => c[p][1]).map(([p, l]) => `<div><b>${c[p][0]}/${c[p][1]}</b><span>${l}</span></div>`).join('')}
      </div>
      ${extra.length ? `<p class="status-line">${extra.join(' · ')}</p>` : ''}
      ${c.holds[1] ? `<p class="status-line">Dagelijkse holds: ${c.holds[0]} van ${c.holds[1]} dagen.</p>` : ''}
    </section>`;
  }

  // Zonder actieve blessure: meer plaats voor training en voortgang
  function progressCard() {
    const wk = weekKey(today());
    const ws = S.workouts.filter(w => inWeek(w.date, wk)), as = S.activities.filter(a => inWeek(a.date, wk));
    const minutes = sum(ws.map(woMinutes)) + sum(as.map(a => +a.minutes));
    const rpes = [...ws, ...as].map(x => num(x.rpe)).filter(v => v != null);
    const g = goal();
    const days = g.evalDate ? daysBetween(today(), parseKey(g.evalDate)) : null;
    return `<div class="tiles">
        <div class="tile"><span class="label">Trainingsminuten deze week</span><div class="num">${minutes}<span class="unit">min</span></div></div>
        <div class="tile"><span class="label">Gemiddelde zwaarte</span><div class="num">${rpes.length ? fmtNum(Math.round(sum(rpes) / rpes.length * 10) / 10) : '–'}<span class="unit">/ 10</span></div></div>
      </div>
      ${g.text || g.evalDate ? `<section class="card"><span class="label">Doel</span><p class="mt-4"><b>${esc(g.text || GOAL_LABEL[g.type])}</b></p>${g.evalDate ? `<p class="status-line">Evaluatie op ${fmtDay(g.evalDate)}${days != null && days >= 0 ? ` · over ${days} dagen` : ''}</p>` : ''}</section>` : ''}`;
  }

  function nextMatchCard() {
    const tk = dkey(today());
    const f = fixtures().find(x => x.date >= tk && !played(x));
    if (f) {
      const days = daysBetween(today(), parseKey(f.date));
      return `<section class="card list-row tap" style="padding:16px" data-action="cal-open" data-k="${f.date}">
        <div class="ico">${icon('ball')}</div>
        <div class="body"><span class="label">Volgende match · ${days === 0 ? 'vandaag' : days === 1 ? 'morgen' : `over ${days} dagen`}</span>
          <b class="next-match-title">${esc(f.opponent)}</b>
          <span>${f.home ? 'Thuis' : 'Uit'} · ${fmtDay(f.date)}${f.time ? ' · ' + esc(f.time) : ''}</span></div>
        <div class="end">${icon('chevR')}</div>
      </section>`;
    }
    let next = null;
    for (let i = 0; i < 14 && !next; i++) { const d = addDays(today(), i); if (planFor(d).some(x => x.type === 'match')) next = dkey(d); }
    return `<section class="card list-row" style="padding:16px">
      <div class="ico">${icon('ball')}</div>
      <div class="body"><span class="label">Volgende match</span>
        <b style="margin-top:0">${next ? cap(fmtDay(next)) : 'Geen match gepland'}</b>
        <span>Tegenstander en uur zie je na het importeren van de RBFA-kalender.</span></div>
      <div class="end"><button class="btn sm" data-action="open-rbfa">Importeer</button></div>
    </section>`;
  }

  /* ---------- Dagelijkse check invullen ---------- */
  // Trajecten die op een datum liepen (ook voor het aanpassen van een oude check)
  // Een traject dat vandaag afgerond is, stelt vandaag geen vragen meer
  const injuriesOn = k => injuries().filter(i => (!i.start || i.start <= k) && (i.status !== 'afgerond' || (i.end && i.end > k)));
  const pickGroup = (group, v, from, to, hiFrom) => `<div class="score-pad pick-group" data-group="${group}">${Array.from({ length: to - from + 1 }, (_, n) => {
    const i = from + n; return `<button type="button" class="${i === v ? 'on' : ''} ${hiFrom != null && i > hiFrom ? 'hi' : ''}" data-action="pick" data-v="${i}" aria-pressed="${i === v}">${i}</button>`;
  }).join('')}</div>`;

  function openCheck(date = dkey(today())) {
    const c = checkFor(date) || {};
    const list = injuriesOn(date);
    const yk = dkey(addDays(parseKey(date), -1));
    const yLoad = [...workoutsOn(yk).map(w => woTitle(w)), ...activitiesOn(yk).map(a => a.type === 'match' ? 'de match' : 'de clubtraining')];
    const blocks = list.map(inj => {
      const e = checkEntry(c, inj.id) || {};
      const sides = injurySides(inj);
      const lim = num(inj.painLimit);
      const sideRows = (kind, hi) => sides.map(s => `<div class="pad-row">${sideShort(s) ? `<span class="pad-side">${cap(sideShort(s))}</span>` : ''}${pickGroup(`${kind}|${inj.id}|${s}`, checkVal(c, inj.id, kind, s), 0, 10, hi)}</div>`).join('');
      return `<div class="check-block">
        <h4>${esc(injuryLabel(inj))}${injurySideText(inj) ? `<span>${esc(injurySideText(inj))}</span>` : ''}</h4>
        <p class="label">Stijfheid bij het opstaan · 0 = niets, 10 = heel stijf</p>${sideRows('stiff', null)}
        <p class="label mt-12">Pijn · 0 = geen pijn${lim != null ? `, jouw afspraak: max ${lim}` : ''}</p>${sideRows('pain', lim)}
        ${yLoad.length && inj.status !== 'afgerond' ? `<p class="label mt-12">Reactie op ${esc(yLoad.join(' en '))} van gisteren</p>
          <div class="choice pick-group" data-group="react|${inj.id}">${[['beter', 'Beter'], ['gelijk', 'Gelijk'], ['slechter', 'Slechter']].map(([v, l]) => `<button type="button" class="${e.reaction === v ? 'on' : ''}" data-action="pick" data-v="${v}">${l}</button>`).join('')}</div>` : ''}
      </div>`;
    }).join('');
    const fatigue = `<p class="label mt-12">Vermoeidheid · 1 = uitgerust, 5 = erg moe</p>${pickGroup('fatigue', c.fatigue ?? null, 1, 5, null)}`;
    openSheet(`<div class="sheet-head"><div><h3>Dagelijkse check</h3><p>${cap(fmtDay(date))}${date === dkey(today()) ? '' : ' · aanpassing achteraf'}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${blocks || fatigue}
      ${list.length ? `<details class="more"><summary>Meer opties</summary>${fatigue}
        <label class="field mt-12"><span>Notitie</span><textarea class="input" id="check-note" rows="2">${esc(c.note || '')}</textarea></label></details>` : ''}
      <p class="label" style="margin:8px 0 0">Wat je leeg laat, wordt niet als 0 bewaard.</p>
      <button class="btn accent block lg" data-action="save-check" data-date="${date}">${icon('check')} Opslaan</button>`);
  }

  async function saveCheck(date = dkey(today())) {
    const old = checkFor(date) || (S.raw.checks || []).find(c => c.date === date && !c.sample) || {};
    const rec = { date, savedAt: Date.now(), sample: false, inj: clone(old.inj || {}), fatigue: old.fatigue ?? null, note: old.note || '' };
    document.querySelectorAll('.sheet .pick-group[data-group]').forEach(g => {
      const on = g.querySelector('.on');
      const v = on ? (isNaN(+on.dataset.v) ? on.dataset.v : +on.dataset.v) : null;
      const [kind, id, side] = g.dataset.group.split('|');
      if (kind === 'fatigue') { rec.fatigue = v; return; }
      const e = rec.inj[id] = rec.inj[id] || { stiff: {}, pain: {} };
      if (kind === 'react') e.reaction = v;
      else { e[kind] = e[kind] || {}; e[kind][side] = v; }
    });
    const note = $('#check-note'); if (note) rec.note = note.value.trim();
    await DB.put('checks', rec);
    S.checks = S.checks.filter(c => c.date !== date).concat(rec);
    closeSheet();
    render({ keepScroll: true });
    const rises = activeInjuries().map(checkRise).flat();
    toast(date === dkey(today()) && rises.length ? 'Opgeslagen. Hoger dan de vorige meting: volg je afspraak.' : 'Check opgeslagen');
  }

  /* ================= Kalender ================= */
  const TYPE_LABEL = { kracht: 'Kracht', herstel: 'Herstel', training: 'Training', match: 'Match', rust: 'Rust' };
  const TYPES = ['kracht', 'herstel', 'training', 'match', 'rust'];
  // Gemiste sessies tellen pas vanaf de start van het lopende kuit/pees-traject (of de huidige fase)
  const planStart = () => S.settings.phaseSince || phaseObj(currentPhase()).start;

  // Ingehaald = dezelfde sessie later in dezelfde week toch gedaan
  // Alleen een sessie uit je schema kan ingehaald worden. Iets wat je zelf toevoegt niet,
  // en een latere workout die op zijn eigen dag al gepland stond, telt daar en niet hier.
  function caughtUp(it, k) {
    if (it.type !== 'session' || it.extra) return false;
    const end = dkey(addDays(startOfWeek(parseKey(k)), 6));
    return S.workouts.some(w => w.sessionKey === it.id && w.date > k && w.date <= end
      && !planFor(parseKey(w.date)).some(x => x.type === 'session' && x.id === it.id));
  }
  const doneOrCaughtUp = (it, k) => itemDone(it, k) || caughtUp(it, k);

  // Gemist = een in te halen sessie in het verleden, vanaf de start van de huidige fase, die niet gedaan is
  // Alleen een bevestigde sessie kan "gemist" zijn; een voorstel dat je niet volgde, is geen mislukking
  function isMissed(it, k) {
    return it.type === 'session' && it.confirmed && !it.extra && C.sessions[it.id] && C.sessions[it.id].catchUp !== false
      && k < dkey(today()) && k >= planStart() && !doneOrCaughtUp(it, k);
  }

  // Status zoals je ze ziet: voorgesteld, bevestigd, uitgevoerd (gelogd, zonder details, aangepast, ingehaald), gemist
  function itemStatus(it, k) {
    if (it.type === 'rest') return { cls: 'rest', label: 'Rust' };
    const rec = recordFor(it, k);
    if (rec) return recStatus(rec);
    if (caughtUp(it, k)) return { cls: 'done', label: 'Ingehaald' };
    if (isMissed(it, k)) return { cls: 'missed', label: 'Gemist' };
    if (k < dkey(today())) return { cls: 'skip', label: it.extra ? 'Nog niet gelogd' : it.confirmed ? 'Niet gedaan' : 'Voorstel niet gedaan' };
    return it.confirmed ? { cls: 'confirmed', label: 'Bevestigd' } : { cls: 'suggested', label: 'Voorgesteld' };
  }
  // Tekst bij een weggehaald item
  function offText(r) {
    if (isSkip(r)) return { tag: 'Overgeslagen', txt: skipReason(r) ? `Overgeslagen · ${skipReason(r)}` : 'Overgeslagen' };
    if (r === 'del') return { tag: 'Verwijderd', txt: 'Uit de planning gehaald' };
    if (String(r).startsWith('replaced:')) { const k2 = r.slice(9); return { tag: 'Vervangen', txt: `Vervangen door ${replacedLabel(k2)}` }; }
    if (String(r).startsWith('moved:')) return { tag: 'Verplaatst', txt: `Verplaatst naar ${fmtDay(r.slice(6))}` };
    return { tag: '', txt: '' };
  }
  const replacedLabel = key => key.startsWith('session:') ? sessionTitle(key.slice(8)) : key.startsWith('custom:') ? key.slice(7).replace(/-/g, ' ') : itemMeta({ type: key }).title;

  // Openen vanuit een ander scherm: spring naar de planning, in de week van die dag
  function openDay(k) {
    closeSheet();
    S.ui.calDay = k;
    const d = parseKey(k);
    S.ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    S.ui.planWeek = weekKey(d);
    S.ui.planFocus = k;
    S.ui.planView = 'week';
    if (currentRoute() === 'planning') render({ keepScroll: true }); else location.hash = 'planning';
  }

  function calDots(d) {
    const k = dkey(d);
    const items = planFor(d);
    const st = {};
    const set = (t, s) => { const rank = { done: 3, missed: 2, planned: 1 }; if (!st[t] || rank[s] > rank[st[t]]) st[t] = s; };
    items.forEach(it => {
      if (it.type === 'rest') { if (items.length === 1) set('rust', 'done'); return; }
      const t = itemType(it);
      const s = doneOrCaughtUp(it, k) ? 'done' : isMissed(it, k) ? 'missed' : k < dkey(today()) ? null : 'planned';
      if (s) set(t, s);
    });
    workoutsOn(k).forEach(w => set(C.sessions[w.sessionKey] && C.sessions[w.sessionKey].program ? 'herstel' : 'kracht', 'done'));
    activitiesOn(k).forEach(a => set(SIMPLE.includes(a.type) ? 'herstel' : a.type, 'done'));
    if (fixtureOn(k) && !st.match) set('match', 'planned');
    return TYPES.filter(t => st[t]).map(t => `<i class="dot t-${t} ${st[t] === 'done' ? '' : st[t]}"></i>`).join('');
  }

  function monthHtml() {
    const t = today(), tk = dkey(t);
    const sel = S.ui.calDay || tk;
    const m = S.ui.calMonth || new Date(t.getFullYear(), t.getMonth(), 1);
    const start = startOfWeek(m);
    let cells = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map(d => `<div class="cal-wd">${d}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      if (i >= 35 && d.getMonth() !== m.getMonth()) break;
      const k = dkey(d);
      cells += `<button class="cal-cell ${d.getMonth() !== m.getMonth() ? 'out' : ''} ${k === tk ? 'today' : ''} ${k === sel ? 'on' : ''}" data-action="cal-pick" data-k="${k}" aria-label="${fmtDay(k)}" aria-pressed="${k === sel}">
        ${d.getDate()}<span class="dots">${calDots(d)}</span></button>`;
    }
    return `
      <section class="card">
        <div class="cal-head">
          ${iconBtn('chevL', 'cal-prev', 'Vorige maand')}
          <strong>${MONTH[m.getMonth()]} ${m.getFullYear()}</strong>
          ${iconBtn('chevR', 'cal-next', 'Volgende maand')}
        </div>
        <div class="cal-grid">${cells}</div>
        <div class="legend">${TYPES.map(tp => `<span><i class="dot t-${tp}"></i>${TYPE_LABEL[tp]}</span>`).join('')}</div>
        <div class="legend-states">
          <span><i class="dot"></i>gedaan</span><span><i class="dot planned"></i>gepland</span><span><i class="dot missed"></i>gemist (bevestigd, niet gedaan)</span>
        </div>
      </section>
      <div class="section"><span>${cap(fmtDay(sel))} · ${relLong(sel).toLowerCase()}</span>${sel !== tk ? `<button class="link-btn" data-action="cal-pick" data-k="${tk}">Vandaag</button>` : ''}</div>
      <section class="card" id="day-panel">${dayPanelHtml(sel)}</section>
    `;
  }

  function dayPanelHtml(k) {
    const tk = dkey(today());
    const { items, off } = planDetail(parseKey(k));
    const f = fixtureOn(k);
    const chk = checkFor(k), ws = workoutsOn(k), acts = activitiesOn(k);
    const past = k <= tk;
    let html = '';

    if (f) {
      const logged = acts.some(a => a.type === 'match');
      html += `<div class="day-item">
        <div class="day-item-top"><span class="type-bar" style="background:var(--c-match)"></span>
          <div class="body"><b>${esc(fxTitle(f))}</b><span>${f.home ? 'Thuis' : 'Uit'}${f.time ? ' · ' + esc(f.time) : ''}${f.comp ? ' · ' + esc(f.comp) : ''}</span></div>
          ${played(f) ? `<span class="tag ${fixtureResult(f) === 'win' ? 'done' : ''}">${fxScore(f)}</span>` : `<span class="tag">Match</span>`}</div>
        ${past && !logged ? `<div class="day-item-actions"><button class="btn sm accent" data-action="${played(f) ? 'open-minutes' : 'open-log'}" data-type="match" data-date="${k}">${icon('edit')} Minuten invullen</button><button class="btn sm" data-action="skip-item" data-k="${k}" data-key="match">Niet gespeeld</button></div>` : ''}
      </div>`;
    }

    items.filter(it => !(f && it.type === 'match')).forEach(it => {
      const m = itemMeta(it), key = itemKey(it), st = itemStatus(it, k);
      if (it.type === 'rest') {
        html += `<div class="day-item"><div class="day-item-top"><span class="type-bar" style="background:var(--c-rust)"></span><div class="body"><b>Rustdag</b><span>${esc(it.note || 'Wandelen, mobiliteit en goed slapen')}</span></div></div></div>`;
        return;
      }
      // Eén hoofdactie waar dat zinvol is (starten of loggen); al de rest zit in het "…"-menu
      let actions = '';
      const noCatchUp = it.type === 'session' && k < tk && (C.sessions[it.id].catchUp === false || k < planStart());
      if (!doneOrCaughtUp(it, k) && !noCatchUp && k <= tk) {
        if (it.type === 'session') actions = `<button class="btn sm" data-action="start-session" data-key="${it.id}">${icon('play')} ${k < tk ? 'Inhalen' : 'Start'}</button>`;
        else if (it.type === 'training' || it.type === 'match') actions = `<button class="btn sm" data-action="open-log" data-type="${it.type}" data-date="${k}">${icon('edit')} Loggen</button>`;
        else if (it.type === 'run') actions = `<button class="btn sm" data-action="open-run" data-date="${k}">${icon('edit')} Loggen</button>`;
        else if (SIMPLE.includes(it.type)) actions = `<button class="btn sm" data-action="mark-simple" data-k="${k}" data-key="${esc(key)}">${icon('check')} Gedaan</button>`;
      }
      const more = `<button class="icon-btn ghost" data-action="item-menu" data-k="${k}" data-key="${esc(key)}" aria-label="Meer acties voor ${esc(m.title)}">${icon('more')}</button>`;
      const rec = recordFor(it, k);
      html += `<div class="day-item">
        <div class="day-item-top"><span class="type-bar" style="background:var(--c-${itemType(it)})"></span>
          <div class="body"><b>${esc(m.title)}</b><span>${esc(actKind(it))} · ${esc(it.type === 'session' ? sessionDesc(it.id) : m.sub)}${it.note ? ' · ' + esc(it.note) : ''}</span></div>
          <span class="tag ${st.cls}">${st.label}</span>${more}</div>
        ${rec ? `<button class="done-line" data-action="show-entry" data-store="${rec.store}" data-id="${rec.r.id}">${icon('check')}<span>${esc(recordLine(rec))}</span>${icon('chevR')}</button>` : ''}
        ${actions ? `<div class="day-item-actions">${actions}</div>` : ''}
      </div>`;
    });

    off.forEach(o => {
      const m = itemMeta(o.item);
      const ot = offText(o.reason), txt = ot.txt;
      html += `<div class="day-item"><div class="day-item-top"><span class="type-bar" style="background:var(--line)"></span>
        <div class="body"><b class="muted">${esc(m.title)}</b><span>${esc(txt)}</span></div><span class="tag skip">${ot.tag}</span></div>
        <div class="day-item-actions"><button class="btn sm" data-action="restore-item" data-k="${k}" data-key="${esc(itemKey(o.item))}">${icon('undo')} Terugzetten</button></div></div>`;
    });

    if (!html) html = `<p class="empty">Niets gepland.</p>`;

    const logged = [];
    const checkInj = chk && chk.inj ? Object.keys(chk.inj).map(injuryById).filter(Boolean) : [];
    if (chk) logged.push(`<div class="list-row tap" data-action="open-check" data-date="${k}"><div class="ico">${icon('pulse')}</div><div class="body"><b>Dagelijkse check</b><span>${checkInj.length ? checkInj.map(i => `${esc(injuryLabel(i))}: stijfheid ${valsText(chk, i, 'stiff')}`).join(' · ') : chk.fatigue != null ? `Vermoeidheid ${chk.fatigue}/5` : 'Ingevuld'}</span></div><div class="end">${icon('edit')}</div></div>`);
    else if (past) logged.push(`<div class="list-row tap" data-action="open-check" data-date="${k}"><div class="ico">${icon('pulse')}</div><div class="body"><b>Dagelijkse check</b><span>Nog niet ingevuld</span></div><div class="end">${icon('plus')}</div></div>`);
    ws.filter(w => !items.some(it => it.type === 'session' && it.id === w.sessionKey)).forEach(w => logged.push(`<div class="list-row tap" data-action="show-entry" data-store="workouts" data-id="${w.id}"><div class="ico">${icon((C.sessions[w.sessionKey] || {}).icon || 'dumbbell')}</div><div class="body"><b>${esc(woTitle(w))}</b><span>${esc(recStatus({ store: 'workouts', r: w }).label)} · ${esc(recordLine({ store: 'workouts', r: w }))}</span></div><div class="end">${icon('chevR')}</div></div>`));
    acts.filter(a => !items.some(it => actMatches(a, it)) && !(f && a.type === 'match')).forEach(a => logged.push(`<div class="list-row tap" data-action="show-entry" data-store="activities" data-id="${a.id}"><div class="ico">${icon(actIcon(a))}</div><div class="body"><b>${esc(actTitle(a))}</b><span>${esc(recordLine({ store: 'activities', r: a }))}</span></div><div class="end">${icon('chevR')}</div></div>`));
    if (f) acts.filter(a => a.type === 'match').forEach(a => logged.push(`<div class="list-row tap" data-action="show-entry" data-store="activities" data-id="${a.id}"><div class="ico">${icon('ball')}</div><div class="body"><b>Match · ${esc(recStatus({ store: 'activities', r: a }).label)}</b><span>${esc(recordLine({ store: 'activities', r: a }))}</span></div><div class="end">${icon('chevR')}</div></div>`));
    if (logged.length) html += `<div class="divider"></div><p class="label mb-8">Gelogd</p>${logged.join('')}`;

    html += `<div class="divider"></div><div class="day-actions">
      <button class="btn sm" data-action="add-menu" data-k="${k}">${icon('plus')} Sessie</button>
      ${past ? `<button class="btn sm" data-action="open-log" data-type="training" data-date="${k}">${icon('whistle')} Training loggen</button>` : ''}
    </div>`;
    return html;
  }

  /* ================= Planning: week (slepen of Verplaatsen) en maand ================= */
  const DAY_UP = ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA'];
  const isHeavySession = it => it.type === 'session' && C.sessions[it.id] && !!C.sessions[it.id].heavy;
  const heavyDay = d => planFor(d).some(it => isHeavySession(it) || it.type === 'match');

  // Optionele waarschuwing: 3 zware dagen op rij, of een zware sessie de dag voor een match
  function loadWarnings(ws) {
    if (S.settings.loadWarn === false) return [];
    const out = [];
    let run = [];
    const flush = () => {
      if (run.length >= 3 && run[run.length - 1] >= ws) {
        const a = run[0], b = run[run.length - 1];
        out.push(`${run.length} zware dagen op rij (${DAY[a.getDay()]} tot ${DAY[b.getDay()]}). Plan er liefst een lichtere dag tussen.`);
      }
      run = [];
    };
    for (let i = -2; i < 7; i++) { const d = addDays(ws, i); if (heavyDay(d)) run.push(d); else flush(); }
    flush();
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i);
      if (planFor(d).some(isHeavySession) && planFor(addDays(d, 1)).some(it => it.type === 'match')) {
        const names = planFor(d).filter(isHeavySession).map(it => sessionTitle(it.id)).join(' en ');
        out.push(`${names} op ${DAY[d.getDay()]} is zwaar, de dag voor een match. Verplaatsen kan met één tik.`);
      }
    }
    return out;
  }

  // Voorgestelde items (vandaag en later) die je nog kan bevestigen
  function pendingSuggestions(ws) {
    const tk = dkey(today()), out = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i), k = dkey(d);
      if (k < tk) continue;
      planFor(d).forEach(it => { if (it.type !== 'rest' && !it.confirmed && !doneOrCaughtUp(it, k)) out.push([k, itemKey(it)]); });
    }
    return out;
  }

  function planCard(it, k) {
    const key = itemKey(it), m = itemMeta(it), st = itemStatus(it, k), tk = dkey(today());
    const done = it.type !== 'rest' && doneOrCaughtUp(it, k);
    const mins = it.type === 'session' ? `${sessionStats(it.id).minutes} min` : it.type === 'training' ? (plannedMinutes(it) ? `${plannedMinutes(it)} min` : '') : it.min ? `${it.min} min` : '';
    const time = it.type === 'match' && it.fixture ? it.fixture.time : it.time;
    const meta = it.type === 'rest' ? [it.note || 'Volledig herstel'] : [time && String(time).split(/[–-]/)[0], mins, st.label];
    const cls = it.type === 'rest' ? 'st-rest' : done ? 'st-done' : st.cls === 'missed' ? 'st-missed' : k < tk ? 'st-past' : it.confirmed ? 'st-confirmed' : 'st-suggested';
    const draggable = it.type !== 'rest' && !it.fixture && !done;
    const title = it.type === 'match' && it.fixture ? `${it.fixture.home ? 'Thuis' : 'Uit'} · ${it.fixture.opponent}` : it.type === 'session' ? sessionTitle(it.id) : m.title;
    // Rustige rij: type, titel, tijd/duur en status; afvinken en de rest zit in het "…"-menu
    return `<div class="pcard ${cls} t-${itemType(it)}" data-k="${k}" data-key="${esc(key)}">
      <button class="pc-main" data-action="item-actions" data-k="${k}" data-key="${esc(key)}" aria-label="${esc(title)}, ${esc(st.label)}. Aanpassen">
        <span class="pc-kind">${esc(actKind(it))}${done ? `<span class="pc-ok">${icon('check')}</span>` : ''}${it.userNote ? ` · ${icon('edit')}` : ''}</span>
        <b>${esc(title)}</b>
        <span class="pc-meta">${meta.filter(Boolean).map(esc).join('  ·  ')}</span>
      </button>
      ${draggable ? `<button class="pc-grip" data-action="open-move" data-k="${k}" data-key="${esc(key)}" aria-label="${esc(title)} verplaatsen (slepen of tikken)">${icon('grip')}</button>` : ''}
      <button class="pc-more" data-action="item-menu" data-k="${k}" data-key="${esc(key)}" aria-label="Meer acties voor ${esc(title)}">${icon('more')}</button>
    </div>`;
  }

  // De uitleg over slepen alleen de eerste keer (blijft zichtbaar tijdens die sessie)
  function dragHelpOnce() {
    if (S.ui.dragHelp === undefined) {
      try { S.ui.dragHelp = !localStorage.getItem('comeback-drag-help'); if (S.ui.dragHelp) localStorage.setItem('comeback-drag-help', '1'); }
      catch (_) { S.ui.dragHelp = false; }
    }
    return S.ui.dragHelp;
  }

  function weekHtml() {
    const t = today(), tk = dkey(t);
    const ws = parseKey(S.ui.planWeek || weekKey(t));
    const strip = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(ws, i), k = dkey(d);
      return `<button class="day ${k === tk ? 'on' : ''}" data-action="wk-jump" data-k="${k}" aria-label="${fmtDay(k)}"${k === tk ? ' aria-current="date"' : ''}>
        <small>${cap(DAY_S[d.getDay()])}</small><b>${d.getDate()}</b><span class="day-dots">${dayDotsHtml(d)}</span></button>`;
    }).join('');
    const warns = loadWarnings(ws);
    const pend = pendingSuggestions(ws);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(ws, i), k = dkey(d);
      const { items, off } = planDetail(d);
      const offList = off.filter(o => !String(o.reason).startsWith('moved:'));
      const offRows = offList.map(o => {
        const ot = offText(o.reason);
        return `<button class="pc-off" data-action="off-item" data-k="${k}" data-key="${esc(itemKey(o.item))}">${icon(ot.tag === 'Vervangen' ? 'swap' : 'skip')}<span>${esc(itemMeta(o.item).title)} · ${esc(ot.txt)}</span></button>`;
      }).join('');
      // Logregels (verwijderd, vervangen, overgeslagen) standaard ingeklapt
      const changes = offList.length ? `<details class="wk-changes"><summary>Wijzigingen tonen (${offList.length})</summary>${offRows}</details>` : '';
      return `<section class="wk-day ${k === tk ? 'is-today' : ''} ${k < tk ? 'is-past' : ''}" data-k="${k}" id="day-${k}">
        <div class="wk-day-head"><span class="wk-day-label">${DAY_UP[d.getDay()]} ${pad(d.getDate())}${k === tk ? '<small>Vandaag</small>' : ''}</span>
          <button class="wk-add" data-action="add-menu" data-k="${k}" aria-label="Iets toevoegen op ${fmtDay(k)}">${icon('plus')}</button></div>
        <div class="wk-list">${items.map(it => planCard(it, k)).join('') || '<p class="wk-empty">Niets gepland</p>'}${changes}</div>
      </section>`;
    }).join('');
    const isThis = weekKey(t) === weekKey(ws);
    return `
      <div class="wk-nav">
        ${iconBtn('chevL', 'wk-prev', 'Vorige week')}
        <span>${isThis ? 'Deze week' : `Week ${isoWeek(ws)}`}</span>
        ${isThis ? '<span class="wk-nav-gap"></span>' : `<button class="link-btn" data-action="wk-today">Naar deze week</button>`}
        ${iconBtn('chevR', 'wk-next', 'Volgende week')}
      </div>
      <div class="wk-strip">${strip}</div>
      ${warns.map(w => `<div class="hint accent" role="note">${icon('alert')}<span>${esc(w)}</span></div>`).join('')}
      ${pend.length ? `<div class="wk-confirm"><span>${pend.length} voorstel${pend.length === 1 ? '' : 'len'} nog niet bevestigd</span><button class="btn sm" data-action="confirm-week">${icon('check')} Alles bevestigen</button></div>` : ''}
      ${dragHelpOnce() ? `<p class="wk-help">Sleep aan ${icon('grip')} naar een andere dag, of tik op ${icon('grip')} om te verplaatsen.</p>` : ''}
      ${rulesCard()}
      <div class="wk-days" id="wk-days">${days}</div>`;
  }

  function renderPlanning() {
    const t = today();
    const view = S.ui.planView || 'week';
    const ws = parseKey(S.ui.planWeek || weekKey(t));
    const we = addDays(ws, 6);
    const range = ws.getMonth() === we.getMonth() ? `${ws.getDate()} – ${we.getDate()} ${MONTH[we.getMonth()]} ${we.getFullYear()}` : `${ws.getDate()} ${MON[ws.getMonth()]} – ${we.getDate()} ${MON[we.getMonth()]} ${we.getFullYear()}`;
    const isThis = weekKey(t) === weekKey(ws);
    main.innerHTML = `
      <header class="page-head"><div><span class="eyebrow">Jouw ritme</span><h1>${view === 'week' ? (isThis ? 'Deze week.' : `Week ${isoWeek(ws)}.`) : 'Kalender.'}</h1><p>${view === 'week' ? range : 'Tik op een dag om te zien wat er gepland of gedaan is'}</p></div>
        <div class="row">${SUBS.coach ? `<button class="icon-btn" data-action="go" data-to="coach" aria-label="Coach (AI)">${icon('coach')}</button>` : ''}<button class="icon-btn" data-action="add-menu" data-k="${S.ui.planFocus || dkey(t)}" aria-label="Iets toevoegen">${icon('plus')}</button></div></header>
      <div class="seg" role="tablist">${[['week', 'Week'], ['maand', 'Maand']].map(([v, l]) => `<button role="tab" aria-selected="${view === v}" class="${view === v ? 'on' : ''}" data-action="plan-view" data-v="${v}">${l}</button>`).join('')}</div>
      ${view === 'week' ? weekHtml() : monthHtml()}`;
    const focus = S.ui.planFocus;
    if (view === 'week' && focus) {
      S.ui.planFocus = null;
      const el = document.getElementById(`day-${focus}`);
      if (el) requestAnimationFrame(() => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 90));
    }
  }

  /* ---------- Slepen in de weekweergave (aan de greep; tikken op de greep = Verplaatsen) ---------- */
  let drag = null;
  function dragTarget(x, y) {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest('.wk-day') : null;
  }
  function dragEnd(commit) {
    if (!drag) return;
    const d = drag; drag = null;
    cancelAnimationFrame(d.raf);
    document.body.classList.remove('is-dragging');
    document.querySelectorAll('.wk-day.drop').forEach(n => n.classList.remove('drop'));
    if (d.ghost) d.ghost.remove();
    if (d.card) d.card.classList.remove('dragging');
    if (d.moved) {
      S.ui.dragEndedAt = Date.now();
      if (commit && d.over && d.over.dataset.k !== d.k) moveItem(d.k, d.key, d.over.dataset.k);
    }
  }
  document.addEventListener('pointerdown', e => {
    const g = e.target.closest('.pc-grip');
    if (!g || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const card = g.closest('.pcard');
    drag = { card, grip: g, k: card.dataset.k, key: card.dataset.key, x0: e.clientX, y0: e.clientY, y: e.clientY, moved: false, over: null, raf: 0 };
    try { g.setPointerCapture(e.pointerId); } catch (_) { }
  });
  document.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.y = e.clientY;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
      drag.moved = true;
      const r = drag.card.getBoundingClientRect();
      const ghost = drag.card.cloneNode(true);
      ghost.classList.add('pc-ghost');
      Object.assign(ghost.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px` });
      document.body.appendChild(ghost);
      drag.ghost = ghost; drag.top = r.top;
      drag.card.classList.add('dragging');
      document.body.classList.add('is-dragging');
      try { navigator.vibrate && navigator.vibrate(10); } catch (_) { }
      // Automatisch scrollen bij de rand van het scherm
      const tick = () => {
        if (!drag) return;
        const edge = 90, h = window.innerHeight;
        if (drag.y < edge) window.scrollBy(0, -Math.ceil((edge - drag.y) / 6));
        else if (drag.y > h - edge - 70) window.scrollBy(0, Math.ceil((drag.y - (h - edge - 70)) / 6));
        drag.raf = requestAnimationFrame(tick);
      };
      drag.raf = requestAnimationFrame(tick);
    }
    e.preventDefault();
    drag.ghost.style.transform = `translateY(${e.clientY - drag.y0}px)`;
    const over = dragTarget(e.clientX, e.clientY);
    if (over !== drag.over) {
      if (drag.over) drag.over.classList.remove('drop');
      drag.over = over;
      if (over && over.dataset.k !== drag.k) over.classList.add('drop');
    }
  }, { passive: false });
  document.addEventListener('pointerup', () => dragEnd(true));
  document.addEventListener('pointercancel', () => dragEnd(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drag) dragEnd(false); });

  /* ---------- Toevoegen of vervangen ---------- */
  const QUICK_TYPES = [
    ['training', 'Voetbaltraining', 'whistle', 'Met de ploeg'],
    ['run', 'Lopen', 'bolt', 'Duurloop, interval, herstel, sprint'],
    ['kine', 'Kine', 'heart', 'Afspraak bij je kinesist'],
    ['recovery', 'Herstel & mobiliteit', 'pulse', 'Losfietsen, mobiliteit, wandelen'],
    ['match', 'Match', 'ball', 'Zonder RBFA-kalender'],
    ['rest', 'Rustdag', 'moon', 'Telt nooit als gemist']
  ];
  // Standaardinhoud van een nieuw item van een type
  function newItemOf(type) {
    if (type === 'training') { const tpl = Object.values(C.week).flat().find(x => x.type === 'training'); return { type, time: tpl ? tpl.time : '' }; }
    if (type === 'kine') return { type, min: 30 };
    if (type === 'recovery') return { type, min: 25 };
    return { type };
  }

  // replaceKey gezet = vervangen in plaats van toevoegen
  function openAddMenu(k, replaceKey = null) {
    const ids = Object.keys(C.sessions);
    const own = ids.filter(id => C.sessions[id].custom), std = ids.filter(id => !C.sessions[id].custom && programOn(C.sessions[id].program, id));
    const cur = replaceKey ? findItem(k, replaceKey) : null;
    const rep = replaceKey ? ` data-replace="${esc(replaceKey)}"` : '';
    const small = '';
    const row = id => `<div class="list-row"><div class="ico">${icon(C.sessions[id].icon)}</div>
        <div class="body" style="cursor:pointer" data-action="add-session" data-k="${k}" data-id="${id}"${rep}><b>${esc(sessionTitle(id))}</b><span>${esc(sessionDesc(id))}</span></div>
        <div class="end">${!replaceKey && C.sessions[id].custom ? `<button class="icon-btn ghost" data-action="edit-custom" data-key="${id}" aria-label="${esc(sessionTitle(id))} aanpassen">${icon('edit')}</button><button class="icon-btn ghost" data-action="delete-custom" data-key="${id}" aria-label="${esc(sessionTitle(id))} verwijderen">${icon('trash')}</button>` : ''}
          <button class="icon-btn" data-action="add-session" data-k="${k}" data-id="${id}"${rep} aria-label="${esc(sessionTitle(id))} ${replaceKey ? 'kiezen' : 'toevoegen'}">${icon(replaceKey ? 'check' : 'plus')}</button></div></div>`;
    const types = QUICK_TYPES.filter(([t]) => !(replaceKey && cur && cur.type === t)).map(([t, l, ic, sub]) =>
      `<button class="type-tile" data-action="add-type" data-k="${k}" data-type="${t}"${rep}>${icon(ic)}<b>${l}</b><span>${sub}</span></button>`).join('');
    openSheet(`<div class="sheet-head"><div><h3>${replaceKey ? 'Vervangen door' : 'Inplannen'}</h3><p>${replaceKey && cur ? `${esc(itemMeta(cur).title)} · ` : ''}${cap(fmtDay(k))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="type-grid">${types}</div>
      <div class="add-row two mt-12"><input class="input" id="custom-label" placeholder="Eigen type, bv. Zwemmen" aria-label="Naam van een eigen type" maxlength="40"><button class="btn" data-action="add-custom" data-k="${k}"${rep}>${icon(replaceKey ? 'check' : 'plus')}<span class="sr">${replaceKey ? 'Vervangen' : 'Toevoegen'}</span></button></div>
      ${own.length ? `<div class="section"><span>Mijn workouts</span></div>${own.map(row).join('')}` : ''}
      <div class="section"><span>Workouts</span></div>${std.map(row).join('')}
      ${replaceKey ? '' : `<button class="btn block mt-16" data-action="new-custom" data-k="${k}">${icon('plus')} Eigen workout maken</button>`}`);
  }
  function addOrReplace(el, item) {
    if (el.dataset.replace) replaceItem(el.dataset.k, el.dataset.replace, item);
    else openRepeat(el.dataset.k, item);
  }


  /* ---------- Inplannen: één dag of herhalen op vaste weekdagen ---------- */
  const ruleById = id => planRules().find(r => r.id === id);
  const ruleFor = item => planRules().find(r => itemKey(r.item) === itemKey(item) && (!r.until || r.until >= dkey(today())));
  function ruleText(r) {
    const d = r.days || [];
    const every = d.length === 7 ? 'Elke dag' : d.length === 5 && [1, 2, 3, 4, 5].every(x => d.includes(x)) ? 'Elke weekdag' : `Elke ${daysText(d)}`;
    return [every, r.time, r.until ? `tot ${fmtShort(r.until)}` : ''].filter(Boolean).join(' · ');
  }
  // item = wat je inplant; k = de gekozen dag; ruleId = bestaande herhaling aanpassen
  function openRepeat(k, item, ruleId = null) {
    const r = ruleId ? ruleById(ruleId) : null;
    S.ui.rp = { k, item: cleanItem(r ? r.item : item), ruleId: r ? r.id : null, days: r ? [...r.days] : [parseKey(k).getDay()], mode: r ? 'repeat' : 'once' };
    renderRepeat(r);
  }
  function renderRepeat(r = null) {
    const rp = S.ui.rp, m = itemMeta(rp.item);
    const title = rp.item.type === 'session' ? sessionTitle(rp.item.id) : m.title;
    openSheet(`<form id="repeat-form">
      <div class="sheet-head"><div><span class="eyebrow">${rp.ruleId ? 'Herhaling aanpassen' : 'Inplannen'}</span><h3>${esc(title)}</h3><p>${rp.ruleId ? esc(ruleText(r)) : `Vanaf ${fmtDay(rp.k)}`}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${rp.ruleId ? '' : `<label class="field"><span>Datum</span><input class="input" type="date" name="date" value="${rp.k}" required></label>
      <div class="seg">${radio('rpmode', 'once', 'Alleen deze dag', rp.mode)}${radio('rpmode', 'repeat', 'Herhalen', rp.mode)}</div>`}
      <div id="rp-repeat" ${rp.mode === 'repeat' ? '' : 'hidden'}>
        <p class="field-label">Elke week op</p>
        <div class="wd-pick">${WD_ORDER.map(d => `<button type="button" class="tchip ${rp.days.includes(d) ? 'on' : ''}" data-action="rp-wd" data-d="${d}" aria-pressed="${rp.days.includes(d)}" aria-label="${DAY[d]}">${cap(DAY_S[d])}</button>`).join('')}</div>
        <div class="chips mb-12"><button type="button" class="loc-chip" data-action="rp-preset" data-p="2,4">Di + Do</button><button type="button" class="loc-chip" data-action="rp-preset" data-p="1,2,3,4,5">Elke weekdag</button><button type="button" class="loc-chip" data-action="rp-preset" data-p="0,1,2,3,4,5,6">Elke dag</button></div>
        <div class="form-grid">
          <label class="field"><span>Uur (optioneel)</span><input class="input" type="time" name="time" value="${esc((r && r.time) || '')}"></label>
          <label class="field"><span>Tot (optioneel)</span><input class="input" type="date" name="until" min="${rp.k}" value="${esc((r && r.until) || '')}"></label>
        </div>
      </div>
      <button class="btn accent block lg" type="submit">${icon('check')} ${rp.ruleId ? 'Opslaan' : 'Inplannen'}</button>
      ${rp.ruleId ? `<button type="button" class="btn block mt-8" data-action="rp-delete" data-id="${rp.ruleId}">${icon('trash')} Herhaling verwijderen</button>` : ''}
    </form>`);
  }
  async function saveRepeat(form) {
    const rp = S.ui.rp, f = new FormData(form);
    if (f.get('date')) rp.k = f.get('date');
    const mode = rp.ruleId ? 'repeat' : f.get('rpmode');
    if (mode === 'once') { addItemTo(rp.k, rp.item); return; }
    const days = [...new Set(rp.days)].sort();
    if (!days.length) { toast('Kies minstens één dag'); return; }
    const list = planRules().filter(r => r.id !== rp.ruleId);
    const old = rp.ruleId ? ruleById(rp.ruleId) : null;
    const rule = { id: rp.ruleId || newId(), item: rp.item, days, time: f.get('time') || null, since: old ? old.since : rp.k, until: f.get('until') || null };
    list.push(rule);
    await setSetting('schedule', list);
    closeSheet(); render({ keepScroll: true });
    toast(`${itemMeta(rp.item).title}: ${ruleText(rule).toLowerCase()}`);
  }
  // Herhaling stoppen vanaf een dag (eerdere dagen blijven zoals ze waren)
  async function stopRule(id, k) {
    const r = ruleById(id); if (!r) return;
    const until = dkey(addDays(parseKey(k), -1));
    const list = planRules().filter(x => x.id !== id);
    if (r.since && until >= r.since) list.push({ ...r, until });
    await setSetting('schedule', list);
    closeSheet(); render({ keepScroll: true });
    toast(`Herhaling gestopt vanaf ${fmtDay(k)}`);
  }
  async function deleteRule(id) {
    if (!await ask('Deze herhaling helemaal verwijderen? Ze verdwijnt uit alle dagen van je planning. Wat je al logde, blijft bewaard.', { ok: 'Verwijderen', danger: true })) return;
    await setSetting('schedule', planRules().filter(x => x.id !== id));
    closeSheet(); render({ keepScroll: true });
    toast('Herhaling verwijderd');
  }
  // Compact overzicht van je vaste planning (bovenaan Planning)
  function rulesCard() {
    const tk = dkey(today());
    const list = planRules().filter(r => !r.until || r.until >= tk);
    if (!list.length) return '';
    return `<section class="card rules-card"><div class="card-head"><h2>Vaste planning</h2><span class="label">${list.length}</span></div>
      ${list.map(r => `<button class="list-row tap row-btn" data-action="rp-edit" data-id="${r.id}"><span class="body"><b>${esc(r.item.type === 'session' ? sessionTitle(r.item.id) : itemMeta(r.item).title)}</b><span>${esc(ruleText(r))}</span></span><span class="end">${icon('chevR')}</span></button>`).join('')}
    </section>`;
  }

  /* ================= Eigen workouts ================= */
  // Bewaard in de instellingen: customSessions { X…: { name, items: [{ ex, sets, reps, duration, weight }] } }
  // en customExercises { cx…: { name, kind, load, … } }. Ze worden bij het starten in de config gezet.
  let libraryReady = false;
  function registerLibrary() {
    if (libraryReady || !C.library) return;
    Object.entries(C.library.exercises || {}).forEach(([k, v]) => { if (!C.exercises[k]) C.exercises[k] = v; });
    Object.entries(C.library.tags || {}).forEach(([k, v]) => { if (C.exercises[k]) Object.assign(C.exercises[k], v); });
    libraryReady = true;
  }

  function registerCustom() {
    registerLibrary();
    Object.entries(S.settings.customExercises || {}).forEach(([k, v]) => { C.exercises[k] = { rest: 60, ...v, custom: true }; });
    const cs = S.settings.customSessions || {};
    Object.keys(C.sessions).forEach(k => { if (C.sessions[k].custom && !cs[k]) delete C.sessions[k]; });
    Object.entries(cs).forEach(([k, v]) => {
      C.sessions[k] = {
        short: v.name, name: v.name, desc: `${v.items.map(it => (C.exercises[it.ex] || {}).name).filter(Boolean).slice(0, 3).join(', ')}${v.items.length > 3 ? '…' : ''}`,
        place: '', typeLabel: 'Eigen workout', icon: 'dumbbell', custom: true,
        items: v.items.filter(it => C.exercises[it.ex])
      };
    });
  }

  // Standaardwaarden voor een oefening die je aan een eigen workout toevoegt
  function builderItem(exId) {
    const ex = C.exercises[exId];
    const prev = lastPerformance(exId);
    const lastW = prev ? Math.max(0, ...prev.sets.map(s => num(s.weight)).filter(v => v != null)) : 0;
    return {
      ex: exId, sets: 3,
      reps: ex.kind === 'reps' ? (ex.reps ? ex.reps[1] : 10) : null,
      duration: ex.kind === 'hold' || ex.kind === 'time' ? (Array.isArray(ex.duration) ? ex.duration[0] : ex.duration || 30) : null,
      weight: ex.load === 'kg' || ex.load === 'bw' ? (lastW || null) : null
    };
  }

  // injury gezet = herstelplan voor die blessure samenstellen
  function openBuilder(k, key, injury = null) {
    const cs = (S.settings.customSessions || {})[key];
    S.ui.builder = { k, key: key || null, injury, name: cs ? cs.name : '', items: cs ? clone(cs.items) : [], adding: false, view: 'edit', tab: 'spiergroep', loc: 'alles', group: null };
    renderBuilder(true);
  }

  function renderBuilder(fresh) {
    const b = S.ui.builder;
    const html = b.view === 'pick' ? pickerHtml(b) : builderEditHtml(b);
    const sh = $('.sheet');
    if (!fresh && sh) { const y = b.view === b.lastView ? sh.scrollTop : 0; sh.innerHTML = html; sh.scrollTop = y; }
    else openSheet(html);
    b.lastView = b.view;
  }

  function builderEditHtml(b) {
    const mini = (i, f, label, v, step) => `<div class="mini"><span>${label}</span><div class="mini-row">
        <button type="button" data-action="b-step" data-i="${i}" data-f="${f}" data-d="${-step}" aria-label="${label} min">−</button>
        <input inputmode="decimal" data-bi="${i}" data-bf="${f}" value="${v == null ? '' : String(v).replace('.', ',')}" placeholder="–" aria-label="${label}">
        <button type="button" data-action="b-step" data-i="${i}" data-f="${f}" data-d="${step}" aria-label="${label} plus">+</button></div></div>`;
    const rows = b.items.map((it, i) => {
      const ex = C.exercises[it.ex] || { name: '?' };
      const second = ex.kind === 'reps' ? mini(i, 'reps', 'Herhalingen', it.reps, 1)
        : ex.kind === 'distance' ? '' : mini(i, 'duration', 'Seconden', it.duration, 5);
      return `<div class="b-item">
        <div class="b-top"><div><b>${esc(ex.name)}</b>${ex.perSide ? `<span class="label" style="display:block">per ${esc(ex.sideWord || 'kant')}${ex.kind === 'distance' ? ` · ${ex.distance} m` : ''}</span>` : ex.kind === 'distance' ? `<span class="label" style="display:block">${ex.distance} m</span>` : ''}</div>
          <button type="button" class="icon-btn ghost" data-action="b-remove" data-i="${i}" aria-label="Oefening verwijderen">${icon('x')}</button></div>
        <div class="b-grid">
          ${mini(i, 'sets', 'Sets', it.sets, 1)}
          ${second}
          ${ex.load === 'kg' || ex.load === 'bw' ? mini(i, 'weight', ex.load === 'bw' ? 'Extra kg' : 'kg', it.weight, 2.5) : ''}
        </div>
      </div>`;
    }).join('');
    return `<div class="sheet-head"><div><h3>${b.key ? 'Eigen workout aanpassen' : b.injury ? 'Herstelplan' : 'Eigen workout'}</h3><p>${b.injury ? `Oefeningen voor ${esc(injuryLabel(injuryById(b.injury)))}, zoals je kinesist ze voorschrijft` : b.k ? `Voor ${fmtDay(b.k)}` : 'Kies je oefeningen en stel ze in'}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <label class="field"><span>Naam</span><input class="input" id="b-name" data-b="name" value="${esc(b.name)}" placeholder="Bv. Upper body thuis"></label>
      ${b.items.length ? '' : `<div class="b-start">
        <button type="button" class="b-choice" data-action="b-open-pick" data-tab="voorgesteld">${icon('magic')}<b>Voorgestelde workout</b><span>Kant-en-klaar, thuis of in de gym</span></button>
        <button type="button" class="b-choice" data-action="b-open-pick" data-tab="spiergroep">${icon('list')}<b>Zelf samenstellen</b><span>Per spiergroep oefeningen kiezen</span></button>
      </div>`}
      ${rows}
      ${b.items.length ? `<div class="row" style="margin:4px 0 8px">
        <button type="button" class="btn" data-action="b-open-pick" data-tab="spiergroep">${icon('plus')} Oefening</button>
        <button type="button" class="btn" data-action="b-open-pick" data-tab="voorgesteld">${icon('magic')} Voorgesteld</button>
      </div>` : ''}
      <button class="btn primary block lg" data-action="b-save" ${b.items.length ? '' : 'disabled'}>${icon('check')} ${b.key ? 'Opslaan' : b.k ? 'Opslaan en inplannen' : 'Opslaan'}</button>`;
  }

  // ---------- Oefeningen kiezen: voorgesteld of per spiergroep, filter thuis/gym ----------
  const LIB = C.library;
  const fitsLoc = (where, loc) => loc === 'alles' || !where || (Array.isArray(where) ? where.includes(loc) : where === loc);
  const plyoLocked = () => currentPhase() !== 'f3';
  const groupName = id => (LIB.categories.flatMap(c => c.groups).find(g => g.id === id) || {}).name || id;
  function groupExercises(group, loc) {
    return Object.keys(C.exercises).filter(k => {
      const ex = C.exercises[k];
      if (group === 'mine') return ex.custom;
      return !ex.custom && ex.group === group && fitsLoc(ex.where, loc);
    }).sort((a, c) => C.exercises[a].name.localeCompare(C.exercises[c].name));
  }
  function templateMinutes(t) {
    return Math.max(10, Math.round(sum(t.items.map(it => {
      const ex = C.exercises[it.ex] || {};
      const n = (it.sets || 3) * (ex.perSide ? 2 : 1);
      return n * ((ex.rest || 60) + (it.duration || (ex.kind === 'hold' || ex.kind === 'time' ? ex.duration || 30 : 35)));
    })) / 60 / 5) * 5);
  }
  const whereLabel = w => (Array.isArray(w) ? w : [w]).map(x => x === 'gym' ? 'Gym' : 'Thuis').join(' · ');

  function pickerHtml(b) {
    const loc = b.loc || 'alles', tab = b.tab || 'spiergroep';
    const head = `<div class="sheet-head">
        <button class="icon-btn" data-action="b-back" aria-label="Terug naar je workout">${icon('back')}</button>
        <div style="flex:1;min-width:0"><h3>${tab === 'voorgesteld' ? 'Voorgestelde workouts' : b.group ? esc(groupName(b.group)) : 'Oefeningen'}</h3><p>${b.items.length} oefening${b.items.length === 1 ? '' : 'en'} gekozen</p></div>
        <button class="btn primary sm" data-action="b-back">Klaar</button></div>
      <div class="seg">${[['spiergroep', 'Spiergroepen'], ['voorgesteld', 'Voorgesteld']].map(([v, l]) => `<button class="${tab === v ? 'on' : ''}" data-action="b-tab" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="chips" style="margin:-4px 0 16px">${[['alles', 'Alles'], ['thuis', 'Thuis'], ['gym', 'Gym']].map(([v, l]) => `<button class="loc-chip ${loc === v ? 'on' : ''}" data-action="b-loc" data-v="${v}">${l}</button>`).join('')}</div>`;

    if (tab === 'voorgesteld') {
      const list = LIB.templates.filter(t => fitsLoc(t.where, loc));
      return head + (list.map(t => `<button class="tpl" data-action="b-template" data-id="${t.id}">
          <span class="ico">${icon(t.icon)}</span>
          <span class="body"><b>${esc(t.name)}</b><span>${esc(t.desc)}</span>
            <span class="tpl-meta"><span class="tag">${whereLabel(t.where)}</span><span class="tag">${t.items.length} oefeningen</span><span class="tag">±${templateMinutes(t)} min</span>${t.plyo && plyoLocked() ? '<span class="tag missed">vanaf fase 2 + 3</span>' : ''}</span></span>
          <span class="end">${icon('plus')}</span></button>`).join('') || '<p class="empty">Geen voorgestelde workouts voor deze plaats.</p>')
        + `<p class="label mt-12">Na het kiezen kun je elke oefening nog aanpassen of verwijderen.</p>`;
    }

    if (b.group) {
      const ids = groupExercises(b.group, loc);
      const g = LIB.categories.flatMap(c => c.groups).find(x => x.id === b.group);
      return head + `<button class="link-btn" style="margin:-4px 0 8px" data-action="b-group" data-id="">${icon('chevL')} Alle spiergroepen</button>
        ${g && g.hint ? `<p class="label" style="margin:0 0 8px">${esc(g.hint)}</p>` : ''}
        <section class="card" style="padding:4px 16px">${ids.map(id => {
          const ex = C.exercises[id], on = b.items.some(i => i.ex === id);
          return `<div class="list-row">
            <div class="body"><b>${esc(ex.name)}</b><span>${esc(prescription({ sets: 3 }, ex).replace(/^3 × /, ''))}${ex.where ? ' · ' + whereLabel(ex.where) : ''}</span>
              ${ex.plyo && plyoLocked() ? '<span class="tag missed mt-4">vanaf fase 2 + 3</span>' : ''}</div>
            <div class="end"><button class="icon-btn pick-btn ${on ? 'on' : ''}" data-action="b-pick-ex" data-id="${id}" aria-label="${on ? 'Verwijderen' : 'Toevoegen'}">${icon(on ? 'check' : 'plus')}</button></div>
          </div>`;
        }).join('') || '<p class="empty">Geen oefeningen voor deze plaats in deze groep.</p>'}</section>`;
    }

    const mine = groupExercises('mine', loc);
    return head + LIB.categories.map(c => {
      const groups = c.groups.map(g => ({ ...g, n: groupExercises(g.id, loc).length })).filter(g => g.n);
      if (!groups.length) return '';
      return `<div class="section mt-16"><span>${esc(c.name)}</span></div>
        <div class="group-grid">${groups.map(g => `<button class="group-tile" data-action="b-group" data-id="${g.id}">
          <b>${esc(g.name)}</b><span>${esc(g.hint || '')}</span><em>${g.n} oefeningen${c.id === 'power' && plyoLocked() ? ' · vanaf fase 2 + 3' : ''}</em></button>`).join('')}</div>`;
    }).join('') + `
      ${mine.length ? `<div class="section mt-16"><span>Mijn oefeningen</span></div><div class="group-grid"><button class="group-tile" data-action="b-group" data-id="mine"><b>Mijn oefeningen</b><span>Zelf gemaakt</span><em>${mine.length} oefeningen</em></button></div>` : ''}
      <div class="b-add mt-16">
        ${b.adding ? `<label class="field"><span>Naam van je eigen oefening</span><input class="input" id="b-new-name" placeholder="Bv. Hamstring curl"></label>
          <div class="seg">${radio('b-kind', 'reps', 'Herh. + kg', 'reps')}${radio('b-kind', 'bw', 'Herh.', 'reps')}${radio('b-kind', 'time', 'Op tijd', 'reps')}</div>
          <button type="button" class="btn block" data-action="b-new-add">${icon('plus')} Toevoegen</button>`
          : `<button type="button" class="btn ghost block" data-action="b-new-toggle">${icon('plus')} Staat je oefening er niet bij? Maak ze zelf</button>`}
      </div>`;
  }

  // Een voorgestelde workout overnemen (naam alleen als je nog geen naam koos)
  function applyTemplate(id) {
    const b = S.ui.builder, t = LIB.templates.find(x => x.id === id);
    if (!t) return;
    if (!b.name) b.name = t.name;
    t.items.forEach(ti => {
      if (!C.exercises[ti.ex]) return;
      const it = builderItem(ti.ex);
      if (ti.sets) it.sets = ti.sets;
      if (ti.reps && it.reps != null) it.reps = ti.reps;
      if (ti.duration) it.duration = ti.duration;
      b.items.push(it);
    });
    b.view = 'edit';
    renderBuilder();
    toast(`${t.name}: ${t.items.length} oefeningen toegevoegd${t.plyo && plyoLocked() ? '. Let op: sprongen pas vanaf fase 2 + 3' : ''}`);
  }

  function togglePickEx(id) {
    const b = S.ui.builder;
    const i = b.items.findIndex(x => x.ex === id);
    if (i >= 0) b.items.splice(i, 1); else b.items.push(builderItem(id));
    renderBuilder();
  }

  const keepName = () => { const n = $('#b-name'); if (n && S.ui.builder) S.ui.builder.name = n.value; };

  function builderStep(i, f, d) {
    const it = S.ui.builder.items[i];
    const min = f === 'sets' ? 1 : 0;
    it[f] = clamp(Math.round(((num(it[f]) ?? (f === 'weight' ? 0 : min)) + d) * 100) / 100, min, f === 'duration' ? 600 : 500);
    const inp = $(`[data-bi="${i}"][data-bf="${f}"]`);
    if (inp) inp.value = String(it[f]).replace('.', ',');
  }

  function builderAddNew() {
    const name = ($('#b-new-name').value || '').trim();
    if (!name) { toast('Geef de oefening een naam'); return; }
    const kind = (document.querySelector('input[name="b-kind"]:checked') || {}).value || 'reps';
    const key = 'cx' + newId();
    C.exercises[key] = kind === 'reps' ? { name, kind: 'reps', reps: [10, 10], load: 'kg', increment: 2.5, rest: 75, custom: true }
      : kind === 'bw' ? { name, kind: 'reps', reps: [12, 12], load: 'bw', rest: 60, custom: true }
        : { name, kind: 'time', duration: 30, load: 'bw', rest: 45, custom: true };
    S.ui.builder.items.push(builderItem(key));
    S.ui.builder.adding = false;
    renderBuilder();
    toast(`${name} toegevoegd`);
  }

  async function saveBuilder() {
    const b = S.ui.builder;
    keepName();
    b.name = (b.name || '').trim();
    if (!b.name) { toast('Geef je workout een naam'); const n = $('#b-name'); if (n) n.focus(); return; }
    if (!b.items.length) { toast('Voeg minstens één oefening toe'); return; }
    const items = b.items.map(it => ({ ex: it.ex, sets: Math.max(1, num(it.sets) || 1), reps: num(it.reps), duration: num(it.duration), weight: num(it.weight) }));
    // Nieuwe eigen oefeningen bewaren
    const cx = { ...(S.settings.customExercises || {}) };
    items.forEach(it => { const ex = C.exercises[it.ex]; if (ex && ex.custom && !cx[it.ex]) { const { custom, ...def } = ex; cx[it.ex] = def; } });
    await setSetting('customExercises', cx);
    const cs = { ...(S.settings.customSessions || {}) };
    const key = b.key || 'X' + newId();
    cs[key] = { name: b.name, items };
    await setSetting('customSessions', cs);
    registerCustom();
    S.ui.builder = null;
    if (!b.key && b.injury) {
      await updateInjury(b.injury, i => { i.linked = [...new Set([...(i.linked || []), key])]; });
      S.ui.injuryId = b.injury;
      render({ keepScroll: true });
      openRehabPlan(key);
      toast(`${b.name} bewaard. Kies nu wanneer je ze doet.`);
      return;
    }
    if (!b.key && b.k) { addSessionTo(b.k, key, ''); return; }
    render({ keepScroll: true });
    if (!b.key) { openWorkoutPlan(key, true); toast(`${b.name} bewaard. Kies nu wanneer je hem doet.`); return; }
    closeSheet();
    toast('Eigen workout aangepast');
  }

  /* ---------- Eigen workouts inplannen: wekelijks op vaste dagen of één keer ---------- */
  const mySchedule = id => { const r = ruleFor({ type: 'session', id }); return r ? { id, days: r.days, since: r.since } : null; };
  function planText(id) {
    const sc = mySchedule(id);
    const rehab = injuries().filter(i => i.status !== 'afgerond').map(i => (i.schedule || []).find(x => x.id === id)).filter(Boolean)[0];
    const days = [...new Set([...((sc && sc.days) || []), ...((rehab && rehab.days) || [])])];
    return days.length ? `Elke ${daysText(days)}` : '';
  }
  function openWorkoutPlan(id, fresh = false) {
    if (!C.sessions[id]) return;
    const r = ruleFor({ type: 'session', id });
    return openRepeat(dkey(today()), { type: 'session', id }, r ? r.id : null);
    S.ui.planDays = [...((mySchedule(id) || {}).days || [])];
    S.ui.planOnce = [];
    renderWorkoutPlan(id, fresh);
  }
  function renderWorkoutPlan(id, fresh) {
    const tk = dkey(today());
    openSheet(`<div class="sheet-head"><div><span class="eyebrow">${fresh ? 'Nieuwe workout' : 'Inplannen'}</span><h3>${esc(sessionTitle(id))}</h3><p>${esc(sessionDesc(id))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <p class="field-label">Elke week op</p>
      <div class="wd-pick">${WD_ORDER.map(d => `<button type="button" class="tchip ${S.ui.planDays.includes(d) ? 'on' : ''}" data-action="plan-wd" data-d="${d}" aria-pressed="${S.ui.planDays.includes(d)}" aria-label="${DAY[d]}">${cap(DAY_S[d])}</button>`).join('')}</div>
      <p class="label" style="margin:0 0 16px">Staat vanaf vandaag in je planning. Per dag kun je hem nog verplaatsen, vervangen of overslaan.</p>
      <p class="field-label">Of op losse dagen</p>
      <div class="add-row two"><input class="input" type="date" id="plan-once" min="${tk}" value="${tk}" aria-label="Datum"><button class="btn" data-action="plan-once-add">${icon('plus')}<span class="sr">Datum toevoegen</span></button></div>
      <div class="chips mt-8" id="plan-once-list">${S.ui.planOnce.map(d => `<button class="loc-chip on" data-action="plan-once-del" data-d="${d}" aria-label="${fmtDay(d)} weghalen">${esc(cap(fmtDay(d)))} ${icon('x')}</button>`).join('')}</div>
      <button class="btn accent block lg" data-action="plan-save" data-key="${id}">${icon('check')} Inplannen</button>
      ${fresh ? `<button class="btn ghost block" data-action="close-sheet">Later</button>` : ''}`);
  }
  async function saveWorkoutPlan(id) {
    const days = [...S.ui.planDays].sort();
    const prev = mySchedule(id);
    const list = (S.settings.workoutSchedule || []).filter(x => x.id !== id);
    if (days.length) list.push({ id, days, since: prev && prev.since && prev.days.length ? prev.since : dkey(today()) });
    await setSetting('workoutSchedule', list);
    const once = S.ui.planOnce.filter(d => !findItem(d, `session:${id}`));
    if (once.length) {
      const all = clone(overrides());
      once.forEach(d => editOv(all, d, o => {
        if (o.removed[`session:${id}`]) delete o.removed[`session:${id}`];
        else o.added.push({ type: 'session', id, extra: true, note: 'Jouw planning' });
        o.confirmed[`session:${id}`] = true;
      }));
      await setSetting('overrides', all);
    }
    closeSheet();
    render({ keepScroll: true });
    const parts = [days.length ? `elke ${daysText(days)}` : '', once.length ? `${once.length} losse dag${once.length === 1 ? '' : 'en'}` : ''].filter(Boolean);
    toast(parts.length ? `${sessionTitle(id)} ingepland: ${parts.join(' en ')}` : `${sessionTitle(id)} staat niet meer wekelijks ingepland`);
  }
  function openWorkoutSheet(id) {
    const s = sessInfo(id), exs = (C.sessions[id].items || []).map(it => C.exercises[it.ex]).filter(Boolean);
    openSheet(`<div class="sheet-head"><div><span class="eyebrow">Mijn workout</span><h3>${esc(s.name)}</h3><p>${s.exercises} oefeningen · ±${s.minutes} min${planText(id) ? ` · ${esc(planText(id))}` : ''}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <button class="btn accent block lg" data-action="start-session" data-key="${id}">${icon('play')} Nu starten</button>
      <div class="row mt-8"><button class="btn" data-action="workout-plan" data-key="${id}">${icon('calendar')} Inplannen</button><button class="btn" data-action="edit-custom" data-key="${id}">${icon('edit')} Aanpassen</button></div>
      <p class="field-label mt-20">Oefeningen</p>
      <section class="card" style="padding:4px 16px">${(C.sessions[id].items || []).map(it => { const ex = C.exercises[it.ex]; return ex ? `<div class="list-row"><div class="body"><b>${esc(ex.name)}</b><span>${esc(prescription({ ...it, sets: it.sets || 3 }, { ...ex, ...(it.reps ? { reps: [it.reps, it.reps], repsText: null } : {}), ...(it.duration ? { duration: it.duration } : {}) }))}${it.weight ? ` · ${fmtNum(it.weight)} kg` : ''}</span></div></div>` : ''; }).join('') || '<p class="empty">Nog geen oefeningen.</p>'}</section>
      <details class="more"><summary>Meer opties</summary><button class="btn danger block" data-action="delete-custom" data-key="${id}">${icon('trash')} Workout verwijderen</button></details>`);
  }

  async function deleteCustom(key) {
    const cs = { ...(S.settings.customSessions || {}) };
    if (!cs[key] || !await ask(`"${cs[key].name}" verwijderen? Hij verdwijnt ook uit je planning. Afgewerkte workouts blijven bewaard.`, { ok: 'Verwijderen', danger: true })) return;
    delete cs[key];
    await setSetting('customSessions', cs);
    await setSetting('schedule', planRules().filter(r => !(r.item.type === 'session' && r.item.id === key)));
    if (injuries().some(i => (i.linked || []).includes(key))) {
      await setSetting('injuries', injuries().map(i => ({ ...i, linked: (i.linked || []).filter(x => x !== key), schedule: (i.schedule || []).filter(x => x.id !== key), maintenance: (i.maintenance || []).filter(x => x !== key) })));
    }
    // Uit de planning halen
    const all = clone(overrides());
    Object.keys(all).forEach(k => editOv(all, k, o => { o.added = o.added.filter(a => a.id !== key); delete o.removed[`session:${key}`]; }));
    await setSetting('overrides', all);
    registerCustom();
    closeSheet();
    render({ keepScroll: true });
    toast('Eigen workout verwijderd');
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
    return done.length >= 2 && done.every(s => (num(s.reps) || 0) >= top && !overLimit(num(s.pain)));
  }

  function buildExercise(it) {
    // Een eigen workout kan herhalingen en tijd per oefening overschrijven
    const ex = { ...C.exercises[it.ex] };
    if (it.reps) { ex.reps = [+it.reps, +it.reps]; ex.repsText = null; }
    if (it.duration) ex.duration = +it.duration;
    const e = {
      exId: it.ex, name: ex.name, kind: ex.kind, load: ex.load, perSide: !!ex.perSide,
      presc: prescription(it, ex) + (ex.kind === 'reps' && ex.load === 'kg' ? ` · ${C.rpe}` : ''),
      cue: ex.cue || '', rest: ex.rest || C.defaultRest,
      target: ex.reps || null, repsText: ex.repsText || null, progressAt: ex.progressAt || null,
      duration: Array.isArray(ex.duration) ? ex.duration[0] : (ex.duration || null),
      distance: ex.distance || null, increment: ex.increment || 2.5,
      setLabels: it.setLabels || null, sets: [], bump: 0, cur: 0, startWeight: it.weight ?? null
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
    if (weight === '' && e.startWeight != null) weight = String(e.startWeight).replace('.', ',');
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
      if (!await ask(`Je bent nog bezig met ${woTitle(cur)}. Die stoppen zonder opslaan en ${sessionTitle(key)} starten?`, { ok: 'Nieuwe starten', danger: true })) return;
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

  // Overzicht van alle sessies (hoofdtab, dus geen terugknop)
  function renderWorkout() { S.ui.trainSeg = 'kracht'; return renderTraining(); }
  function krachtHtml() {
    const w = draft();
    const t = today(), k = dkey(t);
    const todays = planFor(t).filter(it => it.type === 'session' && !itemDone(it, k));
    const rec = relevantSession(todays, k);
    const sm = S.ui.summary;
    const rising = activeInjuries().some(i => checkRise(i).length);
    const groups = [['Kracht', id => !C.sessions[id].program && !C.sessions[id].custom], ['Herstel', id => !!C.sessions[id].program]];
    const own = Object.keys(C.sessions).filter(id => C.sessions[id].custom);

    return `
      ${sm ? `<div class="hint">${icon('check')}<span><b>${esc(sm.title)} opgeslagen.</b> ${sm.sets} set${sm.sets === 1 ? "" : "s"} in ${sm.minutes} min${sm.rpe != null ? `, zwaarte ${sm.rpe}/10` : ''}.</span></div>` : ''}
      ${rising ? `<div class="hint warn">${icon('alert')}<span>Je dagelijkse check is hoger dan de vorige meting. Volg je afspraak met je kinesist.</span></div>` : ''}
      ${w ? `<section class="card resume">
        <div class="card-head"><h2>Onafgewerkte workout</h2><span class="tag adapted">Bewaard</span></div>
        <p class="small"><b>${esc(woTitle(w))}</b> · gestart ${relDay(w.date)} om ${fmtTime(w.startedAt)} · ${w.exercises.flatMap(x => x.sets).filter(s => s.done).length} sets gedaan</p>
        <div class="row mt-12"><button class="btn" data-action="wo-leave">Opties</button><button class="btn accent" data-action="wo-resume">${icon('play')} Hervatten</button></div>
      </section>` : rec ? actCard(rec, k, true) : ''}
      <div class="section"><span>Mijn workouts</span>${own.length ? `<button class="link-btn" data-action="new-workout">${icon('plus')} Nieuwe workout</button>` : ''}</div>
      ${own.length ? `<section class="card">${own.map(key => {
        const s = sessInfo(key);
        return `<div class="list-row">
          <button class="body row-btn" data-action="workout-sheet" data-key="${key}" aria-label="${esc(s.name)}: inplannen of aanpassen"><b>${esc(s.name)}</b><span>${s.exercises} oefeningen · ±${s.minutes} min</span><span class="${planText(key) ? 'accent-text' : ''}">${esc(planText(key) || 'Nog niet ingepland')}</span></button>
          <div class="end"><button class="icon-btn ghost" data-action="workout-plan" data-key="${key}" aria-label="${esc(s.name)} inplannen">${icon('calendar')}</button>
            <button class="icon-btn" data-action="start-session" data-key="${key}" aria-label="Start ${esc(s.name)}">${icon('play')}</button></div>
        </div>`;
      }).join('')}</section>` : `<section class="card empty-row">
          <p>Nog geen eigen workouts.</p>
          <button class="btn sm" data-action="new-workout">${icon('plus')} Nieuwe workout</button>
        </section>`}
      ${groups.map(([title, fn]) => {
        const ids = Object.keys(C.sessions).filter(fn);
        if (!ids.length) return '';
        return `<div class="section"><span>${title}</span></div><section class="card">${ids.map(key => {
          const s = sessInfo(key);
          const off = key === 'PLYO' && currentPhase() !== 'f3';
          const inactive = C.sessions[key].program && !programOn(C.sessions[key].program, key);
          return `<div class="list-row">
            <div class="body"><b>${esc(s.name)}</b><span>${off ? 'Pas vanaf fase 2 + 3' : esc(s.desc)}</span><span>${s.place ? cap(s.place) + ' · ' : ''}${s.exercises} oefeningen · ±${s.minutes} min${inactive ? ' · niet in je schema' : ''}</span></div>
            <div class="end"><button class="icon-btn ghost" data-action="workout-plan" data-key="${key}" aria-label="${esc(s.name)} inplannen">${icon('calendar')}</button><button class="icon-btn" data-action="start-session" data-key="${key}" aria-label="Start ${esc(s.name)}">${icon('play')}</button></div>
          </div>`;
        }).join('')}</section>`;
      }).join('')}
    `;
  }

  // Velden per soort oefening, met de stapgrootte voor de −/+ knoppen
  function fieldsFor(e) {
    const lim = painMax();
    const pain = { f: 'pain', l: 'Pijn', sub: lim != null ? `jouw afspraak: max ${lim}` : '0 = geen pijn', step: 1, min: 0, max: 10, mode: 'numeric', start: 0 };
    if (e.kind === 'reps') {
      const goalTxt = e.repsText || (e.target[0] === e.target[1] ? String(e.target[0]) : `${e.target[0]}–${e.target[1]}`);
      const f = [{ f: 'reps', l: 'Herhalingen', sub: `doel ${goalTxt}`, step: 1, min: 0, max: 200, mode: 'numeric', start: e.target ? e.target[0] : 10 }];
      if (e.load === 'kg') f.push({ f: 'weight', l: 'Gewicht', sub: 'kg', step: e.increment >= 2.5 ? 2.5 : 1, min: 0, max: 500, mode: 'decimal', start: 0 });
      if (e.load === 'bw') f.push({ f: 'weight', l: 'Extra gewicht', sub: 'kg, optioneel', step: 2.5, min: 0, max: 200, mode: 'decimal', start: 0 });
      return f.concat(pain);
    }
    if (e.kind === 'hold') return [{ f: 'duration', l: 'Duur', sub: 'seconden', step: 5, min: 0, max: 600, mode: 'numeric', start: e.duration }, { f: 'weight', l: 'Gewicht', sub: 'kg, optioneel', step: 2.5, min: 0, max: 300, mode: 'decimal', start: 0 }, pain];
    if (e.kind === 'time') return [{ f: 'duration', l: 'Duur', sub: 'seconden', step: 5, min: 0, max: 600, mode: 'numeric', start: e.duration }, pain];
    return [{ f: 'dist', l: 'Afstand', sub: 'meter', step: 5, min: 0, max: 500, mode: 'numeric', start: e.distance }, pain];
  }
  const hasTimer = e => e.kind === 'hold' || e.kind === 'time';
  const sideName = s => s === 'L' ? 'links' : s === 'R' ? 'rechts' : '';
  const setName = s => `${s.label ? s.label : `Set ${s.idx + 1}`}${s.side ? ' · ' + sideName(s.side) : ''}`;

  function setText(s, kind) {
    const w = num(s.weight);
    if (kind === 'reps') return num(s.reps) == null ? '' : `${num(s.reps)}×${w ? ` ${fmtNum(w)} kg` : ''}`;
    if (kind === 'hold' || kind === 'time') return num(s.duration) == null ? '' : `${num(s.duration)} s${w ? ` · ${fmtNum(w)} kg` : ''}`;
    return num(s.dist) == null ? '' : `${num(s.dist)} m`;
  }

  // Eén korte regel boven de sets: alleen als het gewicht omhoog mag, of als de pijn boven je afspraak gaat
  function hintsHtml(e) {
    let html = '';
    if (e.sets.some(s => overLimit(num(s.pain)))) html += `<div class="hint warn">${icon('alert')}<span>Pijn boven je afspraak (${painMax()}): maak het lichter of stop deze oefening.</span></div>`;
    if (progressionReady(e, e.sets)) html += `<div class="hint accent">${icon('up')}<span>${e.load === 'kg' ? `Volgende keer mag het gewicht +${fmtNum(e.increment)} kg omhoog.` : 'Volgende keer mag het zwaarder: kies een moeilijkere variant.'}</span></div>`;
    else if (e.prevReady) html += `<div class="hint accent">${icon('up')}<span>${e.load === 'kg' ? `Gewicht omhoog: vandaag +${fmtNum(e.bump)} kg, al ingevuld.` : 'Vorige keer ging vlot: maak het vandaag iets zwaarder.'}</span></div>`;
    return html;
  }

  function setLinesHtml(e) {
    return e.sets.map((s, i) => {
      const txt = setText(s, e.kind), p = num(s.pain);
      return `<button class="set-line ${s.done ? 'done' : ''} ${i === e.cur ? 'cur' : ''}" data-action="set-sel" data-i="${i}">
        <span class="n">${esc(s.label || `${s.idx + 1}`)}${s.side ? ' ' + s.side : ''}</span>
        <span class="val ${txt ? '' : 'empty-val'}">${txt || (i === e.cur ? 'nu bezig' : '–')}${p != null && txt ? ` · <span class="${overLimit(p) ? 'pain-hi' : 'muted'}">pijn ${p}</span>` : ''}</span>
        <span class="ok">${s.done ? icon('check') : ''}</span>
      </button>`;
    }).join('');
  }

  function editorHtml(e) {
    const i = clamp(e.cur || 0, 0, e.sets.length - 1);
    const s = e.sets[i];
    const allDone = e.sets.every(x => x.done);
    const fields = fieldsFor(e);
    const steppers = fields.map(fd => `<div class="stepper ${fd.f === 'pain' && overLimit(num(s.pain)) ? 'hi' : ''}">
        <span class="lbl">${fd.l}<small>${fd.sub}</small></span>
        <button data-action="step" data-f="${fd.f}" data-d="-1" aria-label="${fd.l} min">−</button>
        <input type="text" inputmode="${fd.mode}" autocomplete="off" data-set="${i}" data-f="${fd.f}" value="${esc(s[fd.f] ?? '')}" placeholder="${esc(String(fd.start ?? ''))}" aria-label="${fd.l}">
        <button data-action="step" data-f="${fd.f}" data-d="1" aria-label="${fd.l} plus">+</button>
      </div>`).join('');
    let buttons;
    if (s.done) buttons = `<button class="btn primary block lg" data-action="set-next">${allDone ? 'Alle sets klaar' : 'Volgende set'} ${icon('chevR')}</button>
      <button class="btn ghost block" data-action="set-undo">Markeer als niet gedaan</button>`;
    else if (hasTimer(e)) buttons = `<button class="btn accent block lg" data-action="hold-start" data-i="${i}">${icon('timer')} Start timer ${num(s.duration) || e.duration} s</button>
      <button class="btn block" data-action="set-done">${icon('check')} Set klaar zonder timer</button>`;
    else buttons = `<button class="btn accent block lg" data-action="set-done">${icon('check')} Set klaar</button>`;
    return `<div class="editor-title"><b>${esc(setName(s))}</b><span class="label">${e.sets.filter(x => x.done).length} van ${e.sets.length} klaar · rust ${fmtSec(e.rest)}</span></div>
      ${steppers}${buttons}`;
  }

  // Vorige keer bij deze oefening (beste set per kant), om meteen te weten waar je staat
  function prevLine(e) {
    const w = draft();
    const prev = S.workouts.filter(x => !x.sample && (!w || x.startedAt !== w.startedAt)).sort((a, b) => b.date.localeCompare(a.date) || (b.finishedAt || 0) - (a.finishedAt || 0))
      .map(x => ({ date: x.date, e: (x.exercises || []).find(y => y.exId === e.exId && y.sets && y.sets.length) })).find(x => x.e);
    if (!prev) return `<p class="ex-prev muted">Eerste keer: kies een gewicht waarmee de laatste herhalingen zwaar maar netjes gaan.</p>`;
    const sets = prev.e.sets;
    const txt = sets.map(s => setText(s, e.kind)).filter(Boolean);
    const best = e.kind === 'reps' ? sets.reduce((a, b) => ((num(b.weight) || 0) > (num(a.weight) || 0) || ((num(b.weight) || 0) === (num(a.weight) || 0) && (num(b.reps) || 0) > (num(a.reps) || 0))) ? b : a) : null;
    return `<p class="ex-prev">${icon('clock')}<span><b>Vorige keer (${esc(relDay(prev.date))}):</b> ${esc(txt.slice(0, 4).join(' · '))}${txt.length > 4 ? ' …' : ''}${best && num(best.weight) ? ` · beste set ${esc(setText(best, e.kind))}` : ''}</span></p>`;
  }

  // Tijdens de workout: vooral de huidige oefening, set, timer en rust
  function renderActive(w) {
    w.current = clamp(w.current, 0, w.exercises.length - 1);
    const e = w.exercises[w.current], n = w.exercises.length;
    if (e.cur == null) e.cur = Math.max(0, e.sets.findIndex(s => !s.done));
    const kindLabel = { reps: 'Herhalingen', hold: 'Isometrische hold', time: 'Op tijd', distance: 'Afstand' }[e.kind];
    const last = w.current === n - 1;
    const doneSets = e.sets.filter(s => s.done).length;
    main.innerHTML = `
      <header class="sub-head">${iconBtn('back', 'wo-leave', 'Workout verlaten')}
        <div><h1>${esc(woTitle(w))}</h1><p>Oefening ${w.current + 1} van ${n} · ${kindLabel}</p></div>
        <button class="link-btn" style="justify-self:end" data-action="wo-finish">Afronden</button></header>
      <div class="wo-progress">${w.exercises.map((x, i) => `<button class="${i === w.current ? 'cur' : x.sets.every(s => s.done) ? 'done' : ''}" data-action="wo-goto" data-i="${i}" aria-label="Oefening ${i + 1}: ${esc(x.name)}"></button>`).join('')}</div>
      <h2 class="ex-title display">${esc(e.name)}</h2>
      <p class="ex-presc">${esc(e.presc)}</p>
      ${prevLine(e)}
      ${e.cue ? `<p class="ex-cue">${esc(e.cue)}</p>` : ''}
      <div class="mt-12" id="wo-hints">${hintsHtml(e)}</div>
      <section class="editor" id="editor">${editorHtml(e)}</section>
      <details class="fold card" ${S.ui.setsOpen ? 'open' : ''} data-fold="sets">
        <summary>Alle sets van deze oefening <span class="label">${doneSets} van ${e.sets.length}</span></summary>
        <div class="set-lines" id="set-lines">${setLinesHtml(e)}</div>
        <button class="btn ghost sm" data-action="wo-add-set">${icon('plus')} Set toevoegen</button>
      </details>
      <div class="wo-nav">
        <button class="btn lg" data-action="wo-prev" ${w.current === 0 ? 'disabled' : ''}>${icon('chevL')} Vorige</button>
        ${last ? `<button class="btn primary lg" data-action="wo-finish">${icon('check')} Afronden</button>`
          : `<button class="btn primary lg" data-action="wo-next">Volgende ${icon('chevR')}</button>`}
      </div>
      <button class="btn ghost block sm" data-action="rest-start">${icon('timer')} Rusttimer starten (${fmtSec(e.rest)})</button>
    `;
  }

  function curEx() { const w = draft(); return w ? w.exercises[w.current] : null; }
  function refreshSets() {
    const e = curEx(); if (!e) return;
    const lines = $('#set-lines'); if (lines) lines.innerHTML = setLinesHtml(e);
    const hints = $('#wo-hints'); if (hints) hints.innerHTML = hintsHtml(e);
  }

  function onSetInput(inp) {
    const e = curEx(); if (!e) return;
    const s = e.sets[+inp.dataset.set];
    if (!s) return;
    s[inp.dataset.f] = inp.value.trim();
    if (inp.dataset.f === 'pain') inp.closest('.stepper').classList.toggle('hi', overLimit(num(inp.value)));
    refreshSets();
    saveDraft();
  }

  // −/+ knoppen: groot genoeg voor één duim
  function stepField(f, dir) {
    const e = curEx(); if (!e) return;
    const s = e.sets[e.cur];
    const fd = fieldsFor(e).find(x => x.f === f);
    const cur = num(s[f]);
    let v = cur == null ? (fd.start ?? 0) : cur + dir * fd.step;
    v = clamp(Math.round(v * 100) / 100, fd.min, fd.max);
    s[f] = String(v).replace('.', ',');
    const inp = $(`#editor input[data-f="${f}"]`);
    if (inp) inp.value = s[f];
    if (f === 'pain' && inp) inp.closest('.stepper').classList.toggle('hi', overLimit(v));
    refreshSets();
    saveDraft();
  }

  function completeSet() {
    const w = draft(), e = w.exercises[w.current], s = e.sets[e.cur];
    s.done = true;
    if (e.kind === 'reps' && s.reps === '' && e.target) s.reps = String(e.target[0] === e.target[1] ? e.target[0] : e.target[1]);
    if (hasTimer(e) && s.duration === '') s.duration = String(e.duration);
    if (e.kind === 'distance' && s.dist === '') s.dist = String(e.distance);
    // Volgende set alvast invullen met dezelfde waarden (pijn niet: die vul je zelf in)
    const next = e.sets.findIndex(x => !x.done);
    if (next >= 0) {
      const n = e.sets[next];
      ['reps', 'weight'].forEach(f => { if (n[f] === '' && s[f] !== '') n[f] = s[f]; });
      e.cur = next;
    }
    if (!w.exercises.every(x => x.sets.every(y => y.done))) startRest(e.rest);
    if (overLimit(num(s.pain))) toast(`Pijn ${num(s.pain)}/10 is boven je afspraak: maak de volgende set lichter of stop`);
    saveDraft();
    render({ keepScroll: true });
    pulse('#editor');
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
    e.cur = e.sets.findIndex(x => !x.done);
    S.ui.setsOpen = true;
    saveDraft();
    render({ keepScroll: true });
  }

  function gotoExercise(i) {
    const w = draft();
    w.current = clamp(i, 0, w.exercises.length - 1);
    saveDraft();
    render();
  }

  // Een workout verlaten: duidelijk zeggen wat er gebeurt
  function openLeave() {
    const w = draft(); if (!w) return;
    const done = w.exercises.flatMap(x => x.sets).filter(s => s.done).length;
    openSheet(`<div class="sheet-head"><div><h3>Workout verlaten?</h3><p>${esc(woTitle(w))} · ${done} sets gedaan. Wat je ingevuld hebt, blijft bewaard op deze gsm.</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="menu-list">
        <button class="menu-btn" data-action="wo-pause">${icon('clock')}<span><b>Pauzeren, later verder</b><small>Hervat via Home of Workout</small></span></button>
        <button class="menu-btn" data-action="wo-finish">${icon('check')}<span><b>Afronden en opslaan</b><small>Niet afgevinkte sets worden niet bewaard</small></span></button>
      </div>
      <details class="more"><summary>Meer opties</summary>
        <button class="btn danger block" data-action="wo-cancel">${icon('trash')} Stoppen zonder opslaan</button>
      </details>`);
  }

  // Afronden: eerst bevestigen, dan zwaarte en deelname vragen
  async function finishWorkout() {
    const w = draft(); if (!w) return;
    const all = w.exercises.flatMap(x => x.sets);
    const done = all.filter(s => s.done);
    if (!done.length) { if (!await ask('Je hebt nog geen sets afgevinkt. Toch opslaan als uitgevoerde sessie?', { ok: 'Opslaan' })) return; }
    else if (done.length < all.length && !await ask(`${all.length - done.length} van de ${all.length} sets zijn niet afgevinkt. Workout toch afronden?`, { ok: 'Afronden' })) return;
    const mins = Math.max(1, Math.round((Date.now() - w.startedAt) / 60000));
    openSheet(`<form id="finish-form">
      <div class="sheet-head"><div><h3>Workout afronden</h3><p>${esc(woTitle(w))} · ${done.length} sets</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <p class="label">Ervaren zwaarte · 0 = heel licht, 10 = maximaal</p>${pickGroup('rpe', null, 0, 10, null)}
      <p class="label mt-16">Hoe heb je meegedaan?</p>
      <div class="seg">${radio('mode', 'volledig', 'Volledig', done.length < all.length ? 'aangepast' : 'volledig')}${radio('mode', 'aangepast', 'Aangepast', done.length < all.length ? 'aangepast' : 'volledig')}</div>
      <details class="more"><summary>Meer opties</summary>
        <p class="label">Vermoeidheid na afloop · 1 = fris, 5 = erg moe</p>${pickGroup('fatigue', null, 1, 5, null)}
        <label class="field mt-12"><span>Duur (minuten)</span><input class="input" name="minutes" type="number" inputmode="numeric" value="${mins}"></label>
        <label class="field"><span>Notitie</span><textarea class="input" name="note" rows="2"></textarea></label>
      </details>
      <button class="btn accent block lg" type="submit">${icon('check')} Opslaan</button>
    </form>`);
  }

  async function saveFinish(form) {
    const w = draft(); if (!w) return;
    const d = new FormData(form);
    const done = w.exercises.flatMap(x => x.sets).filter(s => s.done);
    const clean = s => ({
      idx: s.idx, side: s.side, label: s.label || null,
      reps: num(s.reps), weight: num(s.weight), duration: num(s.duration), dist: num(s.dist), pain: num(s.pain), done: true
    });
    const rec = {
      date: w.date, sessionKey: w.sessionKey, title: sessionTitle(w.sessionKey), phase: w.phase,
      startedAt: w.startedAt, finishedAt: Date.now(), sample: false, logged: 'full',
      mode: d.get('mode') || 'volledig', rpe: padValue('rpe'), fatigue: padValue('fatigue'),
      durationMin: num(d.get('minutes')), note: (d.get('note') || '').trim(),
      exercises: w.exercises.map(x => ({ exId: x.exId, name: x.name, kind: x.kind, load: x.load, perSide: x.perSide, sets: x.sets.filter(s => s.done).map(clean) })).filter(x => x.sets.length)
    };
    rec.id = await DB.put('workouts', rec);
    S.workouts.push(rec);
    S.ui.summary = { title: woTitle(w), sets: done.length, minutes: woMinutes(rec), rpe: rec.rpe };
    S.settings.activeWorkout = null;
    await saveDraft(true);
    closeSheet();
    stopRest();
    releaseWakeLock();
    S.ui.woView = 'picker';
    render();
    celebrate('Workout opgeslagen', afterText());
    checkMilestones();
  }

  async function cancelWorkout() {
    if (!await ask('Stoppen zonder opslaan? Wat je ingevuld hebt, gaat verloren.', { ok: 'Stoppen', danger: true })) return;
    S.settings.activeWorkout = null;
    await saveDraft(true);
    closeSheet();
    stopRest();
    releaseWakeLock();
    S.ui.woView = 'picker';
    render();
  }

  // Korte, subtiele feedback (respecteert 'minder beweging' via CSS)
  function pulse(sel) {
    const el = $(sel); if (!el) return;
    el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse');
  }
  function celebrate(text, sub = '') {
    document.querySelectorAll('.celebrate').forEach(n => n.remove());
    const el = document.createElement('div');
    el.className = 'celebrate';
    el.setAttribute('role', 'status');
    const line = sub || (Q.after && Q.after.length ? Q.after[Math.floor(Math.random() * Q.after.length)] : '');
    el.innerHTML = `<b>${esc(text)}</b>${line ? `<small>${esc(line)}</small>` : ''}`;
    document.body.appendChild(el);
    signal(1);
    setTimeout(() => el.remove(), 1500);
  }

  /* ---------- Motivatie: eigen korte teksten (quotes.json), zonder toeschrijving ---------- */
  // Ingebouwde reserve als quotes.json (nog) niet geladen is
  const Q = {
    quotes: [
      { text: 'Elke herhaling telt.', context: 'training' },
      { text: 'Herstel is ook training. Alleen stiller.', context: 'herstel' },
      { text: 'Rust is geen pauze van je plan. Het is een deel van je plan.', context: 'rust' },
      { text: 'Ritme verslaat motivatie. Doe vandaag gewoon wat gepland staat.', context: 'mindset' }
    ],
    after: ['Gedaan. Dat is wat telt.', 'Weer een dag volgens plan.']
  };
  const lsJSON = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d; } catch (_) { return d; } };
  const lsPut = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { } };
  function loadQuotes() {
    return fetch('quotes.json').then(r => r.ok ? r.json() : null).then(d => {
      if (d && Array.isArray(d.quotes) && d.quotes.length) { Q.quotes = d.quotes.filter(q => q && q.text); if (Array.isArray(d.after) && d.after.length) Q.after = d.after; }
    }).catch(() => { }).finally(() => {
      Q.loaded = true;
      const card = document.querySelector('.quote-card.daily');
      if (card) card.outerHTML = quoteCard();
    });
  }
  // Waar gaat vandaag over? Match, herstel (lopende blessure), rust of training
  function dayContext() {
    const items = planFor(today());
    if (items.some(it => it.type === 'match')) return 'match';
    if (activeInjuries().length) return 'herstel';
    if (items.every(it => it.type === 'rest')) return 'rust';
    return 'training';
  }
  // Eén tekst per dag; geen van de laatste 10 opnieuw
  function dailyQuote() {
    const tk = dkey(today());
    const cur = lsJSON('comeback-quote', null);
    if (cur && cur.date === tk && cur.text) return cur;
    const hist = lsJSON('comeback-quote-hist', []);
    const ctx = dayContext();
    let pool = Q.quotes.filter(q => (q.context === ctx || q.context === 'mindset') && !hist.includes(q.text));
    if (!pool.length) pool = Q.quotes.filter(q => !hist.slice(-10).includes(q.text));
    if (!pool.length) pool = Q.quotes;
    const q = Q.loaded ? pool[Math.floor(Math.random() * pool.length)] : pool[0];
    const pick = { date: tk, text: q.text, name: q.name || null, context: q.context || 'mindset' };
    // Pas vastleggen als alle teksten geladen zijn
    if (!Q.loaded) return pick;
    lsPut('comeback-quote', pick);
    lsPut('comeback-quote-hist', [...hist.filter(t => t !== q.text), q.text].slice(-10));
    return pick;
  }
  const CTX_LABEL = { herstel: 'Herstel', rust: 'Rust', match: 'Matchdag', training: 'Focus', mindset: 'Mindset' };
  function quoteCard() {
    const q = dailyQuote();
    return `<section class="card quote-card daily" aria-label="Motivatie van de dag">
      <span class="label">${esc(CTX_LABEL[q.context] || 'Mindset')}</span>
      <p class="quote-text">${esc(q.text)}</p>
      <span class="label">${q.name ? esc(q.name) : 'Jouw dagelijkse reminder'}</span>
    </section>`;
  }
  const afterText = () => Q.after[Math.floor(Math.random() * Q.after.length)] || '';

  /* ---------- Laden: alleen tonen als er echt iets geladen wordt ---------- */
  let loadTimer = null;
  function showLoading(text, delay = 350) {
    clearTimeout(loadTimer);
    loadTimer = setTimeout(() => {
      if (document.getElementById('loading')) return;
      const el = document.createElement('div');
      el.id = 'loading';
      el.className = 'loading-screen';
      el.setAttribute('role', 'status');
      el.innerHTML = `<div class="ls-brand"><span class="wordmark">comeback</span></div>
        <div class="ls-bottom"><p>${esc(text)}</p><div class="ls-rail"><i></i></div></div>`;
      document.body.appendChild(el);
    }, delay);
  }
  function hideLoading() { clearTimeout(loadTimer); const el = document.getElementById('loading'); if (el) el.remove(); }

  /* ---------- Rusttimer ---------- */
  const rest = { endAt: 0, total: 0, iv: null };
  function startRest(sec = C.defaultRest) {
    rest.total = sec;
    rest.endAt = Date.now() + sec * 1000;
    const el = $('#rest-timer');
    el.innerHTML = `<div class="rest-inner">
      <div class="rest-txt"><small>Rust</small><strong id="rest-time">${fmtClock(sec)}</strong><div class="rest-bar"><i id="rest-bar"></i></div></div>
      <button class="chip-btn" data-action="rest-adj" data-d="-15">−15</button>
      <button class="chip-btn" data-action="rest-adj" data-d="15">+15</button>
      <button class="chip-btn" data-action="rest-skip">Stop</button>
    </div>`;
    el.hidden = false;
    main.classList.add('resting');
    clearInterval(rest.iv);
    rest.iv = setInterval(tickRest, 250);
    tickRest();
  }
  function tickRest() {
    const rem = rest.endAt - Date.now();
    if (rem <= 0) { stopRest(); signal(2); toast('Rust voorbij: volgende set'); return; }
    const t = $('#rest-time'), bar = $('#rest-bar');
    if (t) t.textContent = fmtClock(Math.ceil(rem / 1000));
    if (bar) bar.style.width = `${100 * (1 - rem / (rest.total * 1000))}%`;
  }
  function stopRest() { clearInterval(rest.iv); rest.iv = null; $('#rest-timer').hidden = true; main.classList.remove('resting'); }

  /* ---------- Hold-timer (isometrisch / op tijd) ---------- */
  let hold = null;
  function startHold(i) {
    const w = draft(), e = w.exercises[w.current], s = e.sets[i];
    const dur = num(s.duration) || e.duration || 45;
    stopRest();
    hold = { i, dur, phase: 'lead', endAt: Date.now() + 3000, startAt: 0, iv: null };
    const ov = document.createElement('div');
    ov.className = 'hold-overlay';
    ov.id = 'hold';
    ov.innerHTML = `
      <p class="hold-label">${esc(e.name)}</p>
      <p class="hold-sub">${esc(setName(s))}${painMax() != null ? ` · jouw afspraak: pijn max ${painMax()}` : ''}</p>
      <div class="hold-center"><div class="hold-time" id="hold-time">00:03</div><div class="hold-phase" id="hold-phase">Klaar maken</div></div>
      <div class="hold-track"><i id="hold-bar"></i></div>
      <div class="hold-meta"><span id="hold-el">00:00</span><span id="hold-tot">${fmtClock(dur)}</span></div>
      <div class="hold-controls">
        <button class="btn" data-action="hold-cancel">${icon('x')}Stoppen</button>
        <button class="btn primary" data-action="hold-done">${icon('check')}Klaar</button>
        <button class="btn" data-action="hold-add">${icon('plus')}10 s</button>
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
      $('#hold-bar').style.width = `${Math.min(100, (now - hold.startAt) / (hold.dur * 10))}%`;
      $('#hold-el').textContent = fmtClock(Math.floor((now - hold.startAt) / 1000));
    }
  }
  function completeHold(seconds) {
    const w = draft(), e = w.exercises[w.current];
    e.cur = hold.i;
    e.sets[hold.i].duration = String(seconds);
    closeHold();
    signal(3);
    completeSet();
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
  const STATS_TABS = [['overzicht', 'Overzicht'], ['herstel', 'Herstel'], ['kracht', 'Kracht'], ['matchen', 'Matchen']];

  function renderStats() {
    const tab = S.ui.statsTab || 'overzicht';
    const body = { overzicht: statsOverview, herstel: statsRecovery, kracht: statsStrength, matchen: statsMatches }[tab]();
    main.innerHTML = `
      <header class="page-head"><div><span class="eyebrow">Het grotere plaatje</span><h1>Jouw vooruitgang.</h1><p>Kleine stappen. Zichtbaar resultaat.</p></div>${iconBtn('back', 'go', 'Terug naar Training', 'data-to="workout"')}</header>
      <div class="seg" role="tablist">${STATS_TABS.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" role="tab" aria-selected="${k === tab}" data-action="stats-tab" data-t="${k}">${l}</button>`).join('')}</div>
      ${body}`;
  }

  function statsOverview() {
    return statsHero() + badgesHtml() + statsOverviewBody();
  }
  // Kerncijfers op een donkere fotokaart: streak, sessies, minuten (30 dagen), matchen
  function statsHero() {
    const s = streakInfo(), since = dkey(addDays(today(), -29));
    const mins = sum(S.workouts.filter(w => w.date >= since).map(woMinutes)) + sum(S.activities.filter(a => a.date >= since).map(a => +a.minutes || 0));
    const matches = S.activities.filter(a => a.type === 'match').length;
    const stats = [[s.days, 'd', 'Streak'], [totalDone(), '', 'Sessies'], [mins, '', 'Min · 30 d'], [matches, '', 'Matchen']];
    return `<section class="stats-hero" aria-label="Kerncijfers">
      <img src="assets/stats.jpg" alt="" class="stats-img" decoding="async" onerror="this.remove()">
      <div class="stats-shade"></div>
      <div class="stats-row">${stats.map(([v, u, l]) => `<div class="stat"><b>${v}${u ? `<span class="unit">${u}</span>` : ''}</b><span>${l}</span></div>`).join('')}</div>
    </section>`;
  }
  function statsOverviewBody() {
    const t = today();
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const ws = addDays(startOfWeek(t), -7 * i), k = dkey(ws);
      weeks.push({ start: ws, key: k, label: `W${isoWeek(ws)}`, value: S.workouts.filter(w => inWeek(w.date, k)).length + S.activities.filter(a => a.type === 'run' && inWeek(a.date, k)).length });
    }
    const sel = clamp(S.ui.statsWeek ?? 7, 0, 7);
    const sw = weeks[sel];
    const ws = weekStats(sw.start);
    const parts = ['kracht', 'herstel', 'training', 'match'];
    const planned = sum(parts.map(p => ws[p][1])), executed = sum(parts.map(p => ws[p][0]));
    const swWorkouts = S.workouts.filter(w => inWeek(w.date, sw.key)), swActs = S.activities.filter(a => inWeek(a.date, sw.key));
    const minutes = sum(swWorkouts.map(woMinutes)) + sum(swActs.map(a => +a.minutes));
    const rpes = [...swWorkouts, ...swActs].map(x => num(x.rpe)).filter(v => v != null);
    const g = goal();
    const all = entries();
    const shown = S.ui.recentAll ? all : all.slice(0, 5);
    return `
      ${g.text || g.evalDate ? `<section class="card"><span class="label">Jouw doel · ${esc(GOAL_LABEL[g.type])}</span><p class="mt-4"><b>${esc(g.text || GOAL_LABEL[g.type])}</b></p>${g.evalDate ? `<p class="status-line">Evaluatie op ${fmtDay(g.evalDate)}. Een evaluatiemoment, geen automatisch oordeel.</p>` : ''}</section>` : ''}
      <section class="card">
        <div class="card-head"><h2>Sessies per week</h2><span class="label">workouts en loopjes</span></div>
        ${Charts.bars(weeks, { selected: sel })}
        <div class="status-grid">
          <div><b>${planned}</b><span>gepland</span></div>
          <div><b>${executed}</b><span>uitgevoerd</span></div>
          <div><b>${ws.adapted}</b><span>aangepast</span></div>
          <div><b>${ws.skipped}</b><span>overgeslagen</span></div>
          <div><b>${ws.missed}</b><span>gemist</span></div>
        </div>
        <p class="status-line">Week van ${fmtShort(sw.start)}: ${minutes} minuten training${rpes.length ? `, gemiddelde zwaarte ${fmtNum(Math.round(sum(rpes) / rpes.length * 10) / 10)}/10` : ''}${ws.quick ? `, ${ws.quick} zonder details` : ''}.</p>
      </section>
      <div class="section"><span>Recent</span><span>${all.length}</span></div>
      <section class="card">${recentRows(shown)}
        ${all.length > 5 ? `<button class="btn block sm mt-12" data-action="recent-all">${S.ui.recentAll ? 'Minder tonen' : `Alles tonen (${all.length})`}</button>` : ''}
      </section>`;
  }

  // Herstel: metingen per traject, naast trainingsduur en ervaren zwaarte
  function statsRecovery() {
    const list = injuries().slice().sort((a, b) => (a.status === 'afgerond') - (b.status === 'afgerond') || String(b.start).localeCompare(String(a.start)));
    const t = today(), range = S.ui.lineRange || 30;
    const labels = [], days = [];
    for (let i = range - 1; i >= 0; i--) { const d = addDays(t, -i); labels.push(fmtShort(d)); days.push(dkey(d)); }
    // Belasting per dag: minuten en zwaarte
    const load = days.map(k => {
      const ws = workoutsOn(k), as = activitiesOn(k);
      const rp = [...ws, ...as].map(x => num(x.rpe)).filter(v => v != null);
      return { k, min: sum(ws.map(woMinutes)) + sum(as.map(a => +a.minutes)), rpe: rp.length ? Math.max(...rp) : null };
    });
    const loadBars = Charts.bars(load.map((l, i) => ({ label: i % Math.ceil(range / 6) === 0 ? labels[i] : '', value: l.min })), { selected: -1, action: null, height: 120 });
    const rpeLine = load.some(l => l.rpe != null) ? Charts.line({ labels, series: [{ color: 'var(--ink)', values: load.map(l => l.rpe) }], step: false, height: 120, ticks: [0, 5, 10] }) : '';
    const rangeSeg = `<div class="seg" style="margin:0;padding:0">${[14, 30, 90].map(r => `<button class="${r === range ? 'on' : ''}" style="padding:8px 8px" data-action="line-range" data-r="${r}">${r} d</button>`).join('')}</div>`;
    const loadCard = `<section class="card">
        <div class="card-head"><h2>Belasting</h2>${rangeSeg}</div>
        <p class="label">Minuten training per dag</p>${loadBars}
        ${rpeLine ? `<p class="label mt-12">Ervaren zwaarte (0–10)</p>${rpeLine}` : '<p class="empty">Nog geen zwaarte ingevuld in deze periode.</p>'}
      </section>`;
    if (!list.length) return `<section class="card"><p class="empty">Geen hersteltraject. Je trainingsbelasting staat hieronder.</p></section>${loadCard}`;
    const inj = injuryById(S.ui.statsInjury) || list[0];
    const sides = injurySides(inj);
    const colors = { L: 'var(--accent)', R: 'var(--ink)', X: 'var(--accent)' };
    const seriesFor = kind => sides.map(s => ({ color: colors[s], values: days.map(k => checkVal(checkFor(k), inj.id, kind, s)) }));
    const legend = sides.length > 1 ? `<div class="legend-line"><span><i style="background:var(--accent)"></i>Links</span><span><i style="background:var(--ink)"></i>Rechts</span></div>` : '';
    const stiff = seriesFor('stiff'), pain = seriesFor('pain');
    const has = arr => arr.some(s => s.values.some(v => v != null));
    const lim = num(inj.painLimit);
    return `
      ${list.length > 1 ? `<div class="chips mb-12">${list.map(i => `<button class="loc-chip ${i.id === inj.id ? 'on' : ''}" data-action="stats-inj" data-id="${i.id}">${esc(injuryLabel(i))}${i.status === 'afgerond' ? ' · afgerond' : ''}</button>`).join('')}</div>` : ''}
      <section class="card">
        <div class="card-head"><h2>${esc(injuryLabel(inj))}</h2><span class="tag ${inj.status === 'afgerond' ? '' : 'adapted'}">${STATUS_LABEL[inj.status]}</span></div>
        <p class="label">Stijfheid bij het opstaan (0–10)</p>
        ${has(stiff) ? Charts.line({ labels, series: stiff, step: true, height: 150 }) + legend : '<p class="empty">Nog geen metingen in deze periode.</p>'}
        <p class="label mt-12">Pijn (0–10)${lim != null ? ` · lijn op ${lim} = jouw afspraak` : ''}</p>
        ${has(pain) ? Charts.line({ labels, series: pain, step: true, height: 150, ticks: lim != null ? [0, lim, 10] : [0, 5, 10], warnAbove: lim }) + legend : '<p class="empty">Nog geen pijnscores in deze periode.</p>'}
      </section>
      ${loadCard}`;
  }

  function statsStrength() {
    const exWithWeight = {};
    S.workouts.forEach(w => (w.exercises || []).forEach(e => {
      if (e.sets.some(s => num(s.weight) > 0)) exWithWeight[e.exId] = (C.exercises[e.exId] && C.exercises[e.exId].name) || e.name;
    }));
    const exIds = Object.keys(exWithWeight);
    if (!exIds.includes(S.ui.weightEx)) S.ui.weightEx = exIds[0] || null;
    if (!S.ui.weightEx) return `<section class="card"><p class="empty">Nog geen gewichten gelogd. Na je eerste krachtsessie zie je hier je progressie.</p></section>`;
    const pts = S.workouts
      .map(w => { const e = (w.exercises || []).find(x => x.exId === S.ui.weightEx); if (!e) return null; const ws = e.sets.map(s => num(s.weight)).filter(v => v > 0); return ws.length ? { date: w.date, ts: w.finishedAt || 0, v: Math.max(...ws) } : null; })
      .filter(Boolean).sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts).slice(-20);
    const vals = pts.map(p => p.v);
    const lo = Math.max(0, Math.floor((Math.min(...vals) - 2) / 5) * 5), hi = Math.ceil((Math.max(...vals) + 2) / 5) * 5;
    const diff = vals[vals.length - 1] - vals[0];
    const sessions30 = S.workouts.filter(w => daysBetween(parseKey(w.date), today()) < 30 && C.sessions[w.sessionKey] && !C.sessions[w.sessionKey].program).length;
    return `
      <div class="tiles">
        <div class="tile"><span class="label">Krachtsessies, 30 dagen</span><div class="num">${sessions30}</div></div>
        <div class="tile"><span class="label">Verschil sinds start</span><div class="num ${diff > 0 ? 'accent' : ''}">${diff > 0 ? '+' : ''}${fmtNum(diff)}<span class="unit">kg</span></div></div>
      </div>
      <section class="card">
        <div class="card-head"><h2>Gewicht per oefening</h2><span class="label">zwaarste set</span></div>
        <select class="select" data-change="weight-ex" aria-label="Kies oefening">${exIds.map(id => `<option value="${id}" ${id === S.ui.weightEx ? 'selected' : ''}>${esc(exWithWeight[id])}</option>`).join('')}</select>
        <div class="recovery-nums mb-12">
          <div class="num md">${fmtNum(vals[vals.length - 1])}<span class="unit">kg nu</span></div>
          <div class="num md" style="color:var(--muted)">${fmtNum(vals[0])}<span class="unit">kg start</span></div>
        </div>
        ${Charts.line({ labels: pts.map(p => fmtShort(p.date)), series: [{ color: 'var(--accent)', values: vals }], yMin: lo, yMax: hi, ticks: [lo, Math.round((lo + hi) / 2), hi] })}
      </section>`;
  }

  function statsMatches() {
    const fx = fixtures();
    const matches = S.activities.filter(a => a.type === 'match');
    const span = fixtureSpan();
    const season = span ? matches.filter(a => a.date >= span.first && a.date <= span.last) : matches;
    const total = sum(season.map(a => +a.minutes));
    const playedFx = fx.filter(played).reverse();
    const rows = playedFx.slice(0, S.ui.matchesAll ? 99 : 6).map(f => {
      const a = matches.find(m => m.date === f.date);
      return `<div class="list-row tap" data-action="cal-open" data-k="${f.date}">
        <div class="ico">${icon('ball')}</div>
        <div class="body"><b>${esc(f.opponent)}</b><span>${cap(fmtDay(f.date))} · ${f.home ? 'thuis' : 'uit'} · ${a ? `${a.minutes} min${a.participation && a.participation !== 'volledig' ? ' · ' + a.participation : ''}` : 'geen minuten ingevuld'}</span></div>
        <div class="end"><span class="tag ${fixtureResult(f) === 'win' ? 'done' : ''}">${f.gf}–${f.ga}</span></div>
      </div>`;
    }).join('');
    return `
      <div class="tiles">
        <div class="tile"><span class="label">Mijn minuten dit seizoen</span><div class="num">${total}</div><p>in ${season.length} matchen</p></div>
        <div class="tile"><span class="label">Gemiddeld per match</span><div class="num">${season.length ? Math.round(total / season.length) : 0}<span class="unit">min</span></div></div>
      </div>
      <section class="card">
        <div class="card-head"><h2>Uitslagen ${esc(C.rbfa.teamLabel)}</h2><button class="link-btn" data-action="go" data-to="matchen">Beheren ${icon('chevR')}</button></div>
        ${rows || `<p class="empty">Nog geen gespeelde matchen. Importeer de RBFA-kalender of voeg matchen toe.</p>`}
        ${playedFx.length > 6 ? `<button class="btn block sm mt-12" data-action="matches-all">${S.ui.matchesAll ? 'Minder tonen' : `Alles tonen (${playedFx.length})`}</button>` : ''}
      </section>`;
  }

  function entries() {
    const list = [];
    S.workouts.forEach(w => {
      const st = recStatus({ store: 'workouts', r: w });
      list.push({
        store: 'workouts', id: w.id, date: w.date, ts: w.finishedAt || 0, icon: (C.sessions[w.sessionKey] || {}).icon || 'dumbbell',
        title: woTitle(w), sub: `${cap(relDay(w.date))} · ${st.label} · ${recordLine({ store: 'workouts', r: w })}`, sample: w.sample
      });
    });
    S.activities.forEach(a => list.push({
      store: 'activities', id: a.id, date: a.date, ts: a.createdAt || 0, icon: actIcon(a), type: a.type,
      title: actTitle(a),
      sub: `${cap(relDay(a.date))} · ${recStatus({ store: 'activities', r: a }).label} · ${recordLine({ store: 'activities', r: a })}`, sample: a.sample
    }));
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
  }

  // Recent: tikken opent het detail; verwijderen zit in een secundair menu
  function recentRows(list) {
    if (!list.length) return `<p class="empty">Nog niets gelogd.</p>`;
    return list.map(x => `<button class="list-row tap row-btn" data-action="show-entry" data-store="${x.store}" data-id="${x.id}">
      <span class="ico">${icon(x.icon)}</span>
      <span class="body"><b>${esc(x.title)}${x.sample ? '<span class="sample-tag">voorbeeld</span>' : ''}</b><span>${esc(x.sub)}</span></span>
      <span class="end">${icon('chevR')}</span>
    </button>`).join('');
  }

  // Pijn achteraf: per traject, of de oude enkele score
  function painText(a) {
    if (a.pains && Object.keys(a.pains).length) return Object.entries(a.pains).map(([id, v]) => `${injuryLabel(injuryById(id)) || 'Klacht'} ${v}/10`).join(' · ');
    return a.pain != null ? `${a.pain}/10` : 'niet ingevuld';
  }

  function showEntry(store, id) {
    const rec = S[store].find(x => x.id === id);
    if (!rec) return;
    const st = recStatus({ store, r: rec });
    const menu = `<details class="more"><summary>Meer opties</summary>
        <button class="btn danger block" data-action="del-entry" data-store="${store}" data-id="${rec.id}">${icon('trash')} Verwijderen</button></details>`;
    if (store === 'activities' && rec.type === 'run') {
      openSheet(`<div class="sheet-head"><div><h3>${esc(actTitle(rec))}</h3><p>${cap(fmtDay(rec.date))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
        <div class="run-stats"><div><b>${fmtNum(rec.distanceKm || 0)}</b><span>km</span></div><div><b>${paceText(rec.distanceKm, rec.minutes)}</b><span>min/km</span></div><div><b>${fmtNum(rec.minutes)}</b><span>min</span></div></div>
        <div class="chips">${rec.surface ? `<span class="chip">${esc(RUN_SURF[rec.surface] || rec.surface)}</span>` : ''}${rec.rpe != null ? `<span class="chip">Zwaarte ${rec.rpe}/10</span>` : ''}</div>
        ${rec.note ? `<p class="small mt-12">${esc(rec.note)}</p>` : ''}
        <button class="btn primary block lg mt-16" data-action="edit-entry" data-store="activities" data-id="${rec.id}">${icon('edit')} Bewerken</button>
        ${menu}`);
      return;
    }
    if (store === 'activities') {
      openSheet(`<div class="sheet-head"><div><h3>${esc(actTitle(rec))}</h3><p>${cap(fmtDay(rec.date))} · ${esc(st.label)}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
        <div class="num" style="margin-bottom:16px">${rec.minutes}<span class="unit">min${rec.plannedMinutes && rec.plannedMinutes !== rec.minutes ? ` van ${rec.plannedMinutes} gepland` : ''}</span></div>
        <div class="chips">${rec.score ? `<span class="chip">${esc(rec.score)}</span>` : ''}${rec.role ? `<span class="chip">${esc(rec.role)}</span>` : ''}${rec.rpe != null ? `<span class="chip">Zwaarte ${rec.rpe}/10</span>` : ''}${rec.fatigue != null ? `<span class="chip">Vermoeidheid ${rec.fatigue}/5</span>` : ''}<span class="chip">${esc(rec.surface || '')}</span><span class="chip">${esc(rec.shoes || '')}</span><span class="chip">Pijn achteraf: ${esc(painText(rec))}</span>${rec.source === 'rbfa' ? '<span class="chip">via RBFA</span>' : ''}</div>
        ${rec.note ? `<p class="small mt-12">${esc(rec.note)}</p>` : ''}
        <button class="btn primary block lg mt-16" data-action="edit-entry" data-store="activities" data-id="${rec.id}">${icon('edit')} Bewerken</button>
        ${menu}`);
      return;
    }
    openSheet(`<div class="sheet-head"><div><h3>${esc(woTitle(rec))}</h3><p>${cap(fmtDay(rec.date))} · ${esc(st.label)} · ${esc(recordLine({ store, r: rec }))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${(rec.adaptations || []).length ? `<div class="chips mb-8">${rec.adaptations.map(a => `<span class="chip">${esc(a)}</span>`).join('')}</div>` : ''}
      ${(rec.exercises || []).map(e => `<div class="list-row"><div class="body"><b>${esc(e.name)}</b><span>${e.sets.map(s => `${s.side ? s.side + ' ' : ''}${setText(s, e.kind) || '–'}${s.pain != null ? ` (pijn ${s.pain})` : ''}`).join(' · ')}</span></div></div>`).join('') || `<p class="empty">${rec.quick || rec.logged === 'quick' ? 'Uitgevoerd zonder details: geen sets ingevuld.' : 'Geen sets gelogd.'}</p>`}
      ${rec.note ? `<p class="small mt-8">${esc(rec.note)}</p>` : ''}
      <button class="btn primary block lg mt-12" data-action="edit-entry" data-store="workouts" data-id="${rec.id}">${icon('edit')} Bewerken</button>
      ${menu}`);
  }

  // Een workout achteraf bewerken: datum, zwaarte, deelname, duur, notitie en de sets
  function openWorkoutEdit(id) {
    const w = S.workouts.find(x => x.id === id); if (!w) return;
    const inp = (ei, si, f, v, ph) => `<input class="mini-in" inputmode="decimal" data-we="${ei}|${si}|${f}" value="${v == null ? '' : String(v).replace('.', ',')}" placeholder="${ph}" aria-label="${ph}">`;
    openSheet(`<form id="wedit-form" data-id="${w.id}">
      <div class="sheet-head"><div><h3>Workout bewerken</h3><p>${esc(woTitle(w))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="form-grid">
        <label class="field"><span>Datum</span><input class="input" type="date" name="date" value="${w.date}" max="${dkey(today())}"></label>
        <label class="field"><span>Duur (min)</span><input class="input" name="minutes" type="number" inputmode="numeric" value="${woMinutes(w)}"></label>
      </div>
      <div class="seg">${radio('mode', 'volledig', 'Volledig', w.mode === 'aangepast' ? 'aangepast' : 'volledig')}${radio('mode', 'aangepast', 'Aangepast', w.mode === 'aangepast' ? 'aangepast' : 'volledig')}</div>
      <div id="wedit-adapt" ${w.mode === 'aangepast' ? '' : 'hidden'}>
        <p class="label">Wat deed je anders?</p>
        <div class="chip-pick">${ADAPT_OPTS.map(t => `<label><input type="checkbox" name="adapt" value="${t}" ${(w.adaptations || []).includes(t) ? 'checked' : ''}><span>${t}</span></label>`).join('')}</div>
      </div>
      <p class="label">Ervaren zwaarte (0–10)</p>${pickGroup('rpe', w.rpe ?? null, 0, 10, null)}
      ${(w.exercises || []).map((e, ei) => `<div class="wedit-ex"><b>${esc(e.name)}</b>${e.sets.map((s, si) => `<div class="wedit-set"><span>${s.side ? s.side : ''} ${si + 1}</span>
        ${e.kind === 'reps' ? inp(ei, si, 'reps', s.reps, 'herh.') : e.kind === 'distance' ? inp(ei, si, 'dist', s.dist, 'meter') : inp(ei, si, 'duration', s.duration, 'sec')}
        ${inp(ei, si, 'weight', s.weight, 'kg')}${inp(ei, si, 'pain', s.pain, 'pijn')}</div>`).join('')}</div>`).join('')}
      <label class="field mt-12"><span>Notitie</span><textarea class="input" name="note" rows="2">${esc(w.note || '')}</textarea></label>
      <button class="btn accent block lg" type="submit">${icon('check')} Wijzigingen opslaan</button>
    </form>`);
  }

  async function saveWorkoutEdit(form) {
    const w = S.workouts.find(x => x.id === +form.dataset.id); if (!w) return;
    const d = new FormData(form);
    const upd = clone(w);
    upd.date = d.get('date') || w.date;
    upd.durationMin = num(d.get('minutes'));
    upd.mode = d.get('mode');
    upd.adaptations = upd.mode === 'aangepast' ? d.getAll('adapt') : [];
    upd.rpe = padValue('rpe');
    upd.note = (d.get('note') || '').trim();
    form.querySelectorAll('[data-we]').forEach(i => { const [ei, si, f] = i.dataset.we.split('|'); upd.exercises[ei].sets[si][f] = num(i.value); });
    await DB.put('workouts', upd);
    S.workouts = S.workouts.map(x => x.id === upd.id ? upd : x);
    closeSheet();
    render({ keepScroll: true });
    toast('Wijzigingen opgeslagen');
  }

  // Verwijderen met bevestiging én ongedaan maken
  async function deleteEntry(store, id) {
    const rec = S[store].find(x => x.id === id);
    if (!rec || !await ask('Deze registratie verwijderen? Je kunt het nog even ongedaan maken.', { ok: 'Verwijderen', danger: true })) return;
    closeSheet();
    await DB.del(store, id);
    S[store] = S[store].filter(x => x.id !== id);
    S.ui.undoRec = { store, rec };
    render({ keepScroll: true });
    toast('Verwijderd', { action: 'undo-del', label: 'Ongedaan' });
  }

  /* ================= Account ================= */
  function renderAccount() {
    const p = profile(), g = goal();
    const fx = fixtures();
    const theme = themePref();
    const sampleCount = ['checks', 'workouts', 'activities'].reduce((n, s) => n + (S.raw[s] || []).filter(x => x.sample).length, 0);
    const field = (name, label, value, attrs = '') => `<label class="field"><span>${label}</span><input class="input" data-change="profile" name="${name}" value="${esc(value ?? '')}" ${attrs}></label>`;
    const list = injuries().slice().sort((a, b) => (a.status === 'afgerond') - (b.status === 'afgerond') || String(b.start).localeCompare(String(a.start)));
    const act = activeInjuries();
    const lastExp = S.settings.lastExport;

    main.innerHTML = `
      ${subHead('Account', 'vandaag')}
      <section class="card">
        <div class="profile-top">
          <button class="photo-btn" data-action="pick-photo" aria-label="Profielfoto kiezen"><span class="avatar lg">${avatarInner()}</span><em>${icon('camera')}</em></button>
          <div><b>${esc(p.name)}</b><span class="muted small">${esc(p.position)} · ${esc(p.team)}</span>
            ${S.settings.photo ? `<button class="link-btn" style="display:block" data-action="remove-photo">Foto verwijderen</button>` : ''}</div>
        </div>
        <input type="file" id="photo-file" accept="image/*" hidden data-change="photo">
        <div class="form-grid">
          <div class="full">${field('name', 'Naam', p.name, 'autocomplete="name"')}</div>
          ${field('age', 'Leeftijd', p.age, 'inputmode="numeric"')}
          ${field('position', 'Positie', p.position)}
          ${field('height', 'Lengte (cm)', p.height, 'inputmode="numeric"')}
          ${field('weight', 'Gewicht (kg)', fmtNum(num(p.weight)), 'inputmode="decimal"')}
          <div class="full">${field('team', 'Ploeg', p.team)}</div>
          <div class="full">${field('rbfaName', 'Naam op het wedstrijdblad', p.rbfaName)}</div>
        </div>
        <p class="saved-note">Wijzigingen worden meteen bewaard.</p>
      </section>

      <div class="section"><span>Doel</span></div>
      <section class="card">
        <div class="seg" role="radiogroup" aria-label="Doel">${Object.entries(GOAL_LABEL).map(([v, l]) => `<label><input type="radio" name="goaltype" value="${v}" data-change="goal-type" ${g.type === v ? 'checked' : ''}><span>${v === 'conditie' ? 'Conditie' : l}</span></label>`).join('')}</div>
        <label class="field"><span>Persoonlijk doel (optioneel)</span><input class="input" data-change="goal" name="text" value="${esc(g.text)}" placeholder="Bv. weer 90 minuten spelen"></label>
        <label class="field"><span>Evaluatiedatum (optioneel)</span><input class="input" type="date" data-change="goal" name="evalDate" value="${esc(g.evalDate)}"></label>
        <p class="label">Een evaluatiedatum is een moment om te bekijken waar je staat, geen automatisch oordeel.</p>
      </section>

      <div class="section"><span>Blessures</span></div>
      <section class="card">
        <button class="list-row tap row-btn" data-action="go" data-to="blessures"><span class="ico">${icon('heart')}</span><span class="body"><b>Blessures en herstelplannen</b><span>${act.length ? `${act.length} actief: ${esc(act.map(injuryLabel).join(', '))}` : 'Geen actieve blessure'}</span></span><span class="end">${icon('chevR')}</span></button>
      </section>

      <div class="section"><span>Planning</span></div>
      <section class="card">
        <label class="switch-row"><span><b>Waarschuwing bij zware belasting</b><small>Bij 3 zware dagen op rij of een zware sessie de dag voor een match. Een hulp, geen regel.</small></span>
          <input type="checkbox" class="switch" data-change="load-warn" ${S.settings.loadWarn === false ? '' : 'checked'}></label>
      </section>

      <div class="section"><span>Weergave</span></div>
      <div class="seg" role="radiogroup" aria-label="Thema">
        ${[['auto', 'Automatisch'], ['light', 'Licht'], ['dark', 'Donker']].map(([v, l]) => `<label><input type="radio" name="theme" value="${v}" data-change="theme" ${theme === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
      </div>

      <div class="section"><span>Matchen</span></div>
      <section class="card">
        <button class="list-row tap row-btn" data-action="go" data-to="matchen"><span class="ico">${icon('list')}</span><span class="body"><b>Matchen beheren</b><span>${fx.length ? `${fx.length} matchen · datum, uur, tegenstander en uitslag aanpassen` : 'Nog geen matchen. Importeer of voeg toe.'}</span></span><span class="end">${icon('chevR')}</span></button>
        <button class="list-row tap row-btn" data-action="open-rbfa"><span class="ico">${icon('download')}</span><span class="body"><b>RBFA-kalender importeren</b><span>${S.settings.fixturesAt ? `Laatst bijgewerkt ${relDay(dkey(new Date(S.settings.fixturesAt)))}` : `Alle matchen van ${esc(C.rbfa.teamLabel)} in één keer`}</span></span><span class="end">${icon('chevR')}</span></button>
        <button class="list-row tap row-btn" data-action="open-minutes"><span class="ico">${icon('clock')}</span><span class="body"><b>Mijn minuten van een match</b><span>Van het wedstrijdblad op rbfa.be</span></span><span class="end">${icon('chevR')}</span></button>
      </section>

      <div class="section"><span>Account & synchronisatie</span></div>
      <section class="card">${syncCardHtml()}</section>

      <div class="section"><span>Gegevens</span></div>
      <section class="card">
        <p class="small ${lastExp ? 'muted' : 'warn-text'} mb-12">${lastExp ? `Laatste back-up: ${fmtFull(dkey(new Date(lastExp)))} om ${fmtTime(lastExp)}.` : 'Nog geen back-up gemaakt.'} ${Sync.user() ? 'Een back-up is een JSON-bestand met al je gegevens.' : 'Je gegevens staan alleen op deze gsm.'}</p>
        <div class="row"><button class="btn primary" data-action="export">${icon('download')} Back-up maken</button><button class="btn" data-action="import">${icon('upload')} Terugzetten</button></div>
        <input type="file" id="import-file" accept="application/json,.json" hidden data-change="import">
        <div class="divider"></div>
        <label class="switch-row"><span><b>Demostand</b><small>Toont voorbeelddata in planning en statistieken. Je eigen registraties blijven apart en worden nooit gewist.</small></span>
          <input type="checkbox" class="switch" data-change="demo" ${S.settings.demo ? 'checked' : ''}></label>
        ${sampleCount ? `<button class="btn block mt-12" data-action="clear-sample">${icon('trash')} Voorbeelddata wissen (${sampleCount})</button>` : ''}
        <details class="more"><summary>Meer opties</summary>
          <button class="btn danger block" data-action="clear-all">Alles wissen</button>
        </details>
      </section>

      <p class="footer-note">${esc(C.appName)} v${APP_VERSION} · werkt offline · jouw data blijft van jou<br>Foto: John Money via Unsplash</p>
    `;
  }

  async function saveProfileField(el) {
    const p = { ...profile() };
    let v = el.value.trim();
    if (['age', 'height'].includes(el.name)) v = num(v) ?? '';
    if (el.name === 'weight') v = num(v) ?? '';
    if (el.name === 'name' && !v) v = C.profile.name;
    if (el.name === 'rbfaName' && !v) v = C.rbfa.player;
    p[el.name] = v;
    await setSetting('profile', p);
    toast('Opgeslagen');
    if (el.name === 'name') { const a = $('.profile-top b'); if (a) a.textContent = v; }
  }

  // Profielfoto: verkleind tot 320 px en lokaal bewaard
  function savePhoto(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = async () => {
        const size = 320, c = document.createElement('canvas');
        c.width = c.height = size;
        const s = Math.min(img.width, img.height);
        c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        await setSetting('photo', c.toDataURL('image/jpeg', 0.85));
        render({ keepScroll: true });
        toast('Profielfoto bewaard');
      };
      img.onerror = () => toast('Deze afbeelding kan niet gelezen worden');
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- Hersteltraject ---------- */
  async function updateInjury(id, fn) {
    const list = clone(injuries());
    const i = list.find(x => x.id === id); if (!i) return;
    fn(i);
    await setSetting('injuries', list);
  }

  // Nieuwe blessure: korte sheet met het belangrijkste, de rest vul je later aan
  function openNewInjury() {
    S.ui.newInj = { location: '', side: 'nvt', status: 'actief' };
    renderNewInjury();
  }
  function renderNewInjury() {
    const n = S.ui.newInj;
    const progFree = !injuries().some(i => i.program === 'kuitpees' && i.status !== 'afgerond');
    openSheet(`<form id="inj-form">
      <div class="sheet-head"><div><span class="eyebrow">Nieuwe blessure</span><h3>Wat is er aan de hand?</h3><p>Je vorige blessures en metingen blijven apart bewaard.</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <p class="field-label">Plaats</p>
      <div class="type-chips">${Object.entries(LOC_LABEL).map(([v, l]) => `<button type="button" class="tchip ${n.location === v ? 'on' : ''}" data-action="ni-pick" data-f="location" data-v="${v}" aria-pressed="${n.location === v}">${l}</button>`).join('')}</div>
      <p class="field-label">Kant</p>
      <div class="seg">${Object.entries({ links: 'Links', rechts: 'Rechts', beide: 'Beide', nvt: 'N.v.t.' }).map(([v, l]) => `<button type="button" class="${n.side === v ? 'on' : ''}" data-action="ni-pick" data-f="side" data-v="${v}" aria-pressed="${n.side === v}">${l}</button>`).join('')}</div>
      <p class="field-label">Status</p>
      <div class="seg">${[['actief', 'Actief'], ['opbouw', 'In opbouw']].map(([v, l]) => `<button type="button" class="${n.status === v ? 'on' : ''}" data-action="ni-pick" data-f="status" data-v="${v}" aria-pressed="${n.status === v}">${l}</button>`).join('')}</div>
      <div class="form-grid">
        <label class="field"><span>Sinds</span><input class="input" type="date" name="start" value="${dkey(today())}" max="${dkey(today())}"></label>
        <label class="field"><span>Max pijn (0–10)</span><input class="input" name="painLimit" inputmode="numeric" placeholder="Optioneel"></label>
      </div>
      <label class="field"><span>Naam (optioneel)</span><input class="input" name="label" maxlength="40" placeholder="${esc(LOC_LABEL[n.location] || 'Bv. Rechterkuit')}"></label>
      <label class="field"><span>Afspraak met je kinesist (optioneel)</span><input class="input" name="agreement" maxlength="160" placeholder="Bv. 2 weken geen sprints"></label>
      ${progFree && ['kuit', 'achillespees'].includes(n.location) ? `<label class="check"><input type="checkbox" name="program"><span class="box">${icon('check')}</span><span class="t">Kuit- en peesprogramma uit je schema gebruiken<small>Holds, kuitkracht en veerkracht in fases, zoals in je oorspronkelijke plan</small></span></label>` : ''}
      <button class="btn accent block lg" type="submit">${icon('check')} Blessure toevoegen</button>
      <p class="label mt-12">Een grens of datum is een persoonlijke afspraak, geen medische regel of vrijgave.</p>
    </form>`);
  }
  async function saveNewInjury(form) {
    const n = S.ui.newInj, f = new FormData(form);
    if (!n.location) { toast('Kies eerst waar de blessure zit'); return; }
    const start = f.get('start') || dkey(today());
    const lim = num(f.get('painLimit'));
    const agr = (f.get('agreement') || '').trim();
    const inj = {
      id: 'inj' + newId(), location: n.location, label: (f.get('label') || '').trim(), side: n.side, status: n.status, start, end: null, notes: '',
      program: f.get('program') ? 'kuitpees' : null, painLimit: lim == null ? null : clamp(Math.round(lim), 0, 10),
      agreements: agr ? [{ id: newId(), date: dkey(today()), text: agr }] : [], evals: [], checklist: [], maintenance: [], linked: [], schedule: []
    };
    await setSetting('injuries', [...injuries(), inj]);
    if (inj.program) { await setSetting('phase', C.phases[0].id); await setSetting('phaseSince', start); }
    closeSheet();
    S.ui.injuryId = inj.id;
    go('blessure');
    toast(`${injuryLabel(inj)} toegevoegd. Vul je pijn dagelijks in op Vandaag.`);
  }

  // Herstelplan van een blessure: workouts die je wekelijks of eenmalig inplant
  const WD_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const daysText = days => days && days.length ? WD_ORDER.filter(d => days.includes(d)).map(d => DAY_S[d]).join(' · ') : 'niet wekelijks ingepland';
  function rehabPlanHtml(inj) {
    const done = inj.status === 'afgerond';
    const linked = (inj.linked || []).filter(id => C.sessions[id]);
    const sch = id => (inj.schedule || []).find(s => s.id === id);
    const others = Object.keys(C.sessions).filter(id => C.sessions[id].custom && !linked.includes(id));
    return `<p class="small muted mb-8">${done
        ? 'Wat je als onderhoud houdt, blijft in je planning staan. De rest verdwijnt, je geschiedenis niet.'
        : 'Stel je oefeningen samen zoals je kinesist ze voorschrijft en plan ze in. De app schrijft zelf geen behandeling voor.'}</p>
      ${linked.map(id => {
        const s = sch(id), keep = (inj.maintenance || []).includes(id);
        return `<div class="list-row"><div class="ico">${icon('heart')}</div>
          <div class="body"><b>${esc(sessionTitle(id))}</b><span>${esc(sessionDesc(id))}</span><span>${done ? (keep ? `Onderhoud · ${daysText(s && s.days)}` : 'Niet meer ingepland') : esc(daysText(s && s.days))}</span></div>
          <div class="end"><button class="btn sm" data-action="rehab-plan" data-id="${id}">${icon('calendar')} Inplannen</button></div></div>`;
      }).join('') || `<p class="empty">Nog geen herstelplan.</p>`}
      <div class="row mt-12"><button class="btn" data-action="rehab-new">${icon('plus')} Oefeningen samenstellen</button></div>
      ${others.length ? `<details class="more"><summary>Bestaande workout koppelen</summary>
        ${others.map(id => `<label class="check"><input type="checkbox" data-change="inj-link" value="${id}"><span class="box">${icon('check')}</span><span class="t">${esc(sessionTitle(id))}<small>${esc(sessionDesc(id))}</small></span></label>`).join('')}</details>` : ''}`;
  }

  function openRehabPlan(id) {
    const inj = injuryById(S.ui.injuryId); if (!inj || !C.sessions[id]) return;
    const s = (inj.schedule || []).find(x => x.id === id) || { days: [] };
    S.ui.rehabDays = [...(s.days || [])];
    const keep = (inj.maintenance || []).includes(id);
    openSheet(`<div class="sheet-head"><div><span class="eyebrow">Herstelplan · ${esc(injuryLabel(inj))}</span><h3>${esc(sessionTitle(id))}</h3><p>${esc(sessionDesc(id))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <p class="field-label">Elke week op</p>
      <div class="wd-pick" id="wd-pick">${WD_ORDER.map(d => `<button type="button" class="tchip ${S.ui.rehabDays.includes(d) ? 'on' : ''}" data-action="wd-toggle" data-d="${d}" aria-pressed="${S.ui.rehabDays.includes(d)}" aria-label="${DAY[d]}">${cap(DAY_S[d])}</button>`).join('')}</div>
      <p class="label" style="margin:0 0 12px">Verschijnt als voorstel in je planning zolang de blessure loopt, vanaf vandaag. Verplaatsen of overslaan kan per dag.</p>
      <label class="check ${keep ? 'on' : ''}"><input type="checkbox" id="rehab-keep" ${keep ? 'checked' : ''}><span class="box">${icon('check')}</span><span class="t">Als onderhoud houden na herstel<small>Blijft ingepland als je de blessure afrondt</small></span></label>
      <button class="btn accent block lg" data-action="rehab-save" data-id="${id}">${icon('check')} Bewaren</button>
      <p class="field-label mt-20">Of één keer</p>
      <div class="add-row two"><input class="input" type="date" id="rehab-date" value="${dkey(today())}" aria-label="Datum"><button class="btn" data-action="rehab-once" data-id="${id}">${icon('plus')} Inplannen</button></div>
      <details class="more"><summary>Meer opties</summary>
        <div class="menu-list">
          <button class="menu-btn" data-action="edit-custom" data-key="${id}">${icon('edit')}<span><b>Oefeningen aanpassen</b></span></button>
          <button class="btn danger block" data-action="rehab-unlink" data-id="${id}">Loskoppelen van deze blessure</button>
        </div>
      </details>`);
  }

  async function saveRehabPlan(id) {
    const days = S.ui.rehabDays || [];
    const keep = !!($('#rehab-keep') || {}).checked;
    await updateInjury(S.ui.injuryId, i => {
      const list = (i.schedule || []).filter(s => s.id !== id);
      const prev = (i.schedule || []).find(s => s.id === id);
      if (days.length) list.push({ id, days: [...days].sort(), since: prev && prev.since ? prev.since : dkey(today()) });
      i.schedule = list;
      const m = new Set(i.maintenance || []); keep ? m.add(id) : m.delete(id); i.maintenance = [...m];
      i.linked = [...new Set([...(i.linked || []), id])];
    });
    closeSheet();
    render({ keepScroll: true });
    toast(days.length ? `${sessionTitle(id)}: elke ${daysText(days)}` : `${sessionTitle(id)}: niet wekelijks ingepland`);
  }

  // Blessures-tab: wat nu loopt, je pijn, je herstelplan en je afspraken; afgeronde blessures eronder
  function painSeries(inj, n = 7) {
    const t = today();
    return Array.from({ length: n }, (_, i) => {
      const d = addDays(t, i - n + 1), c = checkFor(dkey(d));
      const vals = injurySides(inj).map(s => checkVal(c, inj.id, 'pain', s)).filter(v => v != null);
      return { label: DAY_LETTER[d.getDay()], v: vals.length ? Math.max(...vals) : null };
    });
  }
  function injuryHero(inj, primary = true) {
    const tk = dkey(today()), c = checkFor(tk);
    const vals = injurySides(inj).map(s => checkVal(c, inj.id, 'pain', s)).filter(v => v != null);
    const painNow = vals.length ? Math.max(...vals) : null;
    const series = painSeries(inj);
    const has = series.some(x => x.v != null);
    const agr = latestAgreement(inj);
    const lim = num(inj.painLimit);
    const plan = inj.program ? `${phaseObj(currentPhase()).label} · ${phaseObj(currentPhase()).title}`
      : (inj.schedule || []).filter(s => C.sessions[s.id]).map(s => `${sessionTitle(s.id)} · ${daysText(s.days)}`).join(' — ');
    const planSub = inj.program ? phaseObj(currentPhase()).summary : plan ? 'Staat als voorstel in je planning' : 'Stel je oefeningen samen en plan ze in';
    return `<section class="card inj-hero">
        <button class="inj-hero-top" data-action="open-injury" data-id="${inj.id}" aria-label="${esc(injuryLabel(inj))}: details">
          <span class="eyebrow">${esc(STATUS_LABEL[inj.status])}  /  sinds ${esc(fmtShort(inj.start || tk))}</span>
          <span class="inj-name">${esc(injuryLabel(inj))}</span>
          <span class="muted small">${esc([injurySideText(inj), inj.notes].filter(Boolean).join(' · ') || 'Tik voor details en afspraken')}</span>
        </button>
        <div class="inj-pain">
          <span class="label">Pijn vandaag</span>
          <div class="inj-pain-num"><b class="${painNow != null && lim != null && painNow > lim ? 'over' : ''}">${painNow == null ? '–' : painNow}</b><span class="unit">/10</span>${lim != null ? `<span class="inj-lim">grens ${lim}</span>` : ''}</div>
        </div>
        <p class="label" style="margin-top:16px;margin-bottom:4px">Pijn, laatste 7 dagen</p>
        ${has ? Charts.line({ labels: series.map(x => x.label), series: [{ color: 'var(--accent)', values: series.map(x => x.v) }], step: false, height: 96, yMin: 0, yMax: 10, ticks: lim != null ? [0, lim, 10] : [0, 5, 10], warnAbove: lim }) : '<p class="empty">Nog geen pijnscores.</p>'}
        <button class="btn ${primary ? 'accent' : ''} block lg inj-cta" data-action="open-check">${painNow == null ? 'Pijn invullen' : 'Pijn aanpassen'}</button>
      </section>
      <button class="card inj-plan" data-action="open-injury" data-id="${inj.id}">
        <span class="label">Herstelplan</span><b>${esc(plan || 'Nog geen plan')}</b><span class="muted small">${esc(planSub)}</span>
      </button>
      ${agr ? `<section class="card quote-card kine"><span class="label">Afspraak met je kinesist</span><p class="quote-text">“${esc(agr.text)}”</p><span class="label">${esc(fmtFull(agr.date))}</span></section>` : ''}`;
  }

  function renderInjuries() {
    const list = injuries().slice().sort((a, b) => String(b.start).localeCompare(String(a.start)));
    const act = list.filter(i => i.status !== 'afgerond'), past = list.filter(i => i.status === 'afgerond');
    const maint = past.flatMap(i => (i.maintenance || []).filter(id => C.sessions[id] || String(id).includes(':')));
    main.innerHTML = `
      <header class="photo-head page-photo">
        <img src="assets/lichaam.jpg" alt="" class="photo-img" decoding="async" onerror="this.remove()">
        <div class="photo-shade"></div>
        <div class="photo-top"><span class="photo-date">Preventie en herstel</span><button class="icon-btn photo-chip" data-action="inj-new" aria-label="Blessure toevoegen">${icon('plus')}</button></div>
        <div class="photo-bottom"><h1 class="display">Lichaam.</h1><p>Luister naar je lichaam. Bouw bewust op.</p></div>
      </header>
      ${act.map((inj, i) => injuryHero(inj, i === 0)).join('')}
      ${!list.length ? `<section class="card empty-row">
          <p>Nog geen blessures.</p>
          <button class="btn sm" data-action="inj-new">${icon('plus')} Blessure toevoegen</button>
        </section>` : !act.length ? `<section class="card empty-row">
          <p>Geen actieve blessure.${maint.length ? ` ${maint.length} onderhoudsoefening${maint.length === 1 ? '' : 'en'} in je planning.` : ''}</p>
          <button class="btn sm" data-action="inj-new">${icon('plus')} Nieuwe blessure</button>
        </section>` : ''}
      ${past.length ? `<details class="card fold past-fold"><summary><span>Hersteld</span><span class="label">${past.length}</span></summary>
        ${past.map(i => `<button class="list-row tap row-btn" data-action="open-injury" data-id="${i.id}">
          <span class="body"><b>${esc(injuryLabel(i))}</b><span>${esc([injurySideText(i), `${fmtShort(i.start)} – ${i.end ? fmtFull(i.end) : '?'}`].filter(Boolean).join(' · '))}</span></span>
          <span class="end">${icon('chevR')}</span></button>`).join('')}</details>` : ''}
      ${act.length > 0 ? `<button class="btn ghost block mt-8" data-action="inj-none">Geen actieve blessure meer</button>` : ''}
      <p class="footer-note">Pijngrenzen, fases en evaluatiedata zijn persoonlijke afspraken. De app geeft geen medische vrijgave.</p>`;
  }

  // Programma-oefeningen die je na afronden als onderhoud kan houden
  function maintenanceOptions(inj) {
    if (!inj.program) return (inj.linked || []).filter(id => C.sessions[id]).map(id => ({ id, label: sessionTitle(id) }));
    const opts = Object.keys(C.sessions).filter(id => C.sessions[id].program === inj.program).map(id => ({ id, label: sessionTitle(id) }));
    Object.keys(C.sessions).forEach(sid => (C.sessions[sid].items || []).forEach(it => {
      if (it.program === inj.program) opts.push({ id: `${sid}:${it.ex}`, label: `${C.exercises[it.ex].name} (in ${sessionTitle(sid)})` });
    }));
    return opts;
  }

  function renderInjury() {
    const inj = injuryById(S.ui.injuryId);
    if (!inj) { location.hash = 'blessures'; return; }
    const done = inj.status === 'afgerond';
    const sel = (name, opts, cur) => `<select class="select" data-change="inj" name="${name}">${Object.entries(opts).map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    const custom = Object.keys(C.sessions).filter(id => !C.sessions[id].program);
    const crit = inj.checklist || [];
    main.innerHTML = `
      ${subHead(esc(injuryLabel(inj)), 'blessures', `${STATUS_LABEL[inj.status]}${inj.start ? ' · sinds ' + fmtFull(inj.start) : ''}`)}
      ${inj.program ? '' : `<p class="hint">${icon('info')}<span>De app stelt geen behandelprogramma voor. Leg je oefeningen en afspraken vast zoals je ze met je kinesist maakt.</span></p>`}
      <section class="card">
        <div class="form-grid">
          <label class="field"><span>Locatie</span>${sel('location', LOC_LABEL, inj.location)}</label>
          <label class="field"><span>Startdatum</span><input class="input" type="date" data-change="inj" name="start" value="${esc(inj.start || '')}"></label>
          <label class="field full"><span>Naam van het traject</span><input class="input" data-change="inj" name="label" value="${esc(inj.label || '')}" placeholder="${esc(LOC_LABEL[inj.location])}"></label>
        </div>
        <p class="label">Kant</p>
        <div class="seg">${Object.entries({ links: 'Links', rechts: 'Rechts', beide: 'Beide', nvt: 'N.v.t.' }).map(([v, l]) => `<label><input type="radio" name="side" value="${v}" data-change="inj" ${inj.side === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>
        ${done ? '' : `<p class="label">Status</p><div class="seg">${[['actief', 'Actief'], ['opbouw', 'In opbouw']].map(([v, l]) => `<label><input type="radio" name="status" value="${v}" data-change="inj" ${inj.status === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`}
        <label class="field"><span>Notities</span><textarea class="input" rows="2" data-change="inj" name="notes" placeholder="Bv. wat je merkt, wat helpt">${esc(inj.notes || '')}</textarea></label>
      </section>

      <div class="section"><span>Afspraken met je kinesist</span></div>
      <section class="card">
        ${(inj.agreements || []).slice().sort((a, b) => b.date.localeCompare(a.date)).map(a => `<div class="list-row"><div class="body"><b>${esc(a.text)}</b><span>Afgesproken op ${fmtFull(a.date)}</span></div><div class="end"><button class="icon-btn ghost" data-action="agr-del" data-id="${a.id}" aria-label="Afspraak verwijderen">${icon('x')}</button></div></div>`).join('') || '<p class="empty">Nog geen afspraken vastgelegd.</p>'}
        <div class="add-row"><input class="input" type="date" id="agr-date" value="${dkey(today())}" aria-label="Datum van de afspraak"><input class="input" id="agr-text" placeholder="Bv. hops pas na controle" aria-label="Afspraak"><button class="btn" data-action="agr-add">${icon('plus')}<span class="sr">Toevoegen</span></button></div>
        <label class="field mt-12"><span>Afgesproken maximale pijn tijdens oefenen (0–10)</span><input class="input" inputmode="numeric" data-change="inj" name="painLimit" value="${inj.painLimit ?? ''}" placeholder="Leeg = geen afspraak"></label>
        <p class="label">De app gebruikt deze grens alleen om je eraan te herinneren. Het is geen medische regel.</p>
      </section>

      ${inj.program ? `<div class="section"><span>Fase</span></div>
        ${C.phases.map(f => `<label class="opt ${f.id === currentPhase() ? 'on' : ''}">
          <input type="radio" name="phase" value="${f.id}" data-change="phase" ${f.id === currentPhase() ? 'checked' : ''}>
          <div class="body"><b>${esc(f.label)} · ${esc(f.title)}</b><span>Oorspronkelijke evaluatiedatum: ${fmtFull(f.start)}</span><p>${esc(f.summary)}</p></div>
          <span class="mark"></span></label>`).join('')}
        <p class="label" style="margin:8px 0 0">Je wisselt zelf van fase, na overleg. Een datum is een evaluatiemoment, geen toestemming om zwaarder te trainen.</p>
        ${currentPhase() === 'f3' ? `<label class="field mt-12"><span>Stap voor veerkracht & sprint</span>
          <select class="select" data-change="plyo-step">
            <option value="auto" ${!S.settings.plyoStep || S.settings.plyoStep === 'auto' ? 'selected' : ''}>Elke week één stap (nu stap ${plyoStep()})</option>
            ${C.sessions.PLYO.steps.map((s, i) => `<option value="${i + 1}" ${String(S.settings.plyoStep) === String(i + 1) ? 'selected' : ''}>Stap ${i + 1}: ${esc(s.title)}</option>`).join('')}
          </select></label>` : ''}` : ''}

      <div class="section"><span>Evaluatiemomenten</span></div>
      <section class="card">
        ${(inj.evals || []).slice().sort((a, b) => a.date.localeCompare(b.date)).map(e => `<div class="list-row"><div class="body"><b>${esc(e.label || 'Evaluatie')}</b><span>${cap(fmtDay(e.date))}${e.date < dkey(today()) ? ' · voorbij' : ''}</span></div><div class="end"><button class="icon-btn ghost" data-action="eval-del" data-id="${e.id}" aria-label="Evaluatiemoment verwijderen">${icon('x')}</button></div></div>`).join('') || '<p class="empty">Nog geen evaluatiemomenten.</p>'}
        <div class="add-row"><input class="input" type="date" id="eval-date" aria-label="Datum"><input class="input" id="eval-label" placeholder="Bv. controle kinesist" aria-label="Omschrijving"><button class="btn" data-action="eval-add">${icon('plus')}<span class="sr">Toevoegen</span></button></div>
      </section>

      <div class="section"><span>Evaluatiechecklist</span><span>${crit.filter(c => c.done).length} van ${crit.length}</span></div>
      <section class="card">
        ${crit.map(c => `<label class="check ${c.done ? 'on' : ''}">
          <input type="checkbox" data-change="inj-check" value="${c.id}" ${c.done ? 'checked' : ''}>
          <span class="box">${icon('check')}</span>
          <span class="t">${esc(c.text)}${c.done ? `<small>Afgevinkt op ${fmtFull(c.done)}</small>` : ''}</span>
        </label>`).join('') || '<p class="empty">Nog geen punten.</p>'}
        <div class="add-row two"><input class="input" id="chk-text" placeholder="Nieuw punt om te evalueren" aria-label="Nieuw punt"><button class="btn" data-action="chk-add">${icon('plus')}<span class="sr">Toevoegen</span></button></div>
        <p class="label mt-8">Afvinken is een notitie voor jezelf. Het is geen medische vrijgave om (volledig) te spelen.</p>
      </section>

      <div class="section"><span>Herstelplan</span></div>
      <section class="card">
        ${inj.program ? `<p class="small muted mb-8">${done ? 'Kies welke hersteloefeningen je als onderhoud in je schema houdt.' : 'Deze oefeningen staan in je schema zolang dit traject loopt. Vink aan wat je na afronden als onderhoud wil houden.'}</p>
          ${maintenanceOptions(inj).map(o => `<label class="check ${(inj.maintenance || []).includes(o.id) ? 'on' : ''}"><input type="checkbox" data-change="inj-maint" value="${esc(o.id)}" ${(inj.maintenance || []).includes(o.id) ? 'checked' : ''}><span class="box">${icon('check')}</span><span class="t">${esc(o.label)}</span></label>`).join('')}`
        : rehabPlanHtml(inj)}
      </section>

      <div style="margin-top:16px">
        ${done ? `<button class="btn block" data-action="inj-reopen" data-id="${inj.id}">${icon('undo')} Traject heropenen</button>`
          : `<button class="btn primary block lg" data-action="inj-finish" data-id="${inj.id}">${icon('check')} Traject afronden</button>
             <p class="label" style="margin:8px 0 0">Je metingen en afspraken blijven bewaard. De dagelijkse blessurevragen en de herstelkaart verdwijnen van Home.</p>`}
      </div>
    `;
  }

  function openFinishInjury(id) {
    const inj = injuryById(id); if (!inj) return;
    const opts = maintenanceOptions(inj);
    openSheet(`<div class="sheet-head"><div><h3>${esc(injuryLabel(inj))} afronden</h3><p>Je geschiedenis blijft bewaard onder dit traject.</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${opts.length ? `<p class="label">Welke hersteloefeningen hou je als onderhoud in je schema?</p>
        ${opts.map(o => `<label class="check ${(inj.maintenance || []).includes(o.id) ? 'on' : ''}"><input type="checkbox" class="maint-pick" value="${esc(o.id)}" ${(inj.maintenance || []).includes(o.id) ? 'checked' : ''}><span class="box">${icon('check')}</span><span class="t">${esc(o.label)}</span></label>`).join('')}` : ''}
      <button class="btn primary block lg" data-action="inj-finish-ok" data-id="${inj.id}">${icon('check')} Afronden</button>`);
  }

  async function finishInjury(id, maint) {
    await updateInjury(id, i => { i.status = 'afgerond'; i.end = dkey(today()); if (maint) i.maintenance = maint; });
    closeSheet();
    render();
    toast('Traject afgerond. Je geschiedenis blijft bewaard.');
  }

  /* ---------- Matchen beheren ---------- */
  function renderMatches() {
    const tk = dkey(today());
    const fx = fixtures();
    const upcoming = fx.filter(f => f.date >= tk && !played(f));
    const past = fx.filter(f => !(f.date >= tk && !played(f))).reverse();
    const row = f => `<div class="list-row tap" data-action="edit-match" data-id="${f.id}">
      <div class="ico">${icon('ball')}</div>
      <div class="body"><b>${esc(f.opponent)}</b><span>${cap(fmtDay(f.date))}${f.time ? ' · ' + esc(f.time) : ''} · ${f.home ? 'thuis' : 'uit'}${f.edited || f.src === 'manual' ? ' · aangepast' : ''}</span></div>
      <div class="end">${played(f) ? `<span class="tag ${fixtureResult(f) === 'win' ? 'done' : ''}">${f.gf}–${f.ga}</span>` : ''}${icon('chevR')}</div>
    </div>`;
    main.innerHTML = `
      ${subHead('Matchen', 'account', `${fx.length} matchen`)}
      <p class="label" style="margin:0 0 12px">Tik op een match om datum, uur, tegenstander, thuis of uit en de uitslag aan te passen. Wat je aanpast, blijft staan bij een nieuwe RBFA-import.</p>
      <div class="section"><span>Komend</span><span>${upcoming.length}</span></div>
      <section class="card">${upcoming.map(row).join('') || '<p class="empty">Geen komende matchen.</p>'}</section>
      <div class="section"><span>Gespeeld</span><span>${past.length}</span></div>
      <section class="card">${past.map(row).join('') || '<p class="empty">Nog geen gespeelde matchen.</p>'}</section>
      <div class="row mt-12"><button class="btn" data-action="open-rbfa">${icon('download')} RBFA-import</button><button class="btn primary" data-action="edit-match" data-id="">${icon('plus')} Match toevoegen</button></div>
    `;
  }

  function openMatchEdit(id) {
    const f = id ? fixtures().find(x => x.id === id) : null;
    const v = f || { date: dkey(today()), time: '', opponent: '', home: true, gf: null, ga: null, comp: '' };
    openSheet(`<form id="match-form" data-id="${f ? f.id : ''}">
      <div class="sheet-head"><div><h3>${f ? 'Match aanpassen' : 'Match toevoegen'}</h3>${f && f.src === 'rbfa' ? '<p>Geïmporteerd van RBFA. Je aanpassing blijft staan bij een nieuwe import.</p>' : ''}</div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <label class="field"><span>Tegenstander</span><input class="input" name="opponent" value="${esc(v.opponent)}" required></label>
      <div class="form-grid">
        <label class="field"><span>Datum</span><input class="input" type="date" name="date" value="${v.date}" required></label>
        <label class="field"><span>Uur</span><input class="input" type="time" name="time" value="${esc(v.time || '')}"></label>
      </div>
      <div class="seg">${radio('home', '1', 'Thuis', v.home ? '1' : '0')}${radio('home', '0', 'Uit', v.home ? '1' : '0')}</div>
      <div class="form-grid">
        <label class="field"><span>Goals ${esc(C.rbfa.teamLabel)}</span><input class="input" name="gf" inputmode="numeric" value="${v.gf ?? ''}" placeholder="–"></label>
        <label class="field"><span>Goals tegenstander</span><input class="input" name="ga" inputmode="numeric" value="${v.ga ?? ''}" placeholder="–"></label>
      </div>
      <label class="field"><span>Competitie (optioneel)</span><input class="input" name="comp" value="${esc(v.comp || '')}"></label>
      <button class="btn primary block lg" type="submit">${icon('check')} Opslaan</button>
      ${f ? `<button class="btn danger block" type="button" data-action="delete-match" data-id="${f.id}">${icon('trash')} Verwijderen</button>` : ''}
    </form>`);
  }

  async function saveMatch(form) {
    const d = new FormData(form);
    const id = form.dataset.id;
    const list = fixtures();
    const cur = id ? list.find(x => x.id === id) : null;
    const gf = num(d.get('gf')), ga = num(d.get('ga'));
    const vals = {
      date: d.get('date'), time: d.get('time') || null, opponent: (d.get('opponent') || '').trim() || 'Onbekend',
      home: d.get('home') === '1', gf: gf == null || ga == null ? null : gf, ga: gf == null || ga == null ? null : ga,
      comp: (d.get('comp') || '').trim() || null
    };
    if (cur) Object.assign(cur, vals, { edited: true });
    else { const n = { id: newId(), ...vals, src: 'manual', edited: true }; n.key = fxKey(n); list.push(n); }
    await setSetting('fixtures', list);
    closeSheet();
    render({ keepScroll: true });
    toast(cur ? 'Match aangepast' : 'Match toegevoegd');
  }

  async function deleteMatch(id) {
    const f = fixtures().find(x => x.id === id);
    if (!f || !await ask(`${f.opponent} op ${fmtDay(f.date)} verwijderen?`, { ok: 'Verwijderen', danger: true })) return;
    if (f.src === 'rbfa') await setSetting('fixturesDeleted', [...new Set([...(S.settings.fixturesDeleted || []), f.key])]);
    await setSetting('fixtures', fixtures().filter(x => x.id !== id));
    closeSheet();
    render({ keepScroll: true });
    toast('Match verwijderd');
  }

  /* ================= RBFA: kalender en minuten (kopiëren en plakken) ================= */
  const MONTHS_RE = MONTH.join('|');
  const normDash = s => s.replace(/[‐-―−]/g, '-').replace(/ /g, ' ');
  const TIME_RE = /(\d{1,2})\s*[:.uh]\s*(\d{2})/i;
  const toTime = s => { const m = String(s).match(TIME_RE); return m && +m[1] < 24 && +m[2] < 60 ? `${pad(+m[1])}:${m[2]}` : null; };
  const isScore = l => /^\d{1,2}\s*-\s*\d{1,2}$/.test(l);
  const isTime = l => /^-?\s*\d{1,2}\s*[:.uh]\s*\d{2}$/i.test(l);
  const isRef = l => /^\(ref/i.test(l);
  const isStatus = l => /^(afgelast|uitgesteld|ff|forfait|gestaakt)/i.test(l);
  const isNoise = l => isScore(l) || isTime(l) || isRef(l) || /^strafschoppen$/i.test(l);
  const DAYS_RE = '(?:maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag|ma|di|wo|do|vr|za|zo)\\.?';
  const HEAD_TXT = new RegExp(`^${DAYS_RE},?\\s+(\\d{1,2})\\s+(${MONTHS_RE})(?:\\s+(\\d{4}))?(?:\\s*-?\\s*(\\d{1,2}\\s*[:.uh]\\s*\\d{2}))?$`, 'i');
  const HEAD_NUM = new RegExp(`^(?:${DAYS_RE},?\\s+)?(\\d{1,2})/(\\d{1,2})(?:/(\\d{2,4}))?(?:\\s*-?\\s*(\\d{1,2}\\s*[:.uh]\\s*\\d{2}))?$`, 'i');

  // Herkent een datumregel zoals "ZONDAG 08 NOVEMBER - 12:30", "zaterdag, 31 oktober 2026" of "za 31/10 20u00"
  function parseHead(l) {
    let m = l.match(HEAD_TXT);
    if (m) return { day: +m[1], month: MONTH.indexOf(m[2].toLowerCase()), year: m[3] ? +m[3] : null, time: m[4] ? toTime(m[4]) : null };
    m = l.match(HEAD_NUM);
    if (m && +m[2] >= 1 && +m[2] <= 12) return { day: +m[1], month: +m[2] - 1, year: m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : null, time: m[4] ? toTime(m[4]) : null };
    return null;
  }

  // Leest de tekst van de RBFA-ploegkalender (of het competitieoverzicht) en houdt de matchen van je ploeg over
  function parseCalendar(text) {
    const lines = normDash(text).split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const t = today();
    const seasonStart = t.getMonth() >= 5 ? t.getFullYear() : t.getFullYear() - 1;
    const found = new Map();
    let i = 0;
    while (i < lines.length) {
      const h = parseHead(lines[i]);
      if (!h) { i++; continue; }
      const year = h.year || (h.month >= 6 ? seasonStart : seasonStart + 1);
      const date = dkey(new Date(year, h.month, h.day));
      let headTime = h.time;
      let j = i + 1;
      // Het uur staat soms op een eigen regel onder de datum ("- 20:00")
      if (!headTime && j < lines.length && isTime(lines[j]) && lines[j].startsWith('-')) { headTime = toTime(lines[j]); j++; }
      const block = [];
      while (j < lines.length && !parseHead(lines[j]) && !/^(sorteer|kalender afdrukken|podium|volledige)/i.test(lines[j])) { block.push(lines[j]); j++; }
      let comp = null;
      for (let b = 0; b < block.length; b++) {
        const next = block[b + 1];
        const startsMatch = next && (isScore(next) || isTime(next) || isStatus(next)) && !isNoise(block[b]);
        if (!startsMatch) {
          if (b === 0 && !isNoise(block[b])) comp = block[b];
          continue;
        }
        const home = block[b];
        let k2 = b + 1, hs = null, as = null, time = headTime;
        if (isScore(block[k2])) [hs, as] = block[k2].split('-').map(x => +x.trim());
        else if (isTime(block[k2])) time = toTime(block[k2]) || headTime;
        k2++;
        while (k2 < block.length && (isScore(block[k2]) || /^strafschoppen$/i.test(block[k2]))) k2++;
        const away = block[k2];
        if (!away) break;
        if (isMine(home) || isMine(away)) {
          const f = normFx({ date, time, home, away, hs, as, comp: comp && !isMine(comp) ? comp : null });
          found.set(f.key + '|' + date, f);
        }
        b = k2;
        while (b + 1 < block.length && isRef(block[b + 1])) b++;
      }
      i = j;
    }
    return [...found.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  // Voegt geïmporteerde matchen samen met wat er al is. Zelf aangepaste of verwijderde matchen blijven zoals ze zijn.
  function mergeFixtures(parsed) {
    const list = fixtures();
    const deleted = new Set(S.settings.fixturesDeleted || []);
    const res = { added: 0, updated: 0, kept: 0 };
    parsed.forEach(p => {
      if (deleted.has(p.key)) { res.kept++; return; }
      const ex = list.find(f => f.key === p.key && f.src === 'rbfa' && Math.abs(daysBetween(parseKey(f.date), parseKey(p.date))) < 120)
        || list.find(f => f.date === p.date && f.opponent.toLowerCase() === p.opponent.toLowerCase());
      if (!ex) { list.push(p); res.added++; }
      else if (ex.edited) res.kept++;
      else { Object.assign(ex, { date: p.date, time: p.time || ex.time, gf: p.gf, ga: p.ga, comp: p.comp || ex.comp, home: p.home }); res.updated++; }
    });
    return { list, res };
  }

  // Leest een wedstrijdblad en berekent alleen JOUW minuten. Andere namen worden niet bewaard.
  function parseMatchSheet(text, player) {
    const lines = normDash(text).split(/\r?\n/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const surname = player.trim().split(' ').slice(1).join(' ') || player.trim();
    const lower = s => s.toLowerCase();
    const res = { ok: false };
    const dm = normDash(text).match(new RegExp(`\\b(?:ma|di|wo|do|vr|za|zo)\\w*\\.?\\s+(\\d{1,2})\\s+(${MONTHS_RE})\\s+(\\d{4})(?:\\s*-\\s*(\\d{1,2}[:.]\\d{2}))?`, 'i'));
    if (dm) { res.date = dkey(new Date(+dm[3], MONTH.indexOf(dm[2].toLowerCase()), +dm[1])); res.time = dm[4] ? toTime(dm[4]) : null; }
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
        const mm = l.match(/^(\d{1,3})(?:\s*\+\s*\d+)?\s*[‘'’`´]$/);
        if (mm) { cur = { min: +mm[1], names: [] }; groups.push(cur); }
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
    openSheet(`<div class="sheet-head"><div><h3>RBFA-kalender</h3><p>Alle matchen van ${esc(C.rbfa.teamLabel)}, met uur en uitslag</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <ol class="steps">
        <li>Open de <a href="${esc(C.rbfa.calendarUrl)}" target="_blank" rel="noopener">kalender van ${esc(C.rbfa.teamLabel)}</a>.</li>
        <li>Houd je vinger op de tekst → <b>Alles selecteren</b> → <b>Kopieer</b>.</li>
        <li>Kom terug en tik op <b>Plakken</b>.</li>
      </ol>
      <textarea class="input paste" id="rbfa-text" aria-label="Gekopieerde tekst" placeholder="Plak hier de tekst van de RBFA-pagina"></textarea>
      <div class="row mt-8">
        <button class="btn" data-action="paste" data-target="rbfa-text">${icon('paste')} Plakken</button>
        <button class="btn primary" data-action="rbfa-import">${icon('download')} Importeren</button>
      </div>
      <p class="label mt-12">Matchen die je zelf aangepast of verwijderd hebt, blijven zoals jij ze zette.</p>`);
  }

  async function importCalendar() {
    const parsed = parseCalendar($('#rbfa-text').value);
    if (!parsed.length) { toast(`Geen matchen van ${C.rbfa.teamLabel} gevonden. Kopieer de volledige kalenderpagina.`); return; }
    const { list, res } = mergeFixtures(parsed);
    await setSetting('fixtures', list);
    await setSetting('fixturesAt', Date.now());
    closeSheet();
    render({ keepScroll: true });
    toast(`${res.added} nieuw, ${res.updated} bijgewerkt${res.kept ? `, ${res.kept} door jou aangepast en behouden` : ''}`);
  }

  function openMinutes(date) {
    const f = date ? fixtureOn(date) : null;
    openSheet(`<div class="sheet-head"><div><h3>Mijn minuten</h3><p>${f ? `${esc(fxTitle(f))}, ${fmtShort(f.date)}` : 'Van het wedstrijdblad op rbfa.be'}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <ol class="steps">
        <li>Open de <a href="${esc(C.rbfa.calendarUrl)}" target="_blank" rel="noopener">kalender</a> en tik op de match${f ? ` van ${fmtShort(f.date)}` : ''}.</li>
        <li>Selecteer alles op de matchpagina en kopieer.</li>
        <li>Plak hieronder. De app zoekt <b>${esc(profile().rbfaName)}</b> en bewaart alleen jouw minuten.</li>
      </ol>
      <textarea class="input paste" id="sheet-text" aria-label="Gekopieerde tekst" placeholder="Plak hier de matchpagina"></textarea>
      <div class="row mt-8">
        <button class="btn" data-action="paste" data-target="sheet-text">${icon('paste')} Plakken</button>
        <button class="btn primary" data-action="minutes-parse">${icon('clock')} Berekenen</button>
      </div>
      <div id="minutes-result"></div>
      <p class="label mt-12">Het wedstrijdblad staat er meestal een paar uur na de match op.</p>`);
  }

  function showMinutesResult() {
    const r = parseMatchSheet($('#sheet-text').value, profile().rbfaName);
    const box = $('#minutes-result');
    if (!r.ok) { box.innerHTML = `<div class="hint warn mt-12">${icon('alert')}<span>${esc(r.error || 'Kon de tekst niet lezen.')}</span></div>`; return; }
    const mineHome = isMine(r.home || '');
    const opp = nice(mineHome ? r.away : r.home);
    const gf = r.hs == null ? null : mineHome ? r.hs : r.as, ga = r.hs == null ? null : mineHome ? r.as : r.hs;
    const existing = S.activities.find(a => a.type === 'match' && a.date === r.date);
    const detail = r.role === 'basisspeler'
      ? (r.outMin != null ? `Basisspeler, gewisseld in de ${r.outMin}e minuut` : 'Basisspeler, de hele match gespeeld')
      : r.role === 'wisselspeler'
        ? (r.inMin != null ? `Ingevallen in de ${r.inMin}e minuut${r.outMin != null ? `, eruit in de ${r.outMin}e` : ''}` : 'Op de bank, niet ingevallen')
        : `${profile().rbfaName} staat niet op dit wedstrijdblad`;
    box.innerHTML = `<div class="result">
      <span class="label">${r.date ? cap(fmtDay(r.date)) : 'Datum onbekend'} · ${mineHome ? 'thuis' : 'uit'} tegen ${esc(opp || '?')}${gf != null ? ` · ${gf}–${ga}` : ''}</span>
      <div class="num xl mt-8">${r.minutes}<span class="unit">min</span></div>
      <p class="small mt-8">${esc(detail)}</p>
    </div>
    <form id="minutes-form">
      <input type="hidden" name="date" value="${esc(r.date || dkey(today()))}">
      <input type="hidden" name="opponent" value="${esc(opp || '')}">
      <input type="hidden" name="home" value="${mineHome ? '1' : '0'}">
      <input type="hidden" name="gf" value="${gf ?? ''}"><input type="hidden" name="ga" value="${ga ?? ''}">
      <input type="hidden" name="time" value="${esc(r.time || '')}">
      <input type="hidden" name="role" value="${esc(r.role)}">
      <label class="field"><span>Minuten (aanpasbaar)</span><input class="input" name="minutes" type="number" inputmode="numeric" min="0" max="130" value="${r.minutes}"></label>
      ${logFields(existing)}
      <button class="btn primary block lg" type="submit">${icon('check')} ${existing ? 'Match bijwerken' : 'Opslaan'}</button>
    </form>`;
  }

  async function saveMinutes(form) {
    const f = new FormData(form);
    const date = f.get('date');
    const existing = S.activities.find(a => a.type === 'match' && a.date === date);
    const gf = num(f.get('gf')), ga = num(f.get('ga'));
    const rec = {
      ...(existing || {}),
      type: 'match', date, minutes: +f.get('minutes') || 0, surface: f.get('surface'), shoes: f.get('shoes'),
      pains: collectPains(), rpe: padValue('rpe'), fatigue: padValue('fatigue'), participation: f.get('participation') || 'volledig', plannedMinutes: C.rbfa.matchMinutes,
      opponent: f.get('opponent') || null, score: gf != null ? `${gf} - ${ga}` : null, role: f.get('role') || null,
      note: (f.get('note') || '').trim() || (existing ? existing.note || '' : ''), source: 'rbfa', createdAt: existing ? existing.createdAt : Date.now(), sample: false
    };
    delete rec.pain;
    rec.id = await DB.put('activities', rec);
    S.activities = S.activities.filter(a => a.id !== rec.id).concat(rec);
    await setSetting('logPrefs', { surface: rec.surface, shoes: rec.shoes });
    // De uitslag ook in de matchlijst zetten, als je die match niet zelf aangepast hebt
    const list = fixtures();
    const fx = list.find(x => x.date === date);
    if (fx && !fx.edited && gf != null) { fx.gf = gf; fx.ga = ga; await setSetting('fixtures', list); }
    else if (!fx && rec.opponent) {
      const n = { id: newId(), date, time: f.get('time') || null, opponent: rec.opponent, home: f.get('home') === '1', gf, ga, comp: null, src: 'rbfa', edited: false };
      n.key = fxKey(n); list.push(n); await setSetting('fixtures', list);
    }
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
  // Gekozen waarde van een knoppengroep; niets gekozen = null (nooit automatisch 0)
  const padValue = group => { const b = document.querySelector(`.sheet .pick-group[data-group="${group}"] .on`); return b ? +b.dataset.v : null; };
  function collectPains() {
    const out = {};
    document.querySelectorAll('.sheet .pick-group[data-group^="painA|"]').forEach(g => { const on = g.querySelector('.on'); if (on) out[g.dataset.group.split('|')[1]] = +on.dataset.v; });
    return out;
  }

  // Velden voor een training of match. Ondergrond en schoenen onthoudt de app; pijn vul je zelf in.
  function logFields(ex, preset = {}) {
    const prefs = S.settings.logPrefs || {};
    const surface = (ex && ex.surface) || prefs.surface || 'kunstgras';
    const shoes = (ex && ex.shoes) || prefs.shoes || 'AG';
    const part = (ex && ex.participation) || preset.participation || 'volledig';
    const act = activeInjuries();
    return `
      <p class="label">Hoe heb je meegedaan?</p>
      <div class="seg">${radio('participation', 'volledig', 'Volledig', part)}${radio('participation', 'gedeeltelijk', 'Gedeeltelijk', part)}${radio('participation', 'aangepast', 'Aangepast', part)}</div>
      <p class="label">Ervaren zwaarte · 0 = heel licht, 10 = maximaal</p>${pickGroup('rpe', ex ? ex.rpe ?? null : null, 0, 10, null)}
      ${act.map(i => `<p class="label mt-12">Pijn achteraf · ${esc(injuryLabel(i))}${injurySideText(i) ? ` (${esc(injurySideText(i))})` : ''}</p>${pickGroup(`painA|${i.id}`, ex && ex.pains ? ex.pains[i.id] ?? null : null, 0, 10, num(i.painLimit))}`).join('')}
      <details class="more"><summary>Meer opties <span class="label">${esc(cap(surface))} · ${esc(shoes)}</span></summary>
        <p class="label">Ondergrond</p>
        <div class="seg">${radio('surface', 'kunstgras', 'Kunstgras', surface)}${radio('surface', 'natuurgras', 'Natuurgras', surface)}</div>
        <p class="label">Schoenen</p>
        <div class="seg">${radio('shoes', 'AG', 'AG', shoes)}${radio('shoes', 'FG', 'FG', shoes)}</div>
        <p class="label">Vermoeidheid · 1 = fris, 5 = erg moe</p>${pickGroup('fatigue', ex ? ex.fatigue ?? null : null, 1, 5, null)}
        <label class="field mt-12"><span>Notitie</span><textarea class="input" name="note" rows="2" placeholder="Bv. stijf na de rust">${esc((ex && ex.note) || '')}</textarea></label>
      </details>`;
  }

  // Geplande duur van een training of match op een dag
  function plannedFor(type, date) {
    const it = planFor(parseKey(date)).find(x => x.type === type);
    return (it && plannedMinutes(it)) || (type === 'match' ? C.rbfa.matchMinutes : null);
  }

  function openLog(type = 'training', date = dkey(today()), id = null, preset = {}) {
    const ex = id ? S.activities.find(a => a.id === id) : null;
    if (ex) { type = ex.type; date = ex.date; }
    const planned = (ex && ex.plannedMinutes) || plannedFor(type, date);
    const minutes = ex ? ex.minutes : planned || '';
    openSheet(`<form id="log-form" data-id="${ex ? ex.id : ''}">
      <div class="sheet-head"><h3 id="log-title">${ex ? 'Bewerken: ' : ''}${type === 'match' ? 'Match' : 'Training'}</h3>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${ex ? `<input type="hidden" name="type" value="${type}">` : `<div class="seg">${radio('type', 'training', 'Training', type)}${radio('type', 'match', 'Match', type)}</div>`}
      <div class="form-grid">
        <label class="field"><span>Datum</span><input class="input" type="date" name="date" value="${date}" max="${dkey(today())}" required></label>
        <label class="field"><span>Minuten meegedaan</span><input class="input" type="number" inputmode="numeric" id="lg-min" name="minutes" min="0" max="240" value="${minutes}" required></label>
      </div>
      <input type="hidden" name="planned" value="${planned || ''}">
      ${planned ? `<p class="label" id="lg-planned" style="margin:-4px 0 12px">Vooraf ingevuld met de geplande duur (${planned} min). Pas aan naar wat je echt deed.</p>` : ''}
      ${logFields(ex, preset)}
      <button class="btn accent block lg" type="submit">${icon('check')} Opslaan</button>
    </form>`);
  }

  async function saveLog(form) {
    const f = new FormData(form);
    const id = form.dataset.id ? +form.dataset.id : null;
    const old = id ? S.activities.find(a => a.id === id) : null;
    const rec = {
      ...(old || {}),
      type: f.get('type'), date: f.get('date') || dkey(today()), minutes: +f.get('minutes') || 0,
      plannedMinutes: num(f.get('planned')), participation: f.get('participation') || 'volledig',
      surface: f.get('surface'), shoes: f.get('shoes'), rpe: padValue('rpe'), fatigue: padValue('fatigue'),
      pains: collectPains(), note: (f.get('note') || '').trim(),
      createdAt: old ? old.createdAt : Date.now(), sample: false
    };
    if (old && old.pain != null && !Object.keys(rec.pains).length) rec.pain = old.pain; else delete rec.pain;
    const fx = rec.type === 'match' ? fixtureOn(rec.date) : null;
    if (fx) { rec.opponent = fx.opponent; if (played(fx)) rec.score = `${fx.gf} - ${fx.ga}`; }
    rec.id = await DB.put('activities', rec);
    S.activities = S.activities.filter(a => a.id !== rec.id).concat(rec);
    await setSetting('logPrefs', { surface: rec.surface, shoes: rec.shoes });
    closeSheet();
    render({ keepScroll: true });
    const high = Object.entries(rec.pains).some(([iid, v]) => { const l = num((injuryById(iid) || {}).painLimit); return l != null && v > l; });
    toast(old ? 'Wijzigingen opgeslagen' : high ? 'Opgeslagen. Pijn boven je afspraak: let morgen op je check.' : `${rec.type === 'match' ? 'Match' : 'Training'} opgeslagen`);
    checkMilestones();
  }

  /* ---------- Aangepast uitgevoerd en meer opties ---------- */
  const ADAPT_OPTS = ['Minder sets', 'Lichter gewicht', 'Andere oefeningen', 'Korter', 'Minder diep of minder ver', 'Door pijn of stijfheid'];
  function openAdapted(k, key) {
    const it = findItem(k, key); if (!it) return;
    if (it.type !== 'session') { openLog(it.type, k, null, { participation: 'aangepast' }); return; }
    const s = sessInfo(it.id);
    openSheet(`<form id="adapted-form" data-k="${k}" data-id="${it.id}">
      <div class="sheet-head"><div><h3>Aangepast uitgevoerd</h3><p>${esc(s.name)} · ${fmtDay(k)}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <p class="label">Wat deed je anders?</p>
      <div class="chip-pick">${ADAPT_OPTS.map(t => `<label><input type="checkbox" name="adapt" value="${t}"><span>${t}</span></label>`).join('')}</div>
      <label class="field"><span>Werkelijke duur (minuten)</span><input class="input" name="minutes" type="number" inputmode="numeric" min="0" max="300" value="${s.minutes}"></label>
      <p class="label" style="margin-top:-8px">Vooraf ingevuld met de geplande duur (±${s.minutes} min).</p>
      <p class="label mt-12">Ervaren zwaarte · 0 = heel licht, 10 = maximaal</p>${pickGroup('rpe', null, 0, 10, null)}
      <label class="field mt-12"><span>Notitie (optioneel)</span><textarea class="input" name="note" rows="2"></textarea></label>
      <button class="btn accent block lg" type="submit">${icon('check')} Opslaan</button>
    </form>`);
  }

  async function saveAdapted(form) {
    const f = new FormData(form), k = form.dataset.k, id = form.dataset.id;
    const now = Date.now();
    const rec = {
      date: k, sessionKey: id, title: sessionTitle(id), phase: currentPhase(), startedAt: now, finishedAt: now, exercises: [],
      logged: 'quick', mode: 'aangepast', adaptations: f.getAll('adapt'), durationMin: num(f.get('minutes')),
      rpe: padValue('rpe'), note: (f.get('note') || '').trim(), sample: false
    };
    rec.id = await DB.put('workouts', rec);
    S.workouts.push(rec);
    S.ui.undoDone = { store: 'workouts', id: rec.id };
    closeSheet();
    render({ keepScroll: true });
    toast(`${sessionTitle(id)}: aangepast uitgevoerd`, { action: 'undo-done', label: 'Ongedaan' });
    checkMilestones();
  }

  // Sessie aanpassen: starten of afvinken, bevestigen, type vervangen, dag en uur, notitie, overslaan met reden
  const SKIP_REASONS = ['Geblesseerd', 'Ziek', 'Geen tijd', 'Rust nodig', 'Andere'];
  const TYPE_CHIPS = [['session', 'Fitness'], ['training', 'Voetbal'], ['kine', 'Kine'], ['recovery', 'Herstel'], ['match', 'Match'], ['rest', 'Rust']];
  function openItemActions(k, key) {
    const it = findItem(k, key); if (!it) return;
    const m = itemMeta(it), tk = dkey(today()), st = itemStatus(it, k);
    const s = it.type === 'session' ? C.sessions[it.id] : null;
    const done = it.type !== 'rest' && doneOrCaughtUp(it, k);
    const fixed = !!it.fixture;
    const curType = it.type === 'custom' ? 'custom' : it.type;
    const startTime = String(it.time || '').split(/[–-]/)[0].trim();
    let primary = '';
    if (!done && k <= tk) {
      if (s) primary = `<button class="btn accent block lg" data-action="start-session" data-key="${it.id}">${icon('play')} ${k < tk ? 'Nu inhalen' : 'Start workout'}</button>
        <div class="row mt-8"><button class="btn" data-action="mark-done" data-k="${k}" data-key="${it.id}">${icon('check')} Gedaan</button><button class="btn" data-action="adapted" data-k="${k}" data-key="${esc(key)}">${icon('edit')} Aangepast</button></div>`;
      else if (it.type === 'training' || it.type === 'match') primary = `<button class="btn accent block lg" data-action="${it.type === 'match' && it.fixture && played(it.fixture) ? 'open-minutes' : 'open-log'}" data-type="${it.type}" data-date="${k}">${icon('edit')} ${it.type === 'match' ? 'Minuten invullen' : 'Training loggen'}</button>`;
      else if (SIMPLE.includes(it.type)) primary = `<button class="btn accent block lg" data-action="mark-simple" data-k="${k}" data-key="${esc(key)}">${icon('check')} Gedaan</button>`;
    } else if (!done && !it.confirmed && it.type !== 'rest') {
      primary = `<button class="btn primary block lg" data-action="confirm-item" data-k="${k}" data-key="${esc(key)}">${icon('check')} Bevestigen</button>`;
    }
    const rec = recordFor(it, k);
    const viaOther = done && !rec;   // ingehaald door een workout op een andere dag
    // Duidelijke keuze: nog te doen of afgerond (niet voor rust)
    const statusSeg = it.type === 'rest' ? '' : `<div class="seg status-seg" role="radiogroup" aria-label="Status">
        <button type="button" role="radio" aria-checked="${!done}" class="${done ? '' : 'on'}" ${done ? `data-action="item-undone" data-k="${k}" data-key="${esc(key)}"` : ''} ${viaOther ? 'disabled' : ''}>Nog te doen</button>
        <button type="button" role="radio" aria-checked="${done}" class="${done ? 'on' : ''}" ${done ? '' : `data-action="item-done" data-k="${k}" data-key="${esc(key)}"`} ${!done && k > tk ? 'disabled' : ''}>Afgerond</button>
      </div>
      ${viaOther ? `<p class="label" style="margin:-8px 0 12px">Telt als ingehaald door dezelfde workout later in de week.</p>` : !done && k > tk ? `<p class="label" style="margin:-8px 0 12px">Afronden kan vanaf de dag zelf.</p>` : ''}`;
    openSheet(`<form id="item-form" data-k="${k}" data-key="${esc(key)}">
      <div class="sheet-head"><div><span class="eyebrow">${esc(actKind(it))}  ·  ${esc(st.label)}</span><h3>${esc(it.type === 'session' ? sessionTitle(it.id) : m.title)}</h3><p>${cap(fmtDay(k))}${it.note ? ` · ${esc(it.note)}` : ''}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${statusSeg}
      ${primary}
      ${rec ? `<button type="button" class="done-line" data-action="show-entry" data-store="${rec.store}" data-id="${rec.r.id}">${icon('check')}<span>${esc(recStatus(rec).label)} · ${esc(recordLine(rec))}</span>${icon('chevR')}</button>` : ''}
      ${fixed ? `<p class="label" style="margin:16px 0 0">Deze match komt uit de RBFA-kalender. Datum en uur pas je aan via Account → Matchen beheren.</p>` : `
      <p class="field-label">Sessietype</p>
      <div class="type-chips">${TYPE_CHIPS.map(([t, l]) => `<button type="button" class="tchip ${curType === t ? 'on' : ''}" ${curType === t ? 'aria-pressed="true"' : `data-action="replace-type" data-k="${k}" data-key="${esc(key)}" data-type="${t}"`}>${l}</button>`).join('')}
        <button type="button" class="tchip ${curType === 'custom' ? 'on' : ''}" data-action="replace-type" data-k="${k}" data-key="${esc(key)}" data-type="custom">${curType === 'custom' ? esc(it.label) : 'Eigen…'}</button></div>
      <p class="label" style="margin:-4px 0 16px">Een ander type kiezen vervangt deze sessie alleen op deze dag.</p>`}
      ${it.type === 'rest' || fixed ? '' : `
      <p class="field-label">Dag en uur</p>
      <div class="form-grid">
        <label class="field"><span class="sr">Datum</span><input class="input" type="date" name="date" value="${k}" required></label>
        <label class="field"><span class="sr">Uur</span><input class="input" type="time" name="time" value="${esc(/^\d{1,2}:\d{2}$/.test(startTime) ? startTime.padStart(5, '0') : '')}"></label>
      </div>
      ${it.type === 'session' ? '' : `<label class="field"><span>Duur (minuten)</span><input class="input" type="number" inputmode="numeric" min="0" max="300" name="min" value="${esc(it.min || (it.type === 'training' ? plannedMinutes(it) || '' : ''))}" placeholder="Optioneel"></label>`}
      ${done ? '' : `<button type="button" class="btn block" style="margin:-4px 0 16px" data-action="open-move" data-k="${k}" data-key="${esc(key)}">${icon('magic')} Verplaatsen met advies</button>`}`}
      <label class="field"><span>Notitie</span><textarea class="input" name="note" rows="2" placeholder="Bv. focus op techniek, kuit rustig opbouwen">${esc(it.userNote || '')}</textarea></label>
      <button class="btn ${primary ? '' : 'primary'} block lg" type="submit">${icon('check')} Wijzigingen opslaan</button>
      ${!done && it.type !== 'rest' ? `<p class="field-label mt-20">Overslaan met reden</p>
      <div class="chip-pick">${SKIP_REASONS.map(r => `<button type="button" class="tchip" data-action="skip-reason" data-k="${k}" data-key="${esc(key)}" data-reason="${r}">${r}</button>`).join('')}</div>
      <p class="label" style="margin:-8px 0 0">Overslaan telt niet als gemist, ook niet in je streak.</p>` : ''}
      <details class="more"><summary>Meer opties</summary>
        <div class="menu-list">
          ${!done && k <= tk && it.type !== 'session' && it.type !== 'rest' && !SIMPLE.includes(it.type) ? `<button type="button" class="menu-btn" data-action="adapted" data-k="${k}" data-key="${esc(key)}">${icon('edit')}<span><b>Aangepast uitgevoerd</b><small>Anders gedaan dan gepland</small></span></button>` : ''}
          ${s && s.custom ? `<button type="button" class="menu-btn" data-action="edit-custom" data-key="${it.id}">${icon('edit')}<span><b>Eigen workout aanpassen</b></span></button>` : ''}
          ${fixed ? '' : `<button type="button" class="btn danger block" data-action="del-item" data-k="${k}" data-key="${esc(key)}">${icon('trash')} Uit de planning halen</button>`}
        </div>
      </details>
    </form>`);
  }

  // Afronden vanuit de sheet: sessie of eenvoudig type met één tik, training/match via het logformulier
  function setItemDone(k, key) {
    const it = findItem(k, key); if (!it) return;
    if (it.type === 'session') markDone(k, it.id);
    else if (it.type === 'run') { closeSheet(); openRunLog(null, k); }
    else if (SIMPLE.includes(it.type)) markSimpleDone(k, key);
    else if (it.type === 'match' && it.fixture && played(it.fixture)) { closeSheet(); openMinutes(k); }
    else { closeSheet(); openLog(it.type, k); }
  }

  // Terug naar "nog te doen": de registratie(s) van die dag verwijderen, met Ongedaan.
  // Staan er gelogde sets of details in, dan eerst bevestigen.
  async function setItemUndone(k, key) {
    const it = findItem(k, key); if (!it) return;
    const store = it.type === 'session' ? 'workouts' : 'activities';
    const recs = store === 'workouts' ? workoutsOn(k).filter(w => w.sessionKey === it.id) : activitiesOn(k).filter(a => actMatches(a, it));
    if (!recs.length) return;
    const detailed = recs.some(r => store === 'workouts' ? (r.exercises || []).some(e => (e.sets || []).length) || r.rpe != null || r.note : r.rpe != null || r.note || Object.keys(r.pains || {}).length);
    if (detailed && !await ask(`Je registratie van ${itemMeta(it).title} op ${fmtDay(k)} bevat details (${store === 'workouts' ? 'sets, zwaarte of notitie' : 'minuten, zwaarte of pijn'}). Die worden verwijderd. Je kunt het meteen ongedaan maken.`, { ok: 'Terug naar nog te doen', title: 'Nog te doen?' })) return;
    for (const r of recs) await DB.del(store, r.id);
    S[store] = S[store].filter(x => !recs.includes(x));
    S.ui.undoRecs = { store, recs };
    closeSheet();
    render({ keepScroll: true });
    toast(`${itemMeta(it).title} staat weer op nog te doen`, { action: 'undo-recs', label: 'Ongedaan' });
  }

  async function saveItemForm(form) {
    const k = form.dataset.k, key = form.dataset.key;
    const it = findItem(k, key); if (!it) { closeSheet(); return; }
    const f = new FormData(form);
    const ed = { note: (f.get('note') || '').trim() };
    if (f.has('time')) {
      const t = f.get('time') || '';
      const cur = String(it.time || '').split(/[–-]/)[0].trim();
      // Alleen bewaren als je het uur echt veranderde (zo blijft bv. 19:45–21:30 staan)
      if (t !== (/^\d{1,2}:\d{2}$/.test(cur) ? cur.padStart(5, '0') : '')) ed.time = t;
    }
    if (f.has('min')) ed.min = num(f.get('min')) || '';
    const to = f.get('date') || k;
    saveItemEdit(k, key, ed, 'Opgeslagen');
    closeSheet();
    if (to !== k) moveItem(k, key, to);
  }

  // Een weggehaald item (overgeslagen, vervangen of verwijderd): terugzetten
  async function openOffItem(k, key) {
    const { off } = planDetail(parseKey(k));
    const o = off.find(x => itemKey(x.item) === key); if (!o) return;
    const ot = offText(o.reason);
    if (await ask(`${itemMeta(o.item).title} · ${ot.txt}. Terug in de planning zetten?${ot.tag === 'Vervangen' ? ' De vervanging verdwijnt dan.' : ''}`, { ok: 'Terugzetten', title: cap(fmtDay(k)) })) restoreItem(k, key);
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

  // Bevestiging in de app zelf (in plaats van de systeempopup)
  function ask(text, { ok = 'Ja', cancel = 'Annuleren', danger = false, title = 'Ben je zeker?' } = {}) {
    return new Promise(resolve => {
      const bd = document.createElement('div');
      bd.className = 'sheet-backdrop confirm';
      bd.innerHTML = `<div class="sheet" role="alertdialog" aria-modal="true">
        <div class="sheet-head"><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></div>
        <div class="row"><button class="btn" data-a="no">${esc(cancel)}</button><button class="btn ${danger ? 'accent' : 'primary'}" data-a="yes">${esc(ok)}</button></div>
      </div>`;
      const done = v => { bd.remove(); resolve(v); };
      bd.addEventListener('click', e => {
        e.stopPropagation();
        const b = e.target.closest('[data-a]');
        if (b) done(b.dataset.a === 'yes');
        else if (e.target === bd) done(false);
      });
      document.body.appendChild(bd);
      requestAnimationFrame(() => bd.classList.add('open'));
    });
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
      app: 'comeback', version: 4, exportedAt: new Date().toISOString(),
      checks: S.raw.checks, workouts: S.raw.workouts, activities: S.raw.activities, settings: S.settings
    };
    const name = `comeback-backup-${dkey(today())}.json`;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const mobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (mobile && navigator.canShare) {
      try {
        const file = new File([blob], name, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Comeback back-up' }); await markExported(); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    await markExported();
    toast('Back-up gedownload');
  }
  async function markExported() { await setSetting('lastExport', Date.now()); if (currentRoute() === 'account') render({ keepScroll: true }); }

  async function importData(file) {
    let data;
    try { data = JSON.parse(await file.text()); } catch (_) { toast('Dit is geen geldig JSON-bestand'); return; }
    if (!data || !Array.isArray(data.checks) || !Array.isArray(data.workouts) || !Array.isArray(data.activities)) {
      toast('Dit lijkt geen Comeback-back-up'); return;
    }
    if (!await ask(`Back-up van ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString('nl-BE') : 'onbekende datum'} terugzetten? Dit vervangt alle huidige gegevens op deze gsm${Sync.user() ? ' en in je account, dus ook op je andere toestellen' : ''}.`, { ok: 'Terugzetten' })) return;
    for (const s of DB.stores) await DB.clear(s);
    await DB.bulkPut('checks', data.checks);
    await DB.bulkPut('workouts', data.workouts);
    await DB.bulkPut('activities', data.activities);
    const settings = Object.entries(data.settings || {}).map(([key, value]) => ({ key, value }));
    if (!settings.some(s => s.key === 'seeded')) settings.push({ key: 'seeded', value: true });
    await DB.bulkPut('settings', settings);
    await loadAll();
    await migrate();
    registerCustom();
    render();
    toast('Back-up teruggezet');
  }

  async function seedSample() {
    const data = Sample.generate({
      C, dkey, addDays, today: today(),
      planFor: (d, phase) => basePlan(d, phase, { fixtures: false, satMatch: false }),
      sessionItems
    });
    await DB.bulkPut('checks', data.checks.filter(c => !(S.raw.checks || []).some(x => x.date === c.date)));
    await DB.bulkPut('workouts', data.workouts);
    await DB.bulkPut('activities', data.activities);
    await DB.setSetting('seeded', true);
    await loadAll();
  }

  async function clearSample() {
    if (!await ask('Alle voorbeelddata wissen? Je eigen gegevens blijven staan.')) return;
    await DB.bulkDel('checks', S.raw.checks.filter(x => x.sample).map(x => x.date));
    await DB.bulkDel('workouts', S.raw.workouts.filter(x => x.sample).map(x => x.id));
    await DB.bulkDel('activities', S.raw.activities.filter(x => x.sample).map(x => x.id));
    await setSetting('demo', false);
    await loadAll();
    render({ keepScroll: true });
    toast('Voorbeelddata gewist');
  }

  async function clearAll() {
    if (!await ask(`Echt ALLE data wissen (ook je eigen workouts, checks en instellingen)${Sync.user() ? ', ook in je account en op je andere toestellen' : ''}? Maak eerst een back-up.`)) return;
    if (!await ask('Laatste bevestiging: alles wissen?')) return;
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
    'close-sheet': closeSheet,
    'toggle-theme': () => setTheme(isDark() ? 'light' : 'dark'),
    'save-check': el => saveCheck(el.dataset.date || undefined),
    'open-check': el => openCheck(el.dataset.date || undefined),
    'open-score': () => openCheck(),
    'pick': el => {
      const g = el.closest('.pick-group'); const was = el.classList.contains('on');
      g.querySelectorAll('button').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
      if (!was) { el.classList.add('on'); el.setAttribute('aria-pressed', 'true'); }
    },
    'adapted': el => openAdapted(el.dataset.k, el.dataset.key),
    'item-actions': el => openItemActions(el.dataset.k, el.dataset.key),
    'item-menu': el => openItemMenu(el.dataset.k, el.dataset.key),
    'log-menu': () => openLogMenu(),
    'open-run': el => { closeSheet(); openRunLog(null, el.dataset.date); },
    'log-new': el => logNew(el.dataset.type),
    'train-seg': el => { S.ui.trainSeg = el.dataset.s; S.ui.timelineAll = false; if (el.dataset.s === 'kracht') S.ui.woView = null; render(); },
    'timeline-all': () => { S.ui.timelineAll = !S.ui.timelineAll; render({ keepScroll: true }); },
    'wo-leave': openLeave,
    'undo-del': async () => { const u = S.ui.undoRec; if (!u) return; await DB.put(u.store, u.rec); S[u.store].push(u.rec); S.ui.undoRec = null; $('#toast').hidden = true; render({ keepScroll: true }); toast('Teruggezet'); },
    'edit-entry': el => {
      const id = +el.dataset.id;
      if (el.dataset.store === 'workouts') return openWorkoutEdit(id);
      const a = S.activities.find(x => x.id === id) || {};
      if (a.type === 'run') return openRunLog(id);
      if (a.type === 'training' || a.type === 'match') return openLog(null, null, id);
      return openSimpleLog(a.type, id);
    },
    'stats-inj': el => { S.ui.statsInjury = el.dataset.id; render({ keepScroll: true }); },
    'open-injury': el => { S.ui.injuryId = el.dataset.id; go('blessure'); },
    'inj-new': openNewInjury,
    'ni-pick': el => { const f = $('#inj-form'); const keep = f ? Object.fromEntries(new FormData(f)) : {}; S.ui.newInj[el.dataset.f] = el.dataset.v; renderNewInjury(); const g = $('#inj-form'); if (g) Object.entries(keep).forEach(([k, v]) => { if (g.elements[k] && g.elements[k].type !== 'checkbox') g.elements[k].value = v; }); },
    'rehab-plan': el => openRehabPlan(el.dataset.id),
    'rehab-save': el => saveRehabPlan(el.dataset.id),
    'rehab-once': el => { const d = ($('#rehab-date') || {}).value; if (!d) { toast('Kies eerst een datum'); return; } addItemTo(d, { type: 'session', id: el.dataset.id }, `Herstel · ${injuryLabel(injuryById(S.ui.injuryId))}`); },
    'rehab-new': () => openBuilder(null, null, S.ui.injuryId),
    'rehab-unlink': async el => { const id = el.dataset.id; await updateInjury(S.ui.injuryId, i => { i.linked = (i.linked || []).filter(x => x !== id); i.schedule = (i.schedule || []).filter(x => x.id !== id); i.maintenance = (i.maintenance || []).filter(x => x !== id); }); closeSheet(); render({ keepScroll: true }); toast('Losgekoppeld. De workout zelf blijft bewaard.'); },
    'wd-toggle': el => { const d = +el.dataset.d, l = S.ui.rehabDays; const i = l.indexOf(d); if (i >= 0) l.splice(i, 1); else l.push(d); el.classList.toggle('on', i < 0); el.setAttribute('aria-pressed', String(i < 0)); },
    'inj-none': async () => {
      if (!await ask('Alle lopende trajecten afronden? Hun metingen en afspraken blijven bewaard.', { ok: 'Afronden' })) return;
      const list = clone(injuries()); list.forEach(i => { if (i.status !== 'afgerond') { i.status = 'afgerond'; i.end = dkey(today()); } });
      await setSetting('injuries', list); render(); toast('Geen actieve blessure. Kies per traject welke oefeningen je als onderhoud houdt.');
    },
    'inj-finish': el => openFinishInjury(el.dataset.id),
    'inj-finish-ok': el => finishInjury(el.dataset.id, [...document.querySelectorAll('.maint-pick:checked')].map(i => i.value)),
    'inj-reopen': async el => { await updateInjury(el.dataset.id, i => { i.status = 'actief'; i.end = null; }); render(); toast('Traject heropend'); },
    'agr-add': async () => { const t = $('#agr-text').value.trim(); if (!t) { toast('Schrijf eerst de afspraak'); return; } await updateInjury(S.ui.injuryId, i => { (i.agreements = i.agreements || []).push({ id: newId(), date: $('#agr-date').value || dkey(today()), text: t }); }); render({ keepScroll: true }); toast('Afspraak bewaard'); },
    'agr-del': async el => { if (!await ask('Deze afspraak verwijderen?', { ok: 'Verwijderen', danger: true })) return; await updateInjury(S.ui.injuryId, i => { i.agreements = (i.agreements || []).filter(a => a.id !== el.dataset.id); }); render({ keepScroll: true }); },
    'eval-add': async () => { const d = $('#eval-date').value; if (!d) { toast('Kies eerst een datum'); return; } await updateInjury(S.ui.injuryId, i => { (i.evals = i.evals || []).push({ id: newId(), date: d, label: $('#eval-label').value.trim() || 'Evaluatie' }); }); render({ keepScroll: true }); },
    'eval-del': async el => { await updateInjury(S.ui.injuryId, i => { i.evals = (i.evals || []).filter(e => e.id !== el.dataset.id); }); render({ keepScroll: true }); },
    'chk-add': async () => { const t = $('#chk-text').value.trim(); if (!t) return; await updateInjury(S.ui.injuryId, i => { (i.checklist = i.checklist || []).push({ id: newId(), text: t, done: null }); }); render({ keepScroll: true }); },
    'demo-off': async () => { await setSetting('demo', false); await loadAll(); render(); toast('Demostand uit: alleen je eigen gegevens'); },
    'score-pick': el => { el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
    'home-day': el => { S.ui.homeDay = el.dataset.k; render({ keepScroll: true }); },
    'cal-open': el => openDay(el.dataset.k),
    'start-session': el => { S.ui.trainSeg = 'kracht'; startSession(el.dataset.key); },
    'open-log': el => openLog(el.dataset.type, el.dataset.date || undefined),
    'open-day': el => openDay(el.dataset.k),
    'open-move': el => openMoveSheet(el.dataset.k, el.dataset.key),
    'smart-move': el => smartMove(el.dataset.k, el.dataset.key),
    'move-to': el => moveItem(el.dataset.from, el.dataset.key, el.dataset.to),
    'move-custom': el => { const v = $('#move-date').value; if (!v) { toast('Kies eerst een datum'); return; } moveItem(el.dataset.from, el.dataset.key, v); },
    'skip-item': el => skipItem(el.dataset.k, el.dataset.key),
    'restore-item': el => restoreItem(el.dataset.k, el.dataset.key),
    'cal-pick': el => { S.ui.calDay = el.dataset.k; const d = parseKey(el.dataset.k); S.ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1); render({ keepScroll: true }); },
    'add-menu': el => openAddMenu(el.dataset.k),
    'add-session': el => addOrReplace(el, { type: 'session', id: el.dataset.id }),
    'add-type': el => addOrReplace(el, newItemOf(el.dataset.type)),
    'add-custom': el => { const v = ($('#custom-label').value || '').trim(); if (!v) { toast('Geef je eigen type eerst een naam'); $('#custom-label').focus(); return; } addOrReplace(el, { type: 'custom', label: v.slice(0, 40) }); },
    'replace-type': el => { const t = el.dataset.type; if (t === 'session' || t === 'custom') openAddMenu(el.dataset.k, el.dataset.key); else replaceItem(el.dataset.k, el.dataset.key, newItemOf(t)); },
    'skip-reason': el => skipItem(el.dataset.k, el.dataset.key, el.dataset.reason),
    'confirm-item': el => confirmItems([[el.dataset.k, el.dataset.key]], 'Bevestigd'),
    'confirm-week': () => { const l = pendingSuggestions(parseKey(S.ui.planWeek || weekKey(today()))); confirmItems(l, `${l.length} voorstel${l.length === 1 ? '' : 'len'} bevestigd`); },
    'mark-simple': el => markSimpleDone(el.dataset.k, el.dataset.key),
    'item-done': el => setItemDone(el.dataset.k, el.dataset.key),
    'item-undone': el => setItemUndone(el.dataset.k, el.dataset.key),
    'undo-recs': async () => {
      const u = S.ui.undoRecs; if (!u) return;
      for (const r of u.recs) { await DB.put(u.store, r); S[u.store].push(r); }
      S.ui.undoRecs = null; $('#toast').hidden = true; render({ keepScroll: true }); toast('Teruggezet');
    },
    'off-item': el => openOffItem(el.dataset.k, el.dataset.key),
    'plan-view': el => { S.ui.planView = el.dataset.v; render(); },
    'wk-prev': () => { S.ui.planWeek = dkey(addDays(parseKey(S.ui.planWeek || weekKey(today())), -7)); render(); },
    'wk-next': () => { S.ui.planWeek = dkey(addDays(parseKey(S.ui.planWeek || weekKey(today())), 7)); render(); },
    'wk-today': () => { S.ui.planWeek = weekKey(today()); S.ui.planFocus = dkey(today()); render(); },
    'wk-jump': el => { const n = document.getElementById(`day-${el.dataset.k}`); if (n) window.scrollTo({ top: n.getBoundingClientRect().top + window.scrollY - 90, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); },
    'del-item': async el => { if (!await ask('Uit de planning halen? Je kan het terugzetten in de kalender.', { ok: 'Uit planning halen', danger: true })) return; deleteItem(el.dataset.k, el.dataset.key); },
    'new-custom': el => openBuilder(el.dataset.k),
    'new-workout': () => openBuilder(null),
    'workout-sheet': el => openWorkoutSheet(el.dataset.key),
    'workout-plan': el => openWorkoutPlan(el.dataset.key),
    'plan-wd': el => { const d = +el.dataset.d, l = S.ui.planDays, i = l.indexOf(d); if (i >= 0) l.splice(i, 1); else l.push(d); el.classList.toggle('on', i < 0); el.setAttribute('aria-pressed', String(i < 0)); },
    'plan-once-add': el => { const v = ($('#plan-once') || {}).value; if (!v) { toast('Kies eerst een datum'); return; } if (v < dkey(today())) { toast('Kies vandaag of later'); return; } if (!S.ui.planOnce.includes(v)) S.ui.planOnce.push(v); S.ui.planOnce.sort(); const box = $('#plan-once-list'); if (box) box.innerHTML = S.ui.planOnce.map(d => `<button class="loc-chip on" data-action="plan-once-del" data-d="${d}" aria-label="${fmtDay(d)} weghalen">${esc(cap(fmtDay(d)))} ${icon('x')}</button>`).join(''); },
    'plan-once-del': el => { S.ui.planOnce = S.ui.planOnce.filter(d => d !== el.dataset.d); el.remove(); },
    'plan-save': el => saveWorkoutPlan(el.dataset.key),
    'rp-wd': el => { const d = +el.dataset.d, l = S.ui.rp.days, i = l.indexOf(d); if (i >= 0) l.splice(i, 1); else l.push(d); el.classList.toggle('on', i < 0); el.setAttribute('aria-pressed', String(i < 0)); },
    'rp-preset': el => { S.ui.rp.days = el.dataset.p.split(',').map(Number); document.querySelectorAll('[data-action="rp-wd"]').forEach(b => { const on = S.ui.rp.days.includes(+b.dataset.d); b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }); },
    'rp-edit': el => { const r = ruleById(el.dataset.id); if (r) openRepeat(r.since || dkey(today()), r.item, r.id); },
    'rp-stop': el => stopRule(el.dataset.id, el.dataset.k),
    'rp-delete': el => deleteRule(el.dataset.id),
    'edit-custom': el => openBuilder(null, el.dataset.key),
    'delete-custom': el => deleteCustom(el.dataset.key),
    'b-step': el => builderStep(+el.dataset.i, el.dataset.f, +el.dataset.d),
    'b-remove': el => { keepName(); S.ui.builder.items.splice(+el.dataset.i, 1); renderBuilder(); },
    'b-open-pick': el => { keepName(); Object.assign(S.ui.builder, { view: 'pick', tab: el.dataset.tab, group: null }); renderBuilder(); },
    'b-back': () => { S.ui.builder.view = 'edit'; renderBuilder(); },
    'b-tab': el => { Object.assign(S.ui.builder, { tab: el.dataset.v, group: null }); renderBuilder(); },
    'b-loc': el => { S.ui.builder.loc = el.dataset.v; renderBuilder(); },
    'b-group': el => { S.ui.builder.group = el.dataset.id || null; renderBuilder(); const sh = $('.sheet'); if (sh) sh.scrollTop = 0; },
    'b-pick-ex': el => togglePickEx(el.dataset.id),
    'b-template': el => applyTemplate(el.dataset.id),
    'b-new-toggle': () => { S.ui.builder.adding = true; renderBuilder(); },
    'b-new-add': builderAddNew,
    'b-save': saveBuilder,
    'mark-done': el => markDone(el.dataset.k, el.dataset.key),
    'undo-done': async () => {
      const u = S.ui.undoDone; if (!u) return;
      await DB.del(u.store, u.id); S[u.store] = S[u.store].filter(w => w.id !== u.id); S.ui.undoDone = null;
      $('#toast').hidden = true; render({ keepScroll: true }); toast('Ongedaan gemaakt');
    },
    'undo': async () => { if (!S.ui.undo) return; await setSetting('overrides', S.ui.undo); S.ui.undo = null; $('#toast').hidden = true; render({ keepScroll: true }); toast('Ongedaan gemaakt'); },
    'wo-pause': () => { closeSheet(); S.ui.woView = 'picker'; render(); toast('Workout bewaard. Hervat wanneer je wil.'); },
    'wo-resume': () => { S.ui.woView = 'active'; requestWakeLock(); if (currentRoute() === 'workout') render(); else go('workout'); },
    'wo-cancel': () => { closeSheet(); cancelWorkout(); },
    'wo-goto': el => gotoExercise(+el.dataset.i),
    'wo-prev': () => gotoExercise(draft().current - 1),
    'wo-next': () => gotoExercise(draft().current + 1),
    'wo-finish': () => { closeSheet(); finishWorkout(); },
    'wo-add-set': addSet,
    'set-done': completeSet,
    'set-sel': el => { const e = curEx(); e.cur = +el.dataset.i; saveDraft(); render({ keepScroll: true }); },
    'set-next': () => { const e = curEx(); const n = e.sets.findIndex(s => !s.done); if (n >= 0) { e.cur = n; render({ keepScroll: true }); } else if (draft().current < draft().exercises.length - 1) gotoExercise(draft().current + 1); else finishWorkout(); },
    'set-undo': () => { const e = curEx(); e.sets[e.cur].done = false; saveDraft(); render({ keepScroll: true }); },
    'step': el => stepField(el.dataset.f, +el.dataset.d),
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
    'stats-tab': el => { S.ui.statsTab = el.dataset.t; render(); },
    'recent-all': () => { S.ui.recentAll = !S.ui.recentAll; render({ keepScroll: true }); },
    'matches-all': () => { S.ui.matchesAll = !S.ui.matchesAll; render({ keepScroll: true }); },
    'line-range': el => { S.ui.lineRange = +el.dataset.r; render({ keepScroll: true }); },
    'cal-prev': () => shiftMonth(-1),
    'cal-next': () => shiftMonth(1),
    'show-entry': el => showEntry(el.dataset.store, +el.dataset.id),
    'del-entry': el => deleteEntry(el.dataset.store, +el.dataset.id),
    'pick-photo': () => $('#photo-file').click(),
    'remove-photo': async () => { if (!await ask('Je profielfoto verwijderen?', { ok: 'Verwijderen', danger: true })) return; await setSetting('photo', null); render({ keepScroll: true }); },
    'edit-match': el => openMatchEdit(el.dataset.id),
    'delete-match': el => deleteMatch(el.dataset.id),
    'open-rbfa': openRbfa,
    'rbfa-import': importCalendar,
    'open-minutes': el => openMinutes(el.dataset.date),
    'minutes-parse': showMinutesResult,
    'paste': el => pasteInto(el.dataset.target),
    'export': exportData,
    'import': () => $('#import-file').click(),
    'clear-sample': clearSample,
    'load-sample': async () => { await setSetting('demo', true); await seedSample(); render({ keepScroll: true }); toast('Demostand aan'); },
    'clear-all': clearAll,
    'reload': () => location.reload(),
    'pw-toggle': el => { const i = el.parentElement.querySelector('input'); const show = i.type === 'password'; i.type = show ? 'text' : 'password'; el.setAttribute('aria-pressed', String(show)); el.setAttribute('aria-label', show ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'); i.focus(); },
    'auth-forgot': forgotPassword,
    'auth-relogin': () => { $('#toast').hidden = true; S.auth = { view: 'login', email: '' }; render(); },
    'sync-now': async () => { await Sync.syncNow(); const st = Sync.state(); if (st.status === 'ok') toast('Gesynchroniseerd'); else if (st.error) toast(st.error); },
    'sign-out': signOutFlow
  };

  function shiftMonth(n) {
    const t = today();
    const m = S.ui.calMonth || new Date(t.getFullYear(), t.getMonth(), 1);
    S.ui.calMonth = new Date(m.getFullYear(), m.getMonth() + n, 1);
    render({ keepScroll: true });
  }

  document.addEventListener('click', e => {
    unlockAudio();
    // De klik die op het slepen volgt, mag niets openen
    if (S.ui.dragEndedAt && Date.now() - S.ui.dragEndedAt < 450) { e.preventDefault(); return; }
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
    if (el.matches('[data-bi]') && S.ui.builder) S.ui.builder.items[+el.dataset.bi][el.dataset.bf] = num(el.value);
  });

  document.addEventListener('change', async e => {
    const el = e.target;
    const kind = el.dataset.change;
    if (el.form && el.form.id === 'repeat-form' && el.name === 'rpmode') { S.ui.rp.mode = el.value; const b = document.getElementById('rp-repeat'); if (b) b.hidden = el.value !== 'repeat'; }
    // Workout bewerken: bij "Aangepast" verschijnt wat je anders deed
    if (el.form && el.form.id === 'wedit-form' && el.name === 'mode') { const a = document.getElementById('wedit-adapt'); if (a) a.hidden = el.value !== 'aangepast'; }
    if (el.form && el.form.id === 'log-form' && el.name === 'type') {
      $('#log-title').textContent = el.value === 'match' ? 'Match' : 'Training';
      const pl = plannedFor(el.value, el.form.date.value) || '';
      $('#lg-min').value = pl; el.form.planned.value = pl;
      const note = $('#lg-planned'); if (note) note.textContent = pl ? `Vooraf ingevuld met de geplande duur (${pl} min). Pas aan naar wat je echt deed.` : '';
      return;
    }
    if (!kind) return;
    if (kind === 'satmatch') {
      const wk = weekKey(today());
      const set = new Set(S.settings.satMatchWeeks || []);
      el.checked ? set.add(wk) : set.delete(wk);
      await setSetting('satMatchWeeks', [...set]);
      render({ keepScroll: true });
      toast(el.checked ? 'Zaterdagmatch: Bovenlichaam & core staat nu op donderdag' : 'Standaard weekschema hersteld');
    } else if (kind === 'b-pick') {
      const b = S.ui.builder; b.name = $('#b-name').value;
      if (el.value === '__new') b.adding = true;
      else if (el.value) { b.items.push(builderItem(el.value)); b.adding = false; }
      renderBuilder();
    } else if (kind === 'demo') {
      await setSetting('demo', el.checked);
      if (el.checked && !(S.raw.workouts || []).some(w => w.sample)) await seedSample(); else await loadAll();
      render({ keepScroll: true });
      toast(el.checked ? 'Demostand aan: voorbeelddata telt mee' : 'Demostand uit: alleen je eigen gegevens');
    } else if (kind === 'load-warn') {
      await setSetting('loadWarn', el.checked); toast(el.checked ? 'Waarschuwing aan' : 'Waarschuwing uit');
    } else if (kind === 'goal-type') {
      await setSetting('goal', { ...goal(), type: el.value }); render({ keepScroll: true });
    } else if (kind === 'goal') {
      await setSetting('goal', { ...goal(), [el.name]: el.value.trim() }); toast('Opgeslagen');
    } else if (kind === 'inj') {
      let v = el.value.trim();
      if (el.name === 'painLimit') { v = num(v); if (v != null) v = clamp(Math.round(v), 0, 10); }
      await updateInjury(S.ui.injuryId, i => { i[el.name] = v; });
      if (['location', 'label', 'side', 'status'].includes(el.name)) render({ keepScroll: true }); else toast('Opgeslagen');
    } else if (kind === 'inj-check') {
      await updateInjury(S.ui.injuryId, i => { const c = (i.checklist || []).find(x => x.id === el.value); if (c) c.done = el.checked ? dkey(today()) : null; });
      render({ keepScroll: true });
    } else if (kind === 'inj-maint' || kind === 'inj-link') {
      const field = kind === 'inj-maint' ? 'maintenance' : 'linked';
      await updateInjury(S.ui.injuryId, i => { const set = new Set(i[field] || []); el.checked ? set.add(el.value) : set.delete(el.value); i[field] = [...set]; });
      render({ keepScroll: true });
    } else if (kind === 'profile') {
      await saveProfileField(el);
    } else if (kind === 'photo') {
      if (el.files && el.files[0]) savePhoto(el.files[0]);
      el.value = '';
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
    } else if (kind === 'weight-ex') {
      S.ui.weightEx = el.value;
      render({ keepScroll: true });
    } else if (kind === 'import') {
      if (el.files && el.files[0]) await importData(el.files[0]);
      el.value = '';
    }
  });

  // Live tempo in het loopformulier
  document.addEventListener('input', e => {
    const el = e.target;
    if (!el.form || el.form.id !== 'run-form' || (el.name !== 'km' && el.name !== 'minutes')) return;
    const o = document.getElementById('run-pace');
    if (o) o.textContent = `${paceText(String(el.form.km.value).replace(',', '.'), String(el.form.minutes.value).replace(',', '.'))} /km`;
  });

  const EXT_SUBMIT = {};
  document.addEventListener('submit', e => {
    e.preventDefault();
    if (EXT_SUBMIT[e.target.id]) { EXT_SUBMIT[e.target.id](e.target); return; }
    if (e.target.id === 'login-form') submitLogin(e.target);
    if (e.target.id === 'password-form') submitPassword(e.target);
    if (e.target.id === 'log-form') saveLog(e.target);
    if (e.target.id === 'run-form') saveRun(e.target);
    if (e.target.id === 'repeat-form') saveRepeat(e.target);
    if (e.target.id === 'simple-form') saveSimple(e.target);
    if (e.target.id === 'rpe-form') saveRpe(e.target);
    if (e.target.id === 'minutes-form') saveMinutes(e.target);
    if (e.target.id === 'match-form') saveMatch(e.target);
    if (e.target.id === 'finish-form') saveFinish(e.target);
    if (e.target.id === 'adapted-form') saveAdapted(e.target);
    if (e.target.id === 'wedit-form') saveWorkoutEdit(e.target);
    if (e.target.id === 'item-form') saveItemForm(e.target);
    if (e.target.id === 'inj-form') saveNewInjury(e.target);
  });

  window.addEventListener('hashchange', () => { closeSheet(); render(); });
  window.addEventListener('online', () => { if (S.auth) render(); });
  window.addEventListener('offline', () => { if (S.auth) render(); });
  // Onthouden of de setlijst open staat
  document.addEventListener('toggle', e => { if (e.target.matches && e.target.matches('details[data-fold="sets"]')) S.ui.setsOpen = e.target.open; }, true);

  /* ================= Service worker ================= */
  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    // Lokaal testen zonder offline-cache (anders zie je oude bestanden); met ?sw=1 toch aan
    if (location.hostname === 'localhost' && !/[?&]sw=1/.test(location.search)) return;
    navigator.serviceWorker.register('./sw.js').then(reg => {
      const notify = w => w && w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) toast('Nieuwe versie beschikbaar', { action: 'reload', label: 'Herladen' });
      });
      if (reg.installing) notify(reg.installing);
      reg.addEventListener('updatefound', () => notify(reg.installing));
    }).catch(() => { });
  }

  /* ================= Inloggen en synchronisatie (alleen als Supabase ingesteld is) ================= */
  // S.auth = null (app open) of { view: 'login' | 'password' | 'sent', error, info, busy, email }
  function renderAuth() {
    const a = S.auth;
    $('#tabbar').hidden = true;
    stopRest();
    const err = a.error ? `<p class="auth-msg err" role="alert">${icon('alert')}<span>${esc(a.error)}</span></p>` : '';
    const info = a.info ? `<p class="auth-msg" role="status">${icon('info')}<span>${esc(a.info)}</span></p>` : '';
    const offline = !navigator.onLine ? `<p class="auth-msg" role="status">${icon('info')}<span>Je bent offline. Inloggen kan pas met internet.</span></p>` : '';
    const brand = `<div class="auth-brand"><span class="wordmark">comeback</span><span class="eyebrow">Persoonlijke ruimte</span></div>`;
    let body;
    if (a.view === 'password') {
      body = `<h1 class="auth-title">${a.reason === 'invite' ? 'Welkom.' : 'Nieuw wachtwoord.'}</h1>
        <p class="auth-sub">${a.reason === 'invite' ? 'Kies een wachtwoord om je account af te werken.' : 'Kies een nieuw wachtwoord voor'} <b>${esc((Sync.user() || {}).email || '')}</b></p>
        ${err}
        <form id="password-form" novalidate>
          <label class="field"><span>Nieuw wachtwoord</span>
            <div class="pw-wrap"><input class="input" type="password" name="password" id="auth-pw" autocomplete="new-password" minlength="8" required aria-describedby="pw-hint">
            <button type="button" class="pw-toggle" data-action="pw-toggle" aria-label="Wachtwoord tonen" aria-pressed="false">${icon('eye')}</button></div></label>
          <p class="label" id="pw-hint" style="margin:-8px 0 16px">Minstens 8 tekens.</p>
          <button class="btn accent block lg" type="submit" ${a.busy ? 'disabled' : ''}>${a.busy ? 'Bewaren…' : 'Wachtwoord bewaren'}</button>
        </form>`;
    } else {
      body = `<h1 class="auth-title">Welkom terug.</h1>
        <p class="auth-sub">Jouw plek. Jouw ritme. Jouw comeback.</p>
        ${offline}${err}${info}
        <form id="login-form" novalidate>
          <label class="field"><span>E-mail</span><input class="input" type="email" name="email" id="auth-email" autocomplete="username" inputmode="email" autocapitalize="off" spellcheck="false" required value="${esc(a.email || '')}"></label>
          <label class="field"><span>Wachtwoord</span>
            <div class="pw-wrap"><input class="input" type="password" name="password" id="auth-pw" autocomplete="current-password" required>
            <button type="button" class="pw-toggle" data-action="pw-toggle" aria-label="Wachtwoord tonen" aria-pressed="false">${icon('eye')}</button></div></label>
          <button type="button" class="link-btn auth-forgot" data-action="auth-forgot">Wachtwoord vergeten?</button>
          <button class="btn accent block lg" type="submit" ${a.busy ? 'disabled' : ''}>${a.busy ? 'Inloggen…' : 'Inloggen'}</button>
        </form>
        <p class="auth-foot">Accounts worden alleen op uitnodiging aangemaakt. Je gegevens blijven ook offline op dit toestel.</p>`;
    }
    main.innerHTML = `<section class="auth">${brand}<div class="auth-body">${body}</div></section>`;
    const first = $(a.view === 'password' ? '#auth-pw' : (a.email ? '#auth-pw' : '#auth-email'));
    if (first && !a.busy && !matchMedia('(pointer: coarse)').matches) first.focus();
  }
  function setAuth(patch) { S.auth = { ...(S.auth || { view: 'login' }), ...patch }; render(); }

  async function submitLogin(form) {
    const email = form.email.value.trim(), pw = form.password.value;
    if (!email || !pw) { setAuth({ email, error: 'Vul je e-mailadres en wachtwoord in.', info: null }); return; }
    setAuth({ email, busy: true, error: null, info: null });
    try {
      const user = await Sync.signIn(email, pw);
      await afterSignIn(user);
    } catch (e) { setAuth({ busy: false, error: e.message }); }
  }

  async function submitPassword(form) {
    const pw = form.password.value;
    if (pw.length < 8) { setAuth({ error: 'Gebruik minstens 8 tekens.' }); return; }
    setAuth({ busy: true, error: null });
    try { await Sync.setPassword(pw); await afterSignIn(Sync.user(), 'Wachtwoord bewaard'); }
    catch (e) { setAuth({ busy: false, error: e.message }); }
  }

  async function forgotPassword() {
    const email = (($('#auth-email') || {}).value || '').trim();
    if (!email) { setAuth({ error: 'Vul eerst je e-mailadres in.', info: null }); return; }
    setAuth({ email, busy: true, error: null, info: null });
    try { await Sync.recover(email); setAuth({ busy: false, info: 'Als dit adres een account heeft, krijg je zo een mail met een link om een nieuw wachtwoord te kiezen.' }); }
    catch (e) { setAuth({ busy: false, error: e.message }); }
  }

  // Na inloggen: bij een ander account eerst de lokale gegevens wissen, dan synchroniseren
  async function afterSignIn(user, msg) {
    const prev = Sync.lastUserId();
    if (prev && user && prev !== user.id) {
      const own = ['checks', 'workouts', 'activities'].some(s => (S.raw[s] || []).some(x => !x.sample));
      if (own && !await ask('Op dit toestel staan gegevens van een ander account. Die worden gewist voor je verdergaat. Maak eventueel eerst een back-up.', { ok: 'Wissen en verdergaan', danger: true, title: 'Ander account' })) {
        await Sync.signOut(); setAuth({ view: 'login', busy: false }); return;
      }
      await Sync.resetLocal();
      await reloadData();
    }
    S.auth = null;
    startSync();
    render();
    toast(msg || `Ingelogd als ${user.email}`);
    const first = !Sync.lastSyncAt();
    if (first) showLoading('Je gegevens worden gesynchroniseerd…');
    try { await Sync.syncNow(); } finally { hideLoading(); }
    await reloadData();
  }

  function startSync() {
    Sync.start({
      onRemoteChange: reloadData,
      onAuthLost: msg => { if (!S.auth) { toast(msg, { action: 'auth-relogin', label: 'Inloggen' }); if (currentRoute() === 'account') render({ keepScroll: true }); } }
    });
  }

  async function reloadData() {
    await loadAll();
    await migrate();
    registerCustom();
    // Niet hertekenen terwijl je iets aan het typen bent
    const a = document.activeElement;
    if (!S.auth && !(a && main.contains(a) && a.matches('input, textarea, select'))) render({ keepScroll: true });
  }

  async function signOutFlow() {
    const n = Sync.state().pending;
    if (navigator.onLine && n) await Sync.syncNow();
    const left = Sync.state().pending;
    if (!await ask(`Je gegevens blijven op dit toestel staan.${left ? ` ${left} wijziging${left === 1 ? '' : 'en'} kon${left === 1 ? '' : 'den'} nog niet verstuurd worden; dat gebeurt zodra je weer inlogt.` : ''}`, { ok: 'Uitloggen', title: 'Uitloggen?' })) return;
    await Sync.signOut();
    S.auth = { view: 'login', email: '' };
    location.hash = 'vandaag';
    render();
  }

  // Blok in Account: met wie je ingelogd bent en hoe de synchronisatie loopt
  function syncCardHtml() {
    if (!Sync.configured()) {
      return `<p class="small muted">Je gegevens staan alleen op dit toestel. Synchronisatie met Supabase is niet ingesteld (zie <code>js/env.js</code>).</p>`;
    }
    const u = Sync.user(), st = Sync.state(), last = Sync.lastSyncAt();
    if (!u) return `<p class="small warn-text">Je sessie is verlopen. Wijzigingen blijven bewaard op dit toestel.</p>
      <button class="btn accent block mt-12" data-action="auth-relogin">Opnieuw inloggen</button>`;
    const line = st.status === 'syncing' ? 'Bezig met synchroniseren…'
      : st.status === 'offline' ? 'Offline. Je wijzigingen worden verstuurd zodra je weer verbinding hebt.'
        : st.status === 'error' ? st.error
          : last ? `Gesynchroniseerd ${relDay(dkey(new Date(last)))} om ${fmtTime(last)}.` : 'Nog niet gesynchroniseerd.';
    return `<div class="list-row" style="padding-top:0"><div class="ico">${icon('user')}</div><div class="body"><b>${esc(u.email)}</b><span id="sync-line" class="${st.status === 'error' ? 'warn-text' : ''}">${esc(line)}${st.pending ? ` ${st.pending} wijziging${st.pending === 1 ? '' : 'en'} wacht${st.pending === 1 ? '' : 'en'}.` : ''}</span></div></div>
      <div class="row mt-12"><button class="btn" data-action="sync-now" ${st.status === 'syncing' ? 'disabled' : ''}>${icon('sync')} Synchroniseren</button><button class="btn" data-action="sign-out">Uitloggen</button></div>`;
  }

  /* ================= Migraties ================= */
  // Zet bestaande data om wanneer het datamodel verandert. Er gaat niets verloren.
  const DATA_VERSION = 6;
  async function migrate() {
    const v = S.settings.dataVersion || 1;
    if (v >= DATA_VERSION) return;
    if (v < 3) {
      // v3: matchen krijgen een id, tegenstander, thuis/uit, score vanuit KFC Lint en een sleutel voor samenvoegen
      if (Array.isArray(S.settings.fixtures)) await setSetting('fixtures', fixtures());
      // v3: profiel krijgt een naam voor het wedstrijdblad
      if (S.settings.profile && !S.settings.profile.rbfaName) await setSetting('profile', { ...S.settings.profile, rbfaName: C.rbfa.player });
    }
    if (v < 4) {
      // Veiligheidskopie van je oude ochtendscores, voor het geval dat
      await setSetting('backupBeforeV4', { at: Date.now(), checks: (S.raw.checks || []).filter(c => !c.sample) });
      // v4: het oorspronkelijke plan wordt een hersteltraject 'Achillespees en kuit' met eigen afspraken
      // Alleen wie al gegevens van het oorspronkelijke plan had, krijgt het traject "Achillespees en kuit"
      const legacy = (S.raw.checks || []).some(c => !c.sample) || (S.raw.workouts || []).some(w => !w.sample) || !!S.settings.phase || !!S.settings.criteria;
      if (!injuries().length && legacy) {
        const crit = S.settings.criteria || {};
        const start = C.phases[0].start;
        await setSetting('injuries', [{
          id: 'inj1', location: 'achillespees', label: 'Achillespees en kuit', side: 'beide', status: 'actief', start, end: null,
          notes: (S.settings.profile && S.settings.profile.complaints) || C.profile.complaints || '',
          program: 'kuitpees', painLimit: C.painRule.maxDuring,
          agreements: [{ id: newId(), date: start, text: `${C.painRule.text} (uit het oorspronkelijke plan; bevestig met je kinesist)` }],
          evals: C.phases.slice(1).map(ph => ({ id: newId(), date: ph.start, label: `${ph.label}: ${ph.title}` })),
          checklist: C.criteria.map(c => ({ id: c.id, text: c.text, done: crit[c.id] || null })),
          maintenance: [], linked: []
        }]);
      }
      // Oude ochtendscores (stijfheid links/rechts) blijven bij dat traject; pijn was toen niet gemeten
      const conv = (S.raw.checks || []).filter(c => c.left != null || c.right != null).map(c => {
        const n = { ...c, inj: { ...(c.inj || {}), inj1: { stiff: { L: c.left ?? null, R: c.right ?? null }, pain: {} } } };
        delete n.left; delete n.right; return n;
      });
      if (conv.length) await DB.bulkPut('checks', conv);
      await setSetting('goal', goal());
      if (S.settings.demo === undefined) await setSetting('demo', false);
    }
    if (v < 5) {
      // v5: lopen en andere sport erbij (alleen nieuwe velden). Eerst een lokale kopie, er verandert geen bestaand record.
      const real = l => (l || []).filter(x => !x.sample);
      await setSetting('backupBeforeV5', { at: Date.now(), workouts: real(S.raw.workouts), activities: real(S.raw.activities), checks: real(S.raw.checks) });
    }
    if (v < 6) {
      // v6: de kalender start leeg. Eerst een lokale kopie; daarna je vaste planning, de weekplanning van
      // herstelplannen en je eigen planningswijzigingen vanaf vandaag weg. Gelogde gegevens blijven.
      const tk = dkey(today());
      await setSetting('backupBeforeV6', { at: Date.now(), workoutSchedule: S.settings.workoutSchedule || [], schedule: S.settings.schedule || [], overrides: S.settings.overrides || {}, injuries: injuries() });
      const ov = { ...(S.settings.overrides || {}) };
      Object.keys(ov).forEach(k => { if (k >= tk) delete ov[k]; });
      await setSetting('overrides', ov);
      await setSetting('workoutSchedule', []);
      await setSetting('schedule', []);
      if (injuries().some(i => (i.schedule || []).length)) await setSetting('injuries', injuries().map(i => ({ ...i, schedule: [] })));
    }
    await setSetting('dataVersion', DATA_VERSION);
    await loadAll();
  }

  /* ================= Start ================= */
  async function init() {
    try {
      // Teksten op de achtergrond laden: de app opent er niet trager door
      loadQuotes();
      await loadAll();
      await migrate();
      registerCustom();
      if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
      if (Sync.configured()) {
        // Link uit een uitnodigings- of herstelmail
        const r = await Sync.consumeRedirect();
        if (r && r.error) S.auth = { view: 'login', error: r.error };
        else if (r && (r.type === 'invite' || r.type === 'recovery')) S.auth = { view: 'password', reason: r.type };
        else if (r) { S.auth = null; toast(`Ingelogd als ${r.user.email}`); }
        // Zonder sessie op dit toestel: eerst inloggen. Met sessie werkt alles ook offline.
        else if (!Sync.session()) S.auth = { view: 'login' };
        // Pas synchroniseren als je echt binnen bent (niet tijdens het kiezen van een wachtwoord)
        if (!S.auth) startSync();
        // Syncstatus in Account bijwerken (niet terwijl je in een veld typt)
        Sync.subscribe(() => {
          const a = document.activeElement;
          if (currentRoute() === 'account' && !S.auth && !document.querySelector('.sheet-backdrop') && !(a && main.contains(a) && a.matches('input, textarea, select'))) render({ keepScroll: true });
        });
      }
      if (draft() && !S.auth) requestWakeLock();
      render();
    } catch (err) {
      console.error(err);
      main.innerHTML = `<div class="alert" style="margin-top:40px">${icon('alert')}<div><strong>De app kon niet starten</strong>Je browser blokkeert mogelijk lokale opslag (bv. privévenster). ${esc(err && err.message)}</div></div>`;
    }
    registerSW();
    loadExtensions();
  }

  /* ================= Optionele uitbreidingen (AI-coach) ================= */
  // De AI-module krijgt een kleine, vaste set hulpfuncties. Staat AI_ENABLED uit, dan wordt js/ai.js niet geladen.
  window.ComebackApp = {
    main,
    rerender: () => render({ keepScroll: true }),
    addSub: (name, def) => { SUBS[name] = def; },
    addActions: map => Object.assign(actions, map),
    addSubmit: (id, fn) => { EXT_SUBMIT[id] = fn; },
    helpers: {
      esc, icon, iconBtn, cap, today, addDays, dkey, DAY, fmtDay, C, planFor, itemKey, itemMeta, itemStatus, findItem, newItemOf,
      workoutsOn, activitiesOn, woMinutes, activeInjuries, injuryLabel, injurySides, checkFor, checkVal, sessionTitle,
      moveItem, replaceItem, skipItem, addItemTo, doneOrCaughtUp
    }
  };
  function loadExtensions() {
    const env = window.COMEBACK_ENV || {};
    if (!env.AI_ENABLED || !Sync.configured()) return;
    const sc = document.createElement('script');
    sc.src = 'js/ai.js';
    sc.defer = true;
    document.body.appendChild(sc);
  }

  // Alleen voor tests in de browserconsole
  window.__comeback = { parseCalendar, parseMatchSheet, migrate: () => migrate(), reloadData };

  init();
})();
