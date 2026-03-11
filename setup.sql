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