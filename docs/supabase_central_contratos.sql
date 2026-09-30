-- Executar apos as migracoes de financeiro, barter e cumprimento por alocacao.
BEGIN;
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS arquivado_em timestamptz,
  ADD COLUMN IF NOT EXISTS contraparte text,
  ADD COLUMN IF NOT EXISTS arrendamento_valor numeric(16,2) NOT NULL DEFAULT 0 CHECK (arrendamento_valor >= 0),
  ADD COLUMN IF NOT EXISTS arrendamento_pago_em date,
  ADD COLUMN IF NOT EXISTS arrendamento_observacoes text,
  ADD COLUMN IF NOT EXISTS arrendamento_fazenda_id uuid REFERENCES public.fazendas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS arrendamento_area_ha numeric CHECK (arrendamento_area_ha > 0);
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_tipo_contrato_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_tipo_contrato_check
  CHECK (tipo_contrato IN ('nao_classificado','venda','barter','misto','arrendamento','outro'));

-- Protege tambem as telas antigas que ainda usam DELETE direto.
CREATE OR REPLACE FUNCTION public.proteger_historico_contrato()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.romaneios WHERE contrato_id = OLD.id)
    OR EXISTS (SELECT 1 FROM public.contratos_financeiros WHERE contrato_id = OLD.id)
    OR EXISTS (SELECT 1 FROM public.contratos_barter WHERE contrato_id = OLD.id)
    OR EXISTS (SELECT 1 FROM public.contratos_cumprimentos WHERE contrato_id = OLD.id)
    OR OLD.arrendamento_pago_em IS NOT NULL THEN
    RAISE EXCEPTION 'Contrato possui historico vinculado. Arquive na central de Contratos.';
  END IF;
  RETURN OLD;
END;
$$;
DROP TRIGGER IF EXISTS contratos_proteger_historico ON public.contratos;
CREATE TRIGGER contratos_proteger_historico BEFORE DELETE ON public.contratos
FOR EACH ROW EXECUTE FUNCTION public.proteger_historico_contrato();
CREATE OR REPLACE FUNCTION public.excluir_contrato_sem_historico(p_id uuid, p_safra_id text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessao invalida'; END IF;
  DELETE FROM public.contratos WHERE id=p_id AND safra_id=p_safra_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contrato nao encontrado nesta safra'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.excluir_contrato_sem_historico(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.excluir_contrato_sem_historico(uuid,text) TO authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';
