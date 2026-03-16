-- 1. Garante que os armazéns citados existam no cadastro
INSERT INTO public.armazens (nome)
VALUES 
  ('SIPAL LRV'),
  ('KODIAK/ AGROFÉRTIL'),
  ('SIPAL LRV/ AGROFERTIL'),
  ('INPASA'),
  ('AMAGGI MATUPÁ'),
  ('INPASA - 1º Pagamento'),
  ('INPASA - 2º Pagamento'),
  ('ADM DO BRASIL (N.S.H.)'),
  ('AMAGGI SINOP'),
  ('SIPAL MATUPÁ'),
  ('SIPAL CLÁUDIA')
ON CONFLICT (nome) DO NOTHING;

-- 2. Limpa contratos de milho existentes para evitar duplicidade na carga
DELETE FROM public.contratos WHERE safra_id = 'milho25';

-- 3. Insere os novos contratos de Milho
-- Nota: IDs com sufixos (-CST, -SLZ, etc) para permitir múltiplos registros do mesmo contrato
INSERT INTO public.contratos (safra_id, numero, nome, volume_total, armazem_id)
SELECT 
  'milho25',
  t.numero,
  t.nome,
  t.sacas,
  a.id
FROM (
  VALUES 
    ('290924M180', 'BARTER - Romancini', 14297, 'SIPAL LRV'),
    ('SEMENTES-KODIAK', 'BARTER Sementes - Romancini', 5063, 'KODIAK/ AGROFÉRTIL'),
    ('SEMENTES-SIPAL', 'BARTER Sementes - Romancini', 2118, 'SIPAL LRV/ AGROFERTIL'),
    ('INSUMOS-SIPAL', 'BARTER Insumos - Romancini', 380, 'SIPAL LRV/ AGROFERTIL'),
    ('ARR-INPASA', 'ARRENDAMENTO - Castanhal', 6000, 'INPASA'),
    ('20240106900533-1', 'BARTER - Estrelinha', 14460, 'AMAGGI MATUPÁ'),
    ('21960-CST-1', 'VENDA 1º Pgto - Castanhal', 27665, 'INPASA - 1º Pagamento'),
    ('21960-SLZ-1', 'VENDA 1º Pgto - São Luiz', 11073, 'INPASA - 1º Pagamento'),
    ('21960-CST-2', 'VENDA 2º Pgto - Castanhal', 21262, 'INPASA - 2º Pagamento'),
    ('28614', 'VENDA - Castanhal', 536, 'INPASA'),
    ('290925M216', 'VENDA - Romancini', 10000, 'SIPAL LRV'),
    ('1334P50494M', 'VENDA - São Luiz', 23522, 'ADM DO BRASIL (N.S.H.)'),
    ('GRAO-DIRETO-AS', 'VENDA Grão Direto - São Luiz', 694, 'AMAGGI SINOP'),
    ('GRAO-DIRETO-AM-1', 'VENDA Grão Direto - Estrelinha', 6500, 'AMAGGI MATUPÁ'),
    ('GRAO-DIRETO-AM-2', 'VENDA Grão Direto - Estrelinha', 1000, 'AMAGGI MATUPÁ'),
    ('GRAO-DIRETO-AM-3', 'VENDA Grão Direto - Estrelinha', 2550, 'AMAGGI MATUPÁ'),
    ('COOP-LRV-1', 'VENDA Cooperativa - Romancini', 12000, 'SIPAL LRV'),
    ('COOP-SM', 'VENDA Cooperativa - Estrelinha', 935, 'SIPAL MATUPÁ'),
    ('COOP-SC', 'VENDA Cooperativa - São Luiz', 7308, 'SIPAL CLÁUDIA'),
    ('COOP-LRV-2', 'VENDA Cooperativa - Romancini', 9173, 'SIPAL LRV'),
    ('COOP-LRV-3', 'VENDA Cooperativa - Romancini', 3000, 'SIPAL LRV')
) AS t(numero, nome, sacas, armazem_nome)
JOIN public.armazens a ON a.nome = t.armazem_nome;