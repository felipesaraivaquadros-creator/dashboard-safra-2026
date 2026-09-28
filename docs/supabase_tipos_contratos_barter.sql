-- Tipos de contrato e controle de trocas/barter.
-- Execute depois da criacao da tabela public.contratos.
-- O script e idempotente e nao reclassifica contratos existentes.

ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS tipo_contrato TEXT NOT NULL DEFAULT 'nao_classificado',
  ADD COLUMN IF NOT EXISTS forma_liquidacao TEXT NOT NULL DEFAULT 'nao_definida',
  ADD COLUMN IF NOT EXISTS tipo_outro_descricao TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.contratos'::regclass
      AND conname = 'contratos_tipo_contrato_check'
  ) THEN
    ALTER TABLE public.contratos
      ADD CONSTRAINT contratos_tipo_contrato_check
      CHECK (tipo_contrato IN ('nao_classificado', 'venda', 'barter', 'misto', 'outro'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.contratos'::regclass
      AND conname = 'contratos_forma_liquidacao_check'
  ) THEN
    ALTER TABLE public.contratos
      ADD CONSTRAINT contratos_forma_liquidacao_check
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
  responsavel_frete TEXT NOT NULL DEFAULT 'produtor'
    CHECK (responsavel_frete IN ('produtor', 'comprador', 'compartilhado', 'outro')),
  qualidade_exigida TEXT,
  numero_cpr TEXT,
  modalidade_cpr TEXT NOT NULL DEFAULT 'nao_aplicavel'
    CHECK (modalidade_cpr IN ('nao_aplicavel', 'fisica', 'financeira')),
  registro_cpr TEXT,
  preco_referencia_saca NUMERIC(14,4) CHECK (preco_referencia_saca IS NULL OR preco_referencia_saca >= 0),
  preco_mercado_saca NUMERIC(14,4) CHECK (preco_mercado_saca IS NULL OR preco_mercado_saca >= 0),
  data_preco_mercado DATE,
  status_conciliacao TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status_conciliacao IN ('pendente', 'divergente', 'conciliado')),
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

CREATE INDEX IF NOT EXISTS contratos_tipo_contrato_idx
  ON public.contratos (safra_id, tipo_contrato);
CREATE INDEX IF NOT EXISTS contratos_barter_contrato_id_idx
  ON public.contratos_barter (contrato_id);
CREATE INDEX IF NOT EXISTS contratos_barter_fim_entrega_idx
  ON public.contratos_barter (data_fim_entrega);
CREATE INDEX IF NOT EXISTS contratos_barter_itens_barter_id_idx
  ON public.contratos_barter_itens (contrato_barter_id);

CREATE OR REPLACE FUNCTION public.set_contratos_barter_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contratos_barter_set_updated_at ON public.contratos_barter;
CREATE TRIGGER contratos_barter_set_updated_at
BEFORE UPDATE ON public.contratos_barter
FOR EACH ROW EXECUTE FUNCTION public.set_contratos_barter_updated_at();

