-- ==========================================
-- INSERÇÃO DE ROMANEIOS - SAFRA SOJA 25/26
-- ==========================================

-- Limpa romaneios da safra específica antes de reinserir (opcional, para evitar duplicados se rodar de novo)
DELETE FROM public.romaneios WHERE safra_id = 'soja2526';

INSERT INTO public.romaneios 
(safra_id, data, nfe, motorista, placa, talhao, peso_bruto_kg, peso_liquido_kg, sacas_bruto, sacas_liquida, umidade, preco_frete, fazenda_id, armazem_id, contrato_id)
VALUES
-- Carga 1
('soja2526', '2026-01-08', 934, 'MANOEL', 'SDY9E09', 'SLBREJO', 54590, 50414, 909.83, 840.23, 4176, 2.5, 
  (SELECT id FROM fazendas WHERE nome = 'São Luiz'), 
  (SELECT id FROM armazens WHERE nome = 'COFCO NSH'),
  (SELECT id FROM contratos WHERE numero = '72208' AND safra_id = 'soja2526')),

-- Carga 2
('soja2526', '2026-01-09', 935, 'MAURO', 'NUC1E75', 'SLBREJO', 48360, 45894, 806, 764.9, 2466, 2.5, 
  (SELECT id FROM fazendas WHERE nome = 'São Luiz'), 
  (SELECT id FROM armazens WHERE nome = 'COFCO NSH'),
  (SELECT id FROM contratos WHERE numero = '72208' AND safra_id = 'soja2526')),

-- Carga 3
('soja2526', '2026-01-10', 939, 'LEONEL', 'SDT3G54', 'SLBREJO', 50520, 49712, 842, 828.53, 808, 2.5, 
  (SELECT id FROM fazendas WHERE nome = 'São Luiz'), 
  (SELECT id FROM armazens WHERE nome = 'COFCO NSH'),
  (SELECT id FROM contratos WHERE numero = '72208' AND safra_id = 'soja2526')),

-- Carga 4
('soja2526', '2026-01-10', 938, 'MAURO', 'NUC1E75', 'SLBREJO', 47420, 46310, 790.33, 771.83, 1110, 2.5, 
  (SELECT id FROM fazendas WHERE nome = 'São Luiz'), 
  (SELECT id FROM armazens WHERE nome = 'COFCO NSH'),
  (SELECT id FROM contratos WHERE numero = '72208' AND safra_id = 'soja2526')),

-- Carga 5 (Troca Adubo)
('soja2526', '2026-01-14', 237, 'SADI', 'IYV1F40', 'SL03', 39217, 39217, 653.61, 653.61, 0, 2.7, 
  (SELECT id FROM fazendas WHERE nome = 'São Luiz'), 
  (SELECT id FROM armazens WHERE nome = 'COFCO NSH'),
  (SELECT id FROM contratos WHERE numero = '290925M339' AND safra_id = 'soja2526')),

-- Carga 6 (Arrendamento)
('soja2526', '2026-01-16', 432, 'MAISON', 'IQL1F16', 'SL01', 49600, 49054, 826.66, 817.56, 546, 2.5, 
  (SELECT id FROM fazendas WHERE nome = 'São Luiz'), 
  (SELECT id FROM armazens WHERE nome = 'COFCO NSH'),
  (SELECT id FROM contratos WHERE numero = 'ARR-SLZ-COFCO' AND safra_id = 'soja2526')),

-- Carga 7 (Depósito Estrelinha)
('soja2526', '2026-01-20', 164, 'MAURO', 'NUC1E75', 'EST02', 47600, 46876, 793.33, 781.26, 724, 2.0, 
  (SELECT id FROM fazendas WHERE nome = 'Estrelinha'), 
  (SELECT id FROM armazens WHERE nome = 'SIPAL MATUPÁ'),
  (SELECT id FROM contratos WHERE numero = '290925M339' AND safra_id = 'soja2526')),

-- Carga 8 (Arrendamento CT)
('soja2526', '2026-01-28', 553, 'SADI', 'IYV1F40', 'CST01', 54700, 51522, 911.66, 858.7, 2768, 2.7, 
  (SELECT id FROM fazendas WHERE nome = 'Castanhal'), 
  (SELECT id FROM armazens WHERE nome = 'SIPAL CLÁUDIA'),
  (SELECT id FROM contratos WHERE numero = 'ARR-CST-USIMAT' AND safra_id = 'soja2526')),

-- Carga 9 (Venda ADM a Fixar)
('soja2526', '2026-02-06', 304, 'SADI', 'IYV1F40', 'CST01', 44820, 32897, 747, 548.28, 3810, 2.7, 
  (SELECT id FROM fazendas WHERE nome = 'Castanhal'), 
  (SELECT id FROM armazens WHERE nome = 'AC GRÃOS'),
  (SELECT id FROM contratos WHERE numero = 'VENDA-ADM-FIXAR' AND safra_id = 'soja2526')),

-- Carga 10 (Depósito Romancini)
('soja2526', '2026-02-01', 956, 'MANOEL', 'SDY9E09', 'RMC01', 44060, 42602, 734.33, 710.03, 974, 2.0, 
  (SELECT id FROM fazendas WHERE nome = 'Romancini'), 
  (SELECT id FROM armazens WHERE nome = 'SIPAL LRV'),
  (SELECT id FROM contratos WHERE numero = 'DEP-LRV-SIPAL' AND safra_id = 'soja2526'));

-- ==========================================
-- REPETIR O PADRÃO PARA AS OUTRAS SAFRAS
-- ==========================================

-- Exemplo Soja 24/25
INSERT INTO public.romaneios 
(safra_id, data, nfe, motorista, placa, fazenda_id, armazem_id, contrato_id, peso_bruto_kg, peso_liquido_kg, sacas_bruto, sacas_liquida, umidade)
VALUES
('soja2425', '2025-01-27', 789, 'CARLOS', 'SDY9E09', 
  (SELECT id FROM fazendas WHERE nome = 'Romancini'), 
  (SELECT id FROM armazens WHERE nome = 'AMAGGI LRV'),
  (SELECT id FROM contratos WHERE numero = 'ILDO-AMAGGI' AND safra_id = 'soja2425'),
  50600, 48854, 843.33, 814.23, 1746);

-- Exemplo Milho 25
INSERT INTO public.romaneios 
(safra_id, data, nfe, motorista, placa, fazenda_id, armazem_id, contrato_id, peso_bruto_kg, peso_liquido_kg, sacas_bruto, sacas_liquida, umidade)
VALUES
('milho25', '2025-06-18', 831, 'MAURO', 'NUC1E75', 
  (SELECT id FROM fazendas WHERE nome = 'Romancini'), 
  (SELECT id FROM armazens WHERE nome = 'SIPAL LRV'),
  (SELECT id FROM contratos WHERE numero = '290924M180' AND safra_id = 'milho25'),
  48880, 48880, 814.66, 814.66, 0);