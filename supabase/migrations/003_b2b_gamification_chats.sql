alter table public.profiles add column if not exists current_streak integer not null default 1;
alter table public.profiles add column if not exists total_exp integer not null default 0;
alter table public.profiles add column if not exists chosen_totem text not null default 'arystan';
alter table public.profiles add column if not exists last_active_date date not null default current_date;
alter table public.profiles add column if not exists is_business_account boolean not null default false;

alter table public.professors add column if not exists email text;

create table if not exists public.b2b_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  contact_email text not null,
  country text not null default 'Kazakhstan',
  category text not null check (category in ('language_school', 'consultancy', 'summer_school', 'test_prep')),
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.advertisements (
  id text primary key,
  b2b_account_id text not null,
  title text not null,
  subtitle text not null,
  target_country text not null default 'all',
  target_keyword text not null,
  cta_label text not null,
  cta_url text not null,
  discount_note text,
  impressions integer not null default 0,
  clicks integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.exp_transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  action text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id text not null,
  title text not null,
  discount_code text not null,
  cost integer not null,
  redeemed_at timestamptz not null default now()
);

create table if not exists public.conversations (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  recipient_id text not null,
  recipient_name text not null,
  recipient_role text not null check (recipient_role in ('mentor', 'alumni', 'professor')),
  recipient_avatar text,
  recipient_affiliation text,
  last_message text,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id text primary key,
  conversation_id text not null references public.conversations(id) on delete cascade,
  sender_id text not null,
  sender_role text not null check (sender_role in ('student', 'mentor', 'alumni', 'professor')),
  sender_name text not null,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at asc);
create index if not exists idx_conversations_user on public.conversations(user_id, last_message_at desc);
create index if not exists idx_ads_targeting on public.advertisements(target_keyword, target_country, active);
create index if not exists idx_exp_tx_user on public.exp_transactions(user_id, created_at desc);
create index if not exists idx_rewards_user on public.rewards(user_id, redeemed_at desc);

alter table public.b2b_accounts enable row level security;
alter table public.advertisements enable row level security;
alter table public.exp_transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "own b2b account" on public.b2b_accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "public advertisements view" on public.advertisements for select using (true);
create policy "own advertisements modify" on public.advertisements for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "own exp transactions" on public.exp_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rewards" on public.rewards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own conversations" on public.conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "conversation messages read" on public.messages for select using (
  exists (
    select 1 from public.conversations
    where public.conversations.id = public.messages.conversation_id
    and public.conversations.user_id = auth.uid()
  )
);
create policy "conversation messages write" on public.messages for insert with check (
  exists (
    select 1 from public.conversations
    where public.conversations.id = public.messages.conversation_id
    and public.conversations.user_id = auth.uid()
  )
);

alter publication supabase_realtime add table public.messages;
