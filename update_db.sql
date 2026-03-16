-- 1. Garante que as colunas de peso e sacas existam com os nomes corretos
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS peso_bruto_kg NUMERIC DEFAULT 0;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS peso_liquid_kg NUMERIC DEFAULT 0;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS sacas_bruto NUMERIC DEFAULT 0;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS sacas_liquida NUMERIC DEFAULT 0;

-- 2. Garante que as colunas de descontos e qualidade existam
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS umidade NUMERIC DEFAULT 0;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS impureza NUMERIC DEFAULT 0;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS ardido NUMERIC DEFAULT 0;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS avariados NUMERIC DEFAULT 0;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS quebrados NUMERIC DEFAULT 0;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS contaminantes NUMERIC DEFAULT 0;

-- 3. Garante colunas de identificação e frete
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS numero_romaneio BIGINT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS cidade_entrega TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS preco_frete NUMERIC;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS armazem_nome TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS motorista TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS placa TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS emitente TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS tipo_nf TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS talhao TEXT;

-- 4. Atualiza a tabela de saldos para ter o nome do armazém
ALTER TABLE public.saldos ADD COLUMN IF NOT EXISTS armazem_nome TEXT;

-- 5. Força o recarregamento do cache do esquema
NOTIFY pgrst, 'reload schema';