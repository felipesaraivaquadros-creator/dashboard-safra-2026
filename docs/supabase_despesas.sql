-- Analises privadas por usuario e por safra. Nao altera financeiro ou saldos.
BEGIN;
CREATE TABLE IF NOT EXISTS public.despesas_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  hash text NOT NULL CHECK (hash ~ '^[a-f0-9]{64}$'), nome text NOT NULL, storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(owner_id,hash), UNIQUE(id,owner_id)
);
CREATE TABLE IF NOT EXISTS public.despesas_analises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  safra_id text NOT NULL CHECK (length(trim(safra_id)) > 0),
  titulo text NOT NULL, conta text NOT NULL, status text NOT NULL CHECK(status IN ('rascunho','finalizada')),
  versao integer NOT NULL DEFAULT 1, dados jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,owner_id)
);
CREATE TABLE IF NOT EXISTS public.despesas_versoes (
  analise_id uuid NOT NULL, owner_id uuid NOT NULL, versao integer NOT NULL, status text NOT NULL,
  dados jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(analise_id,versao),
  FOREIGN KEY(analise_id,owner_id) REFERENCES public.despesas_analises(id,owner_id)
);
-- Ocorrencia canonica: arquivo + pagina + linha, independente das versoes de analise.
CREATE TABLE IF NOT EXISTS public.despesas_movimentos (
  owner_id uuid NOT NULL, documento_id uuid NOT NULL, origem text NOT NULL, conta text NOT NULL,
  data date NOT NULL, centavos bigint NOT NULL CHECK(centavos > 0), direcao text NOT NULL,
  descricao text NOT NULL, original text NOT NULL,
  PRIMARY KEY(owner_id,documento_id,origem),
  FOREIGN KEY(documento_id,owner_id) REFERENCES public.despesas_documentos(id,owner_id)
);
CREATE INDEX IF NOT EXISTS despesas_analises_safra_idx ON public.despesas_analises(owner_id,safra_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS despesas_movimentos_busca_idx ON public.despesas_movimentos(owner_id,conta,data,centavos);
ALTER TABLE public.despesas_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_analises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_movimentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS despesas_documentos_owner ON public.despesas_documentos;
CREATE POLICY despesas_documentos_owner ON public.despesas_documentos FOR ALL TO authenticated
  USING(owner_id = auth.uid()) WITH CHECK(owner_id = auth.uid() AND storage_path = auth.uid()::text || '/' || hash || '.pdf');
DROP POLICY IF EXISTS despesas_analises_owner ON public.despesas_analises;
CREATE POLICY despesas_analises_owner ON public.despesas_analises FOR SELECT TO authenticated USING(owner_id = auth.uid());
DROP POLICY IF EXISTS despesas_versoes_owner ON public.despesas_versoes;
CREATE POLICY despesas_versoes_owner ON public.despesas_versoes FOR SELECT TO authenticated USING(owner_id = auth.uid());
DROP POLICY IF EXISTS despesas_movimentos_owner ON public.despesas_movimentos;
CREATE POLICY despesas_movimentos_owner ON public.despesas_movimentos FOR SELECT TO authenticated USING(owner_id = auth.uid());
GRANT SELECT, INSERT ON public.despesas_documentos TO authenticated;
REVOKE UPDATE, DELETE ON public.despesas_documentos FROM authenticated, anon;
GRANT SELECT ON public.despesas_analises,public.despesas_versoes,public.despesas_movimentos TO authenticated;
REVOKE INSERT,UPDATE,DELETE ON public.despesas_analises,public.despesas_versoes,public.despesas_movimentos FROM authenticated,anon;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('despesas-extratos','despesas-extratos',false,20971520,ARRAY['application/pdf'])
ON CONFLICT(id) DO UPDATE SET public=false, file_size_limit=20971520, allowed_mime_types=ARRAY['application/pdf'];
DROP POLICY IF EXISTS despesas_pdf_read ON storage.objects;
CREATE POLICY despesas_pdf_read ON storage.objects FOR SELECT TO authenticated
  USING(bucket_id='despesas-extratos' AND (storage.foldername(name))[1]=auth.uid()::text);
DROP POLICY IF EXISTS despesas_pdf_insert ON storage.objects;
CREATE POLICY despesas_pdf_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK(bucket_id='despesas-extratos' AND (storage.foldername(name))[1]=auth.uid()::text);

CREATE OR REPLACE FUNCTION public.salvar_analise_despesas(
  p_id uuid, p_safra_id text, p_dados jsonb, p_finalizar boolean, p_versao integer DEFAULT 0
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE
  uid uuid := auth.uid(); target uuid := coalesce(p_id,gen_random_uuid());
  current_version integer := 0; doc jsonb; mov jsonb; original_doc uuid;
  debit jsonb; total_refund bigint; balance bigint := 0; amount bigint; doc_balance numeric;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sessao invalida'; END IF;
  IF length(trim(coalesce(p_safra_id,'')))=0 OR length(trim(coalesce(p_dados->>'title','')))=0
    OR length(trim(coalesce(p_dados->>'account','')))=0 THEN RAISE EXCEPTION 'Safra, titulo e conta obrigatorios'; END IF;
  IF jsonb_typeof(p_dados->'documents') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_dados->'movements') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_dados->'movements')>10000
    OR jsonb_array_length(p_dados->'documents')>10 THEN RAISE EXCEPTION 'Estrutura ou tamanho invalido'; END IF;
  IF p_id IS NOT NULL THEN
    SELECT versao INTO current_version FROM public.despesas_analises
      WHERE id=p_id AND owner_id=uid AND safra_id=p_safra_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Analise nao encontrada nesta safra'; END IF;
    IF current_version <> p_versao THEN RAISE EXCEPTION 'Analise alterada em outra janela. Reabra antes de salvar.'; END IF;
  END IF;
  IF p_finalizar AND (jsonb_array_length(p_dados->'documents')=0
    OR coalesce(p_dados->>'periodStart','')='' OR coalesce(p_dados->>'periodEnd','')=''
    OR (p_dados->>'periodStart')::date > (p_dados->>'periodEnd')::date) THEN RAISE EXCEPTION 'Periodo ou movimentos invalidos'; END IF;
  IF p_finalizar AND jsonb_array_length(coalesce(p_dados->'importFailures','[]'::jsonb))>0 THEN
    RAISE EXCEPTION 'Arquivos com falha de leitura pendentes'; END IF;
  IF (SELECT count(DISTINCT value->'statement'->>'accountKey') FROM jsonb_array_elements(p_dados->'documents')
    WHERE coalesce(value->'statement'->>'accountKey','')<>'')>1 THEN
    RAISE EXCEPTION 'Contas diferentes exigem analises separadas'; END IF;
  FOR doc IN SELECT value FROM jsonb_array_elements(p_dados->'documents') LOOP
    SELECT id INTO original_doc FROM public.despesas_documentos WHERE owner_id=uid AND hash=doc->>'hash' AND storage_path=doc->>'path';
    IF NOT FOUND THEN RAISE EXCEPTION 'Arquivo nao pertence ao usuario'; END IF;
    IF p_finalizar AND (coalesce((doc->>'verified')::boolean,false)=false OR jsonb_array_length(doc->'warnings')>0) THEN
      RAISE EXCEPTION 'Arquivo incompleto ou nao conferido'; END IF;
    IF p_finalizar AND jsonb_array_length(p_dados->'movements')=0 THEN
      IF coalesce((doc->'statement'->>'emptyStatement')::boolean,false)=false
        OR coalesce((doc->'statement'->>'balanceMatches')::boolean,false)=false
        OR coalesce(doc->'statement'->>'bank','') NOT IN ('bb','sicredi','cresol','sicoob')
        OR coalesce((doc->'statement'->>'transactionCount')::integer,-1)<>0
        OR doc->'statement'->>'openingCents' IS NULL OR doc->'statement'->>'closingCents' IS NULL THEN
        RAISE EXCEPTION 'Ausencia de movimentos nao comprovada'; END IF;
    END IF;
    IF p_finalizar AND doc->'statement'->>'openingCents' IS NOT NULL AND doc->'statement'->>'closingCents' IS NOT NULL THEN
      SELECT coalesce(sum(CASE WHEN m->>'direction'='credito' THEN (m->>'cents')::numeric ELSE -(m->>'cents')::numeric END),0)
        INTO doc_balance FROM jsonb_array_elements(p_dados->'movements') m WHERE m->>'documentId'=doc->>'hash';
      IF (doc->'statement'->>'openingCents')::numeric+doc_balance<>(doc->'statement'->>'closingCents')::numeric THEN
        RAISE EXCEPTION 'Movimentos divergem dos saldos do arquivo'; END IF;
    END IF;
  END LOOP;
  IF (SELECT count(*) <> count(DISTINCT value->>'id') FROM jsonb_array_elements(p_dados->'movements')) THEN
    RAISE EXCEPTION 'Movimento duplicado'; END IF;
  FOR mov IN SELECT value FROM jsonb_array_elements(p_dados->'movements') LOOP
    SELECT id INTO original_doc FROM public.despesas_documentos WHERE owner_id=uid AND hash=mov->>'documentId'
      AND EXISTS (SELECT 1 FROM jsonb_array_elements(p_dados->'documents') d WHERE d->>'hash'=mov->>'documentId');
    IF NOT FOUND THEN RAISE EXCEPTION 'Origem do movimento invalida'; END IF;
    IF p_finalizar THEN
      IF coalesce((mov->>'reviewed')::boolean,false)=false OR coalesce(mov->>'decision','') NOT IN ('incluir','excluir','estorno')
        OR coalesce(mov->>'direction','') NOT IN ('debito','credito') OR length(trim(coalesce(mov->>'reason','')))=0
        OR coalesce(mov->>'date','')='' OR (mov->>'date')::date NOT BETWEEN (p_dados->>'periodStart')::date AND (p_dados->>'periodEnd')::date
        OR coalesce(mov->>'cents','') !~ '^[0-9]+$'
        THEN RAISE EXCEPTION 'Revisao incompleta'; END IF;
      amount := (mov->>'cents')::bigint;
      IF amount <= 0 OR amount > 999999999999 THEN RAISE EXCEPTION 'Valor invalido'; END IF;
      IF mov->>'decision'='incluir' AND mov->>'direction'<>'debito' THEN RAISE EXCEPTION 'Entrada nao e despesa'; END IF;
      IF mov->>'decision'='estorno' THEN
        SELECT value INTO debit FROM jsonb_array_elements(p_dados->'movements') WHERE value->>'id'=mov->>'refundOf';
        IF debit IS NULL OR debit->>'decision'<>'incluir' OR debit->>'direction'<>'debito' OR mov->>'direction'<>'credito'
          OR (debit->>'date')::date > (mov->>'date')::date THEN RAISE EXCEPTION 'Vinculo de estorno invalido'; END IF;
        SELECT sum((value->>'cents')::bigint) INTO total_refund FROM jsonb_array_elements(p_dados->'movements')
          WHERE value->>'decision'='estorno' AND value->>'refundOf'=debit->>'id';
        IF total_refund > (debit->>'cents')::bigint THEN RAISE EXCEPTION 'Estornos excedem o debito'; END IF;
      END IF;
      balance := balance + CASE WHEN mov->>'direction'='credito' THEN amount ELSE -amount END;
      INSERT INTO public.despesas_movimentos(owner_id,documento_id,origem,conta,data,centavos,direcao,descricao,original)
      VALUES(uid,original_doc,mov->>'id',p_dados->>'account',(mov->>'date')::date,amount,mov->>'direction',mov->>'description',mov->>'raw')
      ON CONFLICT(owner_id,documento_id,origem) DO NOTHING;
    END IF;
  END LOOP;
  IF p_finalizar AND (coalesce(p_dados->>'opening','')<>'' OR coalesce(p_dados->>'closing','')<>'') THEN
    IF coalesce(p_dados->>'opening','') !~ '^-?([0-9]{1,3}(\.[0-9]{3})*|[0-9]+),[0-9]{2}$'
      OR coalesce(p_dados->>'closing','') !~ '^-?([0-9]{1,3}(\.[0-9]{3})*|[0-9]+),[0-9]{2}$' THEN
      RAISE EXCEPTION 'Saldos invalidos'; END IF;
    IF balance + (replace(replace(p_dados->>'opening','.',''),',','.'))::numeric*100
      <> (replace(replace(p_dados->>'closing','.',''),',','.'))::numeric*100 THEN RAISE EXCEPTION 'Divergencia de saldos'; END IF;
  END IF;
  current_version := current_version+1;
  INSERT INTO public.despesas_analises(id,owner_id,safra_id,titulo,conta,status,versao,dados)
  VALUES(target,uid,p_safra_id,p_dados->>'title',p_dados->>'account',CASE WHEN p_finalizar THEN 'finalizada' ELSE 'rascunho' END,current_version,p_dados)
  ON CONFLICT(id) DO UPDATE SET titulo=excluded.titulo,conta=excluded.conta,status=excluded.status,versao=excluded.versao,dados=excluded.dados,updated_at=now();
  INSERT INTO public.despesas_versoes(analise_id,owner_id,versao,status,dados)
  VALUES(target,uid,current_version,CASE WHEN p_finalizar THEN 'finalizada' ELSE 'rascunho' END,p_dados);
  RETURN target;
END;
$$;
REVOKE ALL ON FUNCTION public.salvar_analise_despesas(uuid,text,jsonb,boolean,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.salvar_analise_despesas(uuid,text,jsonb,boolean,integer) TO authenticated;
COMMIT;
NOTIFY pgrst, 'reload schema';
