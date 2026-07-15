-- À exécuter UNE FOIS dans Supabase → SQL Editor → New query
-- (Phase 2 — vraies notifications push. Optionnel : l'appli fonctionne sans.)
--
-- Stocke les abonnements push des appareils, par foyer. La fonction Edge
-- `pousser-notifications` s'en sert pour envoyer les notifications quand le
-- contenu d'un foyer change.

create table if not exists subscriptions (
  endpoint text primary key,             -- identifiant unique de l'abonnement push
  foyer text not null,                   -- clé du foyer concerné
  membre text,                           -- id du membre (pour ne pas se notifier soi-même)
  abonnement jsonb not null,             -- l'objet PushSubscription complet
  created_at timestamptz not null default now()
);

create index if not exists subscriptions_foyer_idx on subscriptions (foyer);

alter table subscriptions enable row level security;

-- Même modèle que le reste : la connaissance de la clé du foyer suffit.
create policy "Lecture des abonnements du foyer" on subscriptions
  for select using (true);
create policy "Ajout/màj d'un abonnement" on subscriptions
  for all using (true) with check (true);
