import { supabase } from '../integrations/supabase/client';
import { ExpenseDraft, ExpenseMovement } from './despesasEngine';

export async function saveExpenseDraft(draft: ExpenseDraft, safraId: string, files: Map<string,File>, id: string | null, version: number, finalize: boolean) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sessão expirada. Entre novamente.');
  const documents = [];
  for (const doc of draft.documents) {
    const path = `${user.id}/${doc.hash}.pdf`;
    const existing = await supabase.from('despesas_documentos').select('id,storage_path').eq('hash',doc.hash).maybeSingle();
    if (existing.error) throw new Error('Banco de Despesas indisponível. Execute docs/supabase_despesas.sql. ' + existing.error.message);
    if (!existing.data) {
      const file = files.get(doc.hash);
      if (!file) throw new Error('Arquivo original indisponível: ' + doc.name);
      const upload = await supabase.storage.from('despesas-extratos').upload(path,file,{ contentType:'application/pdf', upsert:false });
      if (upload.error && String((upload.error as any).statusCode) !== '409') throw upload.error;
      const insert = await supabase.from('despesas_documentos').insert({ hash:doc.hash,nome:doc.name,storage_path:path });
      if (insert.error && insert.error.code !== '23505') throw insert.error;
    }
    documents.push({ ...doc, path: existing.data?.storage_path || path });
  }
  const saved = { ...draft, documents };
  const { data, error } = await supabase.rpc('salvar_analise_despesas', { p_id:id, p_safra_id:safraId, p_dados:saved, p_finalizar:finalize, p_versao:version });
  if (error) throw error;
  return { id: String(data), draft: saved };
}

export async function previousExpenseMovements(account: string, rows: ExpenseMovement[]): Promise<ExpenseMovement[]> {
  const dates = rows.map(r => r.date).filter(Boolean).sort();
  if (!dates.length) return [];
  const result: ExpenseMovement[] = [];
  for (let start=0;;start+=1000) {
    const { data,error } = await supabase.from('despesas_movimentos').select('*')
      .eq('conta',account).gte('data',dates[0]).lte('data',dates[dates.length-1])
      .order('documento_id').order('origem').range(start,start+999);
    if (error) throw new Error('Não foi possível verificar sobreposição com análises salvas: ' + error.message);
    for (const row of data || []) result.push({ id:row.origem,documentId:row.documento_id,page:0,line:0,raw:row.original,date:row.data,description:row.descricao,beneficiary:'',cents:Number(row.centavos),direction:row.direcao,decision:'revisar',reason:'',refundOf:'',reviewed:false });
    if (!data || data.length<1000) break;
  }
  return result;
}
