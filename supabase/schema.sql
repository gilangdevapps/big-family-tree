-- ============================================================
-- Big Family Tree — Supabase Database Schema
-- Phase 1: Project Setup & Authentication
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- Table: users
-- Minimal auth helper table. Most user data is in Supabase Auth.
-- ============================================================
create table public.users (
  id            uuid primary key default uuid_generate_v4(),
  email         text unique not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  last_sign_in_at timestamptz
);

-- ============================================================
-- Table: family_trees
-- ============================================================
create table public.family_trees (
  id              uuid primary key default uuid_generate_v4(),
  owner_id        uuid not null references public.users(id) on delete cascade,
  name            text not null,
  root_person_id  uuid, --FK added after family_members is created
  settings        jsonb default '{}',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- Table: family_members
-- ============================================================
create table public.family_members (
  id                  uuid primary key default uuid_generate_v4(),
  tree_id             uuid not null references public.family_trees(id) on delete cascade,
  first_name          text not null,
  last_name           text not null,
  birth_date          date,
  death_date          date,
  gender              text check (gender in ('male', 'female', 'other')),
  birth_place         text,
  location            text,
  occupation          text,
  bio                 text, -- markdown
  email               text,
  phone               text,
  profile_photo_url   text,
  is_adopted          boolean default false,
  is_root             boolean default false,
  last_edited_by      uuid references public.users(id),
  last_edited_at      timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Add FK for root_person_id now that family_members exists
alter table public.family_trees
  add constraint fk_root_person
  foreign key (root_person_id)
  references public.family_members(id)
  on delete set null;

-- ============================================================
-- Table: relationships
-- ============================================================
create table public.relationships (
  id                uuid primary key default uuid_generate_v4(),
  tree_id           uuid not null references public.family_trees(id) on delete cascade,
  person_a_id       uuid not null references public.family_members(id) on delete cascade,
  person_b_id       uuid not null references public.family_members(id) on delete cascade,
  relationship_type text not null check (relationship_type in ('spouse', 'parent_child', 'step_sibling')),
  is_primary        boolean default false,
  marriage_date     date,
  divorce_date      date,
  ended_reason      text check (ended_reason in ('divorce', 'death', 'null')),
  created_at        timestamptz default now(),

  constraint no_self_relationship check (person_a_id != person_b_id)
);

-- ============================================================
-- Table: tree_memberships
-- ============================================================
create table public.tree_memberships (
  id          uuid primary key default uuid_generate_v4(),
  tree_id     uuid not null references public.family_trees(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null check (role in ('admin', 'family_member')),
  invited_at  timestamptz default now(),
  joined_at   timestamptz
);

-- unique membership per tree/user
create unique index idx_tree_membership_user on public.tree_memberships(tree_id, user_id);

-- ============================================================
-- Table: invite_tokens
-- ============================================================
create table public.invite_tokens (
  id          uuid primary key default uuid_generate_v4(),
  tree_id     uuid not null references public.family_trees(id) on delete cascade,
  token       text unique not null,
  email       text not null,
  role        text not null check (role in ('admin', 'family_member')),
  expires_at  timestamptz, -- null = never expires
  used_at     timestamptz,
  created_at  timestamptz default now()
);

create index idx_invite_token on public.invite_tokens(token);
create index idx_invite_tree on public.invite_tokens(tree_id);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_family_members_tree on public.family_members(tree_id);
create index idx_family_trees_owner on public.family_trees(owner_id);
create index idx_relationships_tree on public.relationships(tree_id);
create index idx_tree_memberships_user on public.tree_memberships(user_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.users enable row level security;
alter table public.family_trees enable row level security;
alter table public.family_members enable row level security;
alter table public.relationships enable row level security;
alter table public.tree_memberships enable row level security;
alter table public.invite_tokens enable row level security;

-- Helper: does the current user have access to a tree?
create or replace function public.user_has_tree_access(tree_uuid uuid)
returns boolean
stable
language sql
security definer
as $$
  select exists (
    select 1 from public.tree_memberships tm
    where tm.tree_id = tree_uuid
      and tm.user_id = auth.uid()
  );
$$;

-- Helper: is the current user an admin of a tree?
create or replace function public.user_is_tree_admin(tree_uuid uuid)
returns boolean
stable
language sql
security definer
as $$
  select exists (
    select 1 from public.tree_memberships tm
    where tm.tree_id = tree_uuid
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  );
$$;

-- ============================================================
-- RLS Policies: users
-- ============================================================

create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Auth trigger can insert users"
  on public.users for insert
  with check (auth.uid() = id);

-- ============================================================
-- RLS Policies: family_trees
-- ============================================================

create policy "Members can view their trees"
  on public.family_trees for select
  using (user_has_tree_access(id));

create policy "Owner or admin can update tree"
  on public.family_trees for update
  using (user_is_tree_admin(id));

create policy "Admins can insert new trees"
  on public.family_trees for insert
  with check (auth.uid() = owner_id);

create policy "Owner can delete tree"
  on public.family_trees for delete
  using (auth.uid() = owner_id);

-- ============================================================
-- RLS Policies: family_members
-- ============================================================

create policy "Members can view members of their trees"
  on public.family_members for select
  using (user_has_tree_access(tree_id));

create policy "Admins can insert members"
  on public.family_members for insert
  with check (user_is_tree_admin(tree_id));

create policy "Admins can update members"
  on public.family_members for update
  using (user_is_tree_admin(tree_id));

create policy "Admins can delete members"
  on public.family_members for delete
  using (user_is_tree_admin(tree_id));

-- ============================================================
-- RLS Policies: relationships
-- ============================================================

create policy "Members can view relationships in their trees"
  on public.relationships for select
  using (user_has_tree_access(tree_id));

create policy "Admins can manage relationships"
  on public.relationships for all
  using (user_is_tree_admin(tree_id));

-- ============================================================
-- RLS Policies: tree_memberships
-- ============================================================

create policy "Members can view their memberships"
  on public.tree_memberships for select
  using (auth.uid() = user_id);

create policy "Admins can view all memberships"
  on public.tree_memberships for select
  using (user_is_tree_admin(tree_id));

create policy "Admins can insert memberships"
  on public.tree_memberships for insert
  with check (user_is_tree_admin(tree_id));

create policy "Admins can update memberships (role changes)"
  on public.tree_memberships for update
  using (user_is_tree_admin(tree_id));

create policy "Admins can delete memberships"
  on public.tree_memberships for delete
  using (user_is_tree_admin(tree_id));

-- ============================================================
-- RLS Policies: invite_tokens
-- ============================================================

create policy "Anyone can view invite by token (for invite acceptance)"
  on public.invite_tokens for select
  using (true);

create policy "Admins can manage invites"
  on public.invite_tokens for all
  using (user_is_tree_admin(tree_id));

-- ============================================================
-- Auto-create user record on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now(),
        last_sign_in_at = now();
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
