# Comeback: voetbal, fitness en herstel

Persoonlijke Progressive Web App (PWA) om je voetbal, fitness en het herstel van je achillespees en kuit bij te houden.
Werkt offline, installeerbaar op Android (Chrome) en iPhone (Safari). Alle data blijft lokaal op je toestel (IndexedDB).

## Bestanden

```
index.html            de app
manifest.json         app-naam, iconen, standalone-modus
sw.js                 service worker (offline)
css/styles.css        vormgeving
js/config.js          ← JOUW SCHEMA: fases, oefeningen, sessies, weekschema
js/app.js             app-logica
js/db.js              lokale opslag (IndexedDB)
js/charts.js          grafieken (eigen SVG, geen internet nodig)
js/sample.js          voorbeelddata
icons/                app-iconen (ook apple-touch-icon)
.nojekyll             zorgt dat GitHub Pages alles ongewijzigd serveert
```

De map `.claude/` heb je niet nodig op GitHub.

## 1. Op GitHub Pages zetten

1. Maak een gratis account op <https://github.com> (als je er nog geen hebt).
2. Klik rechtsboven op **+** → **New repository**.
   - Naam: bv. `comeback`
   - Zet hem op **Public** (GitHub Pages is gratis voor publieke repositories).
   - Klik **Create repository**.
3. Klik op de link **uploading an existing file**.
4. Sleep **de inhoud** van deze map naar het venster: `index.html`, `manifest.json`, `sw.js`, `README.md`, `.nojekyll` en de mappen `css`, `js` en `icons`.
   Sleep de bestanden zelf, niet de bovenliggende map, zodat `index.html` in de hoofdmap van de repository staat.
   (Ziet de upload `.nojekyll` niet, geen probleem: de app werkt ook zonder.)
5. Klik onderaan op **Commit changes**.
6. Ga naar **Settings** → **Pages** (in het menu links).
   - Bij **Source**: kies **Deploy from a branch**.
   - Bij **Branch**: kies `main` en map `/ (root)`, klik **Save**.
7. Wacht 1 à 2 minuten en herlaad de pagina. Bovenaan verschijnt je adres, bv.
   `https://jouwnaam.github.io/comeback/`
8. Open dat adres op je gsm. De app laadt meteen, met voorbeelddata.

### Later iets aanpassen (bv. je schema)

1. Open `js/config.js` op GitHub, klik op het potlood (**Edit**), pas aan en klik **Commit changes**.
2. Verhoog in `sw.js` de regel `const CACHE_VERSION = 'comeback-v1';` naar `'comeback-v2'` (enzovoort). Zo haalt elke gsm zeker de nieuwe versie op.
3. Open de app op je gsm. Na een paar seconden verschijnt **Nieuwe versie beschikbaar**: tik op **Herladen**. Of sluit de app volledig en open ze opnieuw.

## 2. Installeren op je gsm

### Android (Chrome)
1. Open je app-adres in **Chrome**.
2. Tik op het menu **⋮** rechtsboven.
3. Kies **App installeren** of **Toevoegen aan startscherm** en bevestig.
4. Het icoon met de voetbal staat nu op je startscherm. De app opent zonder adresbalk en werkt offline.

### iPhone (Safari)
1. Open je app-adres in **Safari**. Andere browsers kunnen op iOS niet altijd installeren.
2. Tik op de **Deel-knop** (vierkant met pijl omhoog) onderaan.
3. Scrol en kies **Zet op beginscherm**. Pas eventueel de naam aan en tik op **Voeg toe**.
4. Open de app voortaan via het icoon op je beginscherm.

**Goed om te weten**
- Open de app één keer met internet. Daarna werkt ze ook offline (bv. in de fitness zonder bereik).
- Op iPhone hebben de geïnstalleerde app en Safari elk **eigen** data. Gebruik dus altijd het icoon.
- Op iPhone kan een webapp niet trillen, en het piepje van de timers hoor je alleen als je belsignaal aanstaat (de stilteschakelaar staat uit).
- Je data staat alleen op je toestel. Maak geregeld een back-up via **Profiel → Back-up → Exporteren**. Op een nieuwe gsm zet je ze terug met **Importeren**.

## 3. Voorbeelddata

Bij de eerste start vult de app zich met zes weken voorbeelddata (workouts, ochtendchecks, trainingen en matchen), zodat je meteen ziet hoe de statistieken eruitzien.
Wissen gaat met één knop: **Profiel → Voorbeelddata → Voorbeelddata wissen**. Je eigen gegevens blijven staan. In de lijsten krijgen voorbeeldrecords het label *voorbeeld*.

