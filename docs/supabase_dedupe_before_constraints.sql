-- Deduplicate existing rows before creating import unique constraints.
-- Review the SELECT results first. Run DELETE only after confirming the duplicates are safe to collapse.
-- Current import key: safra_id + numero_romaneio + nfe.
-- If duplicated rows exist, this script keeps the most complete/latest row:
-- 1) peso_bruto_kg filled and greater than zero
-- 2) peso_liquid_kg filled and greater than zero
-- 3) newest created_at
-- 4) greatest id

-- 1) Preview duplicated romaneio keys.
select
  safra_id,
  numero_romaneio,
  nfe,
  count(*) as total
from public.romaneios
where nfe is not null
  and numero_romaneio is not null
group by safra_id, numero_romaneio, nfe
having count(*) > 1
order by total desc, safra_id, numero_romaneio, nfe;

-- 2) Preview the rows that would be removed.
with ranked as (
  select
    id,
    safra_id,
    nfe,
    numero_romaneio,
    peso_bruto_kg,
    peso_liquid_kg,
    created_at,
    row_number() over (
      partition by safra_id, numero_romaneio, nfe
      order by
        case when coalesce(peso_bruto_kg, 0) > 0 then 1 else 0 end desc,
        case when coalesce(peso_liquid_kg, 0) > 0 then 1 else 0 end desc,
        created_at desc nulls last,
        id desc
    ) as rn
  from public.romaneios
  where nfe is not null
    and numero_romaneio is not null
)
select *
from ranked
order by safra_id, numero_romaneio, nfe, rn;

-- 3) Delete duplicated rows, keeping the most complete/latest row for each import key.
-- Uncomment and run this block only after reviewing the previews above.
/*
with ranked as (
  select
    id,
    row_number() over (
      partition by safra_id, numero_romaneio, nfe
      order by
        case when coalesce(peso_bruto_kg, 0) > 0 then 1 else 0 end desc,
        case when coalesce(peso_liquid_kg, 0) > 0 then 1 else 0 end desc,
        created_at desc nulls last,
        id desc
    ) as rn
  from public.romaneios
  where nfe is not null
    and numero_romaneio is not null
)
delete from public.romaneios r
using ranked d
where r.id = d.id
  and d.rn > 1
returning r.id, r.safra_id, r.numero_romaneio, r.nfe, r.peso_bruto_kg, r.created_at;
*/

-- 4) Re-run the duplicate preview. It should return zero rows before adding constraints.
