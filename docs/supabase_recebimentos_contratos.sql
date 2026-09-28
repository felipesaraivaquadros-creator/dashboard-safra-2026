-- Phase 2: expected receivables and actual settlements for contract finance.
-- Run after docs/supabase_contratos_financeiros.sql.

create table if not exists public.contratos_recebiveis (
  id uuid primary key default gen_random_uuid(),
  contrato_financeiro_id uuid not null references public.contratos_financeiros(id) on delete cascade,
  numero_parcela integer not null default 1 check (numero_parcela > 0),
  descricao text,
  data_vencimento date not null,
  valor_previsto numeric(14,2) not null check (valor_previsto > 0),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contrato_financeiro_id, numero_parcela)
);

create table if not exists public.contratos_baixas (
  id uuid primary key default gen_random_uuid(),
  recebivel_id uuid not null references public.contratos_recebiveis(id) on delete cascade,
  data_recebimento date not null,
  valor_recebido numeric(14,2) not null check (valor_recebido > 0),
  forma_recebimento text,
  referencia text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contratos_recebiveis_financeiro_id_idx
  on public.contratos_recebiveis (contrato_financeiro_id);
create index if not exists contratos_recebiveis_vencimento_idx
  on public.contratos_recebiveis (data_vencimento);
create index if not exists contratos_baixas_recebivel_id_idx
  on public.contratos_baixas (recebivel_id);
create index if not exists contratos_baixas_data_idx
  on public.contratos_baixas (data_recebimento);

alter table public.contratos_recebiveis enable row level security;
alter table public.contratos_baixas enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contratos_recebiveis'
      and policyname = 'contratos_recebiveis_authenticated_all'
  ) then
    create policy contratos_recebiveis_authenticated_all
      on public.contratos_recebiveis
      for all to authenticated
      using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contratos_baixas'
      and policyname = 'contratos_baixas_authenticated_all'
  ) then
    create policy contratos_baixas_authenticated_all
      on public.contratos_baixas
      for all to authenticated
      using (true) with check (true);
  end if;
end
$$;

grant select, insert, update, delete on public.contratos_recebiveis to authenticated;
grant select, insert, update, delete on public.contratos_baixas to authenticated;

create or replace function public.set_contratos_recebimentos_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contratos_recebiveis_set_updated_at on public.contratos_recebiveis;
create trigger contratos_recebiveis_set_updated_at
before update on public.contratos_recebiveis
for each row execute function public.set_contratos_recebimentos_updated_at();

drop trigger if exists contratos_baixas_set_updated_at on public.contratos_baixas;
create trigger contratos_baixas_set_updated_at
before update on public.contratos_baixas
for each row execute function public.set_contratos_recebimentos_updated_at();

create or replace function public.validar_total_baixas_recebivel()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_valor_previsto numeric(14,2);
  v_total_outras_baixas numeric(14,2);
begin
  select valor_previsto
    into v_valor_previsto
  from public.contratos_recebiveis
  where id = new.recebivel_id
  for update;

  if v_valor_previsto is null then
    raise exception 'Parcela de recebimento não encontrada.';
  end if;

  select coalesce(sum(valor_recebido), 0)
    into v_total_outras_baixas
  from public.contratos_baixas
  where recebivel_id = new.recebivel_id
    and id <> new.id;

  if v_total_outras_baixas + new.valor_recebido > v_valor_previsto then
    raise exception 'A baixa ultrapassa o saldo disponível da parcela.';
  end if;

  return new;
end;
$$;

drop trigger if exists contratos_baixas_validar_total on public.contratos_baixas;
create trigger contratos_baixas_validar_total
before insert or update on public.contratos_baixas
for each row execute function public.validar_total_baixas_recebivel();

create or replace function public.validar_valor_recebivel()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_total_recebido numeric(14,2);
begin
  select coalesce(sum(valor_recebido), 0)
    into v_total_recebido
  from public.contratos_baixas
  where recebivel_id = old.id;

  if new.valor_previsto < v_total_recebido then
    raise exception 'O valor previsto não pode ser menor que o total já recebido.';
  end if;

  return new;
end;
$$;

drop trigger if exists contratos_recebiveis_validar_valor on public.contratos_recebiveis;
create trigger contratos_recebiveis_validar_valor
before update of valor_previsto on public.contratos_recebiveis
for each row execute function public.validar_valor_recebivel();
