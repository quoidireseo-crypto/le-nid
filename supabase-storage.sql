-- À exécuter UNE FOIS dans Supabase → SQL Editor → New query
-- (en plus de supabase-setup.sql, déjà exécuté précédemment)
-- Ça crée un espace de stockage "photos" pour les vraies photos du Frigo.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Même logique de sécurité que pour les données : la clé du foyer suffit.
create policy "Lecture publique des photos" on storage.objects
  for select using (bucket_id = 'photos');

create policy "Ajout de photos" on storage.objects
  for insert with check (bucket_id = 'photos');
