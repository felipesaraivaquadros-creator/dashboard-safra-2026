-- Required for professional CRUD of driver advances and fuel entries.
-- Run this in Supabase SQL Editor.

-- 1) Keep abastecimentos compatible with the app product selector.
alter table public.abastecimentos
  add column if not exists produto text not null default 'DIESEL';

update public.abastecimentos
set produto = 'DIESEL'
where produto is null or trim(produto) = '';

alter table public.abastecimentos
  alter column produto set default 'DIESEL';

-- 2) Enable RLS and grant table privileges to logged users.
alter table public.adiantamentos enable row level security;
alter table public.abastecimentos enable row level security;

grant select, insert, update, delete on public.adiantamentos to authenticated;
grant select, insert, update, delete on public.abastecimentos to authenticated;

-- Keep policies aligned with the app's restricted login.
create or replace function public.is_app_operator()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'fazendaromancini@gmail.com';
$$;

grant execute on function public.is_app_operator() to authenticated;

-- 3) Replace policies to avoid duplicated policy-name errors.
drop policy if exists adiantamentos_authenticated_select on public.adiantamentos;
drop policy if exists adiantamentos_authenticated_insert on public.adiantamentos;
drop policy if exists adiantamentos_authenticated_update on public.adiantamentos;
drop policy if exists adiantamentos_authenticated_delete on public.adiantamentos;

drop policy if exists abastecimentos_authenticated_select on public.abastecimentos;
drop policy if exists abastecimentos_authenticated_insert on public.abastecimentos;
drop policy if exists abastecimentos_authenticated_update on public.abastecimentos;
drop policy if exists abastecimentos_authenticated_delete on public.abastecimentos;

create policy adiantamentos_authenticated_select
on public.adiantamentos
for select
to authenticated
using (public.is_app_operator());

create policy adiantamentos_authenticated_insert
on public.adiantamentos
for insert
to authenticated
with check (public.is_app_operator());

create policy adiantamentos_authenticated_update
on public.adiantamentos
for update
to authenticated
using (public.is_app_operator())
with check (public.is_app_operator());

create policy adiantamentos_authenticated_delete
on public.adiantamentos
for delete
to authenticated
using (public.is_app_operator());

create policy abastecimentos_authenticated_select
on public.abastecimentos
for select
to authenticated
using (public.is_app_operator());

create policy abastecimentos_authenticated_insert
on public.abastecimentos
for insert
to authenticated
with check (public.is_app_operator());

create policy abastecimentos_authenticated_update
on public.abastecimentos
for update
to authenticated
using (public.is_app_operator())
with check (public.is_app_operator());

create policy abastecimentos_authenticated_delete
on public.abastecimentos
for delete
to authenticated
using (public.is_app_operator());

-- 4) Quick checks.
select column_name, data_type, column_default, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'abastecimentos'
  and column_name in ('produto', 'safra_id', 'motorista', 'data', 'litros', 'preco', 'total')
order by ordinal_position;
