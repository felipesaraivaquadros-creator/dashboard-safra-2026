-- 1. Tabela de Fazendas
CREATE TABLE IF NOT EXISTS public.fazendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.1 Areas plantadas por fazenda e safra
CREATE TABLE IF NOT EXISTS public.areas_plantadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safra_id TEXT NOT NULL,
  fazenda_id UUID NOT NULL REFERENCES public.fazendas(id) ON DELETE CASCADE,
  area_ha NUMERIC NOT NULL CHECK (area_ha > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (safra_id, fazenda_id)
);

-- 1.2 Talhoes por fazenda e safra
CREATE TABLE IF NOT EXISTS public.talhoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  safra_id TEXT NOT NULL,
  fazenda_id UUID NOT NULL REFERENCES public.fazendas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  area_ha NUMERIC NOT NULL CHECK (area_ha > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (safra_id, fazenda_id, nome)
);

-- 2. Tabela de Armazéns
CREATE TABLE IF NOT EXISTS public.armazens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT UNIQUE NOT NULL,
  grupo TEXT,
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
  grupo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.1 Configuracao financeira opcional por contrato
CREATE TABLE IF NOT EXISTS public.contratos_financeiros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL UNIQUE REFERENCES public.contratos(id) ON DELETE CASCADE,
  status_preco TEXT NOT NULL DEFAULT 'a_fixar' CHECK (status_preco IN ('a_fixar', 'fixado')),
  preco_saca NUMERIC(14,4) CHECK (preco_saca IS NULL OR preco_saca >= 0),
  data_contrato DATE,
  competencia DATE,
  tributos_revisados BOOLEAN NOT NULL DEFAULT FALSE,
  aceita_excedente BOOLEAN NOT NULL DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (status_preco = 'a_fixar' OR preco_saca IS NOT NULL)
);

-- 3.2 Tributos e descontos flexiveis por contrato
CREATE TABLE IF NOT EXISTS public.contratos_descontos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_financeiro_id UUID NOT NULL REFERENCES public.contratos_financeiros(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('SENAR', 'FETHAB', 'FUNRURAL', 'IAGRO', 'COOP', 'OUTRO')),
  descricao TEXT,
  metodo TEXT NOT NULL CHECK (metodo IN ('percentual', 'por_saca', 'valor_fixo')),
  valor NUMERIC(14,6) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_contratos_financeiros_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contratos_financeiros_set_updated_at ON public.contratos_financeiros;
CREATE TRIGGER contratos_financeiros_set_updated_at
BEFORE UPDATE ON public.contratos_financeiros
FOR EACH ROW EXECUTE FUNCTION public.set_contratos_financeiros_updated_at();

CREATE OR REPLACE FUNCTION public.salvar_contrato_financeiro(
  p_contrato_id UUID,
  p_status_preco TEXT,
  p_preco_saca NUMERIC,
  p_data_contrato DATE,
  p_competencia DATE,
  p_tributos_revisados BOOLEAN,
  p_aceita_excedente BOOLEAN,
  p_observacoes TEXT,
  p_descontos JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_financeiro_id UUID;
BEGIN
  INSERT INTO public.contratos_financeiros (
    contrato_id, status_preco, preco_saca, data_contrato, competencia,
    tributos_revisados, aceita_excedente, observacoes
  ) VALUES (
    p_contrato_id, p_status_preco, p_preco_saca, p_data_contrato, p_competencia,
    p_tributos_revisados, p_aceita_excedente, p_observacoes
  )
  ON CONFLICT (contrato_id) DO UPDATE SET
    status_preco = EXCLUDED.status_preco,
    preco_saca = EXCLUDED.preco_saca,
    data_contrato = EXCLUDED.data_contrato,
    competencia = EXCLUDED.competencia,
    tributos_revisados = EXCLUDED.tributos_revisados,
    aceita_excedente = EXCLUDED.aceita_excedente,
    observacoes = EXCLUDED.observacoes
  RETURNING id INTO v_financeiro_id;

  DELETE FROM public.contratos_descontos
  WHERE contrato_financeiro_id = v_financeiro_id;

  INSERT INTO public.contratos_descontos (
    contrato_financeiro_id, tipo, descricao, metodo, valor
  )
  SELECT v_financeiro_id, item.tipo, item.descricao, item.metodo, item.valor
  FROM jsonb_to_recordset(COALESCE(p_descontos, '[]'::JSONB))
    AS item(tipo TEXT, descricao TEXT, metodo TEXT, valor NUMERIC)
  WHERE item.valor > 0;

  RETURN v_financeiro_id;
END;
$$;

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
ALTER TABLE public.areas_plantadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talhoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.armazens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_descontos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;

-- Criar Políticas de Acesso (Permitir tudo para usuários autenticados)
CREATE POLICY "Acesso total para usuários autenticados em fazendas" ON public.fazendas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em areas plantadas" ON public.areas_plantadas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em talhoes" ON public.talhoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em armazens" ON public.armazens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em contratos" ON public.contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em contratos financeiros" ON public.contratos_financeiros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em descontos financeiros" ON public.contratos_descontos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em romaneios" ON public.romaneios FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.salvar_contrato_financeiro(
  UUID, TEXT, NUMERIC, DATE, DATE, BOOLEAN, BOOLEAN, TEXT, JSONB
) TO authenticated;
