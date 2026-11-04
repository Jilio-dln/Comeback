/*
 * Comeback: koppelingen met externe diensten.
 * ------------------------------------------------------------
 * Laat je SUPABASE_URL en SUPABASE_ANON_KEY leeg, dan werkt de app zoals vroeger:
 * alles blijft lokaal op dit toestel, zonder inlogscherm.
 *
 * Waar vind je ze?  Supabase → je project → Project Settings → API (of "API Keys"):
 *   SUPABASE_URL       Project URL, bv. https://abcdefghijkl.supabase.co
 *   SUPABASE_ANON_KEY  de "anon public" key (of de nieuwere "publishable" key, sb_publishable_…)
 *
 * Waarom mag de anon key hier (publiek op GitHub) staan?
 *   Die sleutel zegt alleen "dit verzoek komt van de Comeback-app". Hij geeft zelf geen
 *   toegang tot gegevens: wat iemand mag lezen of schrijven, bepaalt Row Level Security
 *   in de database (elke gebruiker ziet alleen rijen met zijn eigen user_id) en je moet
 *   ingelogd zijn. Registreren staat uit, dus niemand kan zelf een account maken.
 *
 * Welke sleutel NOOIT in de frontend?
 *   De service_role key (of de nieuwere "secret" key, sb_secret_…). Die omzeilt Row Level
 *   Security volledig: wie hem heeft, kan alle gegevens lezen, wijzigen en wissen.
 *   Die hoort alleen in het Supabase-dashboard of in server-code (bv. een Edge Function).
 */
/*
 * AI_ENABLED  true = de optionele AI-coach laden (vereist Supabase en de Edge Function "coach",
 *             zie docs/ai-coach.md). false = de coach bestaat niet in de app.
 */
window.COMEBACK_ENV = {
  SUPABASE_URL: 'https://ynlqtqmickexjajmkwbd.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_v_WYfYR5SqnReCL8QCq1Xg_5VGA40Vw',
  AI_ENABLED: false,
  AI_FUNCTION: 'coach'
};
