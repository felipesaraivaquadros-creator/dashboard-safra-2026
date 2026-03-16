-- 1. Adiciona colunas faltantes na tabela de romaneios
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS cidade_entrega TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS contaminantes NUMERIC DEFAULT 0;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS preco_frete NUMERIC;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS armazem_nome TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS numero_romaneio BIGINT;

-- 2. Adiciona coluna de nome no cache de saldos
ALTER TABLE public.saldos ADD COLUMN IF NOT EXISTS armazem_nome TEXT;

-- 3. Garante que a tabela de contratos suporte o número como texto (para casos como 'ARR-PC')
ALTER TABLE public.contratos ALTER COLUMN numero TYPE TEXT;

-- 4. Notifica o PostgREST para recarregar o esquema (opcional, o Supabase costuma detectar sozinho)
NOTIFY pgrst, 'reload schema';