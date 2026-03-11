-- ==========================================
-- 1. ESTRUTURA DAS TABELAS
-- ==========================================

-- Safras
CREATE TABLE IF NOT EXISTS public.safras (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fazendas
CREATE TABLE IF NOT EXISTS public.fazendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  area_ha NUMERIC,
  cor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Armazéns
CREATE TABLE IF NOT EXISTS public.armazens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  cor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contratos
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safra_id TEXT REFERENCES public.safras(id) ON DELETE CASCADE,
  armazem_id UUID REFERENCES public.armazens(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  numero TEXT,
  volume_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Romaneios
CREATE TABLE IF NOT EXISTS public.romaneios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safra_id TEXT REFERENCES public.safras(id) ON DELETE CASCADE,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  armazem_id UUID REFERENCES public.armazens(id) ON DELETE SET NULL,
  fazenda_id UUID REFERENCES public.fazendas(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  nfe INTEGER,
  numero_romaneio INTEGER,
  emitente TEXT,
  tipo_nf TEXT,
  talhao TEXT,
  motorista TEXT,
  placa TEXT,
  peso_bruto_kg NUMERIC,
  peso_liquido_kg NUMERIC,
  sacas_bruto NUMERIC,
  sacas_liquida NUMERIC,
  umidade NUMERIC DEFAULT 0,
  impureza NUMERIC DEFAULT 0,
  ardido NUMERIC DEFAULT 0,
  avariados NUMERIC DEFAULT 0,
  quebrados NUMERIC DEFAULT 0,
  contaminantes NUMERIC DEFAULT 0,
  preco_frete NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 2. SEGURANÇA (RLS)
-- ==========================================
ALTER TABLE public.safras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fazendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armazens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safras_auth_policy') THEN
        CREATE POLICY safras_auth_policy ON public.safras FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'fazendas_auth_policy') THEN
        CREATE POLICY fazendas_auth_policy ON public.fazendas FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'armazens_auth_policy') THEN
        CREATE POLICY armazens_auth_policy ON public.armazens FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contratos_auth_policy') THEN
        CREATE POLICY contratos_auth_policy ON public.contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'romaneios_auth_policy') THEN
        CREATE POLICY romaneios_auth_policy ON public.romaneios FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ==========================================
-- 3. CARGA DE DADOS INICIAIS
-- ==========================================

-- Inserir Safras
INSERT INTO public.safras (id, nome, tipo, status) VALUES
('milho26', 'Milho 26', 'Milho', 'Futura'),
('soja2526', 'Soja 25/26', 'Soja', 'Atual'),
('milho25', 'Milho 25', 'Milho', 'Passada'),
('soja2425', 'Soja 24/25', 'Soja', 'Passada')
ON CONFLICT (id) DO NOTHING;

-- Inserir Fazendas
INSERT INTO public.fazendas (nome, area_ha, cor) VALUES
('São Luiz', 675, '#16a34a'),
('Castanhal', 600, '#2563eb'),
('Romancini', 435, '#f59e0b'),
('Estrelinha', 240, '#7c3aed')
ON CONFLICT (nome) DO NOTHING;

-- Inserir Armazéns
INSERT INTO public.armazens (nome, cor) VALUES
('COFCO NSH', '#ea580c'),
('SIPAL MATUPÁ', '#854d0e'),
('AMAGGI MATUPÁ', '#059669'),
('SIPAL CLÁUDIA', '#4338ca'),
('SIPAL LRV', '#7e22ce'),
('SIPAL CAMPOS DE JULIO', '#1d4ed8'),
('AC GRÃOS', '#ef4444'),
('INPASA', '#16a34a'),
('KODYAK', '#f59e0b'),
('AMAGGI SINOP', '#2563eb'),
('GO AGRO', '#94a3b8'),
('AMAGGI LRV', '#0ea5e9'),
('SIPAL (BUNGE)', '#475569'),
('GO AGRO ARMAZENS GERAIS LTDA', '#94a3b8'),
('AC GRÃOS STA HELENA', '#ef4444')
ON CONFLICT (nome) DO NOTHING;

