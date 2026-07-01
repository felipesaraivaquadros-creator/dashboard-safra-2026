-- 1. Garante que a safra milho26 existe na tabela de safras
INSERT INTO public.safras (id, nome, tipo, status)
VALUES ('milho26', 'Milho 26', 'Milho', 'Atual')
ON CONFLICT (id) DO NOTHING;

-- 2. Insere ou atualiza precos gerais de frete para as cidades informadas.
-- A tela atual permite configurar valores especificos por motorista + cidade.
-- Estes registros GERAL servem apenas como fallback enquanto a tabela por motorista e preenchida.
INSERT INTO public.precos_frete (safra_id, motorista, cidade, valor)
VALUES
  ('milho26', 'GERAL', 'MATUPA', 1.50),
  ('milho26', 'GERAL', 'SINOP', 2.90),
  ('milho26', 'GERAL', 'CLAUDIA', 1.70),
  ('milho26', 'GERAL', 'NOVA STA HELENA', 1.50),
  ('milho26', 'GERAL', 'LRV', 1.70)
ON CONFLICT (safra_id, motorista, cidade)
DO UPDATE SET valor = EXCLUDED.valor;
