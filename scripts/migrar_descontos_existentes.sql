-- 1. Limpa dados existentes para evitar duplicidade (opcional, use se quiser recomeçar)
DELETE FROM public.adiantamentos WHERE safra_id = 'soja2526';
DELETE FROM public.abastecimentos WHERE safra_id = 'soja2526';

-- 2. Insere os Adiantamentos da Safra Soja 25/26
INSERT INTO public.adiantamentos (safra_id, motorista, data, valor)
VALUES
  ('soja2526', 'MAILSON', '2026-01-15', 2500.00),
  ('soja2526', 'SADI', '2026-01-22', 10000.00),
  ('soja2526', 'MAILSON', '2026-01-23', 8723.90),
  ('soja2526', 'MAILSON', '2026-02-07', 5000.00),
  ('soja2526', 'SADI', '2026-02-09', 6000.00),
  ('soja2526', 'SADI', '2026-02-20', 5000.00),
  ('soja2526', 'SADI', '2026-02-24', 3500.00),
  ('soja2526', 'SADI', '2026-02-26', 2500.00);

-- 3. Insere os Abastecimentos (Diesel) da Safra Soja 25/26
INSERT INTO public.abastecimentos (safra_id, motorista, data, litros, preco, total)
VALUES
  ('soja2526', 'MAURO', '2026-01-05', 91.00, 5.75, 523.25),
  ('soja2526', 'SADI', '2026-01-13', 640.00, 5.75, 3680.00),
  ('soja2526', 'RICARDO', '2026-01-13', 763.00, 5.75, 4387.25),
  ('soja2526', 'MAILSON', '2026-01-16', 483.00, 5.75, 2777.25),
  ('soja2526', 'MAURO', '2026-01-18', 550.00, 5.75, 3162.50),
  ('soja2526', 'MAURO', '2026-02-05', 411.00, 5.75, 2363.25),
  ('soja2526', 'SADI', '2026-02-06', 680.00, 5.75, 3910.00),
  ('soja2526', 'SADI', '2026-02-07', 50.00, 2.80, 140.00),
  ('soja2526', 'MAILSON', '2026-02-08', 523.00, 5.75, 3007.25),
  ('soja2526', 'SADI', '2026-02-17', 435.00, 5.75, 2501.25);