CREATE OR REPLACE FUNCTION public.salvar_contrato_barter(
  p_contrato_id UUID,
  p_fornecedor TEXT,
  p_recebedor_graos TEXT,
  p_valor_insumos NUMERIC,
  p_data_inicio_entrega DATE,
  p_data_fim_entrega DATE,
  p_local_entrega TEXT,
  p_responsavel_frete TEXT,
  p_qualidade_exigida TEXT,
  p_numero_cpr TEXT,
  p_modalidade_cpr TEXT,
  p_registro_cpr TEXT,
  p_preco_referencia_saca NUMERIC,
  p_preco_mercado_saca NUMERIC,
  p_data_preco_mercado DATE,
  p_status_conciliacao TEXT,
  p_observacoes TEXT,
  p_itens JSONB DEFAULT '[]'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_barter_id UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.contratos
    WHERE id = p_contrato_id
      AND tipo_contrato IN ('barter', 'misto')
  ) THEN
    RAISE EXCEPTION 'O contrato deve estar classificado como barter ou misto.';
  END IF;

  INSERT INTO public.contratos_barter (
    contrato_id, fornecedor, recebedor_graos, valor_insumos,
    data_inicio_entrega, data_fim_entrega, local_entrega, responsavel_frete,
    qualidade_exigida, numero_cpr, modalidade_cpr, registro_cpr,
    preco_referencia_saca, preco_mercado_saca, data_preco_mercado,
    status_conciliacao, observacoes
  ) VALUES (
    p_contrato_id, p_fornecedor, p_recebedor_graos, COALESCE(p_valor_insumos, 0),
    p_data_inicio_entrega, p_data_fim_entrega, p_local_entrega, COALESCE(p_responsavel_frete, 'produtor'),
    p_qualidade_exigida, p_numero_cpr, COALESCE(p_modalidade_cpr, 'nao_aplicavel'), p_registro_cpr,
    p_preco_referencia_saca, p_preco_mercado_saca, p_data_preco_mercado,
    COALESCE(p_status_conciliacao, 'pendente'), p_observacoes
  )
  ON CONFLICT (contrato_id) DO UPDATE SET
    fornecedor = EXCLUDED.fornecedor,
    recebedor_graos = EXCLUDED.recebedor_graos,
    valor_insumos = EXCLUDED.valor_insumos,
    data_inicio_entrega = EXCLUDED.data_inicio_entrega,
    data_fim_entrega = EXCLUDED.data_fim_entrega,
    local_entrega = EXCLUDED.local_entrega,
    responsavel_frete = EXCLUDED.responsavel_frete,
    qualidade_exigida = EXCLUDED.qualidade_exigida,
    numero_cpr = EXCLUDED.numero_cpr,
    modalidade_cpr = EXCLUDED.modalidade_cpr,
    registro_cpr = EXCLUDED.registro_cpr,
    preco_referencia_saca = EXCLUDED.preco_referencia_saca,
    preco_mercado_saca = EXCLUDED.preco_mercado_saca,
    data_preco_mercado = EXCLUDED.data_preco_mercado,
    status_conciliacao = EXCLUDED.status_conciliacao,
    observacoes = EXCLUDED.observacoes
  RETURNING id INTO v_barter_id;

  DELETE FROM public.contratos_barter_itens
  WHERE contrato_barter_id = v_barter_id;

  INSERT INTO public.contratos_barter_itens (
    contrato_barter_id, categoria, descricao, quantidade, unidade, valor_unitario, valor_total
  )
  SELECT
    v_barter_id,
    COALESCE(NULLIF(BTRIM(item.categoria), ''), 'Insumo'),
    COALESCE(item.descricao, ''),
    item.quantidade,
    NULLIF(BTRIM(item.unidade), ''),
    item.valor_unitario,
    COALESCE(item.valor_total, 0)
  FROM jsonb_to_recordset(COALESCE(p_itens, '[]'::JSONB)) AS item(
    categoria TEXT,
    descricao TEXT,
    quantidade NUMERIC,
    unidade TEXT,
    valor_unitario NUMERIC,
    valor_total NUMERIC
  );

  RETURN v_barter_id;
END;
$$;

ALTER TABLE public.contratos_barter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_barter_itens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contratos_barter'
      AND policyname = 'Acesso total para usuarios autenticados em contratos barter'
  ) THEN
    CREATE POLICY "Acesso total para usuarios autenticados em contratos barter"
      ON public.contratos_barter FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contratos_barter_itens'
      AND policyname = 'Acesso total para usuarios autenticados em itens barter'
  ) THEN
    CREATE POLICY "Acesso total para usuarios autenticados em itens barter"
      ON public.contratos_barter_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_barter TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_barter_itens TO authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_contrato_barter(
  UUID, TEXT, TEXT, NUMERIC, DATE, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC, NUMERIC, DATE, TEXT, TEXT, JSONB
) TO authenticated;

