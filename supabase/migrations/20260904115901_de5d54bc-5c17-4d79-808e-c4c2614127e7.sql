create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

grant insert on public.newsletter_subscribers to anon, authenticated;
grant select on public.newsletter_subscribers to service_role;

create policy "Anyone can subscribe"
on public.newsletter_subscribers
for insert
to anon, authenticated
with check (true);