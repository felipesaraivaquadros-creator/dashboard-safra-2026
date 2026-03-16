-- 1. Garante que os armazéns citados existam no cadastro
INSERT INTO public.armazens (nome)
VALUES 
  ('AMAGGI MATUPÁ'),
  ('AMAGGI SINOP'),
  ('ADM STA HELENA (AC GRÃOS)'),
  ('SIPAL'),
  ('AMAGGI LRV'),
  ('GO AGRO ARMAZENS GERAIS LTDA')
ON CONFLICT (nome) DO NOTHING;

-- 2. Limpa contratos de soja 24/25 existentes para evitar duplicidade
DELETE FROM public.contratos WHERE safra_id = 'soja2425';

-- 3. Insere os novos contratos de Soja 24/25
INSERT INTO public.contratos (safra_id, numero, nome, volume_total, armazem_id)
SELECT 
  'soja2425',
  t.numero,
  t.nome,
  t.sacas,
  a.id
FROM (
  VALUES 
    ('9058-8634', 'BARTER - Amaggi Matupá', 5754, 'AMAGGI MATUPÁ'),
    ('9058-8633', 'BARTER - Amaggi Sinop', 18000, 'AMAGGI SINOP'),
    ('ARR-PC', 'ARREND. + PLANT. + TRATOR + INSUMOS (Paulo Cezar)', 11577, 'ADM STA HELENA (AC GRÃOS)'),
    ('SERV-D', 'SERVIÇO (Dieison)', 1032, 'ADM STA HELENA (AC GRÃOS)'),
    ('290925M51', 'VENDA - Romancini', 3000, 'SIPAL'),
    ('290925M69', 'VENDA - Romancini', 3000, 'SIPAL'),
    ('ILDIANA', 'VENDA - Estrelinha', 3000, 'AMAGGI MATUPÁ'),
    ('20240105500994-1', 'VENDA - Romancini', 18000, 'AMAGGI LRV'),
    ('1334P50762S', 'VENDA - Castanhal', 20000, 'ADM STA HELENA (AC GRÃOS)'),
    ('51/2025', 'VENDA - Castanhal', 5916.04, 'GO AGRO ARMAZENS GERAIS LTDA'),
    ('290925M282', 'VENDA - Romancini', 3471, 'SIPAL'),
    ('960732', 'VENDA - Castanhal (Ildo)', 1000, 'ADM STA HELENA (AC GRÃOS)'),
    ('ILDO-MAT-1', 'VENDA - Estrelinha (Ildo)', 5013, 'AMAGGI MATUPÁ'),
    ('ILDO-SIN-1', 'VENDA - São Luiz (Ildo)', 10339.67, 'AMAGGI SINOP'),
    ('ILDO-SIN-2', 'VENDA - São Luiz (Ildo)', 671.17, 'AMAGGI SINOP'),
    ('960734', 'VENDA - Castanhal (Ildo)', 3948.15, 'ADM STA HELENA (AC GRÃOS)'),
    ('960737', 'VENDA - Castanhal (Ildiana)', 393.40, 'ADM STA HELENA (AC GRÃOS)'),
    ('ILDO-MAT-2', 'VENDA - Estrelinha (Ildo)', 3018, 'AMAGGI MATUPÁ'),
    ('2025-01-055-01160', 'VENDA - Romancini', 526.62, 'AMAGGI LRV')
) AS t(numero, nome, sacas, armazem_nome)
JOIN public.armazens a ON a.nome = t.armazem_nome;