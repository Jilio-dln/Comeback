/* Comeback: voorbeelddata (alle records krijgen sample: true en zijn met één knop te wissen) */
window.Sample = (() => {
  const BASE = {
    bulgarian: 10, slRdl: 12, trapBar: 70, legPress: 90, chestRow: 18, dbBench: 20,
    latPulldown: 45, pallof: 10, calfRaiseSL: 0, seatedCalfRaise: 25, calfHoldSeated: 20
  };

  function rng(seed) {
    return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  }

  function generate({ C, planFor, sessionItems, dkey, addDays, today }) {
    const r = rng(20261103);
    const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
    const pick = a => a[Math.floor(r() * a.length)];
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const pain = () => { const x = r(); return x < 0.35 ? 0 : x < 0.65 ? 1 : x < 0.85 ? 2 : x < 0.96 ? 3 : 4; };
    const DAYS = 42;
    const checks = [], workouts = [], activities = [];
    let L = 5.6, R = 3.6, afterMatch = false;

    for (let i = DAYS; i >= 1; i--) {
      const d = addDays(today, -i);
      const k = dkey(d);
      const week = Math.floor((DAYS - i) / 7);
      const phase = i > 21 ? 'f1' : 'f2';

      L = Math.max(1, L - 0.09 + (r() - 0.5) * 0.7);
      R = Math.max(0.5, R - 0.06 + (r() - 0.5) * 0.6);
      // Voorbeeld van het traject 'inj1' (achillespees en kuit): stijfheid en pijn per kant
      const sL = clamp(Math.round(L + (afterMatch ? 1 : 0)), 0, 10), sR = clamp(Math.round(R + (afterMatch && r() > 0.5 ? 1 : 0)), 0, 10);
      checks.push({
        date: k,
        inj: { inj1: { stiff: { L: sL, R: sR }, pain: { L: Math.max(0, sL - 2), R: Math.max(0, sR - 2) }, reaction: afterMatch ? pick(['gelijk', 'slechter']) : null } },
        fatigue: ri(1, 4), savedAt: d.getTime() + 7.5 * 3600e3,
        sample: true
      });
      afterMatch = false;

      for (const it of planFor(d, phase, false)) {
        if (it.type === 'session') {
          if (r() < 0.12) continue;
          workouts.push(makeWorkout(it.id, d, k, phase, week));
        } else if (it.type === 'training') {
          if (r() < 0.15) continue;
          const surface = r() < 0.7 ? 'kunstgras' : 'natuurgras';
          activities.push({
            type: 'training', date: k, minutes: ri(85, 105), plannedMinutes: 105, surface,
            shoes: surface === 'kunstgras' ? 'AG' : 'FG', pains: { inj1: ri(1, 3) }, rpe: ri(5, 8),
            participation: r() < 0.2 ? 'aangepast' : 'volledig', note: '',
            createdAt: d.getTime() + 21.6 * 3600e3, sample: true
          });
        } else if (it.type === 'match') {
          const surface = r() < 0.5 ? 'kunstgras' : 'natuurgras';
          activities.push({
            type: 'match', date: k, minutes: Math.min(90, 30 + week * 12 + ri(0, 10)), plannedMinutes: 90, surface,
            shoes: surface === 'kunstgras' ? 'AG' : 'FG', pains: { inj1: ri(1, 4) }, rpe: ri(6, 9),
            participation: 'gedeeltelijk',
            note: pick(['Goed gevoel', 'Wat stijf na de rust', 'Eén keer gescoord', 'Zware ondergrond', '']),
            createdAt: d.getTime() + 17 * 3600e3, sample: true
          });
          afterMatch = true;
        }
      }
    }
    return { checks, workouts, activities };

    function makeWorkout(key, d, k, phase, week) {
      const start = d.getTime() + (key === 'ISO' ? 8 : 17.5) * 3600e3;
      const exercises = sessionItems(key, phase, 1).map(it => {
        const ex = C.exercises[it.ex];
        const n = Array.isArray(it.sets) ? it.sets[0] : it.sets;
        const sides = ex.perSide ? ['L', 'R'] : [null];
        const load = BASE[it.ex] != null ? BASE[it.ex] + Math.floor(week / 2) * (ex.increment || 2.5) : null;
        const sets = [];
        for (let s = 0; s < n; s++) {
          for (const side of sides) {
            const set = { idx: s, side, reps: null, weight: null, duration: null, dist: null, pain: pain(), done: true };
            if (it.setLabels) set.label = it.setLabels[s];
            if (ex.kind === 'reps') {
              set.reps = ex.reps ? Math.min(ex.reps[1], ri(ex.reps[0], ex.reps[1]) + (week > 3 ? 1 : 0)) : ri(14, 20);
              if (ex.load === 'kg') set.weight = load;
            } else if (ex.kind === 'hold') {
              set.duration = ex.duration;
              if (ex.load === 'kg') set.weight = load;
            } else if (ex.kind === 'time') {
              set.duration = Array.isArray(ex.duration) ? Math.min(ex.duration[1], ex.duration[0] + week * 2) : ex.duration;
            } else if (ex.kind === 'distance') {
              set.dist = ex.distance;
            }
            if (!set.weight) set.weight = null;
            sets.push(set);
          }
        }
        return { exId: it.ex, name: ex.name, kind: ex.kind, load: ex.load, perSide: !!ex.perSide, sets };
      });
      return {
        date: k, sessionKey: key, title: C.sessions[key].name, phase,
        startedAt: start, finishedAt: start + ri(25, 55) * 60e3, exercises, logged: 'full', mode: 'volledig', rpe: ri(4, 8), sample: true
      };
    }
  }

  return { generate };
})();
