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
2. Verhoog in `sw.js` het getal in `const CACHE_VERSION = 'comeback-v10';` (bv. naar `v11`). Zo haalt elke gsm zeker de nieuwe versie op.
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
- Je data staat alleen op je toestel. Maak geregeld een back-up via **Account → Data → Exporteren**. Op een nieuwe gsm zet je ze terug met **Importeren**.

## 3. De app in het kort

Onderaan staan vijf tabs:

| Tab | Wat je er doet |
| --- | --- |
| **Home** | Kies een dag in de rij bovenaan. De oranje kaart toont wat je die dag doet, met één startknop. Daaronder je ochtendscore (Herstel), je weekvoortgang en de volgende match. |
| **Kalender** | Maandoverzicht met een stip per type (oranje = kracht, blauw = training, zwart/wit = match, grijs = rust). Gevuld = gedaan, open = gepland, kruisje = gemist. Tik op een dag voor de knoppen Start, Verplaats, Overslaan, Loggen of Terugzetten. |
| **Workout** | Alle sessies. Tijdens een workout vul je de huidige set in met grote −/+ knoppen en tik je op **Set klaar**. De rusttimer start vanzelf. |
| **Stats** | Overzicht, Herstel (ochtendscore en pijn), Kracht (gewicht per oefening) en Matchen (jouw minuten en uitslagen). |
| **Account** | Profiel en foto, thema (licht, donker of automatisch), herstelfase, criteria, matchen en data. |

**Verplaatsen:** bij **Verplaats** kiest de app de beste dag: zware sessies nooit op of vlak voor een matchdag en liefst op een dag zonder andere sessie. Je kunt ook zelf een dag kiezen. Een sessie die je later in dezelfde week toch doet, telt als **ingehaald**.

**Voorbeelddata:** bij de eerste start staat er voorbeelddata in de app, zodat je de grafieken meteen ziet. Wissen gaat via **Account → Data → Voorbeelddata wissen**. Je eigen gegevens blijven dan staan.

## 4. RBFA: matchen en jouw minuten

De RBFA-site laat geen andere apps rechtstreeks gegevens ophalen. Daarom werkt de koppeling met kopiëren en plakken.

**Kalender (één keer, daarna af en toe bijwerken)**
1. **Account → RBFA-kalender importeren**, tik op de link naar de kalender van KFC Lint.
2. Houd je vinger op de tekst → **Alles selecteren** → **Kopieer**.
3. Terug in de app: **Plakken** → **Importeren**.

Matchdagen komen dan automatisch in je schema: bij een zaterdagmatch schuift *Bovenlichaam & core* naar donderdag.

**Matchen beheren:** in **Account → Matchen beheren** pas je per match de datum, het uur, de tegenstander, thuis of uit en de uitslag aan. Je kunt er ook matchen toevoegen en verwijderen. Wat je zelf aanpast of verwijdert, blijft zo staan bij een nieuwe import.

**Jouw minuten na een match**
1. Open de match op rbfa.be, selecteer alles en kopieer.
2. Tik in de kalender op de matchdag → **Minuten invullen**, of ga naar **Account → Mijn minuten van een match**. Tik op **Plakken** → **Berekenen**.
3. De app zoekt jouw naam (*Jilio Dillen*, aan te passen in Account) in de opstelling en de wissels en berekent alleen jouw minuten. Controleer het getal en sla op.

Een rode kaart of extra tijd kan de app niet zien. Pas de minuten in dat geval zelf aan.

## 5. Schema aanpassen

Alles staat in `js/config.js`, met uitleg bovenaan het bestand:

- **`exercises`**: oefeningen (naam, herhalingen of duur, per kant, gewicht, rusttijd, tempo, tip).
- **`sessions`**: de zes sessies met naam, korte omschrijving, plaats, icoon en oefeningen. Met `phases: ['f2', 'f3']` toon je iets alleen in die fases. Met `heavy` duid je een zware sessie aan, met `catchUp: false` een sessie die je niet hoeft in te halen.
- **`week`** en **`weekWithSaturdayMatch`**: het weekschema (0 = zondag … 6 = zaterdag).
- **`daily`**: sessies die in een fase elke dag terugkomen (fase 1: isometrische holds).
- **`painRule`**, **`criteria`**, **`phases`**, **`rbfa`**: pijnregel, criteria, fases en de RBFA-gegevens.

## Lokaal testen op je computer (optioneel)

Een service worker werkt niet via `file://`. Start in deze map een kleine webserver:

```bash
python -m http.server 8765
```

en open <http://localhost:8765>.
