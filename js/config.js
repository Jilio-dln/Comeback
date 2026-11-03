/*
 * Comeback: configuratie van je herstelplan
 * ------------------------------------------------------------
 * Hier staan je fases, oefeningen, sessies en weekschema.
 * Pas gerust aan; de app leest alles uit dit bestand.
 *
 * Oefening ("exercises"):
 *   name      naam in de app
 *   kind      'reps' (herhalingen), 'hold' (isometrisch vasthouden),
 *             'time' (duur in seconden) of 'distance' (meters)
 *   reps      [min, max] herhalingen, bv. [8, 10]
 *   repsText  vrije tekst in plaats van reps, bv. 'max − 2'
 *   duration  seconden, of [min, max]
 *   distance  meters
 *   perSide   true = sets per kant/been (links en rechts apart)
 *   sideWord  'been' of 'kant' (alleen voor de tekst)
 *   load      'kg' (gewicht), 'bw' (lichaamsgewicht, extra kg optioneel)
 *             of 'band' (weerstandsband, geen gewicht)
 *   increment voorgestelde verhoging in kg bij progressie
 *   progressAt herhalingen waarbij de app meer gewicht voorstelt
 *             (standaard het maximum van 'reps'; bij een vast aantal
 *             zoals [12, 12] alleen als je progressAt invult)
 *   rest      rusttijd in seconden
 *   tempo     tempo-tekst
 *   cue       korte uitvoeringstip
 *
 * Sessie-item: { ex: 'oefening-id', sets: 3 } of sets: [3, 4]
 *   phases: ['f2', 'f3'] = alleen in die fases tonen
 *
 * Sessie: heavy: true = zware krachtsessie (de slimme planner zet die
 *   niet op een matchdag of de dag ervoor); catchUp: false = gemist
 *   hoeft niet ingehaald te worden.
 *
 * Weekschema: 0 = zondag, 1 = maandag ... 6 = zaterdag
 *   type: 'session' (met id), 'training', 'match' of 'rest'
 */
