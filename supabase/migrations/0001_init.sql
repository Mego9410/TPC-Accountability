-- =============================================================================
-- The Principals Club — Accountability Platform
-- Initial schema: profiles, matching, partnerships, meetings, goals, messages,
-- transcripts, calendar connections. All tables are RLS-protected.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Membership numbers (echoing the Club's "No. 0148" convention).
create sequence if not exists public.membership_seq start with 149;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  honorific     text,
  full_name     text,
  practice_name text,
  location      text,
  timezone      text,
  bio           text,
  avatar_url    text,
  membership_no text unique,
  role          text not null default 'principal' check (role in ('principal', 'house')),
  onboarded     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- match_preferences
-- -----------------------------------------------------------------------------
create table if not exists public.match_preferences (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.profiles (id) on delete cascade,
  focus_areas     text[] not null default '{}',
  interests       text[] not null default '{}',
  cadence         text not null default 'monthly' check (cadence in ('weekly', 'fortnightly', 'monthly')),
  preferred_times text[] not null default '{}',
  status          text not null default 'queued' check (status in ('queued', 'matched', 'paused')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- partnerships
-- -----------------------------------------------------------------------------
create table if not exists public.partnerships (
  id         uuid primary key default gen_random_uuid(),
  member_a   uuid not null references public.profiles (id) on delete cascade,
  member_b   uuid not null references public.profiles (id) on delete cascade,
  cadence    text not null default 'monthly' check (cadence in ('weekly', 'fortnightly', 'monthly')),
  status     text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  ended_at   timestamptz,
  check (member_a <> member_b)
);
create index if not exists partnerships_member_a_idx on public.partnerships (member_a);
create index if not exists partnerships_member_b_idx on public.partnerships (member_b);

-- -----------------------------------------------------------------------------
-- meetings
-- -----------------------------------------------------------------------------
create table if not exists public.meetings (
  id                 uuid primary key default gen_random_uuid(),
  partnership_id     uuid not null references public.partnerships (id) on delete cascade,
  scheduled_at       timestamptz not null,
  cadence            text not null default 'monthly' check (cadence in ('weekly', 'fortnightly', 'monthly')),
  daily_room_url     text,
  daily_room_name    text,
  status             text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  google_event_id    text,
  microsoft_event_id text,
  created_by         uuid not null references public.profiles (id) on delete cascade,
  created_at         timestamptz not null default now()
);
create index if not exists meetings_partnership_idx on public.meetings (partnership_id);

-- -----------------------------------------------------------------------------
-- goals
-- -----------------------------------------------------------------------------
create table if not exists public.goals (
  id             uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.partnerships (id) on delete cascade,
  owner_id       uuid not null references public.profiles (id) on delete cascade,
  meeting_id     uuid references public.meetings (id) on delete set null,
  title          text not null,
  detail         text,
  status         text not null default 'open' check (status in ('open', 'done')),
  source         text not null default 'manual' check (source in ('manual', 'transcript')),
  due_at         timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists goals_partnership_idx on public.goals (partnership_id);
create index if not exists goals_owner_idx on public.goals (owner_id);

-- -----------------------------------------------------------------------------
-- messages
-- -----------------------------------------------------------------------------
create table if not exists public.messages (
  id             uuid primary key default gen_random_uuid(),
  partnership_id uuid not null references public.partnerships (id) on delete cascade,
  sender_id      uuid not null references public.profiles (id) on delete cascade,
  body           text not null,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists messages_partnership_idx on public.messages (partnership_id, created_at);

-- -----------------------------------------------------------------------------
-- transcripts
-- -----------------------------------------------------------------------------
create table if not exists public.transcripts (
  id         uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  raw_text   text not null,
  provider   text not null default 'stub',
  created_at timestamptz not null default now()
);
create index if not exists transcripts_meeting_idx on public.transcripts (meeting_id);

-- -----------------------------------------------------------------------------
-- calendar_connections
-- -----------------------------------------------------------------------------
create table if not exists public.calendar_connections (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  provider      text not null check (provider in ('google', 'microsoft')),
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,
  calendar_id   text,
  account_email text,
  created_at    timestamptz not null default now(),
  unique (user_id, provider)
);

-- =============================================================================
-- Helper: partnership membership check (SECURITY DEFINER avoids RLS recursion)
-- =============================================================================
create or replace function public.is_partnership_member(pid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.partnerships p
    where p.id = pid
      and (p.member_a = auth.uid() or p.member_b = auth.uid())
  );
$$;

-- =============================================================================
-- Triggers: timestamps, membership numbers, new-user provisioning
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.assign_membership_no()
returns trigger language plpgsql as $$
begin
  if new.membership_no is null then
    new.membership_no = lpad(nextval('public.membership_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists match_prefs_set_updated_at on public.match_preferences;
create trigger match_prefs_set_updated_at before update on public.match_preferences
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_assign_membership on public.profiles;
create trigger profiles_assign_membership before insert on public.profiles
  for each row execute function public.assign_membership_no();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.profiles             enable row level security;
alter table public.match_preferences    enable row level security;
alter table public.partnerships         enable row level security;
alter table public.meetings             enable row level security;
alter table public.goals                enable row level security;
alter table public.messages             enable row level security;
alter table public.transcripts          enable row level security;
alter table public.calendar_connections enable row level security;

-- profiles: any authenticated member may read the roll; you may edit only yourself.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- match_preferences: self only.
drop policy if exists match_prefs_all on public.match_preferences;
create policy match_prefs_all on public.match_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- partnerships: visible to and endable by its two members; created by service role.
drop policy if exists partnerships_select on public.partnerships;
create policy partnerships_select on public.partnerships
  for select to authenticated using (member_a = auth.uid() or member_b = auth.uid());
drop policy if exists partnerships_update on public.partnerships;
create policy partnerships_update on public.partnerships
  for update to authenticated
  using (member_a = auth.uid() or member_b = auth.uid())
  with check (member_a = auth.uid() or member_b = auth.uid());

-- meetings: members of the partnership.
drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings
  for select to authenticated using (public.is_partnership_member(partnership_id));
drop policy if exists meetings_insert on public.meetings;
create policy meetings_insert on public.meetings
  for insert to authenticated
  with check (public.is_partnership_member(partnership_id) and created_by = auth.uid());
drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings
  for update to authenticated using (public.is_partnership_member(partnership_id));
drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings
  for delete to authenticated using (public.is_partnership_member(partnership_id));

-- goals: members may read; owner may write their own.
drop policy if exists goals_select on public.goals;
create policy goals_select on public.goals
  for select to authenticated using (public.is_partnership_member(partnership_id));
drop policy if exists goals_insert on public.goals;
create policy goals_insert on public.goals
  for insert to authenticated
  with check (public.is_partnership_member(partnership_id) and owner_id = auth.uid());
drop policy if exists goals_update on public.goals;
create policy goals_update on public.goals
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists goals_delete on public.goals;
create policy goals_delete on public.goals
  for delete to authenticated using (owner_id = auth.uid());

-- messages: members may read; you may send as yourself; members may mark read.
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated using (public.is_partnership_member(partnership_id));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (public.is_partnership_member(partnership_id) and sender_id = auth.uid());
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages
  for update to authenticated using (public.is_partnership_member(partnership_id));

-- transcripts: members of the meeting's partnership.
drop policy if exists transcripts_select on public.transcripts;
create policy transcripts_select on public.transcripts
  for select to authenticated using (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_id and public.is_partnership_member(m.partnership_id)
    )
  );
drop policy if exists transcripts_insert on public.transcripts;
create policy transcripts_insert on public.transcripts
  for insert to authenticated with check (
    exists (
      select 1 from public.meetings m
      where m.id = meeting_id and public.is_partnership_member(m.partnership_id)
    )
  );

-- calendar_connections: self only.
drop policy if exists calendar_conn_all on public.calendar_connections;
create policy calendar_conn_all on public.calendar_connections
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =============================================================================
-- Realtime — messaging and live goal updates
-- =============================================================================
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.goals;
  exception when duplicate_object then null;
  end;
end$$;
