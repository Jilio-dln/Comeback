/* Comeback: optionele AI-coach (volledig verwijderbaar).
 *
 * Wordt alleen geladen als COMEBACK_ENV.AI_ENABLED = true én Supabase ingesteld is.
 * Zonder dit bestand werkt de app volledig: geen knop, geen scherm, geen netwerkverkeer.
 *
 * - De app roept NOOIT rechtstreeks OpenAI aan. Alles gaat via de Supabase Edge Function
 *   "coach" (supabase/functions/coach), die de API-sleutel als secret bewaart en controleert
 *   dat je ingelogd bent.
 * - AIService is de vaste interface. Wil je later een andere aanbieder, dan pas je alleen
 *   de Edge Function aan (of deze twee functies), niet de rest van de app.
 * - Een voorstel wordt NOOIT automatisch toegepast: jij bevestigt elk voorstel apart.
 */
(() => {
  'use strict';
  const ENV = window.COMEBACK_ENV || {};
  const FN = ENV.AI_FUNCTION || 'coach';
  const App = window.ComebackApp;
  if (!App || !window.Sync || !Sync.configured()) return;

  /* ---------- Service: de enige plek die met de server praat ---------- */
  const AIService = {
    // Vrije vraag over training of herstel
    async ask(question, context) {
      const r = await Sync.callFunction(FN, { mode: 'ask', question: String(question).slice(0, 1000), context });
      return { reply: String((r && r.reply) || ''), proposals: [] };
    },
    // Voorstel om de planning aan te passen (wordt nooit vanzelf toegepast)
    async suggestPlanChanges(question, context) {
      const r = await Sync.callFunction(FN, { mode: 'plan', question: String(question || '').slice(0, 1000), context });
      return { reply: String((r && r.reply) || ''), proposals: Array.isArray(r && r.proposals) ? r.proposals : [] };
    }
  };
  window.AIService = AIService;

  const H = App.helpers;
  const { esc, icon } = H;
  const state = { msgs: [], busy: false };

  // Wat de coach te zien krijgt: alleen planning, belasting en pijnscores. Geen naam, e-mail of notities.
  function buildContext() {
    const t = H.today();
    const days = [];
    for (let i = -3; i < 8; i++) {
      const d = H.addDays(t, i), k = H.dkey(d);
      days.push({
        date: k, weekday: H.DAY[d.getDay()],
        items: H.planFor(d).map(it => ({
          key: H.itemKey(it), type: it.type, title: H.itemMeta(it).title, status: H.itemStatus(it, k).label,
          heavy: it.type === 'match' || !!(it.type === 'session' && H.C.sessions[it.id] && H.C.sessions[it.id].heavy),
          time: it.time || null
        })),
        doneMinutes: H.workoutsOn(k).reduce((a, w) => a + (H.woMinutes(w) || 0), 0) + H.activitiesOn(k).reduce((a, x) => a + (+x.minutes || 0), 0)
      });
    }
    const injuries = H.activeInjuries().map(inj => ({
      label: H.injuryLabel(inj), side: inj.side, status: inj.status, painLimit: inj.painLimit ?? null,
      pain: [0, 1, 2].map(n => { const k = H.dkey(H.addDays(t, -n)); const c = H.checkFor(k); const v = H.injurySides(inj).map(s => H.checkVal(c, inj.id, 'pain', s)).filter(x => x != null); return { date: k, max: v.length ? Math.max(...v) : null }; })
    }));
    const options = [
      ...Object.keys(H.C.sessions).map(id => ({ type: 'session', id, title: H.sessionTitle(id), heavy: !!H.C.sessions[id].heavy })),
      { type: 'training' }, { type: 'kine' }, { type: 'recovery' }, { type: 'rest' }
    ];
    return { today: H.dkey(t), position: 'spits', days, injuries, options };
  }

  // Een voorstel van de server nakijken: bestaat het item, mag de actie, bestaat het nieuwe type?
  const TYPES = ['session', 'training', 'kine', 'recovery', 'rest', 'custom'];
  function validate(p) {
    if (!p || typeof p !== 'object') return null;
    const date = String(p.date || ''), key = String(p.key || ''), action = String(p.action || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < H.dkey(H.today())) return null;
    const reason = String(p.reason || '').slice(0, 200);
    // Niets voorstellen voor iets dat al gedaan is
    const cur = key ? H.findItem(date, key) : null;
    if (cur && H.doneOrCaughtUp(cur, date)) return null;
    if (action === 'add' || action === 'replace') {
      const it = p.item || {};
      if (!TYPES.includes(it.type)) return null;
      if (it.type === 'session' && !H.C.sessions[it.id]) return null;
      const item = it.type === 'session' ? { type: 'session', id: it.id } : it.type === 'custom' ? { type: 'custom', label: String(it.label || 'Eigen').slice(0, 40) } : H.newItemOf(it.type);
      if (action === 'add') return { action, date, item, reason };
      if (!H.findItem(date, key)) return null;
      return { action, date, key, item, reason };
    }
    if (!H.findItem(date, key)) return null;
    if (action === 'skip') return { action, date, key, reason };
    if (action === 'move') {
      const to = String(p.to || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(to) || to < H.dkey(H.today()) || to === date) return null;
      return { action, date, key, to, reason };
    }
    return null;
  }
  function proposalTitle(p) {
    const cur = p.key ? H.findItem(p.date, p.key) : null;
    const name = cur ? H.itemMeta(cur).title : '';
    const day = H.fmtDay(p.date);
    if (p.action === 'move') return `${name}: ${day} → ${H.fmtDay(p.to)}`;
    if (p.action === 'replace') return `${H.cap(day)}: ${name} → ${H.itemMeta(p.item).title}`;
    if (p.action === 'skip') return `${H.cap(day)}: ${name} overslaan`;
    return `${H.cap(day)}: ${H.itemMeta(p.item).title} toevoegen`;
  }
  function apply(p) {
    if (p.action === 'move') H.moveItem(p.date, p.key, p.to);
    else if (p.action === 'replace') H.replaceItem(p.date, p.key, p.item);
    else if (p.action === 'skip') H.skipItem(p.date, p.key, 'Op advies van de coach');
    else if (p.action === 'add') H.addItemTo(p.date, p.item, 'Voorstel van de coach');
  }

  function renderCoach(main) {
    const msgs = state.msgs.map((m, i) => m.role === 'user'
      ? `<div class="msg me">${esc(m.text)}</div>`
      : `<div class="msg coach"><span class="eyebrow">Comeback coach</span><p>${esc(m.text).replace(/\n/g, '<br>')}</p>
          ${(m.proposals || []).map((p, j) => `<div class="proposal ${p.state || ''}">
            <span class="label">${p.state === 'done' ? 'Toegepast' : p.state === 'no' ? 'Niet toegepast' : 'Voorstel · nog niet toegepast'}</span>
            <b>${esc(proposalTitle(p))}</b>${p.reason ? `<span class="small muted">${esc(p.reason)}</span>` : ''}
            ${p.state ? '' : `<div class="row"><button class="btn accent" data-action="ai-apply" data-i="${i}" data-j="${j}">${icon('check')} Bevestigen</button><button class="btn" data-action="ai-no" data-i="${i}" data-j="${j}">Niet nu</button></div>`}
          </div>`).join('')}
          ${m.dropped ? `<p class="label">${m.dropped} voorstel${m.dropped === 1 ? '' : 'len'} weggelaten: niet geldig voor je huidige planning.</p>` : ''}
        </div>`).join('');
    main.innerHTML = `
      <header class="sub-head">${H.iconBtn('back', 'go', 'Terug', 'data-to="planning"')}<div><h1>Coach</h1><p>Optionele module</p></div><span></span></header>
      <div class="page-head" style="margin-top:0"><div><span class="eyebrow">Aan jouw zijde</span><h1>Plan en reflectie.</h1></div></div>
      <div class="hint">${icon('info')}<span>Geen medisch advies. Bij meer pijn of twijfel: overleg met je kinesist. De coach past niets aan zonder jouw akkoord.</span></div>
      <div class="chips" style="margin-bottom:12px">
        <button class="loc-chip" data-action="ai-quick" data-mode="plan" data-q="Bekijk mijn komende week. Is de belasting goed verdeeld rond mijn matchen en mijn blessure?">Week nakijken</button>
        <button class="loc-chip" data-action="ai-quick" data-mode="plan" data-q="Ik heb vandaag wat pijn. Pas mijn planning van de komende dagen voorzichtig aan.">Ik heb pijn vandaag</button>
        <button class="loc-chip" data-action="ai-quick" data-mode="ask" data-q="Waar let ik best op bij mijn training van vandaag?">Tip voor vandaag</button>
      </div>
      <div class="msgs" aria-live="polite">${msgs || '<p class="empty">Stel een vraag over je training of vraag een voorstel voor je week.</p>'}
        ${state.busy ? `<div class="msg coach busy"><span class="eyebrow">Comeback coach</span><p>Denkt na…</p></div>` : ''}</div>
      <form id="ai-form" class="ai-input">
        <label class="sr" for="ai-q">Je vraag</label>
        <input class="input" id="ai-q" name="q" maxlength="1000" placeholder="Stel je vraag…" autocomplete="off" ${state.busy ? 'disabled' : ''}>
        <button class="btn accent" type="submit" aria-label="Versturen" ${state.busy ? 'disabled' : ''}>${icon('arrowR')}</button>
      </form>
      <details class="more"><summary>Wat ziet de coach?</summary><p class="small muted">Je planning van 3 dagen terug tot 7 dagen vooruit, je trainingsminuten, je lopende blessures met pijnscores en pijnafspraak, en je vraag. Geen naam, e-mailadres of notities. Gesprekken worden niet bewaard.</p></details>`;
  }

  async function send(q, mode) {
    q = String(q || '').trim();
    if (!q || state.busy) return;
    state.msgs.push({ role: 'user', text: q });
    state.busy = true; App.rerender();
    try {
      const ctx = buildContext();
      const r = mode === 'ask' ? await AIService.ask(q, ctx) : await AIService.suggestPlanChanges(q, ctx);
      const ok = (r.proposals || []).map(validate).filter(Boolean).slice(0, 6);
      state.msgs.push({ role: 'coach', text: r.reply || (ok.length ? 'Dit stel ik voor:' : 'Ik heb geen aanpassing nodig gevonden.'), proposals: ok, dropped: (r.proposals || []).length - ok.length });
    } catch (e) {
      state.msgs.push({ role: 'coach', text: e && e.message ? e.message : 'De coach is nu niet bereikbaar. Je planning blijft gewoon werken.' });
    } finally { state.busy = false; App.rerender(); const i = document.getElementById('ai-q'); if (i && !matchMedia('(pointer: coarse)').matches) i.focus(); }
  }

  App.addSub('coach', { parent: 'planning', render: () => renderCoach(App.main) });
  App.addActions({
    'ai-quick': el => send(el.dataset.q, el.dataset.mode),
    'ai-apply': el => { const p = state.msgs[+el.dataset.i].proposals[+el.dataset.j]; if (!p || p.state) return; apply(p); p.state = 'done'; setTimeout(App.rerender, 50); },
    'ai-no': el => { const p = state.msgs[+el.dataset.i].proposals[+el.dataset.j]; if (p) { p.state = 'no'; App.rerender(); } }
  });
  App.addSubmit('ai-form', form => { const q = form.q.value; form.q.value = ''; send(q, /pas|aanpas|week|plan|verplaats|vervang|pijn/i.test(q) ? 'plan' : 'ask'); });
  App.rerender();
})();
