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
  const nice = s => String(s || '').replace(/\b([A-ZÀ-Ý][A-ZÀ-Ý.]{3,})\b/g, w => w.charAt(0) + w.slice(1).toLowerCase());
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

  // Verouderd menu: leidt nu door naar de kalenderdag met zichtbare knoppen
  function openItemSheet(k) { openDay(k); }

  /* ================= Router ================= */
  // Hoofdtabs (zonder terugknop) en subschermen (met terugknop naar hun tab)
  const ROUTES = {
    vandaag: { label: 'Home', icon: 'home', render: () => renderToday() },
    kalender: { label: 'Kalender', icon: 'calendar', render: () => renderCalendarPage() },
    workout: { label: 'Workout', icon: 'dumbbell', render: () => renderWorkout() },
    statistieken: { label: 'Stats', icon: 'chart', render: () => renderStats() },
    account: { label: 'Account', icon: 'user', render: () => renderProfile() }
  };
  const SUBS = {};
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
      return `<a class="tab ${key === active ? 'active' : ''}" href="#${key}" ${key === active ? 'aria-current="page"' : ''}><span class="box">${icon(r.icon)}</span>${r.label}</a>`;
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
        if (itemDone(it, k)) c[bucket][0]++;
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

  // Tijdelijk nog gebruikt door oudere schermen
  function heroHtml(it, k) { return homeHero(k); }

  function planItemHtml(it, k, { actions = true } = {}) {
    const m = itemMeta(it), done = itemDone(it, k), key = itemKey(it);
    let btn = '';
    if (actions && it.type === 'session' && !done) btn = `<button class="btn sm" data-action="start-session" data-key="${it.id}">${icon('play')} Start</button>`;
    if (actions && it.type !== 'rest' && !done) btn += `<button class="btn sm" data-action="item-menu" data-k="${k}" data-key="${key}">Wijzig</button>`;
    return `<div class="list-row"><div class="ico">${icon(m.icon)}</div><div class="body"><b>${esc(m.title)}</b><span>${esc(m.sub)}</span></div><div class="end">${done ? '<span class="tag done">Gedaan</span>' : btn}</div></div>`;
  }

  /* ================= Kalender ================= */
  const TYPE_LABEL = { kracht: 'Kracht', training: 'Training', match: 'Match', rust: 'Rust' };
  const planStart = () => S.settings.phaseSince || phaseObj(currentPhase()).start;

  // Gemist = een in te halen sessie in het verleden, vanaf de start van de huidige fase, die niet gedaan is
  function isMissed(it, k) {
    return it.type === 'session' && C.sessions[it.id] && C.sessions[it.id].catchUp !== false
      && k < dkey(today()) && k >= planStart() && !itemDone(it, k);
  }

  function itemStatus(it, k) {
    if (itemDone(it, k)) return { cls: 'done', label: 'Gedaan' };
    if (isMissed(it, k)) return { cls: 'missed', label: 'Gemist' };
    if (k < dkey(today()) && it.type !== 'rest') return { cls: 'skip', label: 'Niet gelogd' };
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
      const s = itemDone(it, k) ? 'done' : isMissed(it, k) ? 'missed' : k < dkey(today()) ? null : 'planned';
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
      if (!itemDone(it, k)) {
        if (it.type === 'session') {
          actions = `<button class="btn sm ${k <= tk ? 'primary' : ''}" data-action="start-session" data-key="${it.id}">${icon('play')} ${k === tk ? 'Start' : k < tk ? 'Nu inhalen' : 'Nu starten'}</button>
            ${C.sessions[it.id].catchUp === false ? '' : `<button class="btn sm" data-action="open-move" data-k="${k}" data-key="${esc(key)}">${icon('move')} Verplaats</button>`}
            <button class="btn sm" data-action="skip-item" data-k="${k}" data-key="${esc(key)}">${icon('skip')} Overslaan</button>`;
        } else if (past) {
          actions = `<button class="btn sm primary" data-action="open-log" data-type="${it.type}" data-date="${k}">${icon('edit')} Loggen</button>`;
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
      const txt = o.reason === 'skip' ? 'Overgeslagen' : `Verplaatst naar ${fmtDay(o.reason.slice(6))}`;
      html += `<div class="day-item"><div class="day-item-top"><span class="type-bar" style="background:var(--line)"></span>
        <div class="body"><b class="muted">${esc(m.title)}</b><span>${esc(txt)}</span></div><span class="tag skip">${o.reason === 'skip' ? 'Overgeslagen' : 'Verplaatst'}</span></div>
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
    openSheet(`<div class="sheet-head"><div><h3>Sessie toevoegen</h3><p>${cap(fmtDay(k))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      ${Object.keys(C.sessions).map(id => `<div class="list-row tap" data-action="add-session" data-k="${k}" data-id="${id}">
        <div class="ico">${icon(C.sessions[id].icon)}</div><div class="body"><b>${esc(sessionTitle(id))}</b><span>${esc(sessionDesc(id))}</span></div><div class="end">${icon('plus')}</div></div>`).join('')}`);
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
      if (!await ask(`Je hebt nog een workout bezig (${woTitle(cur)}). Die stoppen en een nieuwe starten?`)) return;
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
        <div class="card-head"><div><h3>Bezig: ${esc(woTitle(w))}</h3><p class="muted small">Gestart om ${fmtTime(w.startedAt)} · oefening ${w.current + 1} van ${w.exercises.length}</p></div></div>
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
        <div class="topbar-title"><strong>${esc(woTitle(w))}</strong><small>Gestart om ${fmtTime(w.startedAt)}</small></div>
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
    if (!done.length) { if (!await ask('Je hebt nog geen sets afgevinkt. Toch opslaan als afgewerkte sessie?')) return; }
    else if (done.length < all.length && !await ask(`${all.length - done.length} sets zijn niet afgevinkt. Workout toch afronden?`)) return;
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
    S.ui.summary = { title: woTitle(w), sets: done.length, minutes: Math.max(1, Math.round((rec.finishedAt - w.startedAt) / 60000)), maxPain: pains.length ? Math.max(...pains) : null };
    S.settings.activeWorkout = null;
    await saveDraft(true);
    stopRest();
    releaseWakeLock();
    S.ui.woView = 'picker';
    render();
    toast('Workout opgeslagen 💪');
  }

  async function cancelWorkout() {
    if (!await ask('Deze workout stoppen zonder op te slaan?')) return;
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
        <div class="li-body" data-action="open-day" data-k="${f.date}"><strong>${esc(nice(opponent(f)))}</strong><span>${fmtShort(f.date)} · ${f.home ? 'thuis' : 'uit'} · ${a ? `${a.minutes} min gespeeld` : 'nog geen minuten'}</span></div>
        <span class="score-pill ${fixtureResult(f)}">${fxScore(f)}</span>
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
        title: woTitle(w), sub: `${relDay(w.date)} · ${(w.exercises || []).length} oef. · ${sets} sets${pains.length ? ` · pijn max ${Math.max(...pains)}` : ''}`, sample: w.sample
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
    openSheet(`<div class="sheet-head"><div><h3>${esc(woTitle(rec))}</h3><p>${cap(fmtDay(rec.date))}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
      <div class="chips" style="margin-bottom:8px">${rec.finishedAt && rec.startedAt ? `<span class="chip dark">${Math.round((rec.finishedAt - rec.startedAt) / 60000)} min</span>` : ''}<span class="chip">${esc(phaseObj(rec.phase).label)}</span></div>
      ${(rec.exercises || []).map(e => `<div class="detail-ex"><strong>${esc(e.name)}</strong><div class="prev-chips">${e.sets.map(s => `<span>${s.label ? esc(s.label) + ' ' : s.side ? s.side + ' ' : ''}${setText(s, e.kind)}${s.pain != null ? ` <i class="${s.pain > MAX_PAIN ? 'hi' : ''}">p${s.pain}</i>` : ''}</span>`).join('')}</div></div>`).join('') || '<p class="empty">Geen sets gelogd.</p>'}`);
  }

  async function deleteEntry(store, id) {
    if (!await ask('Dit item verwijderen?')) return;
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
          ${next ? `<div class="plan-item"><div class="pi-icon match">${icon('ball')}</div><div class="pi-body" data-action="open-day" data-k="${next.date}" style="cursor:pointer"><strong>Volgende: ${esc(nice(opponent(next)))}</strong><span>${cap(fmtDay(next.date))} · ${esc(next.time || '')} · ${next.home ? 'thuis' : 'uit'}</span></div></div>` : ''}
          ${lastPlayed ? `<div class="plan-item"><div class="pi-icon">${icon('ball')}</div><div class="pi-body" data-action="open-day" data-k="${lastPlayed.date}" style="cursor:pointer"><strong>Laatste: ${esc(nice(opponent(lastPlayed)))}</strong><span>${cap(fmtDay(lastPlayed.date))}</span></div><span class="score-pill ${fixtureResult(lastPlayed)}">${fxScore(lastPlayed)}</span></div>` : ''}
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
    openSheet(`<div class="sheet-head"><div><h3>Mijn minuten</h3><p>${f ? `${esc(fxTitle(f))}, ${fmtShort(f.date)}` : 'Van het wedstrijdblad op rbfa.be'}</p></div>${iconBtn('x', 'close-sheet', 'Sluiten')}</div>
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
    'menu-go': el => go(el.dataset.to),
    'open-menu': openMenu,
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
    'item-menu': el => openItemSheet(el.dataset.k, el.dataset.key),
    'open-move': el => openMoveSheet(el.dataset.k, el.dataset.key),
    'smart-move': el => smartMove(el.dataset.k, el.dataset.key),
    'move-to': el => moveItem(el.dataset.from, el.dataset.key, el.dataset.to),
    'move-custom': el => { const v = $('#move-date').value; if (!v) { toast('Kies eerst een datum'); return; } moveItem(el.dataset.from, el.dataset.key, v); },
    'skip-item': el => skipItem(el.dataset.k, el.dataset.key),
    'restore-item': el => restoreItem(el.dataset.k, el.dataset.key),
    'cal-pick': el => { S.ui.calDay = el.dataset.k; const d = parseKey(el.dataset.k); S.ui.calMonth = new Date(d.getFullYear(), d.getMonth(), 1); render({ keepScroll: true }); },
    'add-menu': el => openAddMenu(el.dataset.k),
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
