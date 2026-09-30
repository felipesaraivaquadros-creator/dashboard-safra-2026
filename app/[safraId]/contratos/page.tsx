"use client";

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Archive, ArchiveRestore, Download, Edit2, Eye, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import ManagementShell, { commandClass, fieldClass, MetricStrip } from '../../../src/components/ManagementShell';
import ContratoForm from '../../../src/components/saldos/ContratoForm';
import FinanceiroStatusBadge from '../../../src/components/financeiro/FinanceiroStatusBadge';
import { TIPO_CONTRATO_LABELS } from '../../../src/data/financeiroTypes';
import { useFinanceiroData } from '../../../src/lib/useFinanceiroData';
import { isContractFinanciallyFulfilled } from '../../../src/lib/financeiroCalculations';
import { supabase } from '../../../src/integrations/supabase/client';
import { showError, showSuccess } from '../../../src/utils/toast';
import { downloadCsv } from '../../../src/lib/exportCsv';

const num = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ContratosPage() {
  const safraId = useParams().safraId as string;
  const data = useFinanceiroData(safraId);
  const [type, setType] = useState('todos');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('todos');
  const [warehouse, setWarehouse] = useState('');
  const [archived, setArchived] = useState(false);
  const [edit, setEdit] = useState<any | null | undefined>(undefined);
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const all = data.summaries;
  const fulfilled = all.filter(isContractFinanciallyFulfilled).length;
  const incomplete = (c: typeof all[number]) => c.tipoContrato === 'arrendamento'
    ? !c.contraparte || !(c.volumeContratado > 0 || (c.arrendamentoValor || 0) > 0)
    : c.tipoContrato === 'barter' ? !c.barter : c.pendencias.length > 0;
  const rows = useMemo(() => all.filter(c => {
    const text = [c.nome, c.numero, c.contraparte, c.barter?.fornecedor].join(' ').toLocaleLowerCase('pt-BR');
    return (archived || !c.arquivado) && (type === 'todos' || c.tipoContrato === type)
      && text.includes(search.toLocaleLowerCase('pt-BR')) && (!warehouse || c.armazemId === warehouse)
      && (status === 'todos' || (status === 'cumpridos' ? isContractFinanciallyFulfilled(c)
        : status === 'incompletos' ? incomplete(c) : !isContractFinanciallyFulfilled(c)));
  }), [all, type, search, status, warehouse, archived]);
  const selected = all.find(c => c.contratoId === detail);
  const change = async (id: string, action: 'archive' | 'restore' | 'delete') => {
    const message = action === 'delete' ? 'Excluir contrato sem histórico? Esta ação não pode ser desfeita.'
      : action === 'archive' ? 'Arquivar contrato? Saldos, compromissos e totais históricos serão preservados.' : 'Restaurar contrato?';
    if (!window.confirm(message)) return;
    setBusy(true);
    const { error } = action === 'delete'
      ? await supabase.rpc('excluir_contrato_sem_historico', { p_id: id, p_safra_id: safraId })
      : await supabase.from('contratos').update({ arquivado_em: action === 'archive' ? new Date().toISOString() : null }).eq('id', id).eq('safra_id', safraId);
    if (error) showError(error.message + ' Verifique a migration supabase_central_contratos.sql.');
    else { showSuccess('Contrato atualizado.'); data.refresh(); }
    setBusy(false);
  };
  const exportRows = () => downloadCsv(`contratos-${safraId}.csv`, [
    ['Safra', 'Contrato', 'Número', 'Tipo', 'Contraparte', 'Sacas', 'Situação', 'Venda bruta', 'Barter', 'Arrendamento'],
    ...rows.map(c => [safraId, c.nome, c.numero, TIPO_CONTRATO_LABELS[c.tipoContrato], c.contraparte || c.barter?.fornecedor || '', num(c.volumeContratado), isContractFinanciallyFulfilled(c) ? 'Cumprido' : 'Pendente', money(c.brutoContratado), money(c.barterValorInsumos), money(c.arrendamentoValor || 0)]),
  ]);
  return <ManagementShell safraId={safraId} title="Contratos" actions={<>
    <button className={commandClass} onClick={exportRows} title="Exportar contratos"><Download size={16} /> CSV</button>
    <button className={commandClass + ' bg-green-700 text-white'} onClick={() => setEdit(null)}><Plus size={16} /> Novo contrato</button>
  </>}>
    {data.loading ? <p className="flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Carregando contratos...</p> : <>
      <MetricStrip items={[{ label: 'Contratos da safra', value: all.length }, { label: 'Volume contratado (sc)', value: num(all.reduce((s,c) => s + c.volumeContratado, 0)) }, { label: 'Cumpridos', value: fulfilled }, { label: 'Pendentes', value: all.length - fulfilled }, { label: 'Cadastro incompleto', value: all.filter(incomplete).length }]} />
      <nav aria-label="Tipos de contratos" className="flex gap-1 overflow-x-auto border-b dark:border-slate-700">
        {([['todos', 'Todos'], ...Object.entries(TIPO_CONTRATO_LABELS)]).map(([key,label]) => <button key={key} onClick={() => setType(key)} className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${type === key ? 'border-green-700 text-green-700 dark:text-green-400' : 'border-transparent text-slate-500'}`}>{label}</button>)}
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 items-center gap-2"><Search size={18} /><input aria-label="Buscar contratos" className={fieldClass + ' w-full'} placeholder="Nome, número ou contraparte" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <select aria-label="Situação" className={fieldClass} value={status} onChange={e => setStatus(e.target.value)}><option value="todos">Todas as situações</option><option value="cumpridos">Cumpridos</option><option value="pendentes">Pendentes</option><option value="incompletos">Cadastro incompleto</option></select>
        <select aria-label="Armazém" className={fieldClass} value={warehouse} onChange={e => setWarehouse(e.target.value)}><option value="">Todos os armazéns</option>{Array.from(new Map(all.filter(c => c.armazemId).map(c => [c.armazemId!,c.armazem])).entries()).map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={archived} onChange={e => setArchived(e.target.checked)} /> Incluir arquivados</label>
      </div>
      <p className="text-sm text-slate-500">{rows.length} contratos · {num(rows.reduce((s,c) => s + c.volumeContratado,0))} sc na lista</p>
      <section className="divide-y divide-slate-200 dark:divide-slate-700">
        {!rows.length && <p className="py-12 text-center text-slate-500">Nenhum contrato encontrado.</p>}
        {rows.map(c => <article key={c.contratoId} className="grid items-center gap-4 py-5 md:grid-cols-[minmax(180px,2fr)_1fr_1fr_auto]">
          <div className="min-w-0"><h2 className="break-words font-semibold">{c.nome} {c.arquivado && <span className="text-xs text-slate-500">(arquivado)</span>}</h2><p className="mt-1 text-xs text-slate-500">{c.numero || 'Sem número'} · {TIPO_CONTRATO_LABELS[c.tipoContrato]} · {c.contraparte || c.barter?.fornecedor || 'Contraparte não informada'}</p></div>
          <div><p className="font-semibold">{num(c.volumeContratado)} sc</p><p className="text-xs text-slate-500">{c.armazem || c.grupo || 'Sem armazém específico'}</p><p className="mt-1 text-xs">{c.tipoContrato === 'arrendamento' ? 'Obrigação: ' + money(c.arrendamentoValor || 0) : c.tipoContrato === 'barter' ? 'Troca: ' + money(c.barterValorInsumos) : 'Venda: ' + money(c.brutoContratado)}</p>{c.tipoContrato === 'misto' && <p className="text-xs">Troca: {money(c.barterValorInsumos)}</p>}</div>
          <div className="space-y-1"><p className={isContractFinanciallyFulfilled(c) ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-300'}>{isContractFinanciallyFulfilled(c) ? 'Cumprido' : 'Pendente'}</p>
            {c.tipoContrato !== 'barter' && c.tipoContrato !== 'arrendamento' && <FinanceiroStatusBadge status={c.status} />}</div>
          <div className="flex gap-1">
            <button className={commandClass} title="Detalhes" onClick={() => setDetail(c.contratoId)}><Eye size={16} /></button>
            <button className={commandClass} title="Editar" onClick={() => setEdit(data.contracts.find(x => x.id === c.contratoId))}><Edit2 size={16} /></button>
            <button disabled={busy} className={commandClass} title={c.arquivado ? 'Restaurar' : 'Arquivar'} onClick={() => change(c.contratoId, c.arquivado ? 'restore' : 'archive')}>{c.arquivado ? <ArchiveRestore size={16} /> : <Archive size={16} />}</button>
            <button disabled={busy} className={commandClass + ' text-red-600'} title="Excluir sem histórico" onClick={() => change(c.contratoId, 'delete')}><Trash2 size={16} /></button>
          </div>
        </article>)}
      </section>
    </>}
    {edit !== undefined && <ContratoForm safraId={safraId} editData={edit} onClose={() => setEdit(undefined)} onSuccess={data.refresh} />}
    {selected && <div className="fixed inset-0 z-[280] flex justify-end bg-black/40" onClick={() => setDetail('')}>
      <section role="dialog" aria-modal="true" aria-label="Detalhes do contrato" onClick={e => e.stopPropagation()} className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4"><h2 className="break-words text-xl font-bold">{selected.nome}</h2><button onClick={() => setDetail('')} title="Fechar"><X /></button></div>
        <dl className="my-6 grid grid-cols-2 gap-4 text-sm">
          {Object.entries({ Tipo: TIPO_CONTRATO_LABELS[selected.tipoContrato], Volume: num(selected.volumeContratado) + ' sc', 'Entregue / alocado': num(selected.volumeEntregue) + ' sc', 'Bruto venda': money(selected.brutoContratado), 'Descontos': money(selected.descontosContratados), 'Recebido': money(selected.recebimentosRecebidos), 'Valor da troca': money(selected.barterValorInsumos), 'Obrigação de arrendamento': money(selected.arrendamentoValor || 0), 'Pagamento arrendamento': selected.arrendamentoPagoEm || 'Não confirmado' }).map(([k,v]) => <div key={k}><dt className="text-slate-500">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>)}
        </dl>
        <h3 className="font-semibold">Parcelas</h3>
        {selected.recebiveis.map(p => <p key={p.id} className="border-b py-3 text-sm dark:border-slate-700">{p.data_vencimento.split('-').reverse().join('/')} · {money(p.valor_previsto)} · {p.status}</p>)}
        {!selected.recebiveis.length && <p className="my-3 text-sm text-slate-500">Nenhuma parcela registrada.</p>}
        <div className="mt-6 flex flex-wrap gap-3"><Link className={commandClass} href={`/${safraId}/financeiro`}>Financeiro</Link><Link className={commandClass} href={`/${safraId}/saldos`}>Alocações em Saldos</Link></div>
      </section>
    </div>}
  </ManagementShell>;
}
