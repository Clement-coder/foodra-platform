-- Push notification subscriptions for PWA
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  endpoint text unique not null,
  subscription text not null,
  created_at timestamptz default now()
);

-- RLS
alter table push_subscriptions enable row level security;
create policy "Users manage own push subs" on push_subscriptions
  for all using (user_id = auth.uid());


