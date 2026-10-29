-- Road2Fit : comptes + sauvegarde automatique (Supabase). À coller UNE FOIS dans « SQL Editor » puis « Run ».
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

-- 5) Protection des sauvegardes + historique (appliqué le 29/10/2026) -------------------------------------
create table if not exists public.saves_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  version integer not null,
  data jsonb not null,
  saved_at timestamptz not null default now()
);
create index if not exists saves_history_user_date on public.saves_history (user_id, saved_at desc);
alter table public.saves_history enable row level security;
grant select on public.saves_history to authenticated;
drop policy if exists history_select_own on public.saves_history;
create policy history_select_own on public.saves_history for select to authenticated using (auth.uid() = user_id);

create or replace function public.keep_save_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.saves_history h where h.user_id = old.user_id and h.saved_at > now() - interval '8 hours') then
    insert into public.saves_history (user_id, version, data) values (old.user_id, old.version, old.data);
    delete from public.saves_history h
      where h.user_id = old.user_id
        and h.id not in (select s.id from public.saves_history s where s.user_id = old.user_id order by s.saved_at desc limit 21);
  end if;
  return new;
end;
$$;
drop trigger if exists saves_history_trg on public.saves;
create trigger saves_history_trg before update on public.saves for each row execute function public.keep_save_history();

-- Plus personne (même connecté) ne peut supprimer la sauvegarde principale ni l'historique depuis l'application
drop policy if exists saves_delete_own on public.saves;
revoke delete on public.saves from authenticated;
revoke delete on public.saves_history from authenticated;
