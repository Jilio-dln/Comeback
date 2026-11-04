-- Comeback: opslag per gebruiker met Row Level Security.
-- Voer dit één keer uit in Supabase → SQL Editor → New query → Run.
-- Het script kan veilig opnieuw uitgevoerd worden.
--
-- Eén rij = één record uit de app (een dagelijkse check, workout, training/match of instelling).
-- De app werkt offline met een lokale kopie en synchroniseert deze tabel.

create table if not exists public.user_records (
  user_id    uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  store      text        not null check (store in ('checks', 'workouts', 'activities', 'settings')),
  key        text        not null check (char_length(key) between 1 and 200),
  data       jsonb,
  deleted    boolean     not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (user_id, store, key)
);

create index if not exists user_records_user_updated_idx on public.user_records (user_id, updated_at);

-- Het tijdstip zet altijd de server, nooit de klok van je gsm
create or replace function public.user_records_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

drop trigger if exists user_records_touch on public.user_records;
create trigger user_records_touch
  before insert or update on public.user_records
  for each row execute function public.user_records_touch();

-- Row Level Security: elke gebruiker leest en schrijft alleen zijn eigen rijen
alter table public.user_records enable row level security;

drop policy if exists "eigen rijen lezen" on public.user_records;
create policy "eigen rijen lezen" on public.user_records
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "eigen rijen toevoegen" on public.user_records;
create policy "eigen rijen toevoegen" on public.user_records
  for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "eigen rijen wijzigen" on public.user_records;
create policy "eigen rijen wijzigen" on public.user_records
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "eigen rijen verwijderen" on public.user_records;
create policy "eigen rijen verwijderen" on public.user_records
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Niet-ingelogde bezoekers (anon) krijgen geen enkele toegang
revoke all on public.user_records from anon;
grant select, insert, update, delete on public.user_records to authenticated;
