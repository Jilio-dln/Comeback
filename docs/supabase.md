# Supabase instellen (inloggen en synchroniseren)

Zonder deze stappen werkt Comeback gewoon lokaal op je gsm. Met Supabase log je in met e-mail en wachtwoord
en staan je gegevens ook veilig in de cloud, gesynchroniseerd tussen je toestellen.

## 1. Project aanmaken

1. Ga naar <https://supabase.com>, log in en klik **New project**.
2. Kies een naam (bv. `comeback`), een sterk databasewachtwoord (bewaar het, de app heeft het niet nodig)
   en een regio in Europa (bv. **Frankfurt**).

## 2. Tabel en beveiliging aanmaken

1. Open in je project **SQL Editor** → **New query**.
2. Plak de volledige inhoud van [`supabase/migrations/0001_user_records.sql`](../supabase/migrations/0001_user_records.sql) en klik **Run**.
3. Controle: onder **Table Editor** staat nu `user_records`, met het label *RLS enabled*.

## 3. Inloggen instellen (alleen op uitnodiging)

1. **Authentication → Sign In / Providers**: laat **Email** aan en zet **Allow new users to sign up** **uit**.
   Zo kan niemand zelf een account maken.
2. **Authentication → URL Configuration**:
   - **Site URL**: het adres van je app, bv. `https://jilio-dln.github.io/Comeback/`
   - **Redirect URLs**: voeg datzelfde adres toe (en eventueel `http://localhost:8766/` om lokaal te testen).
   Uitnodigings- en herstelmails sturen je naar dit adres terug.

## 4. Je account aanmaken

Kies één van beide in **Authentication → Users → Add user**:

- **Create new user**: vul je e-mail en een wachtwoord in en vink **Auto Confirm User** aan. Je kunt meteen inloggen.
- **Send invitation**: je krijgt een mail. De link opent de app, waar je zelf een wachtwoord kiest.

> De standaard mailserver van Supabase verstuurt maar een paar mails per uur. Voor alleen jezelf is dat genoeg.

## 5. De app koppelen

1. **Project Settings → API** (of **API Keys**): kopieer de **Project URL** en de **anon public** key
   (of de nieuwere **publishable** key, `sb_publishable_…`).
2. Vul ze in [`js/env.js`](../js/env.js) in:
   ```js
   window.COMEBACK_ENV = {
     SUPABASE_URL: 'https://jouwproject.supabase.co',
     SUPABASE_ANON_KEY: 'eyJ…'
   };
   ```
3. Verhoog `CACHE_VERSION` in `sw.js` en zet de wijziging op GitHub.

### Welke sleutel mag waar?

| Sleutel | In de app (`js/env.js`)? | Waarom |
| --- | --- | --- |
| **anon / publishable** | Ja | Hij identificeert alleen de app. Toegang tot gegevens krijg je pas na inloggen, en Row Level Security laat elke gebruiker enkel zijn eigen rijen zien (`user_id = auth.uid()`). |
| **service_role / secret** | **Nooit** | Hij omzeilt Row Level Security: wie hem heeft, kan alles lezen, wijzigen en wissen. Alleen voor het dashboard of server-code (bv. een Edge Function). |

## 6. Eerste keer inloggen

- **Log eerst in op de gsm met je meeste gegevens.** Die uploadt alles wat er lokaal staat (workouts, checks,
  trainingen, matchen, blessures, planning en instellingen). Voorbeelddata gaat nooit mee.
- Op een volgend toestel haalt de app eerst alles uit je account en uploadt daarna alleen wat enkel op dat toestel stond.
- Maak voor de zekerheid vooraf een back-up via **Account → Gegevens → Back-up maken**.

## Hoe de synchronisatie werkt

- De app werkt altijd met de lokale kopie, ook offline. Wijzigingen komen in een wachtrij en gaan naar Supabase
  zodra je online bent (bij openen, bij terug online komen en kort na elke wijziging).
- Per record wint de laatste wijziging. Een wijziging die nog niet verstuurd is, wordt nooit overschreven.
  Pas je op twee toestellen tegelijk offline dezelfde planning aan, dan blijft de versie die als laatste verstuurd werd.
- Een paar dingen blijven per toestel: een lopende workout, de demostand en het tijdstip van je laatste back-up.
- **Uitloggen** laat je gegevens op het toestel staan. Log je in met een ander account, dan vraagt de app eerst
  of de lokale gegevens gewist mogen worden; ze worden nooit naar het andere account gestuurd.
- Verloopt je sessie, dan blijf je in de app en bewaart ze je wijzigingen tot je opnieuw inlogt.

## Wat (nog) niet

- **Passkey / Face ID**: niet toegevoegd. Ik kon geen werkende passkey-login in Supabase Auth controleren;
  een knop die niets beveiligt, komt er niet in.
- **Registreren**: bewust niet in de app. Accounts maak je zelf in het dashboard.
