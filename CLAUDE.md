# Comeback — designregels (ALTIJD volgen)

## Het gevoel
Comeback is een PRIVATE MEMBERSHIP-APP voor een topsporter. Het moet aanvoelen als een product van Porsche, Whoop of Bang & Olufsen: ingetogen, duur, zelfverzekerd. Nooit speels, nooit druk, nooit "gratis app".
Bij twijfel: MINDER. Minder kleur, minder tekst, minder kaders, minder knoppen.

## Harde regels
- Alleen bestaande design tokens uit styles.css. Nooit hardgecodeerde kleuren.
- Maximaal ÉÉN primaire knop per scherm. Al de rest is secundair of zit in het "…"-menu.
- Knoppen in HOOFDLETTERS (letter-spacing 0.06em). Pills, badges en lopende tekst in normale letters.
- Geen kaarten in kaarten. Groepeer met witruimte of dunne scheidingslijnen (--border).
- Kaarten vullen het scherm: zijmarge 12–14px, tussenruimte 10–12px, radius 22px.
- Grote cijfers in de display-font met tabular-nums, en de eenheid klein en lichter ernaast ("165 min").
- Kleine labels in uppercase, --text-muted, letter-spacing 0.08em.
- Uitlegtekst kort. Is iets zonder uitleg duidelijk, laat de uitleg weg.
- --warning (oranje) ALLEEN voor pijn boven de grens, overbelasting en blessurewaarschuwingen.
- Elke bestaande actie moet bereikbaar blijven. Verplaatsen mag, verwijderen niet.

## Premium details
- Overgangen 150–250 ms, ease-out. Niets springt of flitst. Respecteer prefers-reduced-motion.
- Iconen: één lijnstijl, één dikte (1.5px), overal dezelfde grootte per context.
- Uitlijning op een 4px-grid. Teksten in een kaart lijnen exact links uit.
- Lege staten zijn verzorgd: korte zin + één secundaire knop, nooit een leeg vlak.
- Getallen nooit afgekapt; titels maximaal 1–2 regels met ellipsis.
- Tikdoelen minstens 44x44px.

## Werkwijze
- Werk op branch premium-redesign. Merge nooit zelf naar main.
- Toon eerst een kort plan en wacht op akkoord.
- Hergebruik bestaande componenten (het Vandaag-scherm = referentie) in plaats van nieuwe varianten te maken.
- Na elke stap: verhoog APP_VERSION + de cache-naam van de service worker, test op 375x812 en 390x844 in dark en light mode (contrast AA), geef een testchecklist en commit met een duidelijke message.
- Raak het laadscherm en het loginscherm niet aan, tenzij ik het expliciet vraag.
