-- RondouFit : comptes + sauvegarde automatique (Supabase). À coller UNE FOIS dans « SQL Editor » puis « Run ».
-- Avant de lancer : remplace REMPLACE_PAR_TON_CODE (2 endroits : une seule ligne en fait) par le code d'invitation que tu donneras à tes amis.

-- 1) Une ligne de sauvegarde par personne -----------------------------------------------------------
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  version    integer not null default 1,
  updated_at timestamptz not null default now(),
  constraint saves_taille_max check (pg_column_size(data) < 4000000)  -- ~4 Mo : évite les abus
);

-- 2) Règle de sécurité : chacun ne voit et ne modifie QUE sa propre ligne -----------------------------
alter table public.saves enable row level security;

-- Droits d'accès pour les comptes connectés (nécessaire si l'option « exposer automatiquement les nouvelles tables » est désactivée) :
grant select, insert, update, delete on public.saves to authenticated;

drop policy if exists saves_select_own on public.saves;
drop policy if exists saves_insert_own on public.saves;
drop policy if exists saves_update_own on public.saves;
drop policy if exists saves_delete_own on public.saves;

create policy saves_select_own on public.saves for select to authenticated using (auth.uid() = user_id);
create policy saves_insert_own on public.saves for insert to authenticated with check (auth.uid() = user_id);
create policy saves_update_own on public.saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy saves_delete_own on public.saves for delete to authenticated using (auth.uid() = user_id);

-- 3) Inscription seulement avec ton code d'invitation -----------------------------------------------------
create or replace function public.check_invite() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'invite', '') <> 'REMPLACE_PAR_TON_CODE' then
    raise exception 'invitation invalide';
  end if;
  return new;
end;
$$;

drop trigger if exists check_invite_before_signup on auth.users;
create trigger check_invite_before_signup
  before insert on auth.users
  for each row execute function public.check_invite();

-- 4) Photos souvenirs : une ligne par photo et par personne ---------------------------------------------
create table if not exists public.photos (
  user_id    uuid not null references auth.users (id) on delete cascade,
  id         text not null,
  data       jsonb not null,
  version    integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint photos_taille_max check (pg_column_size(data) < 3000000)
);
alter table public.photos enable row level security;
grant select, insert, update, delete on public.photos to authenticated;
drop policy if exists photos_select_own on public.photos;
drop policy if exists photos_insert_own on public.photos;
drop policy if exists photos_update_own on public.photos;
drop policy if exists photos_delete_own on public.photos;
create policy photos_select_own on public.photos for select to authenticated using (auth.uid() = user_id);
create policy photos_insert_own on public.photos for insert to authenticated with check (auth.uid() = user_id);
create policy photos_update_own on public.photos for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy photos_delete_own on public.photos for delete to authenticated using (auth.uid() = user_id);