-- Inserir Contratos (Limpa antes para evitar duplicidade)
DELETE FROM public.contratos;
INSERT INTO public.contratos (safra_id, nome, numero, volume_total, armazem_id) VALUES
('soja2526', 'Venda Sipal 20 Mil Sacas', '72208', 20000, (SELECT id FROM armazens WHERE nome = 'COFCO NSH')),
('soja2526', 'BEDIN', '6750SC', 6750, (SELECT id FROM armazens WHERE nome = 'SIPAL MATUPÁ')),
('soja2526', 'Troca Adubo Sipal 29.500 Sacas', '290925M339', 29500, (SELECT id FROM armazens WHERE nome = 'SIPAL MATUPÁ')),
('soja2526', 'Arrendamento CT', 'ARR-CST-USIMAT', 10000, (SELECT id FROM armazens WHERE nome = 'SIPAL CLÁUDIA')),
('soja2526', 'Arrendamento SL', 'ARR-SLZ-COFCO', 4050, (SELECT id FROM armazens WHERE nome = 'COFCO NSH')),
('soja2526', 'Comissões a Fixar', 'COMISSAO-FIXAR', 1000, NULL),
('soja2526', 'Venda 800 Sacas Comissão', 'Comissoes', 800, NULL),
('soja2526', 'Depósito Amaggi Matupá', 'DEP-MAT-AMAGGI', 0, (SELECT id FROM armazens WHERE nome = 'AMAGGI MATUPÁ')),
('soja2526', 'Depósito Sipal Cláudia', 'DEP-CLA-SIPAL', 0, (SELECT id FROM armazens WHERE nome = 'SIPAL CLÁUDIA')),
('soja2526', 'Depósito Sipal LRV', 'DEP-LRV-SIPAL', 0, (SELECT id FROM armazens WHERE nome = 'SIPAL LRV')),
('soja2526', 'Venda ADM a Fixar', 'VENDA-ADM-FIXAR', 0, (SELECT id FROM armazens WHERE nome = 'AC GRÃOS'));

-- ==========================================
-- 4. INSERIR ROMANEIOS (EXEMPLO SOJA 25/26)
-- ==========================================
DELETE FROM public.romaneios;

-- Inserindo alguns registros da Soja 25/26 como exemplo de vínculo
INSERT INTO public.romaneios 
(safra_id, data, nfe, motorista, placa, fazenda_id, armazem_id, contrato_id, peso_bruto_kg, peso_liquido_kg, sacas_bruto, sacas_liquida, umidade, preco_frete)
VALUES
('soja2526', '2026-01-08', 934, 'MANOEL', 'SDY9E09', 
  (SELECT id FROM fazendas WHERE nome = 'São Luiz'), 
  (SELECT id FROM armazens WHERE nome = 'COFCO NSH'),
  (SELECT id FROM contratos WHERE numero = '72208' AND safra_id = 'soja2526'),
  54590, 50414, 909.83, 840.23, 4176, 2.5),
('soja2526', '2026-01-09', 935, 'MAURO', 'NUC1E75', 
  (SELECT id FROM fazendas WHERE nome = 'São Luiz'), 
  (SELECT id FROM armazens WHERE nome = 'COFCO NSH'),
  (SELECT id FROM contratos WHERE numero = '72208' AND safra_id = 'soja2526'),
  48360, 45894, 806, 764.9, 2466, 2.5),
('soja2526', '2026-01-14', 237, 'SADI', 'IYV1F40', 
  (SELECT id FROM fazendas WHERE nome = 'São Luiz'), 
  (SELECT id FROM armazens WHERE nome = 'COFCO NSH'),
  (SELECT id FROM contratos WHERE numero = '290925M339' AND safra_id = 'soja2526'),
  39217, 39217, 653.61, 653.61, 0, 2.7);

-- Nota: Para inserir os centenas de registros restantes, o ideal é usar a interface de importação CSV do Supabase 
-- ou um script de migração, mas a estrutura acima já garante a integridade dos dados.