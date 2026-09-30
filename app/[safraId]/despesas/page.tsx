"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Check, Download, Edit2, FileUp, Loader2, Plus, Printer, Save, Search, X } from 'lucide-react';
import ManagementShell, { commandClass, fieldClass, MetricStrip } from '../../../src/components/ManagementShell';
import { ExpenseDraft, ExpenseMovement, expenseTotals, markPossibleDuplicates, parseBRMoney, parseStatementLines, validateExpenseDraft } from '../../../src/lib/despesasEngine';
import { readStatementPdf } from '../../../src/lib/readStatementPdf';
import { previousExpenseMovements, saveExpenseDraft } from '../../../src/lib/despesasRepository';
import { supabase } from '../../../src/integrations/supabase/client';
import { showError, showSuccess } from '../../../src/utils/toast';
import { downloadCsv } from '../../../src/lib/exportCsv';

const money = (cents: number) => (cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const empty = (): ExpenseDraft => ({ title:'', account:'', documents:[], movements:[], opening:'', closing:'', periodStart:'', periodEnd:'' });
const dateLabel = (date: string) => date ? date.split('-').reverse().join('/') : 'Data pendente';

export default function DespesasPage() {
  const safraId = useParams().safraId as string;
  const [draft,setDraft] = useState<ExpenseDraft>(empty);
  const [id,setId] = useState<string|null>(null);
  const [version,setVersion] = useState(0);
  const [savedStatus,setSavedStatus] = useState('');
  const [tab,setTab] = useState('pagamentos');
  const [busy,setBusy] = useState('');
  const [history,setHistory] = useState<any[]>([]);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState('');
  const [dirty,setDirty] = useState(false);
  const [edit,setEdit] = useState<ExpenseMovement|null>(null);
  const [amount,setAmount] = useState('');
  const [search,setSearch] = useState('');
  const [from,setFrom] = useState('');
  const [to,setTo] = useState('');
  const [source,setSource] = useState('');
  const files = useRef(new Map<string,File>());
  const input = useRef<HTMLInputElement>(null);
  const loadHistory = async () => {
    const { data,error } = await supabase.from('despesas_analises').select('id,titulo,conta,status,versao,updated_at').eq('safra_id',safraId).order('updated_at',{ascending:false}).limit(100);
    setReady(!error);
    setHistory(data || []);
    if (error) setError('Despesas aguardando banco: execute docs/supabase_despesas.sql. ' + error.message);
  };
  useEffect(() => { setDraft(empty()); setId(null); setVersion(0); setDirty(false); files.current.clear(); loadHistory(); },[safraId]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue=''; } };
    window.addEventListener('beforeunload',warn); return () => window.removeEventListener('beforeunload',warn);
  },[dirty]);
  const update = (patch: Partial<ExpenseDraft>) => { setDraft(d => ({...d,...patch})); setDirty(true); setSavedStatus(''); };
  const importFiles = async (selected: FileList|null) => {
    if (!selected?.length) return;
    if (draft.documents.length+selected.length>10) { showError('Limite de 10 arquivos por análise.'); return; }
    if (!draft.account.trim()) { showError('Informe banco, agência e conta antes de importar.'); return; }
    setBusy('Lendo PDFs...'); setError('');
    let documents = [...draft.documents], movements = [...draft.movements];
    const failures: string[] = (draft.importFailures || []).filter(message => !Array.from(selected).some(file => message.startsWith(file.name + ': ')));
    for (const file of Array.from(selected)) {
      try {
        const doc = await readStatementPdf(file,setBusy);
        if (documents.some(d => d.hash === doc.hash)) { showError(file.name + ': arquivo já adicionado.'); continue; }
        const parsed = parseStatementLines(doc);
        if (!parsed.length) showError(file.name + ': nenhum movimento reconhecido automaticamente. Confira o texto e o layout.');
        const previous = await previousExpenseMovements(draft.account.trim().toUpperCase(),parsed);
        movements = [...movements,...markPossibleDuplicates(parsed,[...movements,...previous])];
        documents.push(doc); files.current.set(doc.hash,file);
      } catch (e:any) { failures.push(file.name + ': ' + e.message); }
    }
    update({ documents,movements, importFailures:failures, account:draft.account.trim().toUpperCase() }); setTab('revisao');
    setError(failures.join('\n')); setBusy('');
    if (input.current) input.current.value='';
  };
  const save = async (finalize: boolean) => {
    const problems = finalize ? validateExpenseDraft(draft) : [];
    if (!draft.title.trim() || !draft.account.trim()) problems.push('Informe título e conta.');
    if (problems.length) { setError(problems.join('\n')); setTab('revisao'); return; }
    if (finalize && !window.confirm(`Finalizar análise de ${safraId} para ${draft.account}? Total líquido: ${money(expenseTotals(draft.movements).net)}.`)) return;
    setBusy('Gravando análise e arquivos privados...'); setError('');
    try {
      const result = await saveExpenseDraft(draft,safraId,files.current,id,version,finalize);
      setId(result.id); setDraft(result.draft); setVersion(v=>v+1); setDirty(false); setSavedStatus(finalize?'finalizada':'rascunho');
      await loadHistory(); showSuccess(finalize?'Análise finalizada.':'Rascunho salvo.');
    } catch (e:any) { setError(e.message); }
    finally { setBusy(''); }
  };
  const open = async (recordId: string) => {
    if (dirty && !window.confirm('Descartar alterações não salvas e abrir esta análise?')) return;
    setBusy('Abrindo análise...');
    const { data,error } = await supabase.from('despesas_analises').select('*').eq('id',recordId).eq('safra_id',safraId).single();
    if (error) setError(error.message);
    else { setDraft(data.dados); setId(data.id); setVersion(data.versao); setSavedStatus(data.status); setDirty(false); setTab('pagamentos'); setFrom(''); setTo(''); setSearch(''); setError(''); }
    setBusy('');
  };
  const newAnalysis = () => {
    if (dirty && !window.confirm('Descartar alterações não salvas?')) return;
    setDraft(empty()); setId(null); setVersion(0); setSavedStatus(''); setDirty(false); setError(''); files.current.clear(); setTab('pagamentos');
  };
  const filtered = draft.movements.filter(m => (!from || m.date>=from) && (!to || m.date<=to) && [m.description,m.beneficiary].join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')));
  const totals = expenseTotals(draft.movements);
  const rows = filtered.filter(m => tab==='revisao' || m.decision==='incluir' || m.decision==='estorno').sort((a,b)=>b.cents-a.cents || b.date.localeCompare(a.date));
  const grouped = Array.from(filtered.filter(m=>m.reviewed && m.decision==='incluir').reduce((map,m)=>{
    const key=m.beneficiary.trim() || 'Beneficiário não confirmado'; map.set(key,(map.get(key)||0)+m.cents); return map;
  },new Map<string,number>())).sort((a,b)=>b[1]-a[1]);
  const exportRows = () => downloadCsv(`despesas-${safraId}.csv`,[
    ['Safra','Conta','Análise','Versão','Situação','Data','Beneficiário','Histórico','Valor','Direção','Decisão','Motivo','Arquivo','Página'],
    ...rows.map(m=>[safraId,draft.account,draft.title,version,dirty?'Não salvo':savedStatus,dateLabel(m.date),m.beneficiary,m.description,money(m.cents),m.direction,m.decision,m.reason,draft.documents.find(d=>d.id===m.documentId)?.name||'',m.page]),
  ]);
  const beginEdit = (m: ExpenseMovement) => { setEdit({...m}); setAmount((m.cents/100).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:false})); };
  const saveEdit = () => {
    if (!edit) return;
    const cents=parseBRMoney(amount);
    if (cents===null || cents<=0 || !edit.date || !edit.reason.trim()) { showError('Confirme data, valor brasileiro positivo e motivo.'); return; }
    if (edit.direction==='indefinido' || edit.decision==='revisar') { showError('Defina débito/crédito e a decisão.'); return; }
    const row={...edit,cents,reviewed:true};
    update({movements:draft.movements.some(m=>m.id===row.id)?draft.movements.map(m=>m.id===row.id?row:m):[...draft.movements,row]}); setEdit(null);
  };
  return <ManagementShell safraId={safraId} title="Despesas" actions={<>
    <button disabled={!!busy} className={commandClass} onClick={newAnalysis}><Plus size={16} /> Nova análise</button>
    <button disabled={!!busy || !ready} className={commandClass} onClick={()=>save(false)}><Save size={16} /> Salvar rascunho</button>
    <button disabled={!!busy || !ready || !draft.movements.length} className={commandClass+' bg-green-700 text-white'} onClick={()=>save(true)}><Check size={16} /> Finalizar</button>
  </>}>
    <div className="hidden print:block"><h1 className="text-xl font-bold">Despesas · {draft.title}</h1><p>{safraId} · {draft.account} · {dateLabel(draft.periodStart)} a {dateLabel(draft.periodEnd)} · Versão {version} · {dirty?'Não salvo':savedStatus || 'Rascunho'}</p></div>
    {error && <p role="alert" className="whitespace-pre-line border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">{error}</p>}
    {!!draft.importFailures?.length && <section className="border-l-4 border-red-500 p-4 text-sm"><h2 className="font-semibold">Arquivos não processados</h2>{draft.importFailures.map(f=><p key={f} className="mt-2 break-words">{f}</p>)}<button disabled={!!busy} className={commandClass+' mt-3 print:hidden'} onClick={()=>{if(window.confirm('Retirar os arquivos com erro? Eles não farão parte desta análise. A exclusão ficará registrada no relatório.')) {update({excludedFiles:[...(draft.excludedFiles||[]),...(draft.importFailures||[])],importFailures:[]});setError('');}}}>Retirar arquivos com erro</button></section>}
    {!!draft.excludedFiles?.length && <p className="text-xs text-amber-700 dark:text-amber-300">Arquivos retirados da análise: {draft.excludedFiles.join('; ')}</p>}
    {busy && <p role="status" className="flex items-center gap-2 text-sm"><Loader2 size={18} className="animate-spin" />{busy}</p>}
    <fieldset disabled={!!busy} className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
      <label className="text-xs font-semibold">Título da análise<input className={fieldClass+' mt-2 w-full'} value={draft.title} onChange={e=>update({title:e.target.value})} /></label>
      <label className="text-xs font-semibold">Banco / agência / conta<input list="expense-accounts" disabled={draft.documents.length>0} className={fieldClass+' mt-2 w-full'} value={draft.account} onChange={e=>update({account:e.target.value})} /><datalist id="expense-accounts">{Array.from(new Set(history.map(h=>h.conta))).map(c=><option key={c} value={c} />)}</datalist></label>
      <label className="text-xs font-semibold">Início do período<input type="date" className={fieldClass+' mt-2 w-full'} value={draft.periodStart} onChange={e=>update({periodStart:e.target.value})} /></label>
      <label className="text-xs font-semibold">Fim do período<input type="date" className={fieldClass+' mt-2 w-full'} value={draft.periodEnd} onChange={e=>update({periodEnd:e.target.value})} /></label>
    </fieldset>
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <input ref={input} type="file" accept=".pdf,application/pdf" multiple hidden onChange={e=>importFiles(e.target.files)} />
      <button disabled={!!busy || !ready} className={commandClass} onClick={()=>input.current?.click()}><FileUp size={17} /> Adicionar PDFs</button>
      <span className="text-xs text-slate-500">{draft.documents.length} arquivos · {draft.movements.length} movimentos · {dirty?'Alterações não salvas':savedStatus || 'Nova análise'}</span>
      {id && <span className="text-xs text-slate-500">Versão {version}</span>}
    </div>
    <MetricStrip items={[{label:'Pagamentos incluídos',value:money(totals.payments)},{label:'Estornos vinculados',value:money(totals.refunds)},{label:'Gasto líquido',value:money(totals.net)},{label:'Valor a revisar',value:money(totals.reviewCents)},{label:'Movimentos a revisar',value:totals.reviewCount}]} />
    <nav className="flex overflow-x-auto border-b dark:border-slate-700 print:hidden" aria-label="Visões de despesas">{[['pagamentos','Pagamentos'],['beneficiarios','Por beneficiário'],['revisao','Revisão'],['historico','Análises salvas']].map(([k,label])=><button key={k} onClick={()=>setTab(k)} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${tab===k?'border-green-700 text-green-700 dark:text-green-400':'border-transparent text-slate-500'}`}>{label}</button>)}</nav>
    {tab==='historico' ? <section className="divide-y dark:divide-slate-700">
      {!history.length && <p className="py-10 text-center text-slate-500">Nenhuma análise salva nesta safra.</p>}
      {history.map(h=><div key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><h2 className="font-semibold">{h.titulo}</h2><p className="text-xs text-slate-500">{h.conta} · {h.status} · v{h.versao} · {new Date(h.updated_at).toLocaleDateString('pt-BR')}</p></div><button disabled={!!busy} className={commandClass} onClick={()=>open(h.id)}>Abrir análise</button></div>)}
    </section> : <>
      <div className="flex flex-wrap items-center gap-3 print:hidden"><label className="flex min-w-0 flex-1 items-center gap-2"><Search size={18} /><input aria-label="Buscar movimentos" className={fieldClass+' w-full'} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Histórico ou beneficiário" /></label><input aria-label="Filtrar a partir de" type="date" className={fieldClass} value={from} onChange={e=>setFrom(e.target.value)} /><input aria-label="Filtrar até" type="date" className={fieldClass} value={to} onChange={e=>setTo(e.target.value)} /><button className={commandClass} title="Exportar CSV" onClick={exportRows}><Download size={16}/></button><button className={commandClass} title="Imprimir relatório" onClick={()=>window.print()}><Printer size={16}/></button></div>
      {(from || to || search) && <p className="text-xs text-slate-500">Filtro da lista: {dateLabel(from)} a {dateLabel(to)} {search} · KPIs do período completo.</p>}
      {tab==='revisao' && <section className="space-y-4 print:hidden">
        {draft.documents.map(doc=><div key={doc.id} className="border-b pb-4 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{doc.name}</p>{doc.warnings.map(w=><p key={w} className="text-xs text-amber-700">{w}</p>)}</div><button className={commandClass} onClick={()=>setSource(source===doc.id?'':doc.id)}>Texto extraído</button></div>
          {source===doc.id && <pre className="my-3 max-h-80 overflow-auto whitespace-pre-wrap break-words bg-slate-50 p-4 text-xs dark:bg-slate-800">{doc.lines.map(l=>`[p.${l.page} linha ${l.line}] ${l.text}`).join('\n')}</pre>}
          <label className="mt-3 flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" disabled={!!busy || doc.warnings.length>0} checked={doc.verified} onChange={e=>update({documents:draft.documents.map(d=>d.id===doc.id?{...d,verified:e.target.checked}:d)})} />Conferi as páginas, a conta, o período e todos os movimentos deste arquivo.</label>
          <button disabled={!!busy} className={commandClass+' mt-3'} onClick={()=>beginEdit({id:doc.id+':manual:'+crypto.randomUUID(),documentId:doc.id,page:1,line:0,raw:'Correção manual vinculada ao arquivo',date:'',description:'',beneficiary:'',cents:0,direction:'indefinido',decision:'revisar',reason:'',refundOf:'',reviewed:false})}><Plus size={14}/> Movimento não identificado</button>
        </div>)}
        <div className="flex flex-wrap gap-4"><label className="text-xs font-semibold">Saldo inicial (opcional)<input disabled={!!busy} className={fieldClass+' ml-2'} placeholder="0,00" value={draft.opening} onChange={e=>update({opening:e.target.value})}/></label><label className="text-xs font-semibold">Saldo final (opcional)<input disabled={!!busy} className={fieldClass+' ml-2'} placeholder="0,00" value={draft.closing} onChange={e=>update({closing:e.target.value})}/></label></div>
      </section>}
      {tab==='beneficiarios' ? <section className="space-y-5">{grouped.map(([name,value])=><div key={name}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="break-words">{name}</span><strong className="shrink-0">{money(value)}</strong></div><div className="h-3 bg-slate-100 dark:bg-slate-800"><div className="h-3 bg-green-600" style={{width:`${value/Math.max(grouped[0]?.[1]||1,1)*100}%`}}/></div></div>)}</section> :
      <section className="divide-y dark:divide-slate-700">
        {!rows.length && <p className="py-12 text-center text-slate-500">Nenhum movimento nesta visão.</p>}
        {rows.map(m=><article key={m.id} className="grid gap-3 py-4 sm:grid-cols-[100px_minmax(0,1fr)_150px_auto]">
          <p className="text-xs text-slate-500">{dateLabel(m.date)}</p><div className="min-w-0"><h3 className="break-words text-sm font-semibold">{m.beneficiary || m.description || 'Histórico pendente'}</h3><p className="mt-1 break-words text-xs text-slate-500">{m.description} · p.{m.page}</p><p className="mt-1 text-xs text-slate-500">{m.reason}</p></div><div><strong>{money(m.cents)}</strong><p className="text-xs text-slate-500">{m.direction} · {m.decision} {!m.reviewed && '· a conferir'}</p></div><button disabled={!!busy} className={commandClass+' self-start print:hidden'} title="Revisar movimento" onClick={()=>beginEdit(m)}><Edit2 size={16}/></button>
        </article>)}
      </section>}
    </>}
    {edit && <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-3">
      <section role="dialog" aria-modal="true" aria-label="Revisar movimento" className="max-h-[94vh] w-full max-w-2xl space-y-4 overflow-auto rounded-lg bg-white p-5 dark:bg-slate-900">
        <div className="flex justify-between"><h2 className="text-lg font-bold">Revisar movimento</h2><button title="Fechar" onClick={()=>setEdit(null)}><X size={20}/></button></div>
        <p className="whitespace-pre-wrap break-words bg-slate-50 p-3 text-xs dark:bg-slate-800">{edit.raw}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold">Data<input type="date" className={fieldClass+' mt-1 w-full'} value={edit.date} onChange={e=>setEdit({...edit,date:e.target.value})}/></label>
          <label className="text-xs font-semibold">Valor (R$)<input className={fieldClass+' mt-1 w-full'} inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
          <label className="text-xs font-semibold">Histórico<input className={fieldClass+' mt-1 w-full'} value={edit.description} onChange={e=>setEdit({...edit,description:e.target.value})}/></label>
          <label className="text-xs font-semibold">Beneficiário confirmado<input className={fieldClass+' mt-1 w-full'} value={edit.beneficiary} onChange={e=>setEdit({...edit,beneficiary:e.target.value})}/></label>
          <label className="text-xs font-semibold">Movimento<select className={fieldClass+' mt-1 w-full'} value={edit.direction} onChange={e=>setEdit({...edit,direction:e.target.value as ExpenseMovement['direction']})}><option value="indefinido">Confirmar</option><option value="debito">Débito / saída</option><option value="credito">Crédito / entrada</option></select></label>
          <label className="text-xs font-semibold">Decisão<select className={fieldClass+' mt-1 w-full'} value={edit.decision} onChange={e=>setEdit({...edit,decision:e.target.value as ExpenseMovement['decision']})}><option value="revisar">Revisar</option><option value="incluir">Incluir como despesa</option><option value="excluir">Excluir do total</option><option value="estorno">Estorno de despesa</option></select></label>
          {edit.decision==='estorno' && <label className="text-xs font-semibold sm:col-span-2">Débito de origem<select className={fieldClass+' mt-1 w-full'} value={edit.refundOf} onChange={e=>setEdit({...edit,refundOf:e.target.value})}><option value="">Selecionar débito</option>{draft.movements.filter(m=>m.decision==='incluir' && m.direction==='debito').map(m=><option key={m.id} value={m.id}>{dateLabel(m.date)} · {m.beneficiary||m.description} · {money(m.cents)}</option>)}</select></label>}
          <label className="text-xs font-semibold sm:col-span-2">Motivo / validação<input className={fieldClass+' mt-1 w-full'} value={edit.reason} onChange={e=>setEdit({...edit,reason:e.target.value})} placeholder="Despesa confirmada, transferência própria, entrada, duplicidade..." /></label>
          <label className="text-xs font-semibold">Página de origem<input type="number" min="1" className={fieldClass+' mt-1 w-full'} value={edit.page} onChange={e=>setEdit({...edit,page:Number(e.target.value)})}/></label>
        </div>
        <button className={commandClass+' bg-green-700 text-white'} onClick={saveEdit}><Check size={16}/> Confirmar revisão</button>
      </section>
    </div>}
  </ManagementShell>;
}
