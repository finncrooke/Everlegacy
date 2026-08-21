-- Everlegacy database schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- orders
-- Created by the Stripe webhook once payment succeeds. Linked to a customer
-- account once they finish creating one (account creation happens right
-- after checkout, but the order exists slightly before the account row does).
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  stripe_checkout_session_id text unique not null,
  stripe_payment_intent_id text,
  customer_email text not null,
  shipping_name text not null,
  shipping_address_line1 text not null,
  shipping_address_line2 text,
  shipping_city text not null,
  shipping_postcode text not null,
  shipping_country text not null default 'United Kingdom',
  amount_total integer not null, -- pence
  currency text not null default 'gbp',
  status text not null default 'processing' check (status in ('processing', 'shipped', 'delivered')),
  user_id uuid references auth.users (id) on delete set null,
  tribute_page_id uuid,
  claim_token uuid not null default gen_random_uuid() -- used to link the order to the account created right after payment
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_claim_token_idx on public.orders (claim_token);

-- ---------------------------------------------------------------------------
-- tribute_pages
-- One per order/account for v1 (no multi-page accounts yet).
-- ---------------------------------------------------------------------------
create table if not exists public.tribute_pages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  slug text unique not null,
  full_name text not null default '',
  date_of_birth date,
  date_of_passing date,
  epitaph text,
  story text,
  cover_photo_path text,
  visibility text not null default 'unlisted' check (visibility in ('public', 'unlisted')),
  published boolean not null default false
);

create index if not exists tribute_pages_user_id_idx on public.tribute_pages (user_id);
create index if not exists tribute_pages_slug_idx on public.tribute_pages (slug);

alter table public.orders
  add constraint orders_tribute_page_fk
  foreign key (tribute_page_id) references public.tribute_pages (id) on delete set null;

-- ---------------------------------------------------------------------------
-- tribute_photos
-- ---------------------------------------------------------------------------
create table if not exists public.tribute_photos (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tribute_page_id uuid not null references public.tribute_pages (id) on delete cascade,
  storage_path text not null,
  is_cover boolean not null default false,
  position integer not null default 0,
  alt_text text
);

create index if not exists tribute_photos_page_idx on public.tribute_photos (tribute_page_id);

-- ---------------------------------------------------------------------------
-- tribute_timeline_entries
-- ---------------------------------------------------------------------------
create table if not exists public.tribute_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tribute_page_id uuid not null references public.tribute_pages (id) on delete cascade,
  entry_date text not null, -- free text, e.g. "1985" or "1985-06-12"
  title text not null,
  description text,
  position integer not null default 0
);

create index if not exists tribute_timeline_page_idx on public.tribute_timeline_entries (tribute_page_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;
alter table public.tribute_pages enable row level security;
alter table public.tribute_photos enable row level security;
alter table public.tribute_timeline_entries enable row level security;

-- Orders: a customer may only read their own order once it's linked to them.
-- All writes go through the service role (webhook / admin API routes).
create policy "customers read own orders" on public.orders
  for select using (auth.uid() = user_id);

-- Tribute pages: owner has full access; anyone can read a page that is
-- published and (public or unlisted) — unlisted just means "not indexed",
-- it is still reachable by anyone who has the direct URL.
create policy "owner manages own tribute page" on public.tribute_pages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "anyone can view published tribute pages" on public.tribute_pages
  for select using (published = true);

create policy "owner manages own photos" on public.tribute_photos
  for all using (
    exists (
      select 1 from public.tribute_pages tp
      where tp.id = tribute_photos.tribute_page_id and tp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tribute_pages tp
      where tp.id = tribute_photos.tribute_page_id and tp.user_id = auth.uid()
    )
  );

create policy "anyone can view photos of published pages" on public.tribute_photos
  for select using (
    exists (
      select 1 from public.tribute_pages tp
      where tp.id = tribute_photos.tribute_page_id and tp.published = true
    )
  );

create policy "owner manages own timeline" on public.tribute_timeline_entries
  for all using (
    exists (
      select 1 from public.tribute_pages tp
      where tp.id = tribute_timeline_entries.tribute_page_id and tp.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.tribute_pages tp
      where tp.id = tribute_timeline_entries.tribute_page_id and tp.user_id = auth.uid()
    )
  );

create policy "anyone can view timeline of published pages" on public.tribute_timeline_entries
  for select using (
    exists (
      select 1 from public.tribute_pages tp
      where tp.id = tribute_timeline_entries.tribute_page_id and tp.published = true
    )
  );

-- updated_at trigger for tribute_pages
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tribute_pages_set_updated_at on public.tribute_pages;
create trigger tribute_pages_set_updated_at
  before update on public.tribute_pages
  for each row execute function public.set_updated_at();
