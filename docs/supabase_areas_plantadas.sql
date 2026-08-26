-- Areas plantadas por fazenda e por safra.
-- Execute este arquivo uma vez no Supabase SQL Editor antes de usar /[safraId]/areas.

create extension if not exists pgcrypto;

create table if not exists public.areas_plantadas (
  id uuid primary key default gen_random_uuid(),
  safra_id text not null,
  fazenda_id uuid not null references public.fazendas(id) on delete cascade,
  area_ha numeric not null check (area_ha > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists areas_plantadas_safra_fazenda_key
  on public.areas_plantadas (safra_id, fazenda_id);

create index if not exists areas_plantadas_safra_id_index
  on public.areas_plantadas (safra_id);

alter table public.areas_plantadas enable row level security;

grant select, insert, update, delete on public.areas_plantadas to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'areas_plantadas'
      and policyname = 'areas_plantadas_authenticated_all'
  ) then
    create policy areas_plantadas_authenticated_all
      on public.areas_plantadas
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;
