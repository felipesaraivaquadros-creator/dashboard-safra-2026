-- 1. Tabela de Safras
CREATE TABLE IF NOT EXISTS public.safras (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Armazéns
CREATE TABLE IF NOT EXISTS public.armazens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  cor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Contratos
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safra_id TEXT REFERENCES public.safras(id) ON DELETE CASCADE,
  armazem_id UUID REFERENCES public.armazens(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  numero TEXT,
  volume_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.safras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armazens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- Criar Políticas de Acesso para usuários autenticados
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'safras_auth_policy') THEN
        CREATE POLICY safras_auth_policy ON public.safras FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'armazens_auth_policy') THEN
        CREATE POLICY armazens_auth_policy ON public.armazens FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contratos_auth_policy') THEN
        CREATE POLICY contratos_auth_policy ON public.contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Inserir Dados Iniciais de Safras
INSERT INTO public.safras (id, nome, tipo, status) VALUES
('milho26', 'Milho 26', 'Milho', 'Futura'),
('soja2526', 'Soja 25/26', 'Soja', 'Atual'),
('milho25', 'Milho 25', 'Milho', 'Passada'),
('soja2425', 'Soja 24/25', 'Soja', 'Passada')
ON CONFLICT (id) DO NOTHING;

-- Inserir Dados Iniciais de Armazéns
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
('GO AGRO', '#94a3b8')
ON CONFLICT (nome) DO NOTHING;

-- Limpar contratos existentes para evitar duplicidade na carga inicial
DELETE FROM public.contratos;

-- 4. Inserir Contratos Soja 25/26
INSERT INTO public.contratos (safra_id, nome, numero, volume_total, armazem_id) VALUES
('soja2526', 'Venda Sipal 20 Mil Sacas', '72208', 20000, (SELECT id FROM armazens WHERE nome = 'COFCO NSH')),
('soja2526', 'BEDIN', '6750SC', 6750, (SELECT id FROM armazens WHERE nome = 'SIPAL MATUPÁ')),
('soja2526', 'Troca Adubo Sipal 29.500 Sacas', '290925M339', 29500, (SELECT id FROM armazens WHERE nome = 'SIPAL MATUPÁ')),
('soja2526', 'Arrendamento CT', 'ARR-CST-USIMAT', 10000, (SELECT id FROM armazens WHERE nome = 'SIPAL CLÁUDIA')),
('soja2526', 'Arrendamento SL', 'ARR-SLZ-COFCO', 4050, (SELECT id FROM armazens WHERE nome = 'COFCO NSH')),
('soja2526', 'Comissões a Fixar', 'COMISSAO-FIXAR', 1000, NULL),
('soja2526', 'Venda 800 Sacas Comissão', 'Comissoes', 800, NULL);

-- 5. Inserir Contratos Soja 24/25
INSERT INTO public.contratos (safra_id, nome, numero, volume_total, armazem_id) VALUES
('soja2425', 'Barter Amaggi Matupá', '9058-8634', 5754, (SELECT id FROM armazens WHERE nome = 'AMAGGI MATUPÁ')),
('soja2425', 'Barter Amaggi Sinop', '9058-8633', 18000, (SELECT id FROM armazens WHERE nome = 'AMAGGI SINOP')),
('soja2425', 'Arrend. + Plant. + Insumos (PC)', 'ARR-PC', 11577, (SELECT id FROM armazens WHERE nome = 'AC GRÃOS')),
('soja2425', 'Serviço Dieison', 'SERV-D', 1032, NULL),
('soja2425', 'Venda Sipal M51', '290925M51', 3000, (SELECT id FROM armazens WHERE nome = 'SIPAL LRV')),
('soja2425', 'Venda Sipal M69', '290925M69', 3000, (SELECT id FROM armazens WHERE nome = 'SIPAL LRV')),
('soja2425', 'Venda Amaggi Ildiana', 'ILDIANA', 3000, (SELECT id FROM armazens WHERE nome = 'AMAGGI MATUPÁ')),
('soja2425', 'Venda Amaggi LRV', '20240105500994-1', 18000, (SELECT id FROM armazens WHERE nome = 'AMAGGI LRV')),
('soja2425', 'Venda ADM 20 Mil Sacas', '1334P50762S', 20000, (SELECT id FROM armazens WHERE nome = 'AC GRÃOS')),
('soja2425', 'Venda GO AGRO', '51/2025', 5916, (SELECT id FROM armazens WHERE nome = 'GO AGRO')),
('soja2425', 'Venda Sipal M282', '290925M282', 3471, (SELECT id FROM armazens WHERE nome = 'SIPAL LRV')),
('soja2425', 'Venda ADM 960732 (Ildo)', '960732', 1000, (SELECT id FROM armazens WHERE nome = 'AC GRÃOS')),
('soja2425', 'Venda Amaggi Ildo (Total)', 'ILDO-AMAGGI', 19042, (SELECT id FROM armazens WHERE nome = 'AMAGGI SINOP')),
('soja2425', 'Venda ADM 960734 (Ildo)', '960734', 3948, (SELECT id FROM armazens WHERE nome = 'AC GRÃOS')),
('soja2425', 'Venda ADM 960737 (Ildiana)', '960737', 393, (SELECT id FROM armazens WHERE nome = 'AC GRÃOS')),
('soja2425', 'Venda Amaggi LRV 1160', '2025-01-055-01160', 527, (SELECT id FROM armazens WHERE nome = 'AMAGGI LRV')),
('soja2425', 'Comissão Funcionários', 'COMISSAO-2425', 1500, NULL);

