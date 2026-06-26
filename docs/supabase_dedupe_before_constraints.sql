-- Deduplicate existing rows before creating import unique constraints.
-- Review the SELECT results first. Run DELETE only after confirming the duplicates are safe to collapse.

-- 1) Preview duplicated romaneio keys.
select
  safra_id,
  numero_romaneio,
  nfe,
  peso_bruto_kg,
  count(*) as total
from public.romaneios
where nfe is not null
  and numero_romaneio is not null
  and peso_bruto_kg is not null
group by safra_id, numero_romaneio, nfe, peso_bruto_kg
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
    created_at,
    row_number() over (
      partition by safra_id, numero_romaneio, nfe, peso_bruto_kg
      order by created_at asc nulls last, id asc
    ) as rn
  from public.romaneios
  where nfe is not null
    and numero_romaneio is not null
    and peso_bruto_kg is not null
)
select *
from ranked
where rn > 1
order by safra_id, numero_romaneio, nfe, peso_bruto_kg, rn;

-- 3) Delete duplicated rows, keeping the oldest row for each import key.
-- Uncomment and run this block only after reviewing the previews above.
/*
with ranked as (
  select
    id,
    row_number() over (
      partition by safra_id, numero_romaneio, nfe, peso_bruto_kg
      order by created_at asc nulls last, id asc
    ) as rn
  from public.romaneios
  where nfe is not null
    and numero_romaneio is not null
    and peso_bruto_kg is not null
)
delete from public.romaneios r
using ranked d
where r.id = d.id
  and d.rn > 1
returning r.id, r.safra_id, r.numero_romaneio, r.nfe, r.peso_bruto_kg, r.created_at;
*/

-- 4) Re-run the duplicate preview. It should return zero rows before adding constraints.
