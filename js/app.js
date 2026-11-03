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
    home: '<path d="M4 10.5L12 4l8 6.5V20H4z"/><path d="M10 20v-5h4v5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    dumbbell: '<path d="M3 12h18M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4"/>',
    chart: '<path d="M4 20h16M7 16v-5M12 16V6M17 16v-8"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c.8-3.8 3.8-5.6 7.5-5.6s6.7 1.8 7.5 5.6"/>',
    back: '<path d="M15 18l-6-6 6-6"/>',
    chevL: '<path d="M15 18l-6-6 6-6"/>',
    chevR: '<path d="M9 18l6-6-6-6"/>',
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
    magic: '<path d="M5 19L17 7M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
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
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#000000' : '#e8e8e5');
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
    const exists = it => it.type !== 'session' || !!C.sessions[it.id];
    const items = base.filter(it => !removed[itemKey(it)]);
    (ov.added || []).forEach(a => { if (exists(a) && !items.some(x => itemKey(x) === itemKey(a))) items.push({ ...a }); });
    const off = base.filter(it => removed[itemKey(it)] && exists(it)).map(it => ({ item: it, reason: removed[itemKey(it)] }));
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
  const sessionTitle = key => (C.sessions[key] && C.sessions[key].name) || key;
  // Naam van een opgeslagen workout: altijd de huidige naam uit de config (oude workouts heetten "Sessie A")
  const woTitle = w => (C.sessions[w.sessionKey] && C.sessions[w.sessionKey].name) || w.title;
  const sessionDesc = key => key === 'PLYO' ? `Stap ${plyoStep()} van 4: ${C.sessions.PLYO.steps[plyoStep() - 1].title}` : ((C.sessions[key] && (C.sessions[key].desc || C.sessions[key].subtitle)) || '');
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
      const sub = sessionDesc(it.id);
      return { icon: s.icon || 'dumbbell', title: sessionTitle(it.id), sub: `${s.place ? cap(s.place) + ' · ' : ''}${st.exercises} oefeningen · ±${st.minutes} min`, note: it.note, short: s.short || it.id, stats: st, subtitle: sub };
    }
    if (it.type === 'training') return { icon: 'whistle', title: 'Clubtraining', sub: it.time || '', note: it.note, short: 'Training' };
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
      if (k < planStart()) continue; // vóór de start van de huidige fase telt niets als gemist
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

  // Verwijderen: weg uit de planning (telt niet als gemist). Terugzetten kan in de kalender.
  function deleteItem(k, key) {
    const it = findItem(k, key);
    if (!it) return;
    const all = clone(overrides());
    if (it.from || it.extra) {
      editOv(all, k, o => { o.added = o.added.filter(a => itemKey(a) !== key); });
      if (it.from) editOv(all, it.from, o => { o.removed[key] = 'del'; });
    } else {
      editOv(all, k, o => { o.removed[key] = 'del'; });
    }
    closeSheet();
    saveOverrides(all, `${itemMeta(it).title} verwijderd uit de planning`);
  }

  function restoreItem(k, key) {
    const all = clone(overrides());
    const reason = ((all[k] || {}).removed || {})[key];
    if (reason && reason.startsWith('moved:')) editOv(all, reason.slice(6), o => { o.added = o.added.filter(a => itemKey(a) !== key); });
    editOv(all, k, o => { delete o.removed[key]; });
    saveOverrides(all, 'Terug in de planning gezet');
  }

  function addSessionTo(k, id, note = 'Extra toegevoegd') {
    const all = clone(overrides());
    if (planFor(parseKey(k)).some(x => itemKey(x) === `session:${id}`)) { closeSheet(); toast('Die sessie staat al op deze dag'); return; }
    editOv(all, k, o => { o.added.push({ type: 'session', id, extra: true, note }); });
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
      <p class="label" style="margin:8px 2px 16px">Zware sessies komen nooit op een matchdag of de dag ervoor, en de app vermijdt dagen waarop al een sessie staat.</p>` : ''}
      <p class="label" style="margin:0 2px 8px">Of kies zelf</p>
      <div class="day-pick">${days.map(o => `<button class="${o.best ? 'best' : ''}" data-action="move-to" data-from="${k}" data-key="${esc(key)}" data-to="${o.k}">
        <b>${cap(DAY_S[o.d.getDay()])} ${o.d.getDate()} ${MON[o.d.getMonth()]}</b>
        <span>${esc(o.label)}</span>
        <span class="tag ${o.best ? 'done' : o.score >= 0 ? '' : 'missed'}">${o.best ? 'Aanbevolen' : o.score >= 0 ? 'Kan' : esc(o.why[0] || 'Liever niet')}</span>
      </button>`).join('')}</div>
      <label class="field" style="margin-top:14px"><span>Andere datum</span>
        <div class="row"><input class="input" type="date" id="move-date" min="${dkey(today())}"><button class="btn primary" style="flex:0 0 auto" data-action="move-custom" data-from="${k}" data-key="${esc(key)}">Zet</button></div></label>`);
  }


  /* ================= Router ================= */
  // Hoofdtabs (zonder terugknop) en subschermen (met terugknop naar hun tab)
  const ROUTES = {
    vandaag: { label: 'Home', icon: 'home', render: () => renderToday() },
    kalender: { label: 'Kalender', icon: 'calendar', render: () => renderCalendarPage() },
    workout: { label: 'Workout', icon: 'dumbbell', render: () => renderWorkout() },
    statistieken: { label: 'Stats', icon: 'chart', render: () => renderStats() },
    account: { label: 'Account', icon: 'user', render: () => renderAccount() }
  };
  const SUBS = { matchen: { parent: 'account', render: () => renderMatches() } };
  const ALIASES = { profiel: 'account' };
  let lastRoute = null;
  const currentRoute = () => {
    const r = location.hash.slice(1);
    if (ALIASES[r]) return ALIASES[r];
    return ROUTES[r] || SUBS[r] ? r : 'vandaag';
  };

  function render({ keepScroll = false } = {}) {
    const r = currentRoute();
    const y = window.scrollY;
    if (r !== lastRoute && r === 'workout') S.ui.woView = null;
    (ROUTES[r] || SUBS[r]).render();
    renderTabbar(SUBS[r] ? SUBS[r].parent : r);
    if (keepScroll || r === lastRoute) window.scrollTo(0, y);
    else window.scrollTo(0, 0);
    lastRoute = r;
  }

  function renderTabbar(active) {
    const keys = Object.keys(ROUTES);
    const bar = $('#tabbar');
    bar.style.gridTemplateColumns = `repeat(${keys.length}, 1fr)`;
    bar.innerHTML = keys.map(key => {
      const r = ROUTES[key];
      // Alleen het icoon is zichtbaar; de naam blijft voor schermlezers en als tooltip
      return `<a class="tab ${key === active ? 'active' : ''}" href="#${key}" aria-label="${r.label}" title="${r.label}" ${key === active ? 'aria-current="page"' : ''}><span class="box">${icon(r.icon)}</span></a>`;
    }).join('');
  }

  // Kop voor een hoofdtab (geen terugknop) en voor een subscherm (wel een terugknop)
  const pageHead = (title, sub = '', right = '') =>
    `<header class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right}</header>`;
  const subHead = (title, back, sub = '', right = '') =>
    `<header class="sub-head">${iconBtn('back', 'go', 'Terug', `data-to="${back}"`)}<div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right || '<span></span>'}</header>`;

  /* ================= Home (vandaag) ================= */
  // Info over een sessie zoals de gebruiker ze ziet
  function sessInfo(id) {
    const s = C.sessions[id] || {};
    const st = sessionStats(id);
    return {
      name: sessionTitle(id), desc: sessionDesc(id), place: s.place || '',
      type: s.typeLabel || 'Kracht', icon: s.icon || 'dumbbell', ...st
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
  const itemType = it => it.type === 'session' ? 'kracht' : it.type === 'rest' ? 'rust' : it.type;

  // Het belangrijkste item van een dag: eerst een open krachtsessie, dan match, training, holds
  function mainItem(items, k) {
    const pick = arr => arr.find(it => it.type === 'session' && C.sessions[it.id] && C.sessions[it.id].catchUp !== false)
      || arr.find(it => it.type === 'match') || arr.find(it => it.type === 'session') || arr.find(it => it.type === 'training');
    return pick(items.filter(it => !itemDone(it, k))) || pick(items) || items[0];
  }

  function dayDotsHtml(d) {
    const k = dkey(d), tk = dkey(today());
    const types = {};
    planFor(d).forEach(it => {
      if (it.type === 'rest') return;
      const t = itemType(it), done = itemDone(it, k);
      if (!types[t] || done) types[t] = done ? 'done' : k < tk ? 'missed' : 'planned';
    });
    return Object.entries(types).slice(0, 3).map(([t, st]) => `<i class="dot t-${t} ${st === 'done' ? '' : 'planned'}"></i>`).join('');
  }

  function renderToday() {
    const t = today(), tk = dkey(t), p = profile();
    const k = S.ui.homeDay && S.ui.homeDay >= dkey(addDays(t, -3)) ? S.ui.homeDay : tk;
    const hr = new Date().getHours();
    const greet = hr < 12 ? 'Goeiemorgen' : hr < 18 ? 'Goeiemiddag' : 'Goeienavond';

    let strip = '';
    for (let i = -3; i <= 10; i++) {
      const d = addDays(t, i), dk = dkey(d);
      strip += `<button class="day ${dk === k ? 'on' : ''}" data-action="home-day" data-k="${dk}" ${dk === tk ? 'id="day-today"' : ''}>${dayLabel(dk)}<span class="day-dots">${dayDotsHtml(d)}</span></button>`;
    }

    main.innerHTML = `
      <header class="page-head">
        <div><h1>${greet}, ${esc(p.name)}</h1><p>${cap(fmtLong(t))} · ${esc(phaseObj(currentPhase()).label)}</p></div>
        <button class="avatar" data-action="go" data-to="account" aria-label="Account">${avatarInner()}</button>
      </header>
      <div class="day-strip" id="day-strip">${strip}</div>
      ${homeHero(k)}
      ${recoveryCard()}
      ${weekCard()}
      ${nextMatchCard()}
    `;
    const strip$ = $('#day-strip'), on = strip$.querySelector('.day.on');
    // Toon de gekozen dag, met een stukje van de vorige dag ernaast
    if (on) strip$.scrollLeft += on.getBoundingClientRect().left - strip$.getBoundingClientRect().left - 44;
  }

  function avatarInner() {
    const photo = S.settings.photo;
    return photo ? `<img src="${photo}" alt="">` : esc((profile().name || '?').charAt(0).toUpperCase());
  }

  // De grote oranje kaart: wat je die dag doet
  function homeHero(k) {
    const tk = dkey(today());
    const items = planFor(parseKey(k));
    const it = mainItem(items, k);
    const rel = dayLabel(k);
    const others = items.filter(x => x !== it && x.type !== 'rest');
    const also = others.length ? `<div class="hero-also">${others.map(o => {
      const m = itemMeta(o), done = itemDone(o, k);
      const act = o.type === 'session' ? (k === tk && !done ? `data-action="start-session" data-key="${o.id}"` : `data-action="cal-open" data-k="${k}"`)
        : `data-action="open-log" data-type="${o.type}" data-date="${k}"`;
      return `<button ${act}><span>${esc(m.title)}${o.time ? ' · ' + esc(o.time) : ''}</span>${done ? icon('check') : icon('chevR')}</button>`;
    }).join('')}</div>` : '';

    if (!it || it.type === 'rest') {
      return `<section class="hero">
        <span class="label">${rel} · Rust</span>
        <h2>Rustdag</h2><p>${esc((it && it.note) || 'Herstel hoort bij de training: wandelen, mobiliteit en goed slapen.')}</p>
        <div class="hero-stats"></div>
        <button class="btn line block" data-action="cal-open" data-k="${k}">${icon('plus')} Toch iets plannen</button>${also}
      </section>`;
    }
    const done = itemDone(it, k);
    if (it.type === 'session') {
      const s = sessInfo(it.id);
      let btn;
      if (done) btn = `<button class="btn line block lg" data-action="cal-open" data-k="${k}">${icon('check')} Afgewerkt</button>`;
      else if (k === tk) btn = `<button class="btn primary block lg" data-action="start-session" data-key="${it.id}">${icon('play')} Start workout</button>`;
      else if (k < tk) btn = `<button class="btn primary block lg" data-action="start-session" data-key="${it.id}">${icon('play')} Nu inhalen</button>`;
      else btn = `<button class="btn line block lg" data-action="cal-open" data-k="${k}">Bekijk of verplaats</button>`;
      return `<section class="hero">
        <span class="label">${rel} · ${esc(s.type)}${s.place ? ' · ' + esc(s.place) : ''}</span>
        <h2>${esc(s.name)}</h2><p>${esc(s.desc)}</p>
        <div class="hero-stats">
          <div class="num">${s.minutes}<span class="unit">min</span></div>
          <div class="num">${s.exercises}<span class="unit">oefeningen</span></div>
        </div>
        ${btn}${also}
      </section>`;
    }
    if (it.type === 'match') {
      const f = it.fixture;
      const isPast = k <= tk;
      const action = done ? `<button class="btn line block lg" data-action="cal-open" data-k="${k}">${icon('check')} Gelogd</button>`
        : isPast ? `<button class="btn primary block lg" data-action="${f && played(f) ? 'open-minutes' : 'open-log'}" data-type="match" data-date="${k}">${icon('edit')} Minuten invullen</button>`
          : `<button class="btn line block lg" data-action="cal-open" data-k="${k}">Bekijk in kalender</button>`;
      return `<section class="hero">
        <span class="label">${rel} · Match${f ? ' · ' + (f.home ? 'thuis' : 'uit') : ''}</span>
        <h2>${f ? esc(f.opponent) : 'Match'}</h2><p>${f && f.comp ? esc(f.comp) : 'Log na de match je minuten en hoe het voelde.'}</p>
        <div class="hero-stats">${f && f.time ? `<div class="num">${esc(f.time)}</div>` : ''}${f && played(f) ? `<div class="num">${f.gf}–${f.ga}</div>` : ''}</div>
        ${action}${also}
      </section>`;
    }
    return `<section class="hero">
      <span class="label">${rel} · Training</span>
      <h2>Clubtraining</h2><p>Met de ploeg. Noteer na afloop hoe het voelde.</p>
      <div class="hero-stats">${it.time ? `<div class="num">${esc(it.time.split('–')[0])}</div>` : ''}</div>
      ${done ? `<button class="btn line block lg" data-action="cal-open" data-k="${k}">${icon('check')} Gelogd</button>`
        : `<button class="btn primary block lg" data-action="open-log" data-type="training" data-date="${k}">${icon('edit')} Training loggen</button>`}
      ${also}
    </section>`;
  }

  function recoveryCard() {
    const tk = dkey(today());
    const chk = checkFor(tk), last = lastCheck();
    const warn = morningWarning();
    const L = [], R = [];
    for (let i = 13; i >= 0; i--) { const c = checkFor(dkey(addDays(today(), -i))); L.push(c ? c.left : null); R.push(c ? c.right : null); }
    const shown = chk || last;
    let status;
    if (warn) status = `<p class="status-line warn">Hoger dan gisteren (${esc(warn.join(', '))}). Zet vandaag een stap terug: lichter trainen, geen sprongen.</p>`;
    else if (chk) status = `<p class="status-line">Niet hoger dan gisteren. Je mag trainen volgens plan.</p>`;
    else status = `<p class="status-line">Nog niet ingevuld vandaag${last ? ` · laatste: ${relDay(last.date)}` : ''}.</p>`;
    return `<section class="card">
      <div class="card-head"><h2>Herstel</h2><span class="label">Stijfheid 0–10</span></div>
      <div class="split" style="align-items:end">
        <div class="recovery-nums">
          <div class="num">${shown ? shown.left : '–'}<span class="unit">links</span></div>
          <div class="num">${shown ? shown.right : '–'}<span class="unit">rechts</span></div>
        </div>
        <div>${Charts.spark([{ color: 'var(--accent)', values: L }, { color: 'var(--muted)', values: R }])}<span class="label" style="display:block;text-align:right;margin-top:4px">14 dagen</span></div>
      </div>
      ${status}
      ${chk ? `<button class="link-btn" style="margin-top:8px" data-action="open-score">Score aanpassen ${icon('chevR')}</button>`
        : `<button class="btn primary block" style="margin-top:14px" data-action="open-score">${icon('edit')} Vul je score van vandaag in</button>`}
    </section>`;
  }

  // Telt wat er deze week gepland en afgewerkt is (holds apart, omdat die dagelijks zijn)
  function weekCounts() {
    const start = startOfWeek(today());
    const c = { kracht: [0, 0], training: [0, 0], match: [0, 0], holds: [0, 0] };
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i), k = dkey(d);
      planFor(d).forEach(it => {
        if (it.type === 'rest') return;
        const bucket = it.type === 'session' ? (C.sessions[it.id] && C.sessions[it.id].catchUp === false ? 'holds' : 'kracht') : it.type;
        c[bucket][1]++;
        if (doneOrCaughtUp(it, k)) c[bucket][0]++;
      });
    }
    return c;
  }

  function weekCard() {
    const c = weekCounts();
    const done = c.kracht[0] + c.training[0] + c.match[0];
    const total = c.kracht[1] + c.training[1] + c.match[1];
    return `<section class="card">
      <div class="card-head"><h2>Deze week</h2><span class="label">week ${isoWeek(today())}</span></div>
      <div class="gauge-wrap">${Charts.gauge(done, total)}
        <div class="gauge-center"><div class="num">${done}<span class="unit">van ${total}</span></div><span class="label">geplande items afgewerkt</span></div>
      </div>
      <div class="week-split">
        <div><b>${c.kracht[0]}/${c.kracht[1]}</b><span>kracht</span></div>
        <div><b>${c.training[0]}/${c.training[1]}</b><span>trainingen</span></div>
        <div><b>${c.match[0]}/${c.match[1]}</b><span>matchen</span></div>
      </div>
      ${c.holds[1] ? `<p class="status-line">Kuit & pees isometrisch: ${c.holds[0]} van ${c.holds[1]} dagen gedaan.</p>` : ''}
    </section>`;
  }

  function nextMatchCard() {
    const tk = dkey(today());
    const f = fixtures().find(x => x.date >= tk && !played(x));
    if (f) {
      const days = daysBetween(today(), parseKey(f.date));
      return `<section class="card list-row tap" style="padding:16px" data-action="cal-open" data-k="${f.date}">
        <div class="ico">${icon('ball')}</div>
        <div class="body"><span class="label">Volgende match · ${days === 0 ? 'vandaag' : days === 1 ? 'morgen' : `over ${days} dagen`}</span>
          <b style="font-size:17px;margin-top:2px">${esc(f.opponent)}</b>
          <span>${f.home ? 'Thuis' : 'Uit'} · ${fmtDay(f.date)}${f.time ? ' · ' + esc(f.time) : ''}</span></div>
        <div class="end">${icon('chevR')}</div>
      </section>`;
    }
    let next = null;
    for (let i = 0; i < 14 && !next; i++) { const d = addDays(today(), i); if (planFor(d).some(x => x.type === 'match')) next = dkey(d); }
    return `<section class="card list-row" style="padding:16px">
      <div class="ico">${icon('ball')}</div>
      <div class="body"><span class="label">Volgende match</span>
        <b style="margin-top:2px">${next ? cap(fmtDay(next)) : 'Geen match gepland'}</b>
        <span>Tegenstander en uur zie je na het importeren van de RBFA-kalender.</span></div>
      <div class="end"><button class="btn sm" data-action="open-rbfa">Importeer</button></div>
    </section>`;
  }

  // Ochtendscore invullen met grote knoppen (0–10)
  function openScore() {
    const chk = checkFor(dkey(today())) || lastCheck() || { left: 0, right: 0 };
    const pad = (side, v) => `<div class="score-row"><div class="top"><b>${side === 'L' ? 'Links' : 'Rechts'}</b><span class="label">0 = niets · 10 = heel stijf</span></div>
      <div class="score-pad" data-side="${side}">${Array.from({ length: 11 }, (_, i) => `<button class="${i === v ? 'on' : ''} ${i > MAX_PAIN ? 'hi' : ''}" data-action="score-pick" data-v="${i}">${i}</button>`).join('')}</div></div>`;
    openSheet(`<div class="sheet-head"><div><h3>Ochtendscore</h3><p>Hoe stijf voelen je achillespees en kuit bij het opstaan?</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${pad('L', chk.left)}${pad('R', chk.right)}
      <button class="btn primary block lg" data-action="save-check">${icon('check')} Opslaan</button>`);
  }

  async function saveCheck() {
    const k = dkey(today());
    const val = side => { const b = document.querySelector(`.score-pad[data-side="${side}"] .on`); return b ? +b.dataset.v : 0; };
    const rec = { date: k, left: val('L'), right: val('R'), savedAt: Date.now(), sample: false };
    await DB.put('checks', rec);
    S.checks = S.checks.filter(c => c.date !== k).concat(rec);
    closeSheet();
    render({ keepScroll: true });
    toast(morningWarning() ? 'Opgeslagen. Je score is hoger dan gisteren: zet een stap terug.' : 'Ochtendscore opgeslagen');
  }



  /* ================= Kalender ================= */
  const TYPE_LABEL = { kracht: 'Kracht', training: 'Training', match: 'Match', rust: 'Rust' };
  const planStart = () => S.settings.phaseSince || phaseObj(currentPhase()).start;

  // Ingehaald = dezelfde sessie later in dezelfde week toch gedaan
  function caughtUp(it, k) {
    if (it.type !== 'session') return false;
    const end = dkey(addDays(startOfWeek(parseKey(k)), 6));
    return S.workouts.some(w => w.sessionKey === it.id && w.date > k && w.date <= end);
  }
  const doneOrCaughtUp = (it, k) => itemDone(it, k) || caughtUp(it, k);

  // Gemist = een in te halen sessie in het verleden, vanaf de start van de huidige fase, die niet gedaan is
  function isMissed(it, k) {
    return it.type === 'session' && C.sessions[it.id] && C.sessions[it.id].catchUp !== false
      && k < dkey(today()) && k >= planStart() && !doneOrCaughtUp(it, k);
  }

  function itemStatus(it, k) {
    if (itemDone(it, k)) return { cls: 'done', label: 'Gedaan' };
    if (caughtUp(it, k)) return { cls: 'done', label: 'Ingehaald' };
    if (isMissed(it, k)) return { cls: 'missed', label: 'Gemist' };
    if (k < dkey(today()) && it.type !== 'rest') return { cls: 'skip', label: 'Niet gedaan' };
    return { cls: '', label: 'Gepland' };
  }

  // Openen vanuit een ander scherm: spring naar de kalender op die dag
  function openDay(k) {
    closeSheet();
    S.ui.calDay = k;
    const d = parseKey(k);
    S.ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    if (currentRoute() === 'kalender') render({ keepScroll: true }); else location.hash = 'kalender';
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
    if (workoutsOn(k).length) set('kracht', 'done');
    activitiesOn(k).forEach(a => set(a.type, 'done'));
    if (fixtureOn(k) && !st.match) set('match', 'planned');
    return ['kracht', 'training', 'match', 'rust'].filter(t => st[t])
      .map(t => `<i class="dot t-${t} ${st[t] === 'done' ? '' : st[t]}"></i>`).join('');
  }

  function renderCalendarPage() {
    const t = today(), tk = dkey(t);
    const sel = S.ui.calDay || tk;
    const m = S.ui.calMonth || new Date(t.getFullYear(), t.getMonth(), 1);
    const start = startOfWeek(m);
    let cells = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map(d => `<div class="cal-wd">${d}</div>`).join('');
    for (let i = 0; i < 42; i++) {
      const d = addDays(start, i);
      if (i >= 35 && d.getMonth() !== m.getMonth()) break;
      const k = dkey(d);
      cells += `<button class="cal-cell ${d.getMonth() !== m.getMonth() ? 'out' : ''} ${k === tk ? 'today' : ''} ${k === sel ? 'on' : ''}" data-action="cal-pick" data-k="${k}" aria-label="${fmtDay(k)}">
        ${d.getDate()}<span class="dots">${calDots(d)}</span></button>`;
    }
    main.innerHTML = `
      ${pageHead('Kalender', 'Tik op een dag om te zien wat er gepland of gedaan is')}
      <section class="card">
        <div class="cal-head">
          ${iconBtn('chevL', 'cal-prev', 'Vorige maand')}
          <strong>${MONTH[m.getMonth()]} ${m.getFullYear()}</strong>
          ${iconBtn('chevR', 'cal-next', 'Volgende maand')}
        </div>
        <div class="cal-grid">${cells}</div>
        <div class="legend">
          ${['kracht', 'training', 'match', 'rust'].map(tp => `<span><i class="dot t-${tp}"></i>${TYPE_LABEL[tp]}</span>`).join('')}
        </div>
        <div class="legend-states">
          <span><i class="dot"></i>gedaan</span><span><i class="dot planned"></i>gepland</span><span><i class="dot missed"></i>gemist</span>
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
        ${past && !logged ? `<div class="day-item-actions"><button class="btn sm primary" data-action="${played(f) ? 'open-minutes' : 'open-log'}" data-type="match" data-date="${k}">${icon('edit')} Minuten invullen</button></div>` : ''}
      </div>`;
    }

    items.filter(it => !(f && it.type === 'match')).forEach(it => {
      const m = itemMeta(it), key = itemKey(it), st = itemStatus(it, k);
      if (it.type === 'rest') {
        html += `<div class="day-item"><div class="day-item-top"><span class="type-bar" style="background:var(--c-rust)"></span><div class="body"><b>Rustdag</b><span>${esc(it.note || 'Wandelen, mobiliteit en goed slapen')}</span></div></div></div>`;
        return;
      }
      let actions = '';
      // Voorbije holds en dagen vóór de start van de fase hoef je niet meer in te halen
      const noCatchUp = it.type === 'session' && k < tk && (C.sessions[it.id].catchUp === false || k < planStart());
      if (!doneOrCaughtUp(it, k) && !noCatchUp) {
        const del = `<button class="btn sm" data-action="del-item" data-k="${k}" data-key="${esc(key)}">${icon('trash')} Verwijder</button>`;
        if (it.type === 'session') {
          const s = C.sessions[it.id];
          actions = `<button class="btn sm ${k <= tk ? 'primary' : ''}" data-action="start-session" data-key="${it.id}">${icon('play')} ${k < tk ? 'Inhalen' : 'Start'}</button>
            ${s.catchUp === false ? '' : `<button class="btn sm" data-action="open-move" data-k="${k}" data-key="${esc(key)}">${icon('move')} Verplaats</button>`}
            ${s.custom ? `<button class="btn sm" data-action="edit-custom" data-key="${it.id}">${icon('edit')} Aanpassen</button>`
              : it.extra ? '' : `<button class="btn sm" data-action="skip-item" data-k="${k}" data-key="${esc(key)}">${icon('skip')} Overslaan</button>`}
            ${del}`;
        } else {
          actions = `${past ? `<button class="btn sm primary" data-action="open-log" data-type="${it.type}" data-date="${k}">${icon('edit')} Loggen</button>` : ''}${del}`;
        }
      }
      html += `<div class="day-item">
        <div class="day-item-top"><span class="type-bar" style="background:var(--c-${itemType(it)})"></span>
          <div class="body"><b>${esc(m.title)}</b><span>${esc(it.type === 'session' ? sessionDesc(it.id) : m.sub)}${it.note ? ' · ' + esc(it.note) : ''}</span></div>
          <span class="tag ${st.cls}">${st.label}</span></div>
        ${actions ? `<div class="day-item-actions">${actions}</div>` : ''}
      </div>`;
    });

    off.forEach(o => {
      const m = itemMeta(o.item);
      const txt = o.reason === 'skip' ? 'Overgeslagen' : o.reason === 'del' ? 'Verwijderd uit de planning' : `Verplaatst naar ${fmtDay(o.reason.slice(6))}`;
      html += `<div class="day-item"><div class="day-item-top"><span class="type-bar" style="background:var(--line)"></span>
        <div class="body"><b class="muted">${esc(m.title)}</b><span>${esc(txt)}</span></div><span class="tag skip">${o.reason === 'skip' ? 'Overgeslagen' : o.reason === 'del' ? 'Verwijderd' : 'Verplaatst'}</span></div>
        <div class="day-item-actions"><button class="btn sm" data-action="restore-item" data-k="${k}" data-key="${esc(itemKey(o.item))}">${icon('undo')} Terugzetten</button></div></div>`;
    });

    if (!html) html = `<p class="empty">Niets gepland.</p>`;

    const logged = [];
    if (chk) logged.push(`<div class="list-row"><div class="ico">${icon('pulse')}</div><div class="body"><b>Ochtendscore</b><span>Links ${chk.left} · rechts ${chk.right}</span></div></div>`);
    ws.forEach(w => logged.push(`<div class="list-row tap" data-action="show-entry" data-store="workouts" data-id="${w.id}"><div class="ico">${icon((C.sessions[w.sessionKey] || {}).icon || 'dumbbell')}</div><div class="body"><b>${esc(woTitle(w))}</b><span>${sum((w.exercises || []).map(e => e.sets.length))} sets${w.finishedAt ? ' · ' + fmtTime(w.finishedAt) : ''}</span></div><div class="end">${icon('chevR')}</div></div>`));
    acts.forEach(a => logged.push(`<div class="list-row tap" data-action="show-entry" data-store="activities" data-id="${a.id}"><div class="ico">${icon(a.type === 'match' ? 'ball' : 'whistle')}</div><div class="body"><b>${a.type === 'match' ? 'Match' : 'Clubtraining'}</b><span>${a.minutes} min · ${esc(a.surface)} · pijn ${a.pain}</span></div><div class="end">${icon('chevR')}</div></div>`));
    if (logged.length) html += `<div class="divider"></div><p class="label" style="margin-bottom:6px">Gelogd</p>${logged.join('')}`;

    html += `<div class="divider"></div><div class="day-actions">
      <button class="btn sm" data-action="add-menu" data-k="${k}">${icon('plus')} Sessie</button>
      ${past ? `<button class="btn sm" data-action="open-log" data-type="training" data-date="${k}">${icon('whistle')} Training loggen</button>` : ''}
    </div>`;
    return html;
  }

  function openAddMenu(k) {
    const ids = Object.keys(C.sessions);
    const own = ids.filter(id => C.sessions[id].custom), std = ids.filter(id => !C.sessions[id].custom);
    const small = 'style="width:36px;height:36px;background:transparent"';
    const row = id => `<div class="list-row"><div class="ico">${icon(C.sessions[id].icon)}</div>
        <div class="body" style="cursor:pointer" data-action="add-session" data-k="${k}" data-id="${id}"><b>${esc(sessionTitle(id))}</b><span>${esc(sessionDesc(id))}</span></div>
        <div class="end">${C.sessions[id].custom ? `<button class="icon-btn" ${small} data-action="edit-custom" data-key="${id}" aria-label="Aanpassen">${icon('edit')}</button><button class="icon-btn" ${small} data-action="delete-custom" data-key="${id}" aria-label="Verwijderen">${icon('trash')}</button>` : ''}
          <button class="icon-btn" style="width:36px;height:36px" data-action="add-session" data-k="${k}" data-id="${id}" aria-label="Toevoegen">${icon('plus')}</button></div></div>`;
    openSheet(`<div class="sheet-head"><div><h3>Toevoegen</h3><p>${cap(fmtDay(k))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <button class="btn accent block lg" data-action="new-custom" data-k="${k}">${icon('plus')} Eigen workout maken</button>
      <p class="label" style="margin:6px 2px 0">Kies zelf je oefeningen, sets, herhalingen of tijd en kg.</p>
      ${own.length ? `<div class="section"><span>Mijn workouts</span></div>${own.map(row).join('')}` : ''}
      <div class="section"><span>Uit je schema</span></div>${std.map(row).join('')}`);
  }

  /* ================= Eigen workouts ================= */
  // Bewaard in de instellingen: customSessions { X…: { name, items: [{ ex, sets, reps, duration, weight }] } }
  // en customExercises { cx…: { name, kind, load, … } }. Ze worden bij het starten in de config gezet.
  function registerCustom() {
    Object.entries(S.settings.customExercises || {}).forEach(([k, v]) => { C.exercises[k] = { rest: 60, ...v, custom: true }; });
    const cs = S.settings.customSessions || {};
    Object.keys(C.sessions).forEach(k => { if (C.sessions[k].custom && !cs[k]) delete C.sessions[k]; });
    Object.entries(cs).forEach(([k, v]) => {
      C.sessions[k] = {
        short: v.name, name: v.name, desc: `Eigen workout · ${v.items.map(it => (C.exercises[it.ex] || {}).name).filter(Boolean).slice(0, 3).join(', ')}${v.items.length > 3 ? '…' : ''}`,
        place: 'eigen workout', typeLabel: 'Eigen workout', icon: 'dumbbell', custom: true,
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

  function openBuilder(k, key) {
    const cs = (S.settings.customSessions || {})[key];
    S.ui.builder = { k, key: key || null, name: cs ? cs.name : '', items: cs ? clone(cs.items) : [], adding: false };
    renderBuilder(true);
  }

  function renderBuilder(fresh) {
    const b = S.ui.builder;
    const lib = Object.keys(C.exercises).filter(id => !C.exercises[id].custom).sort((a, c) => C.exercises[a].name.localeCompare(C.exercises[c].name));
    const own = Object.keys(C.exercises).filter(id => C.exercises[id].custom);
    const mini = (i, f, label, v, step) => `<div class="mini"><span>${label}</span><div class="mini-row">
        <button type="button" data-action="b-step" data-i="${i}" data-f="${f}" data-d="${-step}" aria-label="${label} min">−</button>
        <input inputmode="decimal" data-bi="${i}" data-bf="${f}" value="${v == null ? '' : String(v).replace('.', ',')}" placeholder="–" aria-label="${label}">
        <button type="button" data-action="b-step" data-i="${i}" data-f="${f}" data-d="${step}" aria-label="${label} plus">+</button></div></div>`;
    const rows = b.items.map((it, i) => {
      const ex = C.exercises[it.ex] || { name: '?' };
      return `<div class="b-item">
        <div class="b-top"><b>${esc(ex.name)}</b><button type="button" class="icon-btn" style="width:36px;height:36px;background:transparent" data-action="b-remove" data-i="${i}" aria-label="Oefening verwijderen">${icon('x')}</button></div>
        <div class="b-grid">
          ${mini(i, 'sets', 'Sets', it.sets, 1)}
          ${ex.kind === 'reps' || ex.kind === 'distance' ? mini(i, 'reps', ex.kind === 'distance' ? 'Keer' : 'Herhalingen', it.reps, 1) : mini(i, 'duration', 'Seconden', it.duration, 5)}
          ${ex.load === 'kg' || ex.load === 'bw' ? mini(i, 'weight', 'kg', it.weight, 2.5) : ''}
        </div>
      </div>`;
    }).join('');
    const html = `<div class="sheet-head"><div><h3>${b.key ? 'Eigen workout aanpassen' : 'Eigen workout'}</h3><p>${b.k ? `Voor ${fmtDay(b.k)}` : 'Kies je oefeningen en stel ze in'}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <label class="field"><span>Naam</span><input class="input" id="b-name" data-b="name" value="${esc(b.name)}" placeholder="Bv. Benen licht"></label>
      ${rows || '<p class="empty">Nog geen oefeningen. Voeg er hieronder een toe.</p>'}
      <div class="b-add">
        <label class="field" style="margin:0"><span>Oefening toevoegen</span>
          <select class="select" id="b-pick" data-change="b-pick" style="margin:0">
            <option value="">Kies een oefening…</option>
            <option value="__new">+ Nieuwe oefening maken</option>
            ${own.length ? `<optgroup label="Mijn oefeningen">${own.map(id => `<option value="${id}">${esc(C.exercises[id].name)}</option>`).join('')}</optgroup>` : ''}
            <optgroup label="Uit je schema">${lib.map(id => `<option value="${id}">${esc(C.exercises[id].name)}</option>`).join('')}</optgroup>
          </select></label>
        ${b.adding ? `<div class="b-new">
          <label class="field"><span>Naam van de oefening</span><input class="input" id="b-new-name" placeholder="Bv. Hamstring curl"></label>
          <div class="seg">${radio('b-kind', 'reps', 'Herhalingen + kg', 'reps')}${radio('b-kind', 'time', 'Op tijd', 'reps')}</div>
          <button type="button" class="btn block" data-action="b-new-add">${icon('plus')} Oefening toevoegen</button>
        </div>` : ''}
      </div>
      <button class="btn primary block lg" data-action="b-save">${icon('check')} ${b.key ? 'Opslaan' : b.k ? 'Opslaan en inplannen' : 'Opslaan'}</button>`;
    const sh = $('.sheet');
    if (!fresh && sh) { const y = sh.scrollTop; sh.innerHTML = html; sh.scrollTop = y; }
    else openSheet(html);
  }

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
    C.exercises[key] = kind === 'reps'
      ? { name, kind: 'reps', reps: [10, 10], load: 'kg', increment: 2.5, rest: 75, custom: true }
      : { name, kind: 'time', duration: 30, load: 'bw', rest: 45, custom: true };
    S.ui.builder.items.push(builderItem(key));
    S.ui.builder.adding = false;
    renderBuilder();
  }

  async function saveBuilder() {
    const b = S.ui.builder;
    b.name = ($('#b-name').value || '').trim();
    if (!b.name) { toast('Geef je workout een naam'); $('#b-name').focus(); return; }
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
    if (!b.key && b.k) { addSessionTo(b.k, key, ''); return; }
    closeSheet();
    render({ keepScroll: true });
    toast(b.key ? 'Eigen workout aangepast' : 'Eigen workout bewaard');
  }

  async function deleteCustom(key) {
    const cs = { ...(S.settings.customSessions || {}) };
    if (!cs[key] || !await ask(`"${cs[key].name}" verwijderen? Hij verdwijnt ook uit je planning. Afgewerkte workouts blijven bewaard.`, { ok: 'Verwijderen', danger: true })) return;
    delete cs[key];
    await setSetting('customSessions', cs);
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
    return done.length >= 2 && done.every(s => (num(s.reps) || 0) >= top && (num(s.pain) || 0) <= MAX_PAIN);
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
  function renderWorkout() {
    const w = draft();
    if (w && S.ui.woView !== 'picker') return renderActive(w);
    const t = today(), k = dkey(t);
    const todays = planFor(t).filter(it => it.type === 'session' && !itemDone(it, k));
    const rec = todays.find(it => C.sessions[it.id].catchUp !== false) || todays[0];
    const sm = S.ui.summary;
    const warn = morningWarning();

    main.innerHTML = `
      ${pageHead('Workout', `${esc(phaseObj(currentPhase()).label)} · ${esc(phaseObj(currentPhase()).title)}`)}
      ${sm ? `<div class="hint">${icon('check')}<span><b>${esc(sm.title)} opgeslagen.</b> ${sm.sets} sets in ${sm.minutes} min, hoogste pijn ${sm.maxPain ?? 0}/10.${sm.maxPain > MAX_PAIN ? ' Vul morgen zeker je ochtendscore in.' : ''}</span></div>` : ''}
      ${warn ? `<div class="hint warn">${icon('alert')}<span>Je ochtendscore is hoger dan gisteren. Train vandaag lichter en sla sprongen over.</span></div>` : ''}
      ${w ? `<section class="card">
        <span class="label">Bezig sinds ${fmtTime(w.startedAt)}</span>
        <h2 style="font-size:20px;font-weight:600;margin:4px 0 2px">${esc(woTitle(w))}</h2>
        <p class="muted small">Oefening ${w.current + 1} van ${w.exercises.length} · ${w.exercises.flatMap(x => x.sets).filter(s => s.done).length} sets gedaan</p>
        <div class="row" style="margin-top:14px"><button class="btn" data-action="wo-cancel">Stoppen</button><button class="btn primary" data-action="wo-resume">${icon('play')} Ga verder</button></div>
      </section>` : rec ? `<section class="hero">
        <span class="label">Aanbevolen vandaag · ${esc(sessInfo(rec.id).type)}</span>
        <h2>${esc(sessionTitle(rec.id))}</h2><p>${esc(sessionDesc(rec.id))}</p>
        <div class="hero-stats"><div class="num">${sessInfo(rec.id).minutes}<span class="unit">min</span></div><div class="num">${sessInfo(rec.id).exercises}<span class="unit">oefeningen</span></div></div>
        <button class="btn primary block lg" data-action="start-session" data-key="${rec.id}">${icon('play')} Start workout</button>
      </section>` : ''}
      <div class="section"><span>Alle sessies</span></div>
      <section class="card">
        ${Object.keys(C.sessions).map(key => {
          const s = sessInfo(key);
          const off = key === 'PLYO' && currentPhase() !== 'f3';
          return `<div class="list-row">
            <div class="ico">${icon(s.icon)}</div>
            <div class="body"><b>${esc(s.name)}</b><span>${off ? 'Pas vanaf fase 2 + 3' : `${esc(s.desc)}`}</span><span>${cap(s.place)} · ${s.exercises} oefeningen · ±${s.minutes} min</span></div>
            <div class="end"><button class="icon-btn" style="background:var(--card-2)" data-action="start-session" data-key="${key}" aria-label="Start ${esc(s.name)}">${icon('play')}</button></div>
          </div>`;
        }).join('')}
      </section>
      <p class="label" style="margin:12px 2px">${esc(C.painRule.text)}</p>
    `;
  }

  // Velden per soort oefening, met de stapgrootte voor de −/+ knoppen
  function fieldsFor(e) {
    const pain = { f: 'pain', l: 'Pijn', sub: `max ${MAX_PAIN} van 10`, step: 1, min: 0, max: 10, mode: 'numeric', start: 0 };
    if (e.kind === 'reps') {
      const goal = e.repsText || (e.target[0] === e.target[1] ? String(e.target[0]) : `${e.target[0]}–${e.target[1]}`);
      const f = [{ f: 'reps', l: 'Herhalingen', sub: `doel ${goal}`, step: 1, min: 0, max: 200, mode: 'numeric', start: e.target ? e.target[0] : 10 }];
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

  // Eén korte regel boven de sets: alleen als het gewicht omhoog mag, of als de pijn te hoog is
  function hintsHtml(e) {
    let html = '';
    if (e.sets.some(s => num(s.pain) > MAX_PAIN)) html += `<div class="hint warn">${icon('alert')}<span>Pijn boven ${MAX_PAIN}: maak het lichter of stop deze oefening.</span></div>`;
    if (progressionReady(e, e.sets)) html += `<div class="hint accent">${icon('up')}<span>${e.load === 'kg' ? `Volgende keer mag het gewicht +${fmtNum(e.increment)} kg omhoog.` : 'Volgende keer mag het zwaarder: kies een moeilijkere variant.'}</span></div>`;
    else if (e.prevReady) html += `<div class="hint accent">${icon('up')}<span>${e.load === 'kg' ? `Gewicht omhoog: vandaag +${fmtNum(e.bump)} kg, al ingevuld.` : 'Vorige keer ging vlot: maak het vandaag iets zwaarder.'}</span></div>`;
    return html;
  }

  function setLinesHtml(e) {
    return e.sets.map((s, i) => {
      const txt = setText(s, e.kind), p = num(s.pain);
      return `<button class="set-line ${s.done ? 'done' : ''} ${i === e.cur ? 'cur' : ''}" data-action="set-sel" data-i="${i}">
        <span class="n">${esc(s.label || `${s.idx + 1}`)}${s.side ? ' ' + s.side : ''}</span>
        <span class="val ${txt ? '' : 'empty-val'}">${txt || (i === e.cur ? 'nu bezig' : '–')}${p != null && txt ? ` · <span class="${p > MAX_PAIN ? 'pain-hi' : 'muted'}">pijn ${p}</span>` : ''}</span>
        <span class="ok">${s.done ? icon('check') : ''}</span>
      </button>`;
    }).join('');
  }

  function editorHtml(e) {
    const i = clamp(e.cur || 0, 0, e.sets.length - 1);
    const s = e.sets[i];
    const allDone = e.sets.every(x => x.done);
    const fields = fieldsFor(e);
    const steppers = fields.map(fd => `<div class="stepper ${fd.f === 'pain' && num(s.pain) > MAX_PAIN ? 'hi' : ''}">
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
    else buttons = `<button class="btn primary block lg" data-action="set-done">${icon('check')} Set klaar</button>`;
    return `<div class="editor-title"><b>${esc(setName(s))}</b><span class="label">${e.sets.filter(x => x.done).length} van ${e.sets.length} klaar</span></div>
      ${steppers}${buttons}`;
  }

  function renderActive(w) {
    w.current = clamp(w.current, 0, w.exercises.length - 1);
    const e = w.exercises[w.current], n = w.exercises.length;
    if (e.cur == null) e.cur = Math.max(0, e.sets.findIndex(s => !s.done));
    const kindLabel = { reps: 'Herhalingen', hold: 'Isometrische hold', time: 'Op tijd', distance: 'Afstand' }[e.kind];
    const last = w.current === n - 1;
    main.innerHTML = `
      <header class="sub-head">${iconBtn('back', 'wo-pause', 'Terug naar het overzicht')}
        <div><h1>${esc(woTitle(w))}</h1><p>Gestart om ${fmtTime(w.startedAt)}</p></div>
        <button class="link-btn" style="justify-self:end" data-action="wo-finish">Klaar</button></header>
      <div class="wo-progress">${w.exercises.map((x, i) => `<button class="${i === w.current ? 'cur' : x.sets.every(s => s.done) ? 'done' : ''}" data-action="wo-goto" data-i="${i}" aria-label="Oefening ${i + 1}: ${esc(x.name)}"></button>`).join('')}</div>
      <span class="label">Oefening ${w.current + 1} van ${n} · ${kindLabel}</span>
      <h2 class="ex-title" style="margin-top:4px">${esc(e.name)}</h2>
      <p class="ex-presc">${esc(e.presc)}</p>
      ${e.cue ? `<p class="ex-cue">${esc(e.cue)}</p>` : ''}
      <div id="wo-hints" style="margin-top:14px">${hintsHtml(e)}</div>
      <section class="editor" id="editor">${editorHtml(e)}</section>
      <section class="card" style="padding:8px 10px"><div class="set-lines" id="set-lines">${setLinesHtml(e)}</div>
        <button class="btn ghost sm" data-action="wo-add-set">${icon('plus')} Set toevoegen</button></section>
      <div class="wo-nav">
        <button class="btn" data-action="wo-prev" ${w.current === 0 ? 'disabled' : ''}>${icon('chevL')} Vorige</button>
        ${last ? `<button class="btn primary" data-action="wo-finish">${icon('check')} Afronden</button>`
          : `<button class="btn primary" data-action="wo-next">Volgende ${icon('chevR')}</button>`}
      </div>
      <button class="btn ghost block sm" data-action="rest-start">${icon('timer')} Rusttimer (${fmtSec(e.rest)})</button>
    `;
  }

  function curEx() { const w = draft(); return w ? w.exercises[w.current] : null; }
  function refreshSets() {
    const e = curEx(); if (!e) return;
    $('#set-lines').innerHTML = setLinesHtml(e);
    $('#wo-hints').innerHTML = hintsHtml(e);
  }

  function onSetInput(inp) {
    const e = curEx(); if (!e) return;
    const s = e.sets[+inp.dataset.set];
    if (!s) return;
    s[inp.dataset.f] = inp.value.trim();
    if (inp.dataset.f === 'pain') inp.closest('.stepper').classList.toggle('hi', num(inp.value) > MAX_PAIN);
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
    if (f === 'pain') inp.closest('.stepper').classList.toggle('hi', v > MAX_PAIN);
    refreshSets();
    saveDraft();
  }

  function completeSet() {
    const w = draft(), e = w.exercises[w.current], s = e.sets[e.cur];
    s.done = true;
    if (e.kind === 'reps' && s.reps === '' && e.target) s.reps = String(e.target[0] === e.target[1] ? e.target[0] : e.target[1]);
    if (hasTimer(e) && s.duration === '') s.duration = String(e.duration);
    if (e.kind === 'distance' && s.dist === '') s.dist = String(e.distance);
    // Volgende set alvast invullen met dezelfde waarden (zelfde kant)
    const next = e.sets.findIndex(x => !x.done);
    if (next >= 0) {
      const n = e.sets[next];
      ['reps', 'weight'].forEach(f => { if (n[f] === '' && s[f] !== '') n[f] = s[f]; });
      e.cur = next;
    }
    if (!w.exercises.every(x => x.sets.every(y => y.done))) startRest(e.rest);
    if (num(s.pain) > MAX_PAIN) toast(`Pijn ${num(s.pain)}/10: maak de volgende set lichter of stop`);
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
    e.cur = e.sets.findIndex(x => !x.done);
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
    if (!done.length) { if (!await ask('Je hebt nog geen sets afgevinkt. Toch opslaan als afgewerkte sessie?', { ok: 'Opslaan' })) return; }
    else if (done.length < all.length && !await ask(`${all.length - done.length} van de ${all.length} sets zijn niet afgevinkt. Workout toch afronden?`, { ok: 'Afronden' })) return;
    const clean = s => ({
      idx: s.idx, side: s.side, label: s.label || null,
      reps: num(s.reps), weight: num(s.weight), duration: num(s.duration), dist: num(s.dist), pain: num(s.pain), done: true
    });
    const rec = {
      date: w.date, sessionKey: w.sessionKey, title: sessionTitle(w.sessionKey), phase: w.phase,
      startedAt: w.startedAt, finishedAt: Date.now(), sample: false,
      exercises: w.exercises.map(x => ({ exId: x.exId, name: x.name, kind: x.kind, load: x.load, perSide: x.perSide, sets: x.sets.filter(s => s.done).map(clean) })).filter(x => x.sets.length)
    };
    rec.id = await DB.put('workouts', rec);
    S.workouts.push(rec);
    const pains = done.map(s => num(s.pain)).filter(v => v != null);
    S.ui.summary = { title: woTitle(w), sets: done.length, minutes: Math.max(1, Math.round((rec.finishedAt - w.startedAt) / 60000)), maxPain: pains.length ? Math.max(...pains) : null };
    S.settings.activeWorkout = null;
    await saveDraft(true);
    stopRest();
    releaseWakeLock();
    S.ui.woView = 'picker';
    render();
    toast('Workout opgeslagen');
  }

  async function cancelWorkout() {
    if (!await ask('Deze workout stoppen? Wat je ingevuld hebt, wordt niet bewaard.', { ok: 'Stoppen', danger: true })) return;
    S.settings.activeWorkout = null;
    await saveDraft(true);
    stopRest();
    releaseWakeLock();
    S.ui.woView = 'picker';
    render();
  }

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
      <p class="hold-sub">${esc(setName(s))} · pijn max ${MAX_PAIN}/10</p>
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
      ${pageHead('Stats')}
      <div class="seg" role="tablist">${STATS_TABS.map(([k, l]) => `<button class="${k === tab ? 'on' : ''}" role="tab" aria-selected="${k === tab}" data-action="stats-tab" data-t="${k}">${l}</button>`).join('')}</div>
      ${body}`;
  }

  function statsOverview() {
    const t = today();
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const ws = addDays(startOfWeek(t), -7 * i), k = dkey(ws);
      weeks.push({ start: ws, key: k, label: `W${isoWeek(ws)}`, value: S.workouts.filter(w => inWeek(w.date, k)).length });
    }
    const sel = clamp(S.ui.statsWeek ?? 7, 0, 7);
    const sw = weeks[sel];
    const swActs = S.activities.filter(a => inWeek(a.date, sw.key));
    const monthKey = dkey(t).slice(0, 7);
    const monthWorkouts = S.workouts.filter(w => w.date.startsWith(monthKey)).length;
    const monthMinutes = sum(S.activities.filter(a => a.date.startsWith(monthKey)).map(a => +a.minutes));
    const all = entries();
    const shown = S.ui.recentAll ? all : all.slice(0, 5);
    return `
      <div class="tiles">
        <div class="tile"><span class="label">Workouts in ${MONTH[t.getMonth()]}</span><div class="num">${monthWorkouts}</div></div>
        <div class="tile"><span class="label">Minuten voetbal in ${MONTH[t.getMonth()]}</span><div class="num">${monthMinutes}<span class="unit">min</span></div></div>
      </div>
      <section class="card">
        <div class="card-head"><h2>Workouts per week</h2><span class="label">tik op een week</span></div>
        ${Charts.bars(weeks, { selected: sel })}
        <p class="status-line">Week van ${fmtShort(sw.start)}: ${sw.value} workouts, ${swActs.filter(a => a.type === 'training').length} trainingen, ${swActs.filter(a => a.type === 'match').length} matchen, ${sum(swActs.map(a => +a.minutes))} minuten voetbal.</p>
      </section>
      <div class="section"><span>Recent</span><span>${all.length}</span></div>
      <section class="card">${recentRows(shown)}
        ${all.length > 5 ? `<button class="btn block sm" style="margin-top:10px" data-action="recent-all">${S.ui.recentAll ? 'Minder tonen' : `Alles tonen (${all.length})`}</button>` : ''}
      </section>`;
  }

  function statsRecovery() {
    const t = today(), range = S.ui.lineRange || 30;
    const labels = [], Lv = [], Rv = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = addDays(t, -i), c = checkFor(dkey(d));
      labels.push(fmtShort(d)); Lv.push(c ? c.left : null); Rv.push(c ? c.right : null);
    }
    const avg = arr => { const v = arr.filter(x => x != null); return v.length ? fmtNum(Math.round(sum(v) / v.length * 10) / 10) : '–'; };
    const has = Lv.some(v => v != null);
    // Hoogste pijn per workout (laatste 20)
    const pains = S.workouts.slice().sort((a, b) => a.date.localeCompare(b.date) || (a.finishedAt || 0) - (b.finishedAt || 0)).slice(-20)
      .map(w => ({ date: w.date, v: Math.max(-1, ...(w.exercises || []).flatMap(e => e.sets.map(s => num(s.pain))).filter(v => v != null)) }))
      .filter(p => p.v >= 0);
    return `
      <section class="card">
        <div class="card-head"><h2>Ochtendscore</h2>
          <div class="seg" style="margin:0;padding:2px">${[14, 30, 90].map(r => `<button class="${r === range ? 'on' : ''}" style="padding:6px 10px" data-action="line-range" data-r="${r}">${r} d</button>`).join('')}</div></div>
        <div class="recovery-nums" style="margin-bottom:12px">
          <div class="num md">${avg(Lv)}<span class="unit">gem. links</span></div>
          <div class="num md">${avg(Rv)}<span class="unit">gem. rechts</span></div>
        </div>
        ${has ? Charts.line({ labels, series: [{ color: 'var(--accent)', values: Lv }, { color: 'var(--ink)', values: Rv }], step: true })
          + `<div class="legend-line"><span><i style="background:var(--accent)"></i>Links</span><span><i style="background:var(--ink)"></i>Rechts</span></div>`
          : '<p class="empty">Nog geen ochtendscores in deze periode.</p>'}
      </section>
      <section class="card">
        <div class="card-head"><h2>Pijn tijdens workouts</h2><span class="label">hoogste per sessie</span></div>
        ${pains.length > 1 ? Charts.line({ labels: pains.map(p => fmtShort(p.date)), series: [{ color: 'var(--accent)', values: pains.map(p => p.v) }], step: true, ticks: [0, MAX_PAIN, 10] })
          + `<p class="status-line">De lijn op ${MAX_PAIN} is je grens: daarboven maak je de oefening lichter.</p>`
          : '<p class="empty">Nog te weinig workouts met een pijnscore.</p>'}
      </section>`;
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
    const sessions30 = S.workouts.filter(w => daysBetween(parseKey(w.date), today()) < 30 && C.sessions[w.sessionKey] && C.sessions[w.sessionKey].catchUp !== false).length;
    return `
      <div class="tiles">
        <div class="tile"><span class="label">Krachtsessies, 30 dagen</span><div class="num">${sessions30}</div></div>
        <div class="tile"><span class="label">Progressie</span><div class="num ${diff > 0 ? 'accent' : ''}">${diff > 0 ? '+' : ''}${fmtNum(diff)}<span class="unit">kg</span></div></div>
      </div>
      <section class="card">
        <div class="card-head"><h2>Gewicht per oefening</h2><span class="label">zwaarste set</span></div>
        <select class="select" data-change="weight-ex" aria-label="Kies oefening">${exIds.map(id => `<option value="${id}" ${id === S.ui.weightEx ? 'selected' : ''}>${esc(exWithWeight[id])}</option>`).join('')}</select>
        <div class="recovery-nums" style="margin-bottom:10px">
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
        <div class="body"><b>${esc(f.opponent)}</b><span>${cap(fmtDay(f.date))} · ${f.home ? 'thuis' : 'uit'} · ${a ? `${a.minutes} min gespeeld` : 'geen minuten ingevuld'}</span></div>
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
        ${playedFx.length > 6 ? `<button class="btn block sm" style="margin-top:10px" data-action="matches-all">${S.ui.matchesAll ? 'Minder tonen' : `Alles tonen (${playedFx.length})`}</button>` : ''}
      </section>`;
  }

  function entries() {
    const list = [];
    S.workouts.forEach(w => {
      const sets = sum((w.exercises || []).map(e => e.sets.length));
      const pains = (w.exercises || []).flatMap(e => e.sets.map(s => num(s.pain))).filter(v => v != null);
      list.push({
        store: 'workouts', id: w.id, date: w.date, ts: w.finishedAt || 0, icon: (C.sessions[w.sessionKey] || {}).icon || 'dumbbell',
        title: woTitle(w), sub: `${cap(relDay(w.date))} · ${sets} sets${pains.length ? ` · pijn max ${Math.max(...pains)}` : ''}`, sample: w.sample
      });
    });
    S.activities.forEach(a => list.push({
      store: 'activities', id: a.id, date: a.date, ts: a.createdAt || 0, icon: a.type === 'match' ? 'ball' : 'whistle',
      title: a.type === 'match' ? (a.opponent ? `Match tegen ${a.opponent}` : 'Match') : 'Clubtraining',
      sub: `${cap(relDay(a.date))} · ${a.minutes} min · ${a.surface} · pijn ${a.pain}`, sample: a.sample
    }));
    return list.sort((a, b) => b.date.localeCompare(a.date) || b.ts - a.ts);
  }

  function recentRows(list) {
    if (!list.length) return `<p class="empty">Nog niets gelogd.</p>`;
    return list.map(x => `<div class="list-row">
      <div class="ico">${icon(x.icon)}</div>
      <div class="body tap" data-action="show-entry" data-store="${x.store}" data-id="${x.id}" style="cursor:pointer"><b>${esc(x.title)}${x.sample ? '<span class="sample-tag">voorbeeld</span>' : ''}</b><span>${esc(x.sub)}</span></div>
      <div class="end"><button class="icon-btn" style="background:transparent;width:36px;height:36px" data-action="del-entry" data-store="${x.store}" data-id="${x.id}" aria-label="Verwijderen">${icon('trash')}</button></div>
    </div>`).join('');
  }

  function showEntry(store, id) {
    const rec = S[store].find(x => x.id === id);
    if (!rec) return;
    if (store === 'activities') {
      openSheet(`<div class="sheet-head"><div><h3>${rec.type === 'match' ? (rec.opponent ? 'Tegen ' + esc(rec.opponent) : 'Match') : 'Clubtraining'}</h3><p>${cap(fmtDay(rec.date))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
        <div class="num" style="margin-bottom:14px">${rec.minutes}<span class="unit">min</span></div>
        <div class="chips">${rec.score ? `<span class="chip">${esc(rec.score)}</span>` : ''}${rec.role ? `<span class="chip">${esc(rec.role)}</span>` : ''}<span class="chip">${esc(rec.surface)}</span><span class="chip">${esc(rec.shoes)}</span><span class="chip">Pijn achteraf ${rec.pain}/10</span>${rec.source === 'rbfa' ? '<span class="chip">via RBFA</span>' : ''}</div>
        ${rec.note ? `<p class="small" style="margin-top:12px">${esc(rec.note)}</p>` : ''}`);
      return;
    }
    openSheet(`<div class="sheet-head"><div><h3>${esc(woTitle(rec))}</h3><p>${cap(fmtDay(rec.date))}${rec.finishedAt && rec.startedAt ? ` · ${Math.round((rec.finishedAt - rec.startedAt) / 60000)} min` : ''}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${(rec.exercises || []).map(e => `<div class="list-row"><div class="body"><b>${esc(e.name)}</b><span>${e.sets.map(s => `${s.side ? s.side + ' ' : ''}${setText(s, e.kind) || '–'}${s.pain != null ? ` (pijn ${s.pain})` : ''}`).join(' · ')}</span></div></div>`).join('') || '<p class="empty">Geen sets gelogd.</p>'}`);
  }

  async function deleteEntry(store, id) {
    if (!await ask('Dit item verwijderen? Dat kan niet ongedaan gemaakt worden.', { ok: 'Verwijderen', danger: true })) return;
    closeSheet();
    await DB.del(store, id);
    S[store] = S[store].filter(x => x.id !== id);
    render({ keepScroll: true });
    toast('Verwijderd');
  }

  /* ================= Account ================= */
  function renderAccount() {
    const p = profile(), ph = currentPhase(), crit = S.settings.criteria || {};
    const critDone = C.criteria.filter(c => crit[c.id]).length;
    const since = S.settings.phaseSince;
    const sampleCount = ['checks', 'workouts', 'activities'].reduce((n, s) => n + S[s].filter(x => x.sample).length, 0);
    const fx = fixtures();
    const theme = themePref();
    const field = (name, label, value, attrs = '') => `<label class="field"><span>${label}</span><input class="input" data-change="profile" name="${name}" value="${esc(value ?? '')}" ${attrs}></label>`;

    main.innerHTML = `
      ${pageHead('Account')}
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
          <label class="field full"><span>Klachten</span><textarea class="input" rows="2" data-change="profile" name="complaints">${esc(p.complaints)}</textarea></label>
        </div>
        <p class="saved-note">Wijzigingen worden meteen bewaard.</p>
      </section>

      <div class="section"><span>Weergave</span></div>
      <div class="seg" role="radiogroup" aria-label="Thema">
        ${[['auto', 'Automatisch'], ['light', 'Licht'], ['dark', 'Donker']].map(([v, l]) => `<label><input type="radio" name="theme" value="${v}" data-change="theme" ${theme === v ? 'checked' : ''}><span>${l}</span></label>`).join('')}
      </div>

      <div class="section"><span>Herstelfase</span></div>
      ${C.phases.map(f => `<label class="opt ${f.id === ph ? 'on' : ''}">
        <input type="radio" name="phase" value="${f.id}" data-change="phase" ${f.id === ph ? 'checked' : ''}>
        <div class="body"><b>${esc(f.label)} · ${esc(f.title)}</b><span>Standaard vanaf ${fmtFull(f.start)}</span><p>${esc(f.summary)}</p></div>
        <span class="mark"></span>
      </label>`).join('')}
      <p class="label" style="margin:6px 2px 0">Je wisselt zelf van fase.${since ? ` Huidige fase actief sinds ${fmtFull(since)}.` : ''}</p>
      ${ph === 'f3' ? `<label class="field" style="margin-top:12px"><span>Stap voor veerkracht & sprint</span>
        <select class="select" data-change="plyo-step">
          <option value="auto" ${!S.settings.plyoStep || S.settings.plyoStep === 'auto' ? 'selected' : ''}>Automatisch (nu stap ${plyoStep()})</option>
          ${C.sessions.PLYO.steps.map((s, i) => `<option value="${i + 1}" ${String(S.settings.plyoStep) === String(i + 1) ? 'selected' : ''}>Stap ${i + 1}: ${esc(s.title)}</option>`).join('')}
        </select></label>` : ''}

      <div class="section"><span>Klaar om volledig te spelen</span><span>${critDone} van ${C.criteria.length}</span></div>
      <section class="card">
        <div class="progress"><i style="width:${(critDone / C.criteria.length) * 100}%"></i></div>
        ${C.criteria.map(c => `<label class="check ${crit[c.id] ? 'on' : ''}">
          <input type="checkbox" data-change="crit" value="${c.id}" ${crit[c.id] ? 'checked' : ''}>
          <span class="box">${icon('check')}</span>
          <span class="t">${esc(c.text)}${crit[c.id] ? `<small>Gehaald op ${fmtFull(crit[c.id])}</small>` : ''}</span>
        </label>`).join('')}
      </section>

      <div class="section"><span>Matchen</span></div>
      <section class="card">
        <div class="list-row tap" data-action="go" data-to="matchen"><div class="ico">${icon('list')}</div><div class="body"><b>Matchen beheren</b><span>${fx.length ? `${fx.length} matchen · datum, uur, tegenstander en uitslag aanpassen` : 'Nog geen matchen. Importeer of voeg toe.'}</span></div><div class="end">${icon('chevR')}</div></div>
        <div class="list-row tap" data-action="open-rbfa"><div class="ico">${icon('download')}</div><div class="body"><b>RBFA-kalender importeren</b><span>${S.settings.fixturesAt ? `Laatst bijgewerkt ${relDay(dkey(new Date(S.settings.fixturesAt)))}` : `Alle matchen van ${esc(C.rbfa.teamLabel)} in één keer`}</span></div><div class="end">${icon('chevR')}</div></div>
        <div class="list-row tap" data-action="open-minutes"><div class="ico">${icon('clock')}</div><div class="body"><b>Mijn minuten van een match</b><span>Van het wedstrijdblad op rbfa.be</span></div><div class="end">${icon('chevR')}</div></div>
      </section>

      <div class="section"><span>Data</span></div>
      <section class="card">
        <p class="small muted" style="margin-bottom:12px">Je gegevens staan alleen op deze gsm. Maak geregeld een back-up.</p>
        <div class="row"><button class="btn" data-action="export">${icon('download')} Exporteren</button><button class="btn" data-action="import">${icon('upload')} Importeren</button></div>
        <input type="file" id="import-file" accept="application/json,.json" hidden data-change="import">
        <div class="divider"></div>
        ${sampleCount ? `<button class="btn block" data-action="clear-sample">${icon('trash')} Voorbeelddata wissen (${sampleCount})</button>`
          : `<button class="btn block" data-action="load-sample">Voorbeelddata laden</button>`}
        <button class="btn danger block" style="margin-top:8px" data-action="clear-all">Alles wissen</button>
      </section>

      <p class="footer-note">${esc(C.appName)} v${APP_VERSION} · werkt offline</p>
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
      <p class="label" style="margin:0 2px 12px">Tik op een match om datum, uur, tegenstander, thuis of uit en de uitslag aan te passen. Wat je aanpast, blijft staan bij een nieuwe RBFA-import.</p>
      <div class="section"><span>Komend</span><span>${upcoming.length}</span></div>
      <section class="card">${upcoming.map(row).join('') || '<p class="empty">Geen komende matchen.</p>'}</section>
      <div class="section"><span>Gespeeld</span><span>${past.length}</span></div>
      <section class="card">${past.map(row).join('') || '<p class="empty">Nog geen gespeelde matchen.</p>'}</section>
      <div class="row" style="margin-top:12px"><button class="btn" data-action="open-rbfa">${icon('download')} RBFA-import</button><button class="btn primary" data-action="edit-match" data-id="">${icon('plus')} Match toevoegen</button></div>
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
      <div class="row" style="margin-top:8px">
        <button class="btn" data-action="paste" data-target="rbfa-text">${icon('paste')} Plakken</button>
        <button class="btn primary" data-action="rbfa-import">${icon('download')} Importeren</button>
      </div>
      <p class="label" style="margin-top:12px">Matchen die je zelf aangepast of verwijderd hebt, blijven zoals jij ze zette.</p>`);
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
      <div class="row" style="margin-top:8px">
        <button class="btn" data-action="paste" data-target="sheet-text">${icon('paste')} Plakken</button>
        <button class="btn primary" data-action="minutes-parse">${icon('clock')} Berekenen</button>
      </div>
      <div id="minutes-result"></div>
      <p class="label" style="margin-top:12px">Het wedstrijdblad staat er meestal een paar uur na de match op.</p>`);
  }

  function showMinutesResult() {
    const r = parseMatchSheet($('#sheet-text').value, profile().rbfaName);
    const box = $('#minutes-result');
    if (!r.ok) { box.innerHTML = `<div class="hint warn" style="margin-top:12px">${icon('alert')}<span>${esc(r.error || 'Kon de tekst niet lezen.')}</span></div>`; return; }
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
      <div class="num xl" style="margin-top:8px">${r.minutes}<span class="unit">min</span></div>
      <p class="small" style="margin-top:6px">${esc(detail)}</p>
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
      pain: padValue('P'), opponent: f.get('opponent') || null, score: gf != null ? `${gf} - ${ga}` : null, role: f.get('role') || null,
      note: existing ? existing.note || '' : '', source: 'rbfa', createdAt: existing ? existing.createdAt : Date.now(), sample: false
    };
    rec.id = await DB.put('activities', rec);
    S.activities = S.activities.filter(a => a.id !== rec.id).concat(rec);
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
  const padValue = side => { const b = document.querySelector(`.score-pad[data-side="${side}"] .on`); return b ? +b.dataset.v : 0; };
  const painPad = v => `<div class="score-pad" data-side="P">${Array.from({ length: 11 }, (_, i) => `<button type="button" class="${i === v ? 'on' : ''} ${i > MAX_PAIN ? 'hi' : ''}" data-action="score-pick" data-v="${i}">${i}</button>`).join('')}</div>`;
  const logFields = ex => `
      <p class="label" style="margin:4px 2px 6px">Ondergrond</p>
      <div class="seg">${radio('surface', 'kunstgras', 'Kunstgras', ex ? ex.surface : 'kunstgras')}${radio('surface', 'natuurgras', 'Natuurgras', ex ? ex.surface : '')}</div>
      <p class="label" style="margin:0 2px 6px">Schoenen</p>
      <div class="seg">${radio('shoes', 'AG', 'AG', ex ? ex.shoes : 'AG')}${radio('shoes', 'FG', 'FG', ex ? ex.shoes : '')}</div>
      <p class="label" style="margin:0 2px 6px">Pijn achteraf (0 = niets)</p>
      ${painPad(ex ? ex.pain : 0)}`;

  function openLog(type = 'training', date = dkey(today())) {
    openSheet(`<form id="log-form">
      <div class="sheet-head"><h3 id="log-title">${type === 'match' ? 'Match' : 'Training'} loggen</h3>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="seg">${radio('type', 'match', 'Match', type)}${radio('type', 'training', 'Training', type)}</div>
      <div class="form-grid">
        <label class="field"><span>Datum</span><input class="input" type="date" name="date" value="${date}" max="${dkey(today())}" required></label>
        <label class="field"><span>Minuten</span><input class="input" type="number" inputmode="numeric" id="lg-min" name="minutes" min="0" max="240" value="${type === 'match' ? 90 : 105}" required></label>
      </div>
      ${logFields(null)}
      <label class="field" style="margin-top:14px"><span>Notitie (optioneel)</span><textarea class="input" name="note" rows="2" placeholder="Bv. stijf na de rust"></textarea></label>
      <button class="btn primary block lg" type="submit">${icon('check')} Opslaan</button>
    </form>`);
  }

  async function saveLog(form) {
    const f = new FormData(form);
    const rec = {
      type: f.get('type'), date: f.get('date') || dkey(today()), minutes: +f.get('minutes') || 0,
      surface: f.get('surface'), shoes: f.get('shoes'), pain: padValue('P'),
      note: (f.get('note') || '').trim(), createdAt: Date.now(), sample: false
    };
    const fx = rec.type === 'match' ? fixtureOn(rec.date) : null;
    if (fx) { rec.opponent = fx.opponent; if (played(fx)) rec.score = `${fx.gf} - ${fx.ga}`; }
    rec.id = await DB.put('activities', rec);
    S.activities.push(rec);
    closeSheet();
    render({ keepScroll: true });
    toast(rec.pain > MAX_PAIN ? `Opgeslagen. Pijn ${rec.pain}/10: let morgen goed op je ochtendscore.` : `${rec.type === 'match' ? 'Match' : 'Training'} opgeslagen`);
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
    if (!await ask(`Back-up van ${data.exportedAt ? new Date(data.exportedAt).toLocaleDateString('nl-BE') : 'onbekende datum'} importeren? Dit vervangt alle huidige data.`)) return;
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
    if (!await ask('Alle voorbeelddata wissen? Je eigen gegevens blijven staan.')) return;
    await DB.bulkDel('checks', S.checks.filter(x => x.sample).map(x => x.date));
    await DB.bulkDel('workouts', S.workouts.filter(x => x.sample).map(x => x.id));
    await DB.bulkDel('activities', S.activities.filter(x => x.sample).map(x => x.id));
    await loadAll();
    render({ keepScroll: true });
    toast('Voorbeelddata gewist');
  }

  async function clearAll() {
    if (!await ask('Echt ALLE data wissen (ook je eigen workouts, checks en instellingen)? Maak eerst een back-up.')) return;
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
    'save-check': saveCheck,
    'open-score': openScore,
    'score-pick': el => { el.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
    'home-day': el => { S.ui.homeDay = el.dataset.k; render({ keepScroll: true }); },
    'cal-open': el => openDay(el.dataset.k),
    'start-session': el => startSession(el.dataset.key),
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
    'add-session': el => addSessionTo(el.dataset.k, el.dataset.id),
    'del-item': el => deleteItem(el.dataset.k, el.dataset.key),
    'new-custom': el => openBuilder(el.dataset.k),
    'edit-custom': el => openBuilder(null, el.dataset.key),
    'delete-custom': el => deleteCustom(el.dataset.key),
    'b-step': el => builderStep(+el.dataset.i, el.dataset.f, +el.dataset.d),
    'b-remove': el => { S.ui.builder.name = $('#b-name').value; S.ui.builder.items.splice(+el.dataset.i, 1); renderBuilder(); },
    'b-new-add': () => { S.ui.builder.name = $('#b-name').value; builderAddNew(); },
    'b-save': saveBuilder,
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
    'load-sample': async () => { await seedSample(); render({ keepScroll: true }); toast('Voorbeelddata geladen'); },
    'clear-all': clearAll,
    'reload': () => location.reload()
  };

  function shiftMonth(n) {
    const t = today();
    const m = S.ui.calMonth || new Date(t.getFullYear(), t.getMonth(), 1);
    S.ui.calMonth = new Date(m.getFullYear(), m.getMonth() + n, 1);
    render({ keepScroll: true });
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
    if (el.matches('[data-bi]') && S.ui.builder) S.ui.builder.items[+el.dataset.bi][el.dataset.bf] = num(el.value);
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
    } else if (kind === 'b-pick') {
      const b = S.ui.builder; b.name = $('#b-name').value;
      if (el.value === '__new') b.adding = true;
      else if (el.value) { b.items.push(builderItem(el.value)); b.adding = false; }
      renderBuilder();
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
    if (e.target.id === 'minutes-form') saveMinutes(e.target);
    if (e.target.id === 'match-form') saveMatch(e.target);
  });

  window.addEventListener('hashchange', () => { closeSheet(); render(); });

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

  /* ================= Migraties ================= */
  // Zet bestaande data om wanneer het datamodel verandert. Er gaat niets verloren.
  const DATA_VERSION = 3;
  async function migrate() {
    const v = S.settings.dataVersion || 1;
    if (v >= DATA_VERSION) return;
    if (v < 3) {
      // v3: matchen krijgen een id, tegenstander, thuis/uit, score vanuit KFC Lint en een sleutel voor samenvoegen
      if (Array.isArray(S.settings.fixtures)) await setSetting('fixtures', fixtures());
      // v3: profiel krijgt een naam voor het wedstrijdblad
      if (S.settings.profile && !S.settings.profile.rbfaName) await setSetting('profile', { ...S.settings.profile, rbfaName: C.rbfa.player });
    }
    await setSetting('dataVersion', DATA_VERSION);
  }

  /* ================= Start ================= */
  async function init() {
    try {
      await loadAll();
      await migrate();
      registerCustom();
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