-- 6. Inserir Contratos Milho 25
INSERT INTO public.contratos (safra_id, nome, numero, volume_total, armazem_id) VALUES
('milho25', 'Barter Sipal LRV M180', '290924M180', 14297, (SELECT id FROM armazens WHERE nome = 'SIPAL LRV')),
('milho25', 'Barter Kodiak/Agrofértil', 'SEMENTES-KODIAK', 5063, (SELECT id FROM armazens WHERE nome = 'KODYAK')),
('milho25', 'Barter Sipal/Agrofértil (Sementes)', 'SEMENTES-SIPAL', 2118, (SELECT id FROM armazens WHERE nome = 'SIPAL LRV')),
('milho25', 'Barter Sipal/Agrofértil (Insumos)', 'INSUMOS-SIPAL', 380, (SELECT id FROM armazens WHERE nome = 'SIPAL LRV')),
('milho25', 'Arrendamento Inpasa', 'ARR-INPASA', 6000, (SELECT id FROM armazens WHERE nome = 'INPASA')),
('milho25', 'Barter Amaggi Matupá', '20240106900533-1', 14460, (SELECT id FROM armazens WHERE nome = 'AMAGGI MATUPÁ')),
('milho25', 'Venda Inpasa (21960)', '21960', 60000, (SELECT id FROM armazens WHERE nome = 'INPASA')),
('milho25', 'Venda Inpasa (28614)', '28614', 536, (SELECT id FROM armazens WHERE nome = 'INPASA')),
('milho25', 'Venda Sipal M216', '290925M216', 10000, (SELECT id FROM armazens WHERE nome = 'SIPAL LRV')),
('milho25', 'Venda ADM 1334P50494M', '1334P50494M', 23522, (SELECT id FROM armazens WHERE nome = 'AC GRÃOS')),
('milho25', 'Venda Grão Direto Amaggi Sinop', 'GRAO-DIRETO-AS', 694, (SELECT id FROM armazens WHERE nome = 'AMAGGI SINOP')),
('milho25', 'Venda Grão Direto Amaggi Matupá', 'GRAO-DIRETO-AM', 10050, (SELECT id FROM armazens WHERE nome = 'AMAGGI MATUPÁ')),
('milho25', 'Venda Cooperativa Sipal LRV', 'COOP-LRV', 21173, (SELECT id FROM armazens WHERE nome = 'SIPAL LRV')),
('milho25', 'Venda Cooperativa Sipal Matupá', 'COOP-SM', 935, (SELECT id FROM armazens WHERE nome = 'SIPAL MATUPÁ')),
('milho25', 'Venda Cooperativa Sipal Cláudia', 'COOP-SC', 7308, (SELECT id FROM armazens WHERE nome = 'SIPAL CLÁUDIA')),
('milho25', 'Comissão Funcionários', 'COMISSAO-M25', 1500, NULL);