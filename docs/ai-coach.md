# Optionele AI-coach

De coach is een losse module. Zonder de stappen hieronder bestaat hij niet in de app: geen knop,
geen scherm en `js/ai.js` wordt niet geladen. Alle andere functies werken volledig zonder AI.

## Hoe hij werkt

```
app (js/ai.js) ──► Supabase Edge Function "coach" ──► OpenAI
   AIService.ask()                 controleert je login
   AIService.suggestPlanChanges()  bewaart de API-sleutel als secret
```

- De app roept OpenAI **nooit** rechtstreeks aan. De sleutel staat alleen als secret in Supabase.
- De coach ziet: je planning van 3 dagen terug tot 7 dagen vooruit, trainingsminuten, lopende blessures met
  pijnscores en pijnafspraak, en je vraag. Geen naam, e-mailadres of notities. Gesprekken worden niet bewaard.
- Voorstellen (verplaatsen, vervangen, overslaan, toevoegen) worden **nooit automatisch toegepast**.
  De app controleert elk voorstel tegen je huidige planning en jij bevestigt ze één voor één.
- Geen medisch advies: bij pijn of twijfel verwijst de coach naar je kinesist.
- Andere aanbieder? Pas alleen `callModel()` in `supabase/functions/coach/index.ts` aan.

## Aanzetten

1. **Edge Function aanmaken:** Supabase → **Edge Functions** → **Deploy a new function** → *Via Editor*.
   Naam: `coach`. Plak de inhoud van [`supabase/functions/coach/index.ts`](../supabase/functions/coach/index.ts) en klik **Deploy**.
   (Met de Supabase CLI: `supabase functions deploy coach`.)
2. **Secrets:** Edge Functions → **Secrets** → voeg `OPENAI_API_KEY` toe (je sleutel van platform.openai.com).
   Optioneel `OPENAI_MODEL` (standaard `gpt-4o-mini`; kies een model dat je account aanbiedt).
3. **Aanzetten in de app:** zet in `js/env.js` `AI_ENABLED: true`, verhoog `CACHE_VERSION` in `sw.js` en push.
4. In **Planning** verschijnt rechtsboven een coach-knop.

**Uitzetten** = `AI_ENABLED: false`. De Edge Function mag blijven staan of kan verwijderd worden.

Let op: elke vraag kost een klein bedrag bij OpenAI. Stel in je OpenAI-account een maandlimiet in.
