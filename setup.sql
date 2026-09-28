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

-- 3.3 Parcelas previstas para recebimento
CREATE TABLE IF NOT EXISTS public.contratos_recebiveis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_financeiro_id UUID NOT NULL REFERENCES public.contratos_financeiros(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL DEFAULT 1 CHECK (numero_parcela > 0),
  descricao TEXT,
  data_vencimento DATE NOT NULL,
  valor_previsto NUMERIC(14,2) NOT NULL CHECK (valor_previsto > 0),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (contrato_financeiro_id, numero_parcela)
);

-- 3.4 Baixas reais, inclusive parciais, de cada parcela
CREATE TABLE IF NOT EXISTS public.contratos_baixas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recebivel_id UUID NOT NULL REFERENCES public.contratos_recebiveis(id) ON DELETE CASCADE,
  data_recebimento DATE NOT NULL,
  valor_recebido NUMERIC(14,2) NOT NULL CHECK (valor_recebido > 0),
  forma_recebimento TEXT,
  referencia TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contratos_recebiveis_financeiro_id_idx
  ON public.contratos_recebiveis (contrato_financeiro_id);
CREATE INDEX IF NOT EXISTS contratos_recebiveis_vencimento_idx
  ON public.contratos_recebiveis (data_vencimento);
CREATE INDEX IF NOT EXISTS contratos_baixas_recebivel_id_idx
  ON public.contratos_baixas (recebivel_id);
CREATE INDEX IF NOT EXISTS contratos_baixas_data_idx
  ON public.contratos_baixas (data_recebimento);

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

CREATE OR REPLACE FUNCTION public.set_contratos_recebimentos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contratos_recebiveis_set_updated_at ON public.contratos_recebiveis;
CREATE TRIGGER contratos_recebiveis_set_updated_at
BEFORE UPDATE ON public.contratos_recebiveis
FOR EACH ROW EXECUTE FUNCTION public.set_contratos_recebimentos_updated_at();

DROP TRIGGER IF EXISTS contratos_baixas_set_updated_at ON public.contratos_baixas;
CREATE TRIGGER contratos_baixas_set_updated_at
BEFORE UPDATE ON public.contratos_baixas
FOR EACH ROW EXECUTE FUNCTION public.set_contratos_recebimentos_updated_at();

CREATE OR REPLACE FUNCTION public.validar_total_baixas_recebivel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_valor_previsto NUMERIC(14,2);
  v_total_outras_baixas NUMERIC(14,2);
BEGIN
  SELECT valor_previsto INTO v_valor_previsto
  FROM public.contratos_recebiveis
  WHERE id = NEW.recebivel_id
  FOR UPDATE;

  SELECT COALESCE(SUM(valor_recebido), 0) INTO v_total_outras_baixas
  FROM public.contratos_baixas
  WHERE recebivel_id = NEW.recebivel_id
    AND id <> NEW.id;

  IF v_total_outras_baixas + NEW.valor_recebido > v_valor_previsto THEN
    RAISE EXCEPTION 'A baixa ultrapassa o saldo disponível da parcela.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contratos_baixas_validar_total ON public.contratos_baixas;
CREATE TRIGGER contratos_baixas_validar_total
BEFORE INSERT OR UPDATE ON public.contratos_baixas
FOR EACH ROW EXECUTE FUNCTION public.validar_total_baixas_recebivel();

CREATE OR REPLACE FUNCTION public.validar_valor_recebivel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_total_recebido NUMERIC(14,2);
BEGIN
  SELECT COALESCE(SUM(valor_recebido), 0) INTO v_total_recebido
  FROM public.contratos_baixas
  WHERE recebivel_id = OLD.id;

  IF NEW.valor_previsto < v_total_recebido THEN
    RAISE EXCEPTION 'O valor previsto não pode ser menor que o total já recebido.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contratos_recebiveis_validar_valor ON public.contratos_recebiveis;
CREATE TRIGGER contratos_recebiveis_validar_valor
BEFORE UPDATE OF valor_previsto ON public.contratos_recebiveis
FOR EACH ROW EXECUTE FUNCTION public.validar_valor_recebivel();

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
ALTER TABLE public.contratos_recebiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_baixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneios ENABLE ROW LEVEL SECURITY;

