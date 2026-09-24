-- Optional financial layer for contracts.
-- Existing contracts remain valid and do not need backfilling.

create table if not exists public.contratos_financeiros (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null unique references public.contratos(id) on delete cascade,
  status_preco text not null default 'a_fixar'
    check (status_preco in ('a_fixar', 'fixado')),
  preco_saca numeric(14,4)
    check (preco_saca is null or preco_saca >= 0),
  data_contrato date,
  competencia date,
  tributos_revisados boolean not null default false,
  aceita_excedente boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status_preco = 'a_fixar' or preco_saca is not null)
);

create table if not exists public.contratos_descontos (
  id uuid primary key default gen_random_uuid(),
  contrato_financeiro_id uuid not null references public.contratos_financeiros(id) on delete cascade,
  tipo text not null
    check (tipo in ('SENAR', 'FETHAB', 'FUNRURAL', 'IAGRO', 'COOP', 'OUTRO')),
  descricao text,
  metodo text not null
    check (metodo in ('percentual', 'por_saca', 'valor_fixo')),
  valor numeric(14,6) not null default 0
    check (valor >= 0),
  created_at timestamptz not null default now()
);

create index if not exists contratos_financeiros_contrato_id_idx
  on public.contratos_financeiros (contrato_id);

create index if not exists contratos_financeiros_competencia_idx
  on public.contratos_financeiros (competencia);

create index if not exists contratos_descontos_financeiro_id_idx
  on public.contratos_descontos (contrato_financeiro_id);

alter table public.contratos_financeiros enable row level security;
alter table public.contratos_descontos enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contratos_financeiros'
      and policyname = 'contratos_financeiros_authenticated_all'
  ) then
    create policy contratos_financeiros_authenticated_all
      on public.contratos_financeiros
      for all
      to authenticated
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contratos_descontos'
      and policyname = 'contratos_descontos_authenticated_all'
  ) then
    create policy contratos_descontos_authenticated_all
      on public.contratos_descontos
      for all
      to authenticated
      using (true)
      with check (true);
  end if;
end
$$;

grant select, insert, update, delete on public.contratos_financeiros to authenticated;
grant select, insert, update, delete on public.contratos_descontos to authenticated;

create or replace function public.set_contratos_financeiros_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contratos_financeiros_set_updated_at on public.contratos_financeiros;
create trigger contratos_financeiros_set_updated_at
before update on public.contratos_financeiros
for each row execute function public.set_contratos_financeiros_updated_at();

-- Saves the financial header and all discounts in a single transaction.
-- This prevents a partial update from deleting discounts when a later insert fails.
create or replace function public.salvar_contrato_financeiro(
  p_contrato_id uuid,
  p_status_preco text,
  p_preco_saca numeric,
  p_data_contrato date,
  p_competencia date,
  p_tributos_revisados boolean,
  p_aceita_excedente boolean,
  p_observacoes text,
  p_descontos jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_financeiro_id uuid;
begin
  insert into public.contratos_financeiros (
    contrato_id,
    status_preco,
    preco_saca,
    data_contrato,
    competencia,
    tributos_revisados,
    aceita_excedente,
    observacoes
  ) values (
    p_contrato_id,
    p_status_preco,
    p_preco_saca,
    p_data_contrato,
    p_competencia,
    p_tributos_revisados,
    p_aceita_excedente,
    p_observacoes
  )
  on conflict (contrato_id) do update set
    status_preco = excluded.status_preco,
    preco_saca = excluded.preco_saca,
    data_contrato = excluded.data_contrato,
    competencia = excluded.competencia,
    tributos_revisados = excluded.tributos_revisados,
    aceita_excedente = excluded.aceita_excedente,
    observacoes = excluded.observacoes
  returning id into v_financeiro_id;

  delete from public.contratos_descontos
  where contrato_financeiro_id = v_financeiro_id;

  insert into public.contratos_descontos (
    contrato_financeiro_id,
    tipo,
    descricao,
    metodo,
    valor
  )
  select
    v_financeiro_id,
    item.tipo,
    item.descricao,
    item.metodo,
    item.valor
  from jsonb_to_recordset(coalesce(p_descontos, '[]'::jsonb))
    as item(tipo text, descricao text, metodo text, valor numeric)
  where item.valor > 0;

  return v_financeiro_id;
end;
$$;

grant execute on function public.salvar_contrato_financeiro(
  uuid, text, numeric, date, date, boolean, boolean, text, jsonb
) to authenticated;
