# Comeback: verbeterplan (v4)

Dit overzicht hoort bij de herwerking volgens het Figma-bestand *Jilio APP* en de ontwerpomschrijving.
Het bepaalt wat blijft, wat verandert en wat er (voorlopig) niet in komt, met de reden.

## Hoe de app nu in elkaar zit

- **Techniek:** een PWA zonder buildstap. `index.html` laadt `js/config.js` (schema, oefeningen, fases),
  `js/db.js` (IndexedDB), `js/charts.js` (eigen SVG-grafieken), `js/sample.js` (demodata) en `js/app.js`
  (router, schermen en logica, ±3200 regels). `sw.js` cachet alles (stale-while-revalidate), dus de app werkt offline.
- **Opslag:** IndexedDB met vier stores: `checks` (dagelijkse check per datum), `workouts`, `activities`
  (training en match) en `settings` (o.a. `injuries`, `overrides`, `fixtures`, `customSessions`, `activeWorkout`).
  Back-up en terugzetten als JSON, met migraties (`dataVersion` 4).
- **Planning:** een weekschema uit `config.js` (template) plus per datum `overrides` (verwijderd, verplaatst,
  overgeslagen, toegevoegd). Wijzigingen raken dus al alleen die dag, niet het template.
- **Blessures:** sinds v3.0 al generieke *hersteltrajecten* (locatie, kant, status, afspraken met de kinesist,
  evaluatiemomenten, checklist, onderhoudsoefeningen). Het kuit/pees-programma en de fases zitten wel nog vast in `config.js`.
- **Statussen:** gepland, gelogd, zonder details, aangepast, ingehaald, overgeslagen, uit planning gehaald, gemist.

## Behouden

- Lokale opslag in IndexedDB, back-up/terugzetten en de bestaande migraties. Er gaat geen data verloren.
- De workoutflow voor één duim (grote −/+ knoppen, hold- en rusttimer, scherm blijft aan, pauzeren en hervatten).
- Template + overrides als planningsmodel, de slimme verplaatser (geen zware sessie op of vlak voor een matchdag).
- Hersteltrajecten met afspraken en evaluatiepunten die nooit als medische vrijgave werken.
- RBFA-import van kalender en minuten, eigen workouts en de oefenbibliotheek, de statistieken.

## Aanpassen (per fase)

1. **Tokens en thema** – Figma-taal: Inter, `#090909` / `#EFEFEF`, kaarten met zachte gradient en 1px rand,
   radius 16–20, één oranje hoofdactie per scherm, warme gloed bovenaan, zwevende tabbar met oranje halo.
   De brand gradient alleen op de fotoheader en mijlpaal-badges.
2. **Opslag en synchronisatie** – klaar: optionele Supabase-sync met invite-only login (e-mail + wachtwoord), Row Level Security en offline-eerst. Zie [supabase.md](supabase.md).
3. **Planning** (klaar) – weekweergave met sessiekaarten per dag, slepen én een knop *Verplaatsen*; voorgesteld
   (stippellijn), bevestigd (volle rand), uitgevoerd, aangepast en overgeslagen (met reden) duidelijk verschillend;
   sessietypes fitness, voetbaltraining, match, kine, herstel/mobiliteit, rust en eigen types; *vervangen door*
   een ander type; notitie per sessie; waarschuwing bij te veel zware dagen op rij of zwaar vlak voor een match.
4. **Blessures** (klaar) – eigen tab; elk traject krijgt een eigen herstelplan met oefeningen die je als sessie inplant.
   Het kuit/pees-programma wordt het herstelplan van het bestaande traject. Afronden verbergt alles op Vandaag;
   oefeningen kun je als onderhoud houden.
5. **Vandaag** (motivatie klaar) – eerst wat er vandaag gepland staat met één startknop, daarna dagelijkse check, weekritme en streak.
   Rust- en hersteldagen tellen mee als *volgens plan*, nooit als gemist.
6. **Workout en voortgang** (klaar) – vorige prestatie per oefening terug zichtbaar; streak, weekritme en mijlpalen.

Navigatie onderaan (alleen iconen, met toegankelijke namen): **Vandaag, Planning, Workout, Voortgang, Blessures**.
Profiel en instellingen open je via je avatar op Vandaag.

## Bewust anders dan Figma of de omschrijving

| Onderdeel | Keuze | Reden |
| --- | --- | --- |
| Tekst op de oranje knop | zwart in plaats van wit | wit op `#E85002` haalt 3,6:1, zwart 5,6:1 (WCAG AA) |
| Oranje tekst op licht | donkerdere tint `#B33E00` | `#E85002` op `#F9F9F9` haalt maar 3,6:1; de tint haalt 5,5:1 |
| Laadscherm met quote | niet bij elke start | de app opent in een fractie van een seconde uit lokale opslag; een kunstmatige wachttijd vertraagt dagelijks gebruik. De motivatietekst staat op Vandaag. |
| Quotes van topsporters | eigen korte teksten zonder naam | echtheid en juiste toeschrijving kan ik niet controleren; een fout citaat is erger dan geen citaat |
| Inloggen | alleen als Supabase ingesteld is | zonder project zou een loginscherm niets beveiligen; met project is het verplicht |
| Passkey/Face ID | niet | geen controleerbare passkey-login in Supabase Auth; geen knop die veiligheid suggereert |
| Tabelmodel | één tabel `user_records` (record per rij, JSON) | volgt de lokale opslag één op één, zodat offline synchroniseren eenvoudig en betrouwbaar blijft; de vorm van planning en blessures verandert nog in de volgende fases |
| AI-coach | klaar maar uit (`AI_ENABLED: false`) | werkt pas na het installeren van de Edge Function met je eigen OpenAI-sleutel, zie [ai-coach.md](ai-coach.md) |
| Gewicht, hartslag, Apple Health | weggelaten | een webapp kan Apple Health niet lezen; geen schijnkoppeling |
| Sportfoto's uit Figma | niet gebruikt | licentie onbekend; de bestaande Unsplash-foto (vrij te gebruiken) blijft, in zwart-wit |
| "Private membership" | alleen als sfeer in de typografie | geen abonnement, betaalmuur of extra accountstappen |

## Motivatieteksten

`quotes.json` bevat eigen korte teksten zonder naam, per soort dag (training, herstel, rust, match, mindset).
Vandaag toont er één per dag, nooit een van de laatste 10. Wil je later een citaat van een sporter toevoegen,
vul dan `name` en in `context` de bron in, en alleen als je de juiste herkomst gecontroleerd hebt.

