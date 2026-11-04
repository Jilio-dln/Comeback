// Comeback: Edge Function "coach" voor de optionele AI-coach.
//
// - Bewaart de API-sleutel als secret (OPENAI_API_KEY); de app ziet die nooit.
// - Werkt alleen voor ingelogde gebruikers (de JWT van Supabase Auth wordt gecontroleerd).
// - Geeft een antwoord en, bij mode "plan", voorstellen terug. Die worden in de app pas
//   toegepast nadat de gebruiker ze één voor één bevestigt.
// - Aanbieder vervangen? Pas alleen callModel() aan; de app blijft hetzelfde.
//
// Secrets (Supabase → Edge Functions → Secrets):
//   OPENAI_API_KEY   verplicht
//   OPENAI_MODEL     optioneel, standaard "gpt-4o-mini" (kies een model dat je account aanbiedt)
// SUPABASE_URL en SUPABASE_ANON_KEY zijn standaard beschikbaar in Edge Functions.

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const SYSTEM = `Je bent de coach in Comeback, een persoonlijke app van een voetballer (spits) die traint, herstelt en terugkomt van blessures.
Regels:
- Antwoord in het Nederlands (Vlaams mag), kort en concreet, maximaal 120 woorden.
- Je geeft GEEN medische diagnose of behandeling en geeft nooit toestemming om te spelen of zwaarder te trainen. Bij pijn boven de afgesproken grens, toenemende pijn of twijfel: verwijs naar de kinesist of arts.
- Wees voorzichtig: bij pijn liever lichter, minder of rust dan meer.
- Geen zware sessie de dag voor een match; vermijd drie zware dagen op rij.
- Je past NIETS zelf aan. Je mag alleen voorstellen doen; de gebruiker beslist.
Antwoord ALTIJD als JSON-object: {"reply": string, "proposals": [ ... ]}.
Bij mode "ask": proposals is een lege lijst.
Bij mode "plan": maximaal 4 voorstellen, alleen voor vandaag of later, alleen met keys en datums uit de context:
  {"action":"move","date":"YYYY-MM-DD","key":"<key>","to":"YYYY-MM-DD","reason":"…"}
  {"action":"replace","date":"YYYY-MM-DD","key":"<key>","item":{"type":"session|training|kine|recovery|rest","id":"<session id bij type session>"},"reason":"…"}
  {"action":"skip","date":"YYYY-MM-DD","key":"<key>","reason":"…"}
  {"action":"add","date":"YYYY-MM-DD","item":{"type":"…","id":"…"},"reason":"…"}
Geef geen voorstel als de planning al goed is.`;

async function callModel(mode: string, question: string, context: unknown) {
  const key = Deno.env.get('OPENAI_API_KEY');
  if (!key) throw new Error('OPENAI_API_KEY ontbreekt in de secrets van de Edge Function.');
  const model = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: JSON.stringify({ mode, question, context }) }
      ]
    })
  });
  if (!res.ok) throw new Error(`Taalmodel gaf fout ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '{}';
  let out: { reply?: unknown; proposals?: unknown };
  try { out = JSON.parse(text); } catch { out = { reply: String(text) }; }
  return {
    reply: String(out.reply ?? '').slice(0, 1500),
    proposals: mode === 'plan' && Array.isArray(out.proposals) ? out.proposals.slice(0, 6) : []
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Alleen POST' }, 405);

  // Wie is dit? Alleen ingelogde gebruikers
  const auth = req.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } }
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Niet ingelogd' }, 401);

  let body: { mode?: string; question?: string; context?: unknown };
  try { body = await req.json(); } catch { return json({ error: 'Ongeldige vraag' }, 400); }
  const mode = body.mode === 'plan' ? 'plan' : 'ask';
  const question = String(body.question ?? '').slice(0, 1000);
  const ctx = JSON.stringify(body.context ?? {});
  if (ctx.length > 30000) return json({ error: 'Te veel context' }, 413);

  try {
    return json(await callModel(mode, question, JSON.parse(ctx)));
  } catch (e) {
    console.error(e);
    return json({ error: 'De coach is nu niet bereikbaar. Je planning blijft gewoon werken.' }, 502);
  }
});
