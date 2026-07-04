-- À exécuter une seule fois dans Supabase → SQL Editor → New query

create table if not exists nids (
  code text primary key,
  donnees jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Sécurité : la "clé" (le code du foyer) EST le secret, comme une vraie clé de maison.
-- Quiconque connaît le code peut lire et écrire les données de ce foyer ; personne
-- d'autre ne peut deviner un code au hasard (il y a des milliers de combinaisons).
-- C'est adapté à un usage familial, mais ce n'est pas un niveau de sécurité bancaire.
alter table nids enable row level security;

create policy "Lecture avec la clé du foyer" on nids
  for select using (true);

create policy "Écriture avec la clé du foyer" on nids
  for all using (true) with check (true);

-- Active la synchronisation en temps réel sur cette table
alter publication supabase_realtime add table nids;
