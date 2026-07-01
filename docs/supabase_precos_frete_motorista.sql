-- Evolucao da tabela de precos de frete para preco por motorista + cidade.
-- Execute este arquivo no Supabase SQL Editor antes de usar a nova tela de precos.

create extension if not exists pgcrypto;
create extension if not exists unaccent;

create table if not exists public.precos_frete (
  id uuid primary key default gen_random_uuid(),
  safra_id text not null,
  cidade text not null,
  motorista text,
  valor numeric not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.precos_frete
  add column if not exists motorista text;

alter table public.precos_frete
  add column if not exists created_at timestamptz default now();

alter table public.precos_frete
  add column if not exists updated_at timestamptz default now();

update public.precos_frete
set
  cidade = upper(trim(unaccent(coalesce(nullif(cidade, ''), 'SEM CIDADE')))),
  motorista = upper(trim(unaccent(coalesce(nullif(motorista, ''), 'GERAL')))),
  valor = coalesce(valor, 0),
  updated_at = now()
where true;

alter table public.precos_frete
  alter column motorista set not null;

alter table public.precos_frete
  alter column cidade set not null;

alter table public.precos_frete
  alter column valor set not null;

-- Remove constraints unicas antigas em safra + cidade, se existirem.
do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'precos_frete'
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) ilike '%safra_id%'
      and pg_get_constraintdef(c.oid) ilike '%cidade%'
      and pg_get_constraintdef(c.oid) not ilike '%motorista%'
  loop
    execute format('alter table public.precos_frete drop constraint %I', constraint_name);
  end loop;
end $$;

-- Consolida duplicidades antes da nova chave unica, mantendo o registro mais recente.
with ranked as (
  select
    id,
    row_number() over (
      partition by safra_id, motorista, cidade
      order by updated_at desc nulls last, created_at desc nulls last, id desc
    ) as rn
  from public.precos_frete
)
delete from public.precos_frete p
using ranked r
where p.id = r.id
  and r.rn > 1;

create unique index if not exists precos_frete_motorista_cidade_key
  on public.precos_frete (safra_id, motorista, cidade);

alter table public.precos_frete enable row level security;

grant select, insert, update, delete on public.precos_frete to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'precos_frete'
      and policyname = 'precos_frete_authenticated_all'
  ) then
    create policy precos_frete_authenticated_all
      on public.precos_frete
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;
