-- Constraints required by the in-app MS Gestor import flow.
-- Run this in Supabase SQL Editor before saving imported rows.

-- Optional preflight checks. These must return zero rows before adding constraints.
select safra_id, numero, count(*) as total
from public.contratos
where numero is not null
group by safra_id, numero
having count(*) > 1;

select safra_id, numero_romaneio, nfe, count(*) as total
from public.romaneios
where nfe is not null
  and numero_romaneio is not null
group by safra_id, numero_romaneio, nfe
having count(*) > 1;

select safra_id, armazem_id, count(*) as total
from public.saldos
where armazem_id is not null
group by safra_id, armazem_id
having count(*) > 1;

-- Add the unique constraints used by supabase-js upsert(..., { onConflict }).
do $$
begin
  if exists (
    select 1
    from public.romaneios
    where nfe is not null
      and numero_romaneio is not null
    group by safra_id, numero_romaneio, nfe
    having count(*) > 1
  ) then
    raise exception 'Existem romaneios duplicados por safra_id + numero_romaneio + nfe. Rode docs/supabase_dedupe_before_constraints.sql antes de criar romaneios_import_key.';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'contratos_safra_id_numero_key'
      and conrelid = 'public.contratos'::regclass
  ) then
    alter table public.contratos
      add constraint contratos_safra_id_numero_key unique (safra_id, numero);
  end if;

  if exists (
    select 1 from pg_constraint
    where conname = 'romaneios_import_key'
      and conrelid = 'public.romaneios'::regclass
  ) then
    alter table public.romaneios drop constraint romaneios_import_key;
  end if;

  alter table public.romaneios
    add constraint romaneios_import_key unique (safra_id, numero_romaneio, nfe);

  if not exists (
    select 1 from pg_constraint
    where conname = 'saldos_safra_id_armazem_id_key'
      and conrelid = 'public.saldos'::regclass
  ) then
    alter table public.saldos
      add constraint saldos_safra_id_armazem_id_key unique (safra_id, armazem_id);
  end if;
end $$;
