-- 1. Tabela de Fazendas
CREATE TABLE IF NOT EXISTS public.fazendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Armazéns
CREATE TABLE IF NOT EXISTS public.armazens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Contratos
CREATE TABLE IF NOT EXISTS public.contratos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safra_id TEXT NOT NULL,
  nome TEXT NOT NULL,
  numero TEXT,
  volume_total NUMERIC DEFAULT 0,
  armazem_id UUID REFERENCES public.armazens(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Romaneios
CREATE TABLE IF NOT EXISTS public.romaneios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safra_id TEXT NOT NULL,
  data DATE,
  nfe NUMERIC,
  numero_romaneio NUMERIC,
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
  fazenda_id UUID REFERENCES public.fazendas(id) ON DELETE SET NULL,
  armazem_id UUID REFERENCES public.armazens(id) ON DELETE SET NULL,
  contrato_id UUID REFERENCES public.contratos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.fazendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armazens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;

-- Criar Políticas de Acesso (Permitir tudo para usuários autenticados)
CREATE POLICY "Acesso total para usuários autenticados em fazendas" ON public.fazendas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em armazens" ON public.armazens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em contratos" ON public.contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em romaneios" ON public.romaneios FOR ALL TO authenticated USING (true) WITH CHECK (true);