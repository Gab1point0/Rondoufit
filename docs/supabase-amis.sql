-- Road2Fit : AMIS (code à 7 caractères). À coller dans « SQL Editor » du projet Supabase puis « Run » (sans risque : ne touche pas aux sauvegardes).
--
-- Principe :
--  - chaque personne a un profil public « résumé » (prénom, niveau, dernière séance, maxima, exercices : JAMAIS le poids ni les photos) et un code aléatoire de 7 caractères ;
--  - quelqu'un qui connaît le code peut ajouter la personne à SA liste d'amis (à sens unique) et lire ce résumé ;
--  - personne ne peut lister les profils ou deviner les codes en masse : tout passe par des fonctions qui limitent les essais ratés ;
--  - on peut couper le partage (colonne share) ou changer de code (ce qui retire aussi tous ceux qui l'avaient ajouté).

-- 1) Code aléatoire de 7 caractères (sans I, O, 0, 1 : faciles à confondre) -------------------------------------
create or replace function public.make_friend_code() returns text
language plpgsql volatile security definer set search_path = public, extensions as $
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 32 caractères : un octet aléatoire modulo 32, sans biais
  bytes bytea;
  code text;
  i int;
begin
  loop
    bytes := extensions.gen_random_bytes(7);
    code := '';
    for i in 0..6 loop
      code := code || substr(alphabet, (get_byte(bytes, i) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where friend_code = code);
  end loop;
  return code;
end;
$$;

-- 2) Profils ------------------------------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  friend_code text unique,
  share       boolean not null default true,
  summary     jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now(),
  constraint profiles_code_format check (friend_code ~ '^[A-HJ-NP-Z2-9]{7}$'),
  constraint profiles_taille_max check (pg_column_size(summary) < 100000)
);
alter table public.profiles alter column friend_code set default public.make_friend_code();
alter table public.profiles alter column friend_code set not null;

alter table public.profiles enable row level security;
revoke all on public.profiles from authenticated, anon;
-- chacun lit sa propre ligne (pour afficher son code) et écrit seulement son résumé / son réglage de partage (jamais son code)
grant select on public.profiles to authenticated;
grant insert (user_id, summary, share, updated_at) on public.profiles to authenticated;
grant update (user_id, summary, share, updated_at) on public.profiles to authenticated;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated using (auth.uid() = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check (auth.uid() = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3) Amis (à sens unique : « owner » a ajouté « friend_user ») -----------------------------------------------
create table if not exists public.friendships (
  owner       uuid not null references auth.users (id) on delete cascade,
  friend_user uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (owner, friend_user),
  constraint friendships_pas_soi check (owner <> friend_user)
);
create index if not exists friendships_friend_user on public.friendships (friend_user);
alter table public.friendships enable row level security;
revoke all on public.friendships from authenticated, anon;
grant select on public.friendships to authenticated;
drop policy if exists friendships_select_own on public.friendships;
create policy friendships_select_own on public.friendships for select to authenticated using (auth.uid() = owner);
-- (ajout et retrait passent par les fonctions ci-dessous : aucune écriture directe)

-- 4) Essais ratés (contre les devinettes de codes) ----------------------------------------------------------
create table if not exists public.friend_attempts (
  user_id uuid not null references auth.users (id) on delete cascade,
  at      timestamptz not null default now()
);
create index if not exists friend_attempts_user_at on public.friend_attempts (user_id, at desc);
alter table public.friend_attempts enable row level security;
revoke all on public.friend_attempts from authenticated, anon;

-- 5) Fonctions (les seules portes d'entrée) --------------------------------------------------------------------
-- Ajouter un ami avec son code. Erreurs : FRIEND_NOT_FOUND, FRIEND_SELF, FRIEND_LOCKED, FRIEND_FULL
create or replace function public.friend_add(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  code text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  target public.profiles%rowtype;
begin
  if me is null then raise exception 'FRIEND_AUTH'; end if;
  delete from public.friend_attempts where at < now() - interval '1 day';
  if (select count(*) from public.friend_attempts where user_id = me and at > now() - interval '15 minutes') >= 8 then
    raise exception 'FRIEND_LOCKED';
  end if;
  select * into target from public.profiles where friend_code = code and share;
  if not found then
    insert into public.friend_attempts (user_id) values (me);
    raise exception 'FRIEND_NOT_FOUND';
  end if;
  if target.user_id = me then raise exception 'FRIEND_SELF'; end if;
  if (select count(*) from public.friendships where owner = me) >= 100 then raise exception 'FRIEND_FULL'; end if;
  insert into public.friendships (owner, friend_user) values (me, target.user_id) on conflict do nothing;
  return jsonb_build_object('user_id', target.user_id, 'summary', target.summary, 'updated_at', target.updated_at);
end;
$$;

-- Ma liste d'amis avec leur résumé (seulement ceux qui partagent encore)
create or replace function public.friend_list() returns table (user_id uuid, summary jsonb, updated_at timestamptz, added_at timestamptz)
language sql stable security definer set search_path = public as $$
  select p.user_id, p.summary, p.updated_at, f.created_at
  from public.friendships f join public.profiles p on p.user_id = f.friend_user
  where f.owner = auth.uid() and p.share
  order by f.created_at;
$$;

create or replace function public.friend_remove(p_user uuid) returns void
language sql security definer set search_path = public as $$
  delete from public.friendships where owner = auth.uid() and friend_user = p_user;
$$;

-- Nouveau code : l'ancien ne marche plus ET tous ceux qui m'avaient ajouté me perdent
create or replace function public.friend_regenerate_code() returns text
language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  code text;
begin
  if me is null then raise exception 'FRIEND_AUTH'; end if;
  code := public.make_friend_code();
  update public.profiles set friend_code = code where user_id = me;
  delete from public.friendships where friend_user = me;
  return code;
end;
$$;

revoke all on function public.friend_add(text), public.friend_list(), public.friend_remove(uuid), public.friend_regenerate_code(), public.make_friend_code() from public, anon;
-- (make_friend_code sert de valeur par défaut à l'inscription du profil : elle doit rester appelable ; elle ne renvoie qu'un code libre au hasard)
grant execute on function public.make_friend_code() to authenticated;
grant execute on function public.friend_add(text), public.friend_list(), public.friend_remove(uuid), public.friend_regenerate_code() to authenticated;
