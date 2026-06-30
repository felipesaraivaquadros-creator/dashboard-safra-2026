-- Reset selected safras before reimporting official MS Gestor spreadsheets through the app.
-- Review the safra list before running.
-- This keeps shared cadastro tables such as fazendas and armazens.

begin;

-- 1) Choose which safras will be cleaned and reimported.
-- Remove any safra you do not want to reset.
with target_safras(safra_id) as (
  values
    ('milho26'),
    ('milho25'),
    ('soja2526'),
    ('soja2425')
)
delete from public.saldos_custom sc
using target_safras t
where sc.safra_id = t.safra_id;

with target_safras(safra_id) as (
  values
    ('milho26'),
    ('milho25'),
    ('soja2526'),
    ('soja2425')
)
delete from public.saldos s
using target_safras t
where s.safra_id = t.safra_id;

with target_safras(safra_id) as (
  values
    ('milho26'),
    ('milho25'),
    ('soja2526'),
    ('soja2425')
)
delete from public.romaneios r
using target_safras t
where r.safra_id = t.safra_id;

with target_safras(safra_id) as (
  values
    ('milho26'),
    ('milho25'),
    ('soja2526'),
    ('soja2425')
)
delete from public.contratos c
using target_safras t
where c.safra_id = t.safra_id;

-- Optional financial reset. Uncomment only if you want to remove old freight advances/fuel entries too.
/*
with target_safras(safra_id) as (
  values
    ('milho26'),
    ('milho25'),
    ('soja2526'),
    ('soja2425')
)
delete from public.adiantamentos a
using target_safras t
where a.safra_id = t.safra_id;

with target_safras(safra_id) as (
  values
    ('milho26'),
    ('milho25'),
    ('soja2526'),
    ('soja2425')
)
delete from public.abastecimentos a
using target_safras t
where a.safra_id = t.safra_id;
*/

-- 2) Recreate unique constraints used by app imports.
do $$
begin
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
    where conname = 'contratos_safra_id_numero_key'
      and conrelid = 'public.contratos'::regclass
  ) then
    alter table public.contratos
      add constraint contratos_safra_id_numero_key unique (safra_id, numero);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'saldos_safra_id_armazem_id_key'
      and conrelid = 'public.saldos'::regclass
  ) then
    alter table public.saldos
      add constraint saldos_safra_id_armazem_id_key unique (safra_id, armazem_id);
  end if;
end $$;

commit;

-- 3) Quick verification. These counts should be zero for reset safras before reimport.
select safra_id, count(*) as romaneios
from public.romaneios
where safra_id in ('milho26', 'milho25', 'soja2526', 'soja2425')
group by safra_id
order by safra_id;