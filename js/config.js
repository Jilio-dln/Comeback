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
 * Sessie: program = hoort bij een hersteltraject (staat alleen in je schema zolang dat traject
 *   loopt, of als je hem na afronden als onderhoud houdt).
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
    team: 'KFC Lint',
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

  // Startwaarden voor het eerste hersteltraject (achillespees en kuit). Dit zijn geen medische regels:
  // je past ze per traject aan in Account → Blessures & herstel, volgens je afspraken met je kinesist.
  painRule: {
    maxDuring: 3, // afgesproken maximale pijn tijdens oefenen (0–10)
    text: 'Pijn tijdens oefenen max 3/10, de ochtend erna terug op het normale niveau.'
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

  // short = korte naam voor kleine plaatsen, name = naam in de app, desc = korte omschrijving (één regel), place = waar,
  // typeLabel = soort, icon = legs | barbell | torso | hold | calf | bolt
  sessions: {
    A: {
      short: 'Onderlichaam', name: 'Onderlichaam & stabiliteit', desc: 'Eenbenige kracht voor heup, knie en enkel', place: 'thuis',
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
      short: 'Full body', name: 'Full body kracht', desc: 'Zware basisoefeningen voor benen, rug en borst', place: 'fitness',
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
      short: 'Bovenlichaam', name: 'Bovenlichaam & core', desc: 'Duwen, trekken en een stabiele romp', place: 'thuis',
      typeLabel: 'Kracht', icon: 'torso',
      items: [
        { ex: 'pushups', sets: 3 },
        { ex: 'bandRows', sets: 3 },
        { ex: 'bandPullAparts', sets: 3 },
        { ex: 'deadBug', sets: 3 },
        { ex: 'sidePlank', sets: 3 },
        { ex: 'calfRaiseLight', sets: 2, phases: ['f2', 'f3'], program: 'kuitpees' }
      ]
    },
    ISO: {
      short: 'Holds', name: 'Kuit & pees: isometrisch', desc: 'Holds van 45 s die de pees kalmeren', place: 'thuis',
      typeLabel: 'Herstel', icon: 'hold', program: 'kuitpees',
      catchUp: false, // gemiste holds hoef je niet in te halen
      items: [
        { ex: 'calfHoldStanding', sets: 5 },
        { ex: 'calfHoldSeated', sets: 5 }
      ]
    },
    CALF: {
      short: 'Kuitkracht', name: 'Kuit & pees: kracht', desc: 'Zware, trage calf raises: 3 s op, 3 s neer', place: 'thuis of fitness',
      typeLabel: 'Herstel', icon: 'calf', heavy: true, program: 'kuitpees',
      items: [
        { ex: 'calfRaiseSL', sets: [3, 4] },
        { ex: 'seatedCalfRaise', sets: [3, 4] }
      ]
    },
    PLYO: {
      short: 'Veerkracht', name: 'Veerkracht & sprint', desc: 'Sprongen en sprints, elke week een stap verder', place: 'vóór de training',
      typeLabel: 'Herstel', icon: 'bolt', heavy: true, program: 'kuitpees',
      // Elke week een stap (vanaf de dag dat je fase 2 + 3 kiest)
      steps: [
        { title: 'Pogo hops op twee benen', items: [{ ex: 'pogo', sets: 3 }] },
        { title: 'Hops op één been', items: [{ ex: 'hopsSL', sets: 3 }] },
        { title: 'Skippings en bounds', items: [{ ex: 'skipsBounds', sets: 3 }] },
        { title: 'Sprints van 30 m', items: [{ ex: 'sprint30', sets: 3, setLabels: ['70%', '85%', '100%'] }] }
      ]
    }
  },

  // Oefenbibliotheek voor eigen workouts: categorieën, spiergroepen, extra oefeningen en voorgestelde workouts.
  // Alles is voetbalgericht: eenbenig, explosief, blessurepreventie (hamstrings, lies, kuit en pees), duels.
  // where: 'thuis' en/of 'gym'. plyo: true = sprongen en sprints, pas vanaf fase 2 + 3.
  library: {
    categories: [
      { id: 'onder', name: 'Onderlichaam', icon: 'legs', groups: [
        { id: 'quads', name: 'Quadriceps', hint: 'Knie, sprint en afzet' },
        { id: 'hamstrings', name: 'Hamstrings', hint: 'Sprinten en blessurepreventie' },
        { id: 'glutes', name: 'Bilspieren & heup', hint: 'Kracht in duels en richtingsveranderingen' },
        { id: 'adductors', name: 'Adductoren', hint: 'Lies: passen, schieten, draaien' },
        { id: 'calves', name: 'Kuit & achilles', hint: 'Afzet en herstel van je pees' }
      ] },
      { id: 'boven', name: 'Bovenlichaam', icon: 'torso', groups: [
        { id: 'push', name: 'Duwen', hint: 'Afstand houden en afschermen' },
        { id: 'pull', name: 'Trekken', hint: 'Houding en duelkracht' },
        { id: 'shoulders', name: 'Schouders', hint: 'Stabiele schouders bij contact' }
      ] },
      { id: 'core', name: 'Core', icon: 'hold', groups: [
        { id: 'core', name: 'Romp & stabiliteit', hint: 'Balans in duels en bij het schieten' }
      ] },
      { id: 'power', name: 'Explosief', icon: 'bolt', groups: [
        { id: 'power', name: 'Sprongen & sprint', hint: 'Vanaf fase 2 + 3, pijn max 2' }
      ] },
      { id: 'mobility', name: 'Mobiliteit', icon: 'pulse', groups: [
        { id: 'mobility', name: 'Herstel & mobiliteit', hint: 'Heup, enkel en lies los houden' }
      ] }
    ],

    // Spiergroep en plaats voor de oefeningen uit je schema
    tags: {
      calfHoldStanding: { group: 'calves', where: ['thuis', 'gym'] },
      calfHoldSeated: { group: 'calves', where: ['thuis', 'gym'] },
      calfRaiseSL: { group: 'calves', where: ['thuis', 'gym'] },
      seatedCalfRaise: { group: 'calves', where: ['gym'] },
      calfRaiseLight: { group: 'calves', where: ['thuis', 'gym'] },
      bulgarian: { group: 'quads', where: ['thuis', 'gym'] },
      slRdl: { group: 'hamstrings', where: ['thuis', 'gym'] },
      slGluteBridge: { group: 'glutes', where: ['thuis', 'gym'] },
      copenhagen: { group: 'adductors', where: ['thuis', 'gym'] },
      bandSideWalk: { group: 'glutes', where: ['thuis', 'gym'] },
      trapBar: { group: 'glutes', where: ['gym'] },
      legPress: { group: 'quads', where: ['gym'] },
      nordic: { group: 'hamstrings', where: ['thuis', 'gym'] },
      chestRow: { group: 'pull', where: ['gym'] },
      dbBench: { group: 'push', where: ['gym'] },
      latPulldown: { group: 'pull', where: ['gym'] },
      pallof: { group: 'core', where: ['thuis', 'gym'] },
      pushups: { group: 'push', where: ['thuis', 'gym'] },
      bandRows: { group: 'pull', where: ['thuis'] },
      bandPullAparts: { group: 'shoulders', where: ['thuis', 'gym'] },
      deadBug: { group: 'core', where: ['thuis', 'gym'] },
      sidePlank: { group: 'core', where: ['thuis', 'gym'] },
      pogo: { group: 'power', where: ['thuis', 'gym'], plyo: true },
      hopsSL: { group: 'power', where: ['thuis', 'gym'], plyo: true },
      skipsBounds: { group: 'power', where: ['thuis', 'gym'], plyo: true },
      sprint30: { group: 'power', where: ['thuis', 'gym'], plyo: true }
    },

    // Extra oefeningen (zelfde velden als 'exercises', plus group, where en plyo)
    exercises: {
      gobletSquat: { name: 'Goblet squat', kind: 'reps', reps: [8, 12], load: 'kg', increment: 2, rest: 90, group: 'quads', where: ['thuis', 'gym'], cue: 'Dumbbell tegen je borst, diep zitten, knieën naar buiten.' },
      splitSquat: { name: 'Split squat', kind: 'reps', reps: [10, 12], perSide: true, sideWord: 'been', load: 'bw', rest: 60, group: 'quads', where: ['thuis', 'gym'], cue: 'Rechte romp, achterste knie zacht naar de grond.' },
      stepUp: { name: 'Step-up op een bank', kind: 'reps', reps: [8, 10], perSide: true, sideWord: 'been', load: 'kg', increment: 2, rest: 75, group: 'quads', where: ['thuis', 'gym'], cue: 'Duw af met het been op de bank, niet met het onderste.' },
      spanishSquat: { name: 'Spanish squat met band', kind: 'reps', reps: [10, 12], load: 'band', rest: 60, group: 'quads', where: ['thuis', 'gym'], cue: 'Band achter je knieën, zak achterover. Pees- en knievriendelijk.' },
      reverseNordic: { name: 'Reverse Nordic', kind: 'reps', reps: [6, 8], load: 'bw', rest: 75, group: 'quads', where: ['thuis', 'gym'], cue: 'Op je knieën, lichaam recht, langzaam achterover leunen.' },
      hamstringBridge: { name: 'Eenbenige hamstring bridge', kind: 'reps', reps: [8, 12], perSide: true, sideWord: 'been', load: 'bw', rest: 60, group: 'hamstrings', where: ['thuis', 'gym'], cue: 'Hiel op een bank, knie licht gebogen, heup hoog duwen.' },
      slidingCurl: { name: 'Sliding leg curl', kind: 'reps', reps: [8, 10], load: 'bw', rest: 60, group: 'hamstrings', where: ['thuis'], cue: 'Hielen op een handdoek op een gladde vloer, heup hoog houden.' },
      rdlBarbell: { name: 'Roemeense deadlift', kind: 'reps', reps: [6, 8], load: 'kg', increment: 5, rest: 120, group: 'hamstrings', where: ['gym'], cue: 'Stang langs de benen, heup naar achter, rug neutraal.' },
      hipThrust: { name: 'Hip thrust', kind: 'reps', reps: [8, 10], load: 'kg', increment: 5, rest: 90, group: 'glutes', where: ['thuis', 'gym'], cue: 'Schouders op de bank, kin in, bovenaan 1 s knijpen.' },
      lateralLunge: { name: 'Zijwaartse lunge', kind: 'reps', reps: [8, 8], perSide: true, sideWord: 'kant', load: 'bw', rest: 60, group: 'adductors', where: ['thuis', 'gym'], cue: 'Breed staan, zak naar één kant, andere been gestrekt.' },
      clamshell: { name: 'Clamshell met band', kind: 'reps', reps: [15, 15], perSide: true, sideWord: 'kant', load: 'band', rest: 45, group: 'glutes', where: ['thuis'], cue: 'Op je zij, voeten samen, knie openen zonder de heup te draaien.' },
      adductorSqueeze: { name: 'Adductor squeeze', kind: 'hold', duration: 30, load: 'bw', rest: 45, group: 'adductors', where: ['thuis', 'gym'], cue: 'Bal of opgerolde handdoek tussen de knieën, stevig knijpen.' },
      tibialisRaise: { name: 'Tibialis raise', kind: 'reps', reps: [15, 15], load: 'bw', rest: 45, group: 'calves', where: ['thuis', 'gym'], cue: 'Rug tegen de muur, tenen omhoog trekken. Goed voor scheen en enkel.' },
      landminePress: { name: 'Landmine press', kind: 'reps', reps: [8, 10], perSide: true, sideWord: 'arm', load: 'kg', increment: 2.5, rest: 75, group: 'push', where: ['gym'], cue: 'Halfgeknield, schuin omhoog duwen, romp stil.' },
      halfKneelPress: { name: 'Halfgeknielde dumbbell press', kind: 'reps', reps: [8, 10], perSide: true, sideWord: 'arm', load: 'kg', increment: 2, rest: 60, group: 'shoulders', where: ['thuis', 'gym'], cue: 'Op één knie, bilspier aan, niet achterover leunen.' },
      invertedRow: { name: 'Inverted row', kind: 'reps', reps: [8, 12], load: 'bw', rest: 75, group: 'pull', where: ['thuis', 'gym'], cue: 'Onder een stevige tafel of stang, borst naar de rand trekken.' },
      slDbRow: { name: 'Eenarmige dumbbell row', kind: 'reps', reps: [8, 10], perSide: true, sideWord: 'arm', load: 'kg', increment: 2, rest: 60, group: 'pull', where: ['thuis', 'gym'], cue: 'Hand en knie op de bank, elleboog naar de heup.' },
      facePull: { name: 'Face pull', kind: 'reps', reps: [12, 15], load: 'band', rest: 45, group: 'shoulders', where: ['thuis', 'gym'], cue: 'Band of kabel naar je voorhoofd, ellebogen hoog.' },
      ytw: { name: 'Y-T-W op je buik', kind: 'reps', reps: [8, 8], load: 'bw', rest: 45, group: 'shoulders', where: ['thuis'], cue: 'Duimen omhoog, schouderbladen samen en omlaag.' },
      birdDog: { name: 'Bird dog', kind: 'reps', reps: [8, 8], perSide: true, sideWord: 'kant', load: 'bw', rest: 45, group: 'core', where: ['thuis', 'gym'], cue: 'Arm en tegenovergesteld been strekken, rug stil.' },
      plank: { name: 'Plank', kind: 'time', duration: 45, load: 'bw', rest: 45, group: 'core', where: ['thuis', 'gym'], cue: 'Ellebogen onder de schouders, buik en billen aan.' },
      suitcaseCarry: { name: 'Suitcase carry', kind: 'distance', distance: 20, perSide: true, sideWord: 'kant', load: 'kg', increment: 2, rest: 60, group: 'core', where: ['thuis', 'gym'], cue: 'Zwaar gewicht in één hand, rechtop wandelen zonder te hellen.' },
      boxJump: { name: 'Box jump', kind: 'reps', reps: [5, 5], load: 'bw', rest: 90, group: 'power', where: ['gym'], plyo: true, cue: 'Explosief springen, zacht landen, rustig afstappen.' },
      broadJump: { name: 'Broad jump', kind: 'reps', reps: [5, 5], load: 'bw', rest: 90, group: 'power', where: ['thuis', 'gym'], plyo: true, cue: 'Zo ver mogelijk vooruit, landen en 2 s stilstaan.' },
      lateralBound: { name: 'Laterale bounds', kind: 'reps', reps: [6, 6], perSide: true, sideWord: 'kant', load: 'bw', rest: 75, group: 'power', where: ['thuis', 'gym'], plyo: true, cue: 'Zijwaarts afzetten, op één been landen en stabiliseren.' },
      accel10: { name: 'Acceleraties 10 m', kind: 'distance', distance: 10, load: 'bw', rest: 90, group: 'power', where: ['thuis', 'gym'], plyo: true, cue: 'Vanuit staande start, eerste passen kort en krachtig. Op het veld.' },
      hip9090: { name: 'Heup 90/90', kind: 'time', duration: 45, perSide: true, sideWord: 'kant', load: 'bw', rest: 15, group: 'mobility', where: ['thuis', 'gym'], cue: 'Beide knieën 90°, rechtop zitten, langzaam voorover.' },
      couchStretch: { name: 'Couch stretch', kind: 'time', duration: 45, perSide: true, sideWord: 'kant', load: 'bw', rest: 15, group: 'mobility', where: ['thuis'], cue: 'Knie tegen de muur of zetel, bilspier aan, heup naar voor.' },
      ankleMob: { name: 'Enkelmobiliteit knie-naar-muur', kind: 'reps', reps: [10, 10], perSide: true, sideWord: 'kant', load: 'bw', rest: 15, group: 'mobility', where: ['thuis', 'gym'], cue: 'Hiel aan de grond, knie naar de muur. Rustig, geen pijn.' },
      adductorRock: { name: 'Adductor rock back', kind: 'reps', reps: [10, 10], perSide: true, sideWord: 'kant', load: 'bw', rest: 15, group: 'mobility', where: ['thuis', 'gym'], cue: 'Op handen en knieën, één been opzij, rustig naar achter.' }
    },

    // Voorgestelde workouts (focus op voetbal, niet op spiermassa)
    templates: [
      { id: 'lowerGym', name: 'Onderlichaam kracht', desc: 'Sterker afzetten, sprinten en duels winnen', where: 'gym', icon: 'legs',
        items: [{ ex: 'trapBar', sets: 3, reps: 5 }, { ex: 'bulgarian', sets: 3, reps: 8 }, { ex: 'nordic', sets: 3, reps: 5 }, { ex: 'hipThrust', sets: 3, reps: 8 }, { ex: 'copenhagen', sets: 2, duration: 25 }] },
      { id: 'lowerHome', name: 'Onderlichaam thuis', desc: 'Eenbenige kracht zonder machines', where: 'thuis', icon: 'legs',
        items: [{ ex: 'splitSquat', sets: 3, reps: 10 }, { ex: 'slRdl', sets: 3, reps: 10 }, { ex: 'hamstringBridge', sets: 3, reps: 10 }, { ex: 'lateralLunge', sets: 2, reps: 8 }, { ex: 'copenhagen', sets: 2, duration: 20 }] },
      { id: 'upperGym', name: 'Upper body voor duels', desc: 'Sterker afschermen, duwen en in balans blijven', where: 'gym', icon: 'torso',
        items: [{ ex: 'dbBench', sets: 3, reps: 8 }, { ex: 'slDbRow', sets: 3, reps: 10 }, { ex: 'latPulldown', sets: 3, reps: 8 }, { ex: 'landminePress', sets: 3, reps: 8 }, { ex: 'facePull', sets: 2, reps: 15 }] },
      { id: 'upperHome', name: 'Upper body thuis', desc: 'Duwen, trekken en sterke schouders', where: 'thuis', icon: 'torso',
        items: [{ ex: 'pushups', sets: 3, reps: 12 }, { ex: 'invertedRow', sets: 3, reps: 10 }, { ex: 'bandRows', sets: 3, reps: 15 }, { ex: 'halfKneelPress', sets: 2, reps: 10 }, { ex: 'ytw', sets: 2, reps: 8 }] },
      { id: 'fullGym', name: 'Full body voetbal', desc: 'Alles in één, 45 minuten in de gym', where: 'gym', icon: 'barbell',
        items: [{ ex: 'gobletSquat', sets: 3, reps: 10 }, { ex: 'rdlBarbell', sets: 3, reps: 8 }, { ex: 'slDbRow', sets: 3, reps: 10 }, { ex: 'landminePress', sets: 3, reps: 8 }, { ex: 'pallof', sets: 3, reps: 10 }] },
      { id: 'prevention', name: 'Hamstring & lies preventie', desc: 'De oefeningen die blessures bij voetballers het meest verminderen', where: 'thuis', icon: 'heart',
        items: [{ ex: 'nordic', sets: 3, reps: 5 }, { ex: 'copenhagen', sets: 3, duration: 20 }, { ex: 'adductorSqueeze', sets: 3, duration: 30 }, { ex: 'hamstringBridge', sets: 2, reps: 10 }, { ex: 'slGluteBridge', sets: 2, reps: 12 }] },
      { id: 'tendon', name: 'Kuit & pees extra', desc: 'Extra werk voor je achillespees, pijn max 3', where: 'thuis', icon: 'calf',
        items: [{ ex: 'calfHoldStanding', sets: 4, duration: 45 }, { ex: 'calfRaiseSL', sets: 3, reps: 12 }, { ex: 'tibialisRaise', sets: 2, reps: 15 }, { ex: 'spanishSquat', sets: 3, reps: 10 }] },
      { id: 'core', name: 'Core & stabiliteit', desc: 'Balans in duels, bij het schieten en het draaien', where: 'thuis', icon: 'hold',
        items: [{ ex: 'deadBug', sets: 3, reps: 8 }, { ex: 'sidePlank', sets: 3, duration: 30 }, { ex: 'pallof', sets: 3, reps: 10 }, { ex: 'birdDog', sets: 2, reps: 8 }, { ex: 'suitcaseCarry', sets: 2 }] },
      { id: 'power', name: 'Explosief & snelheid', desc: 'Sprongen en acceleraties voor je eerste meters', where: 'gym', icon: 'bolt', plyo: true,
        items: [{ ex: 'broadJump', sets: 3, reps: 5 }, { ex: 'boxJump', sets: 3, reps: 5 }, { ex: 'lateralBound', sets: 3, reps: 6 }, { ex: 'accel10', sets: 4 }] },
      { id: 'md1', name: 'Matchdag -1 activatie', desc: 'Kort en fris, 15 minuten, niet vermoeiend', where: 'thuis', icon: 'whistle',
        items: [{ ex: 'ankleMob', sets: 1, reps: 10 }, { ex: 'slGluteBridge', sets: 2, reps: 10 }, { ex: 'bandSideWalk', sets: 2, reps: 12 }, { ex: 'deadBug', sets: 2, reps: 8 }, { ex: 'adductorSqueeze', sets: 2, duration: 20 }] },
      { id: 'mobility', name: 'Herstel & mobiliteit', desc: 'De dag na de match of op een rustdag', where: 'thuis', icon: 'pulse',
        items: [{ ex: 'hip9090', sets: 2, duration: 45 }, { ex: 'couchStretch', sets: 2, duration: 45 }, { ex: 'adductorRock', sets: 2, reps: 10 }, { ex: 'ankleMob', sets: 2, reps: 10 }, { ex: 'birdDog', sets: 2, reps: 8 }] }
    ]
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
