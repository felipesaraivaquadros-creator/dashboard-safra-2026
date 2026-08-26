-- Talhões cadastrados por safra e fazenda.
-- Execute este arquivo uma vez no Supabase SQL Editor antes de usar /[safraId]/talhoes.

create extension if not exists pgcrypto;

create table if not exists public.talhoes (
  id uuid primary key default gen_random_uuid(),
  safra_id text not null,
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  nome text not null,
  area_ha numeric not null check (area_ha > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (safra_id, fazenda_id, nome)
);

create index if not exists talhoes_safra_fazenda_index
  on public.talhoes (safra_id, fazenda_id);

alter table public.talhoes enable row level security;

grant select, insert, update, delete on public.talhoes to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'talhoes'
      and policyname = 'talhoes_authenticated_all'
  ) then
    create policy talhoes_authenticated_all
      on public.talhoes
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;