## 4. Light en dark mode

Tik op het maantje of zonnetje bovenaan Home, of kies in **Profiel → Weergave**: *Automatisch* (volgt je gsm), *Licht* of *Donker*.

## 5. Kalender en plannen wijzigen

- **Tik op een dag** in de kalender (Stats) of op een staafje in de weektegel (Home) om te zien wat er die dag gepland staat, wat je gelogd hebt en of er een match is.
- Elk item heeft een **⋯**-knop met:
  - **Slim verplaatsen**: de app kiest de beste dag in de komende week. Zware sessies (A, B en plyo) komen nooit op een matchdag of de dag ervoor, en de app vermijdt dagen waarop al een sessie staat. 's Avonds plant hij niet meer op vandaag.
  - **Kies zelf een dag**: zeven dagen met per dag een advies (★ Aanbevolen, "matchdag", "al B", …) of een eigen datum.
  - **Overslaan**: de sessie telt dan niet meer als gemist.
- Op Home verschijnt de kaart **Gemist** met sessies van de afgelopen week die je niet deed. Eén tik op **Slim** plant ze opnieuw in. Na elke wijziging kun je ze **ongedaan** maken.
- In de dagweergave kun je ook een sessie **toevoegen** of iets **herstellen** dat je verplaatst of overgeslagen had.

## 6. RBFA: matchen en jouw minuten

De RBFA-site laat geen andere apps rechtstreeks gegevens ophalen. Daarom werkt de koppeling met kopiëren en plakken. Dat duurt een halve minuut en werkt ook op je gsm.

**Kalender (één keer, daarna af en toe bijwerken)**
1. Profiel → **KFC Lint via RBFA** → **Kalender**.
2. Tik op de link naar de kalender van KFC Lint, selecteer alles en kopieer.
3. Terug in de app: **Plakken** → **Importeren**.

Daarna:
- staan matchdagen met uur, tegenstander en uitslag in je kalender en op Home;
- past je schema zich automatisch aan: bij een **zaterdagmatch** schuift Sessie C naar donderdag, en een weekend zonder match wordt een rustdag;
- zie je in **Stats → Seizoen KFC Lint** je uitslagen, je totaal aantal minuten en je gemiddelde per match.

**Jouw minuten na een match**
1. Open de match op rbfa.be (via de kalender), selecteer alles en kopieer.
2. In de app: tik op de match in de kalender → **Mijn minuten importeren** (of via Menu → Minuten van RBFA) → **Plakken** → **Berekenen**.
3. De app zoekt jouw naam (*Jilio Dillen*, aan te passen in Profiel → bewerken) in de opstelling en de wissels. Hij berekent je minuten: basisspeler tot je wissel, of invaller vanaf je invalbeurt. Controleer het getal en pas het aan als dat nodig is. Vul ook ondergrond, schoenen en pijn in en sla op.

Alleen jouw minuten worden bewaard, geen namen of gegevens van andere spelers. Een rode kaart of extra tijd kan de app niet zien; pas de minuten in dat geval zelf aan. Ploeg, links en speelduur staan in `js/config.js` onder `rbfa`.

## 7. Schema aanpassen

Alles staat in `js/config.js`, met uitleg bovenaan het bestand:

- **`exercises`**: oefeningen (naam, herhalingen of duur, per kant, gewicht, rusttijd, tempo, tip).
- **`sessions`**: welke oefeningen in Sessie A, B, C, de isometrische holds en de plyo-stappen zitten. Met `phases: ['f2', 'f3']` toon je een oefening alleen in die fases (zo komen de calf raises er vanaf fase 2 bij).
- **`week`**: het weekschema (0 = zondag … 6 = zaterdag).
- **`weekWithSaturdayMatch`**: het schema in weken met een zaterdagmatch (aan te zetten op het startscherm). Sessie C schuift dan naar donderdag.
- **`daily`**: sessies die in een fase elke dag terugkomen (fase 1: isometrische holds).
- **`painRule`**, **`criteria`**, **`phases`**: pijnregel, criteria om volledig te spelen, fases met hun standaard startdatums.
- **`heavy`** en **`catchUp`** bij een sessie: zware sessie (niet op of vlak voor een matchdag) en of gemiste sessies ingehaald moeten worden.
- **`rbfa`**: ploegnaam, jouw naam op het wedstrijdblad, link naar de kalender en de speelduur (90 min).

## Lokaal testen op je computer (optioneel)

Een service worker werkt niet via `file://`. Start in deze map een kleine webserver:

```bash
python -m http.server 8765
```

en open <http://localhost:8765>.