window.APP_CONFIG = {
  appName: 'Comeback',

  profile: {
    name: 'Jilio',
    age: 21,
    height: 188,
    weight: 82,
    position: 'Spits',
    team: 'Seniorenploeg',
    complaints: 'Terugkerende klachten aan achillespees en kuit, links en rechts'
  },

  // RBFA-koppeling (kalender en wedstrijdbladen kopiëren en plakken)
  rbfa: {
    team: 'Lint',                 // stuk van de ploegnaam zoals op RBFA
    teamLabel: 'KFC Lint',
    player: 'Jilio Dillen',       // jouw naam zoals op het wedstrijdblad
    calendarUrl: 'https://www.rbfa.be/nl/club/1234/ploeg/361946/kalender',
    competitionUrl: 'https://www.rbfa.be/nl/competitie/CHP_134507/overzicht',
    matchMinutes: 90
  },

  painRule: {
    maxDuring: 3, // max pijn tijdens een oefening (0–10)
    text: 'Tijdens een oefening maximaal 3/10. De ochtend erna moet de pijn terug op het normale niveau zijn.'
  },

  rpe: 'RPE 7–8',
  defaultRest: 90,

  phases: [
    {
      id: 'f1', label: 'Fase 1', title: 'Kalmeren', start: '2026-11-03',
      summary: 'De pees tot rust brengen met dagelijkse isometrische holds. Nog geen sprongen.'
    },
    {
      id: 'f2', label: 'Fase 2', title: 'Kracht', start: '2026-11-17',
      summary: 'Zware, trage kuitkracht (3 s op / 3 s neer) naast je vaste sessies.'
    },
    {
      id: 'f3', label: 'Fase 2 + 3', title: 'Kracht en veerkracht', start: '2026-12-07',
      summary: 'Kracht behouden en elke week een plyo-stap vóór de clubtraining.'
    }
  ],

  criteria: [
    { id: 'calf25', text: '25 eenbenige calf raises per kant, symmetrisch en pijnvrij' },
    { id: 'hops10', text: '10 eenbenige hops met pijn ≤ 2' },
    { id: 'sprint', text: 'Voluit sprinten en explosief vertrekken, met de ochtend erna niets voelen' }
  ],

  exercises: {
    // Kuit
    calfHoldStanding: {
      name: 'Staande calf hold', kind: 'hold', duration: 45, perSide: true, sideWord: 'kant',
      load: 'kg', increment: 2.5, rest: 60,
      cue: 'Op één been, hiel iets van de grond, knie gestrekt. Duw stevig en hou vast.'
    },
    calfHoldSeated: {
      name: 'Zittende calf hold', kind: 'hold', duration: 45, perSide: true, sideWord: 'kant',
      load: 'kg', increment: 2.5, rest: 60,
      cue: 'Zittend, knie 90°, gewicht op de knie. Hiel licht omhoog en vasthouden.'
    },
    calfRaiseSL: {
      name: 'Eenbenige calf raise (gestrekte knie)', kind: 'reps', reps: [8, 15], perSide: true, sideWord: 'been',
      load: 'kg', increment: 2.5, rest: 90, tempo: '3 s op / 3 s neer',
      cue: 'Volledige range: helemaal omhoog, gecontroleerd tot onder de rand zakken.'
    },
    seatedCalfRaise: {
      name: 'Seated calf raise', kind: 'reps', reps: [8, 15],
      load: 'kg', increment: 5, rest: 90, tempo: '3 s op / 3 s neer',
      cue: 'Knie 90°, traag en volledig bewegen. Bovenaan kort vasthouden.'
    },
    calfRaiseLight: {
      name: 'Calf raise (licht)', kind: 'reps', reps: [15, 15],
      load: 'bw', rest: 45,
      cue: 'Met lichaamsgewicht, rustig tempo. Bedoeld om de pees los te maken.'
    },

    // Sessie A
    bulgarian: {
      name: 'Bulgarian split squat', kind: 'reps', reps: [8, 10], perSide: true, sideWord: 'been',
      load: 'kg', increment: 2, rest: 90,
      cue: 'Voorste voet ver genoeg, romp licht voorover, gecontroleerd zakken.'
    },
    slRdl: {
      name: 'Eenbenige Roemeense deadlift', kind: 'reps', reps: [8, 10], perSide: true, sideWord: 'been',
      load: 'kg', increment: 2, rest: 90,
      cue: 'Heup naar achter, rug neutraal, standbeen licht gebogen.'
    },
    slGluteBridge: {
      name: 'Eenbenige glute bridge', kind: 'reps', reps: [12, 12], perSide: true, sideWord: 'been',
      load: 'bw', rest: 60,
      cue: 'Duw door de hiel, bovenaan 1 s knijpen in je bilspier.'
    },
    copenhagen: {
      name: 'Copenhagen plank', kind: 'time', duration: [20, 30], perSide: true, sideWord: 'kant',
      load: 'bw', rest: 60,
      cue: 'Bovenste been op de bank, heup hoog, lichaam in één lijn.'
    },
    bandSideWalk: {
      name: 'Side walks met band', kind: 'reps', reps: [12, 12], perSide: true, sideWord: 'kant',
      load: 'band', rest: 45,
      cue: 'Licht door de knieën, knieën naar buiten duwen, kleine stappen.'
    },

    // Sessie B
    trapBar: {
      name: 'Trap-bar deadlift', kind: 'reps', reps: [5, 5], progressAt: 5,
      load: 'kg', increment: 5, rest: 150,
      cue: 'Borst hoog, duw de grond weg, stang dicht bij het lichaam.'
    },
    legPress: {
      name: 'Leg press of goblet squat', kind: 'reps', reps: [8, 10],
      load: 'kg', increment: 5, rest: 120,
      cue: 'Diep en gecontroleerd, knieën in lijn met de tenen.'
    },
    nordic: {
      name: 'Nordic curls', kind: 'reps', reps: [4, 6],
      load: 'bw', rest: 120,
      cue: 'Zo traag mogelijk zakken, vang jezelf op met je handen.'
    },
    chestRow: {
      name: 'Chest-supported row', kind: 'reps', reps: [8, 10],
      load: 'kg', increment: 2, rest: 90,
      cue: 'Borst op de bank, schouderbladen naar achter en omlaag.'
    },
    dbBench: {
      name: 'Dumbbell bench press', kind: 'reps', reps: [8, 10],
      load: 'kg', increment: 2, rest: 90,
      cue: 'Ellebogen op ongeveer 45°, gecontroleerd zakken.'
    },
    latPulldown: {
      name: 'Lat pulldown of pull-ups', kind: 'reps', reps: [8, 10],
      load: 'kg', increment: 2.5, rest: 90,
      cue: 'Trek de ellebogen naar je heupen, borst hoog.'
    },
    pallof: {
      name: 'Pallof press', kind: 'reps', reps: [10, 10], perSide: true, sideWord: 'kant',
      load: 'kg', increment: 2.5, rest: 45,
      cue: 'Romp stil houden, armen recht vooruit, niet meedraaien.'
    },

    // Sessie C
    pushups: {
      name: 'Push-ups', kind: 'reps', repsText: 'max − 2',
      load: 'bw', rest: 60,
      cue: 'Stop 2 herhalingen voor falen. Lichaam in één lijn.'
    },
    bandRows: {
      name: 'Band rows', kind: 'reps', reps: [15, 15],
      load: 'band', rest: 45,
      cue: 'Ellebogen naar achter, schouderbladen samen.'
    },
    bandPullAparts: {
      name: 'Band pull-aparts', kind: 'reps', reps: [15, 15],
      load: 'band', rest: 45,
      cue: 'Armen gestrekt, band tot aan je borst uit elkaar trekken.'
    },
    deadBug: {
      name: 'Dead bug', kind: 'reps', reps: [8, 8], perSide: true, sideWord: 'kant',
      load: 'bw', rest: 45,
      cue: 'Onderrug tegen de grond, traag uitstrekken en uitademen.'
    },
    sidePlank: {
      name: 'Side plank', kind: 'time', duration: 30, perSide: true, sideWord: 'kant',
      load: 'bw', rest: 45,
      cue: 'Heup hoog, lichaam in één lijn.'
    },

    // Plyo (fase 3)
    pogo: {
      name: 'Pogo hops (twee benen)', kind: 'time', duration: 20,
      load: 'bw', rest: 60,
      cue: 'Korte, snelle contacten op de bal van de voet. Knieën bijna gestrekt.'
    },
    hopsSL: {
      name: 'Hops op één been', kind: 'reps', reps: [10, 10], perSide: true, sideWord: 'been',
      load: 'bw', rest: 60,
      cue: 'Zacht landen, stil staan na elke hop. Stop bij pijn boven 2.'
    },
    skipsBounds: {
      name: 'Skippings en bounds', kind: 'distance', distance: 20,
      load: 'bw', rest: 60,
      cue: 'Ritmisch en veerkrachtig, actieve voet.'
    },
    sprint30: {
      name: 'Sprint 30 m', kind: 'distance', distance: 30,
      load: 'bw', rest: 120,
      cue: 'Bouw op in intensiteit. Volledig herstellen tussen de sprints.'
    }
  },

  // name = naam in de app, desc = korte omschrijving (één regel), place = waar,
  // typeLabel = soort, icon = legs | barbell | torso | hold | calf | bolt
  sessions: {
    A: {
      name: 'Onderlichaam & stabiliteit', desc: 'Eenbenige kracht voor heup, knie en enkel', place: 'thuis',
      typeLabel: 'Kracht', icon: 'legs', heavy: true,
      items: [
        { ex: 'bulgarian', sets: 3 },
        { ex: 'slRdl', sets: 3 },
        { ex: 'slGluteBridge', sets: 3 },
        { ex: 'copenhagen', sets: 3 },
        { ex: 'bandSideWalk', sets: 3 }
      ]
    },
    B: {
      name: 'Full body kracht', desc: 'Zware basisoefeningen voor benen, rug en borst', place: 'fitness',
      typeLabel: 'Kracht', icon: 'barbell', heavy: true,
      items: [
        { ex: 'trapBar', sets: 3 },
        { ex: 'legPress', sets: 3 },
        { ex: 'nordic', sets: 3 },
        { ex: 'chestRow', sets: 3 },
        { ex: 'dbBench', sets: 3 },
        { ex: 'latPulldown', sets: 3 },
        { ex: 'pallof', sets: 3 }
      ]
    },
    C: {
      name: 'Bovenlichaam & core', desc: 'Duwen, trekken en een stabiele romp', place: 'thuis',
      typeLabel: 'Kracht', icon: 'torso',
      items: [
        { ex: 'pushups', sets: 3 },
        { ex: 'bandRows', sets: 3 },
        { ex: 'bandPullAparts', sets: 3 },
        { ex: 'deadBug', sets: 3 },
        { ex: 'sidePlank', sets: 3 },
        { ex: 'calfRaiseLight', sets: 2, phases: ['f2', 'f3'] }
      ]
    },
    ISO: {
      name: 'Kuit & pees: isometrisch', desc: 'Holds van 45 s die de pees kalmeren', place: 'thuis',
      typeLabel: 'Kuit & pees', icon: 'hold',
      catchUp: false, // gemiste holds hoef je niet in te halen
      items: [
        { ex: 'calfHoldStanding', sets: 5 },
        { ex: 'calfHoldSeated', sets: 5 }
      ]
    },
    CALF: {
      name: 'Kuit & pees: kracht', desc: 'Zware, trage calf raises: 3 s op, 3 s neer', place: 'thuis of fitness',
      typeLabel: 'Kuit & pees', icon: 'calf', heavy: true,
      items: [
        { ex: 'calfRaiseSL', sets: [3, 4] },
        { ex: 'seatedCalfRaise', sets: [3, 4] }
      ]
    },
    PLYO: {
      name: 'Veerkracht & sprint', desc: 'Sprongen en sprints, elke week een stap verder', place: 'vóór de training',
      typeLabel: 'Veerkracht', icon: 'bolt', heavy: true,
      // Elke week een stap (vanaf de dag dat je fase 2 + 3 kiest)
      steps: [
        { title: 'Pogo hops op twee benen', items: [{ ex: 'pogo', sets: 3 }] },
        { title: 'Hops op één been', items: [{ ex: 'hopsSL', sets: 3 }] },
        { title: 'Skippings en bounds', items: [{ ex: 'skipsBounds', sets: 3 }] },
        { title: 'Sprints van 30 m', items: [{ ex: 'sprint30', sets: 3, setLabels: ['70%', '85%', '100%'] }] }
      ]
    }
  },

  // Standaard weekschema
  week: {
    1: [{ type: 'session', id: 'A' }, { type: 'session', id: 'CALF', phases: ['f2', 'f3'] }],
    2: [
      { type: 'session', id: 'ISO' },
      { type: 'session', id: 'PLYO', phases: ['f3'], note: 'Vóór de training' },
      { type: 'training', time: '19:45–21:30' }
    ],
    3: [{ type: 'session', id: 'B' }, { type: 'session', id: 'CALF', phases: ['f2', 'f3'] }],
    4: [
      { type: 'session', id: 'ISO' },
      { type: 'session', id: 'PLYO', phases: ['f3'], note: 'Vóór de training' },
      { type: 'training', time: '19:45–21:30' }
    ],
    5: [{ type: 'session', id: 'C' }],
    6: [{ type: 'rest' }],
    0: [{ type: 'match' }]
  },

  // Weken met een match op zaterdagavond: deze dagen vervangen het standaardschema
  weekWithSaturdayMatch: {
    4: [
      { type: 'session', id: 'ISO' },
      { type: 'session', id: 'PLYO', phases: ['f3'], note: 'Vóór de training' },
      { type: 'session', id: 'C', note: 'Verschoven van vrijdag' },
      { type: 'training', time: '19:45–21:30' }
    ],
    5: [{ type: 'rest', note: 'Rust voor de match' }],
    6: [{ type: 'match', note: 'Match op zaterdagavond' }],
    0: [{ type: 'rest', note: 'Herstel na de match' }]
  },

  // Sessies die in een fase elke dag terugkomen
  daily: {
    f1: ['ISO']
  }
};