-- Criar Políticas de Acesso (Permitir tudo para usuários autenticados)
CREATE POLICY "Acesso total para usuários autenticados em fazendas" ON public.fazendas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em areas plantadas" ON public.areas_plantadas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em talhoes" ON public.talhoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em armazens" ON public.armazens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em contratos" ON public.contratos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em contratos financeiros" ON public.contratos_financeiros FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em descontos financeiros" ON public.contratos_descontos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em recebiveis" ON public.contratos_recebiveis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em baixas" ON public.contratos_baixas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuários autenticados em romaneios" ON public.romaneios FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT EXECUTE ON FUNCTION public.salvar_contrato_financeiro(
  UUID, TEXT, NUMERIC, DATE, DATE, BOOLEAN, BOOLEAN, TEXT, JSONB
) TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_recebiveis TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_baixas TO authenticated;

-- 5. Tipos de contrato e controle de trocas/barter
-- Mantido ao final para que este setup tambem funcione em bancos ja existentes.
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS tipo_contrato TEXT NOT NULL DEFAULT 'nao_classificado',
  ADD COLUMN IF NOT EXISTS forma_liquidacao TEXT NOT NULL DEFAULT 'nao_definida',
  ADD COLUMN IF NOT EXISTS tipo_outro_descricao TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contratos'::regclass AND conname = 'contratos_tipo_contrato_check') THEN
    ALTER TABLE public.contratos ADD CONSTRAINT contratos_tipo_contrato_check
      CHECK (tipo_contrato IN ('nao_classificado', 'venda', 'barter', 'misto', 'outro'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.contratos'::regclass AND conname = 'contratos_forma_liquidacao_check') THEN
    ALTER TABLE public.contratos ADD CONSTRAINT contratos_forma_liquidacao_check
      CHECK (forma_liquidacao IN ('nao_definida', 'financeira', 'fisica', 'mista'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.contratos_barter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL UNIQUE REFERENCES public.contratos(id) ON DELETE CASCADE,
  fornecedor TEXT,
  recebedor_graos TEXT,
  valor_insumos NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (valor_insumos >= 0),
  data_inicio_entrega DATE,
  data_fim_entrega DATE,
  local_entrega TEXT,
  responsavel_frete TEXT NOT NULL DEFAULT 'produtor' CHECK (responsavel_frete IN ('produtor', 'comprador', 'compartilhado', 'outro')),
  qualidade_exigida TEXT,
  numero_cpr TEXT,
  modalidade_cpr TEXT NOT NULL DEFAULT 'nao_aplicavel' CHECK (modalidade_cpr IN ('nao_aplicavel', 'fisica', 'financeira')),
  registro_cpr TEXT,
  preco_referencia_saca NUMERIC(14,4) CHECK (preco_referencia_saca IS NULL OR preco_referencia_saca >= 0),
  preco_mercado_saca NUMERIC(14,4) CHECK (preco_mercado_saca IS NULL OR preco_mercado_saca >= 0),
  data_preco_mercado DATE,
  status_conciliacao TEXT NOT NULL DEFAULT 'pendente' CHECK (status_conciliacao IN ('pendente', 'divergente', 'conciliado')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (data_fim_entrega IS NULL OR data_inicio_entrega IS NULL OR data_fim_entrega >= data_inicio_entrega)
);

CREATE TABLE IF NOT EXISTS public.contratos_barter_itens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_barter_id UUID NOT NULL REFERENCES public.contratos_barter(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL DEFAULT 'Insumo',
  descricao TEXT NOT NULL DEFAULT '',
  quantidade NUMERIC(14,4) CHECK (quantidade IS NULL OR quantidade >= 0),
  unidade TEXT,
  valor_unitario NUMERIC(14,4) CHECK (valor_unitario IS NULL OR valor_unitario >= 0),
  valor_total NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (valor_total >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contratos_tipo_contrato_idx ON public.contratos (safra_id, tipo_contrato);
CREATE INDEX IF NOT EXISTS contratos_barter_contrato_id_idx ON public.contratos_barter (contrato_id);
CREATE INDEX IF NOT EXISTS contratos_barter_fim_entrega_idx ON public.contratos_barter (data_fim_entrega);
CREATE INDEX IF NOT EXISTS contratos_barter_itens_barter_id_idx ON public.contratos_barter_itens (contrato_barter_id);

CREATE OR REPLACE FUNCTION public.set_contratos_barter_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS contratos_barter_set_updated_at ON public.contratos_barter;
CREATE TRIGGER contratos_barter_set_updated_at BEFORE UPDATE ON public.contratos_barter
FOR EACH ROW EXECUTE FUNCTION public.set_contratos_barter_updated_at();

CREATE OR REPLACE FUNCTION public.salvar_contrato_barter(
  p_contrato_id UUID, p_fornecedor TEXT, p_recebedor_graos TEXT, p_valor_insumos NUMERIC,
  p_data_inicio_entrega DATE, p_data_fim_entrega DATE, p_local_entrega TEXT, p_responsavel_frete TEXT,
  p_qualidade_exigida TEXT, p_numero_cpr TEXT, p_modalidade_cpr TEXT, p_registro_cpr TEXT,
  p_preco_referencia_saca NUMERIC, p_preco_mercado_saca NUMERIC, p_data_preco_mercado DATE,
  p_status_conciliacao TEXT, p_observacoes TEXT, p_itens JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_barter_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.contratos WHERE id = p_contrato_id AND tipo_contrato IN ('barter', 'misto')) THEN
    RAISE EXCEPTION 'O contrato deve estar classificado como barter ou misto.';
  END IF;
  INSERT INTO public.contratos_barter (
    contrato_id, fornecedor, recebedor_graos, valor_insumos, data_inicio_entrega, data_fim_entrega,
    local_entrega, responsavel_frete, qualidade_exigida, numero_cpr, modalidade_cpr, registro_cpr,
    preco_referencia_saca, preco_mercado_saca, data_preco_mercado, status_conciliacao, observacoes
  ) VALUES (
    p_contrato_id, p_fornecedor, p_recebedor_graos, COALESCE(p_valor_insumos, 0), p_data_inicio_entrega,
    p_data_fim_entrega, p_local_entrega, COALESCE(p_responsavel_frete, 'produtor'), p_qualidade_exigida,
    p_numero_cpr, COALESCE(p_modalidade_cpr, 'nao_aplicavel'), p_registro_cpr, p_preco_referencia_saca,
    p_preco_mercado_saca, p_data_preco_mercado, COALESCE(p_status_conciliacao, 'pendente'), p_observacoes
  ) ON CONFLICT (contrato_id) DO UPDATE SET
    fornecedor = EXCLUDED.fornecedor, recebedor_graos = EXCLUDED.recebedor_graos,
    valor_insumos = EXCLUDED.valor_insumos, data_inicio_entrega = EXCLUDED.data_inicio_entrega,
    data_fim_entrega = EXCLUDED.data_fim_entrega, local_entrega = EXCLUDED.local_entrega,
    responsavel_frete = EXCLUDED.responsavel_frete, qualidade_exigida = EXCLUDED.qualidade_exigida,
    numero_cpr = EXCLUDED.numero_cpr, modalidade_cpr = EXCLUDED.modalidade_cpr,
    registro_cpr = EXCLUDED.registro_cpr, preco_referencia_saca = EXCLUDED.preco_referencia_saca,
    preco_mercado_saca = EXCLUDED.preco_mercado_saca, data_preco_mercado = EXCLUDED.data_preco_mercado,
    status_conciliacao = EXCLUDED.status_conciliacao, observacoes = EXCLUDED.observacoes
  RETURNING id INTO v_barter_id;
  DELETE FROM public.contratos_barter_itens WHERE contrato_barter_id = v_barter_id;
  INSERT INTO public.contratos_barter_itens (contrato_barter_id, categoria, descricao, quantidade, unidade, valor_unitario, valor_total)
  SELECT v_barter_id, COALESCE(NULLIF(BTRIM(item.categoria), ''), 'Insumo'), COALESCE(item.descricao, ''),
    item.quantidade, NULLIF(BTRIM(item.unidade), ''), item.valor_unitario, COALESCE(item.valor_total, 0)
  FROM jsonb_to_recordset(COALESCE(p_itens, '[]'::JSONB)) AS item(
    categoria TEXT, descricao TEXT, quantidade NUMERIC, unidade TEXT, valor_unitario NUMERIC, valor_total NUMERIC
  );
  RETURN v_barter_id;
END;
$$;

ALTER TABLE public.contratos_barter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_barter_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total para usuarios autenticados em contratos barter" ON public.contratos_barter
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso total para usuarios autenticados em itens barter" ON public.contratos_barter_itens
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_barter TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_barter_itens TO authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_contrato_barter(
  UUID, TEXT, TEXT, NUMERIC, DATE, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC, NUMERIC, DATE, TEXT, TEXT, JSONB
) TO authenticated;

-- 6. Cumprimento operacional de contratos pela alocacao em Saldos
CREATE TABLE IF NOT EXISTS public.contratos_cumprimentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL UNIQUE REFERENCES public.contratos(id) ON DELETE CASCADE,
  origem TEXT NOT NULL DEFAULT 'alocacao_saldo' CHECK (origem IN ('alocacao_saldo')),
  grupo TEXT,
  volume_sacas NUMERIC(14,4) NOT NULL DEFAULT 0 CHECK (volume_sacas >= 0),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  confirmado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  cancelado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contratos_cumprimentos_contrato_id_idx ON public.contratos_cumprimentos (contrato_id);
CREATE INDEX IF NOT EXISTS contratos_cumprimentos_ativos_idx ON public.contratos_cumprimentos (contrato_id) WHERE ativo = TRUE;

CREATE OR REPLACE FUNCTION public.set_contratos_cumprimentos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS contratos_cumprimentos_set_updated_at ON public.contratos_cumprimentos;
CREATE TRIGGER contratos_cumprimentos_set_updated_at BEFORE UPDATE ON public.contratos_cumprimentos
FOR EACH ROW EXECUTE FUNCTION public.set_contratos_cumprimentos_updated_at();

INSERT INTO public.contratos_cumprimentos (contrato_id, origem, grupo, volume_sacas, ativo, confirmado_em)
SELECT contrato.id, 'alocacao_saldo', BTRIM(contrato.grupo), GREATEST(COALESCE(contrato.volume_total, 0), 0), TRUE, NOW()
FROM public.contratos AS contrato
WHERE NULLIF(BTRIM(contrato.grupo), '') IS NOT NULL
ON CONFLICT (contrato_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.salvar_alocacoes_contratos(p_safra_id TEXT, p_alocacoes JSONB)
RETURNS INTEGER LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE v_alocacao RECORD; v_grupo TEXT; v_volume NUMERIC(14,4); v_total INTEGER := 0;
BEGIN
  IF NULLIF(BTRIM(p_safra_id), '') IS NULL THEN RAISE EXCEPTION 'A safra e obrigatoria.'; END IF;
  IF JSONB_TYPEOF(COALESCE(p_alocacoes, '[]'::JSONB)) <> 'array' THEN
    RAISE EXCEPTION 'As alocacoes devem ser enviadas como uma lista.';
  END IF;
  FOR v_alocacao IN
    SELECT item.contrato_id, item.grupo
    FROM JSONB_TO_RECORDSET(COALESCE(p_alocacoes, '[]'::JSONB)) AS item(contrato_id UUID, grupo TEXT)
  LOOP
    SELECT GREATEST(COALESCE(contrato.volume_total, 0), 0) INTO v_volume
    FROM public.contratos AS contrato
    WHERE contrato.id = v_alocacao.contrato_id AND contrato.safra_id = p_safra_id
    FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Contrato % nao pertence a safra %.', v_alocacao.contrato_id, p_safra_id;
    END IF;
    v_grupo := NULLIF(BTRIM(v_alocacao.grupo), '');
    UPDATE public.contratos SET grupo = v_grupo WHERE id = v_alocacao.contrato_id;
    IF v_grupo IS NOT NULL THEN
      INSERT INTO public.contratos_cumprimentos (
        contrato_id, origem, grupo, volume_sacas, ativo, confirmado_em, cancelado_em
      ) VALUES (
        v_alocacao.contrato_id, 'alocacao_saldo', v_grupo, v_volume, TRUE, NOW(), NULL
      ) ON CONFLICT (contrato_id) DO UPDATE SET
        origem = EXCLUDED.origem,
        grupo = EXCLUDED.grupo,
        volume_sacas = EXCLUDED.volume_sacas,
        ativo = TRUE,
        confirmado_em = CASE
          WHEN contratos_cumprimentos.ativo THEN contratos_cumprimentos.confirmado_em
          ELSE NOW()
        END,
        cancelado_em = NULL;
    ELSE
      UPDATE public.contratos_cumprimentos
      SET ativo = FALSE, cancelado_em = COALESCE(cancelado_em, NOW())
      WHERE contrato_id = v_alocacao.contrato_id AND ativo = TRUE;
    END IF;
    v_total := v_total + 1;
  END LOOP;
  RETURN v_total;
END;
$$;

ALTER TABLE public.contratos_cumprimentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total para usuarios autenticados em cumprimentos" ON public.contratos_cumprimentos;
CREATE POLICY "Acesso total para usuarios autenticados em cumprimentos" ON public.contratos_cumprimentos
  FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_cumprimentos TO authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_alocacoes_contratos(TEXT, JSONB) TO authenticated;
