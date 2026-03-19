-- 1. Garante que a safra milho26 existe na tabela de safras
INSERT INTO public.safras (id, nome, tipo, status)
VALUES ('milho26', 'Milho 26', 'Milho', 'Atual')
ON CONFLICT (id) DO NOTHING;

-- 2. Insere ou atualiza os preços de frete para as cidades informadas
INSERT INTO public.precos_frete (safra_id, cidade, valor)
VALUES
  ('milho26', 'MATUPÁ', 1.50),
  ('milho26', 'SINOP', 2.90),
  ('milho26', 'CLÁUDIA', 1.70),
  ('milho26', 'NOVA STA HELENA', 1.50),
  ('milho26', 'LRV', 1.70)
ON CONFLICT (safra_id, cidade) 
DO UPDATE SET valor = EXCLUDED.valor;