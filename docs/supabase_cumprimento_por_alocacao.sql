-- Cumprimento operacional de contratos pela alocacao em Saldos por Armazem.
-- Execute este arquivo no SQL Editor do Supabase.

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

CREATE INDEX IF NOT EXISTS contratos_cumprimentos_contrato_id_idx
  ON public.contratos_cumprimentos (contrato_id);
CREATE INDEX IF NOT EXISTS contratos_cumprimentos_ativos_idx
  ON public.contratos_cumprimentos (contrato_id)
  WHERE ativo = TRUE;

CREATE OR REPLACE FUNCTION public.set_contratos_cumprimentos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contratos_cumprimentos_set_updated_at ON public.contratos_cumprimentos;
CREATE TRIGGER contratos_cumprimentos_set_updated_at
BEFORE UPDATE ON public.contratos_cumprimentos
FOR EACH ROW EXECUTE FUNCTION public.set_contratos_cumprimentos_updated_at();

-- Reconhece somente na primeira execucao os contratos que ja estavam alocados.
-- Registros cancelados nao sao reativados se o script for executado novamente.
INSERT INTO public.contratos_cumprimentos (
  contrato_id,
  origem,
  grupo,
  volume_sacas,
  ativo,
  confirmado_em
)
SELECT
  contrato.id,
  'alocacao_saldo',
  BTRIM(contrato.grupo),
  GREATEST(COALESCE(contrato.volume_total, 0), 0),
  TRUE,
  NOW()
FROM public.contratos AS contrato
WHERE NULLIF(BTRIM(contrato.grupo), '') IS NOT NULL
ON CONFLICT (contrato_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.salvar_alocacoes_contratos(
  p_safra_id TEXT,
  p_alocacoes JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_alocacao RECORD;
  v_grupo TEXT;
  v_volume NUMERIC(14,4);
  v_total INTEGER := 0;
BEGIN
  IF NULLIF(BTRIM(p_safra_id), '') IS NULL THEN
    RAISE EXCEPTION 'A safra e obrigatoria.';
  END IF;

  IF JSONB_TYPEOF(COALESCE(p_alocacoes, '[]'::JSONB)) <> 'array' THEN
    RAISE EXCEPTION 'As alocacoes devem ser enviadas como uma lista.';
  END IF;

  FOR v_alocacao IN
    SELECT item.contrato_id, item.grupo
    FROM JSONB_TO_RECORDSET(COALESCE(p_alocacoes, '[]'::JSONB))
      AS item(contrato_id UUID, grupo TEXT)
  LOOP
    SELECT GREATEST(COALESCE(contrato.volume_total, 0), 0)
      INTO v_volume
    FROM public.contratos AS contrato
    WHERE contrato.id = v_alocacao.contrato_id
      AND contrato.safra_id = p_safra_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Contrato % nao pertence a safra %.', v_alocacao.contrato_id, p_safra_id;
    END IF;

    v_grupo := NULLIF(BTRIM(v_alocacao.grupo), '');

    UPDATE public.contratos
    SET grupo = v_grupo
    WHERE id = v_alocacao.contrato_id;

    IF v_grupo IS NOT NULL THEN
      INSERT INTO public.contratos_cumprimentos (
        contrato_id,
        origem,
        grupo,
        volume_sacas,
        ativo,
        confirmado_em,
        cancelado_em
      ) VALUES (
        v_alocacao.contrato_id,
        'alocacao_saldo',
        v_grupo,
        v_volume,
        TRUE,
        NOW(),
        NULL
      )
      ON CONFLICT (contrato_id) DO UPDATE SET
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
      SET
        ativo = FALSE,
        cancelado_em = COALESCE(cancelado_em, NOW())
      WHERE contrato_id = v_alocacao.contrato_id
        AND ativo = TRUE;
    END IF;

    v_total := v_total + 1;
  END LOOP;

  RETURN v_total;
END;
$$;

ALTER TABLE public.contratos_cumprimentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total para usuarios autenticados em cumprimentos" ON public.contratos_cumprimentos;
CREATE POLICY "Acesso total para usuarios autenticados em cumprimentos"
  ON public.contratos_cumprimentos
  FOR ALL TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos_cumprimentos TO authenticated;
GRANT EXECUTE ON FUNCTION public.salvar_alocacoes_contratos(TEXT, JSONB) TO authenticated;
