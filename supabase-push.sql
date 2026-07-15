-- À exécuter UNE FOIS dans Supabase → SQL Editor → New query
-- (après supabase-setup.sql).
--
-- Écriture atomique avec CONTRÔLE DE CONCURRENCE OPTIMISTE.
-- Avant, chaque appareil réécrivait tout le blob : deux personnes qui postaient
-- en même temps → l'une écrasait l'autre (« dernier qui écrit gagne »).
-- Désormais, on ne remplace la ligne que si personne n'a écrit depuis la dernière
-- lecture de l'appareil (paramètre p_expected = updated_at connu). En cas de
-- conflit, l'appli récupère l'état frais renvoyé ici, y rejoue ses changements
-- locaux et réessaie — aucune donnée perdue, même les suppressions.

create or replace function push_nid(p_code text, p_donnees jsonb, p_expected timestamptz)
returns jsonb
language plpgsql
as $$
declare
  n_maj int := 0;
  ligne nids;
begin
  -- Création du foyer s'il n'existe pas encore (premier membre de la famille).
  if not exists (select 1 from nids where code = p_code) then
    insert into nids (code, donnees) values (p_code, p_donnees)
    on conflict (code) do nothing;
    get diagnostics n_maj = row_count; -- 1 si créé, 0 si une autre session a gagné la course
  else
    -- Écriture seulement si personne n'a écrit depuis notre dernière lecture.
    update nids
       set donnees = p_donnees, updated_at = now()
     where code = p_code
       and (p_expected is null or updated_at = p_expected);
    get diagnostics n_maj = row_count; -- 1 si accepté, 0 si conflit détecté
  end if;

  -- On renvoie toujours l'état AUTORITATIF courant (créé, mis à jour, ou intact).
  select * into ligne from nids where code = p_code;
  return jsonb_build_object(
    'applied', n_maj > 0,
    'donnees', ligne.donnees,
    'updated_at', ligne.updated_at
  );
end;
$$;

-- L'appli appelle cette fonction avec la clé anon publique.
grant execute on function push_nid(text, jsonb, timestamptz) to anon, authenticated;
