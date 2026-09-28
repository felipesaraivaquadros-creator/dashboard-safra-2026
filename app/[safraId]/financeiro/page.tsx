"use client";

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  CircleDollarSign,
  Edit2,
  FileWarning,
  LayoutDashboard,
  Loader2,
  ReceiptText,
  Search,
  WalletCards,
} from 'lucide-react';
import ContratoForm from '../../../src/components/saldos/ContratoForm';
import FinanceiroChart from '../../../src/components/financeiro/FinanceiroChart';
import FinanceiroStatusBadge from '../../../src/components/financeiro/FinanceiroStatusBadge';
import RecebimentosChart from '../../../src/components/financeiro/RecebimentosChart';
import RecebimentosModal from '../../../src/components/financeiro/RecebimentosModal';
import NavigationMenu from '../../../src/components/NavigationMenu';
import SafraSelector from '../../../src/components/SafraSelector';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import {
  ContratoFinanceiroResumo,
  StatusEntregaBarter,
  StatusFinanceiro,
  STATUS_ENTREGA_BARTER_LABELS,
  TIPO_CONTRATO_LABELS,
  TIPOS_DESCONTO,
} from '../../../src/data/financeiroTypes';
import { getSafraConfig } from '../../../src/data/safraConfig';
import { buildMonthlyFinancials, getMonthKey, roundMoney } from '../../../src/lib/financeiroCalculations';
import { useFinanceiroData } from '../../../src/lib/useFinanceiroData';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const number = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

type StatusFilter = StatusFinanceiro | 'todos' | 'pendentes';
type FinanceView = 'consolidado' | 'vendas' | 'barter' | 'recebimentos';
type BarterStatusFilter = StatusEntregaBarter | 'todos';

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'pendentes', label: 'Todos os pendentes' },
  { value: 'nao_configurado', label: 'Não configurado' },
  { value: 'preco_pendente', label: 'Preço pendente' },
  { value: 'tributos_pendentes', label: 'Tributos pendentes' },
  { value: 'competencia_pendente', label: 'Competência pendente' },
  { value: 'inconsistente', label: 'Inconsistente' },
  { value: 'completo', label: 'Completo' },
];

const viewOptions: Array<{ value: FinanceView; label: string; icon: typeof LayoutDashboard }> = [
  { value: 'consolidado', label: 'Consolidado', icon: LayoutDashboard },
  { value: 'vendas', label: 'Vendas', icon: CircleDollarSign },
  { value: 'barter', label: 'Trocas / Barter', icon: ArrowLeftRight },
  { value: 'recebimentos', label: 'Recebimentos', icon: ReceiptText },
];

const barterStatusClasses: Record<StatusEntregaBarter, string> = {
  nao_iniciada: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  parcial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  entregue: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  cumprido: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  vencida: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const sum = (items: ContratoFinanceiroResumo[], key: keyof ContratoFinanceiroResumo) => roundMoney(
  items.reduce((total, item) => total + Number(item[key] || 0), 0),
);

export default function FinanceiroPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);
  const {
    loading,
    schemaReady,
    receiptsReady,
    classificationReady,
    barterReady,
    fulfillmentReady,
    summaries,
    deliveries,
    receiptsMonthly,
    totals,
    refresh,
  } = useFinanceiroData(safraId);
  const [view, setView] = useState<FinanceView>('consolidado');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [barterStatus, setBarterStatus] = useState<BarterStatusFilter>('todos');
  const [month, setMonth] = useState('todos');
  const [editingContract, setEditingContract] = useState<ContratoFinanceiroResumo | null>(null);
  const [receivingContractId, setReceivingContractId] = useState<string | null>(null);
  const contractsSectionRef = useRef<HTMLElement>(null);

  const salesSummaries = useMemo(() => summaries.filter((item) => (
    item.tipoContrato === 'venda'
    || item.tipoContrato === 'misto'
    || item.tipoContrato === 'outro'
    || item.tipoContrato === 'nao_classificado'
  )), [summaries]);
  const barterSummaries = useMemo(() => summaries.filter((item) => (
    item.tipoContrato === 'barter' || item.tipoContrato === 'misto'
  )), [summaries]);
  const activeSummaries = useMemo(() => {
    if (view === 'vendas' || view === 'recebimentos') return salesSummaries;
    if (view === 'barter') return barterSummaries;
    return summaries;
  }, [view, summaries, salesSummaries, barterSummaries]);
  const months = useMemo(() => Array.from(new Set(
    activeSummaries.map((item) => getMonthKey(item.competencia)).filter(Boolean),
  )).sort(), [activeSummaries]);

  const filtered = useMemo(() => activeSummaries.filter((item) => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    const matchesSearch = !term
      || item.nome.toLocaleLowerCase('pt-BR').includes(term)
      || item.numero.toLocaleLowerCase('pt-BR').includes(term)
      || String(item.barter?.fornecedor || '').toLocaleLowerCase('pt-BR').includes(term);
    if (!matchesSearch) return false;
    if (view === 'barter') return barterStatus === 'todos' || item.barterStatusEntrega === barterStatus;
    const matchesStatus = status === 'todos'
      || (status === 'pendentes' ? item.status !== 'completo' : item.status === status);
    const matchesMonth = month === 'todos' || getMonthKey(item.competencia) === month;
    return matchesStatus && matchesMonth;
  }), [activeSummaries, search, status, month, view, barterStatus]);

  const filteredMonthly = useMemo(() => buildMonthlyFinancials(filtered, deliveries), [filtered, deliveries]);
  const receivingContract = summaries.find((item) => item.contratoId === receivingContractId) || null;
  const salesTotals = useMemo(() => ({
    brutoContratado: sum(salesSummaries, 'brutoContratado'),
    brutoRealizado: sum(salesSummaries, 'brutoRealizado'),
    descontosContratados: sum(salesSummaries, 'descontosContratados'),
    liquidoContratado: sum(salesSummaries, 'liquidoContratado'),
    incompletos: salesSummaries.filter((item) => item.status !== 'completo').length,
  }), [salesSummaries]);

  const handleViewContracts = () => {
    setView('consolidado');
    setSearch('');
    setStatus('todos');
    setBarterStatus('todos');
    setMonth('todos');
    requestAnimationFrame(() => contractsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  if (loading) {
    return <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="mb-4 animate-spin text-purple-600" size={36} /><p className="text-xs font-black uppercase text-slate-400">Carregando financeiro...</p></div>;
  }

  const showSales = view === 'consolidado' || view === 'vendas';
  const showBarter = view === 'consolidado' || view === 'barter';
  const showReceipts = view === 'recebimentos';

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-slate-900 dark:text-slate-100 md:p-8">
      <header className="mx-auto mb-6 flex max-w-[1400px] flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><NavigationMenu /><div><h1 className="truncate text-xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white md:text-3xl">Financeiro</h1><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Vendas, trocas, recebimentos e obrigações da safra</p></div></div><SafraSelector currentSafra={safraConfig} /></div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700 md:border-0 md:pt-0"><Link href={`/${safraId}/saldos`} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-[10px] font-black uppercase text-white hover:bg-purple-700"><WalletCards size={14} /> Saldos</Link><Link href={`/${safraId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><ArrowLeft size={14} /> Painel</Link><ThemeToggle /></div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6">
        <nav className="flex overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800" aria-label="Visões financeiras">
          {viewOptions.map((option) => { const Icon = option.icon; return <button key={option.value} type="button" onClick={() => setView(option.value)} className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-[10px] font-black uppercase transition-colors ${view === option.value ? 'bg-green-700 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}><Icon size={15} /> {option.label}</button>; })}
        </nav>

        {!schemaReady && <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"><AlertTriangle size={20} className="mt-0.5 shrink-0" /><div><p className="text-sm font-black uppercase">Módulo financeiro aguardando banco</p><p className="mt-1 text-xs font-bold">Execute `docs/supabase_contratos_financeiros.sql`. Contratos e saldos continuam funcionando normalmente.</p></div></div>}
        {!classificationReady && <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"><ArrowLeftRight size={20} className="mt-0.5 shrink-0" /><div><p className="text-sm font-black uppercase">Tipos e barter aguardando banco</p><p className="mt-1 text-xs font-bold">Execute `docs/supabase_tipos_contratos_barter.sql`. Até lá, todos os contratos continuam no fluxo anterior.</p></div></div>}
        {classificationReady && !barterReady && <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"><AlertTriangle size={20} className="mt-0.5 shrink-0" /><p className="text-xs font-bold">A classificação existe, mas as tabelas de barter ainda não estão disponíveis. Execute novamente a migration de tipos e barter.</p></div>}
        {!fulfillmentReady && <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"><AlertTriangle size={20} className="mt-0.5 shrink-0" /><div><p className="text-sm font-black uppercase">Cumprimento por alocação aguardando banco</p><p className="mt-1 text-xs font-bold">Execute `docs/supabase_cumprimento_por_alocacao.sql` para que os contratos alocados em Saldos apareçam como cumpridos.</p></div></div>}
        {schemaReady && !receiptsReady && showReceipts && <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"><AlertTriangle size={20} className="mt-0.5 shrink-0" /><p className="text-xs font-bold">Execute `docs/supabase_recebimentos_contratos.sql` para habilitar parcelas e baixas.</p></div>}
        {classificationReady && totals.contratosNaoClassificados > 0 && <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-amber-800 dark:text-amber-300"><FileWarning size={18} /><p className="text-xs font-black uppercase">{totals.contratosNaoClassificados} contrato(s) antigos aguardam classificação manual</p></div><button type="button" onClick={handleViewContracts} className="text-[10px] font-black uppercase text-amber-800 underline dark:text-amber-300">Ver contratos</button></div>}
        {showSales && salesTotals.incompletos > 0 && schemaReady && <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-amber-800 dark:text-amber-300"><FileWarning size={18} /><p className="text-xs font-black uppercase">{salesTotals.incompletos} contrato(s) precisam de complementação financeira</p></div><button type="button" onClick={handleViewContracts} className="text-[10px] font-black uppercase text-amber-800 underline dark:text-amber-300">Ver contratos</button></div>}

        {showSales && (
          <>
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                { label: 'Bruto contratado', value: salesTotals.brutoContratado, icon: CircleDollarSign, color: 'text-slate-700 dark:text-slate-200' },
                { label: 'Bruto realizado', value: salesTotals.brutoRealizado, icon: ReceiptText, color: 'text-purple-600' },
                { label: 'Descontos previstos', value: salesTotals.descontosContratados, icon: FileWarning, color: 'text-amber-700 dark:text-amber-300' },
                { label: 'Líquido a receber', value: salesTotals.liquidoContratado, icon: WalletCards, color: 'text-green-700 dark:text-green-300' },
              ].map((item) => { const Icon = item.icon; return <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center gap-2 text-slate-400"><Icon size={16} /><p className="text-[9px] font-black uppercase">{item.label}</p></div><p className={`mt-3 text-xl font-black ${item.color}`}>{currency(item.value)}</p></article>; })}
              <article className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"><div className="flex items-center gap-2 text-amber-700 dark:text-amber-300"><AlertTriangle size={16} /><p className="text-[9px] font-black uppercase">Incompletos</p></div><p className="mt-3 text-xl font-black text-amber-800 dark:text-amber-200">{salesTotals.incompletos}</p></article>
            </section>
            {view === 'vendas' && <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"><div className="mb-4"><h2 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Descontos por tipo</h2><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Valores previstos, sem interferência dos filtros</p></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{TIPOS_DESCONTO.map((type) => <div key={type} className="border-l-4 border-amber-500 pl-3"><p className="text-[9px] font-black uppercase text-slate-400">{type}</p><p className="mt-1 text-sm font-black text-slate-700 dark:text-slate-200">{currency(roundMoney(salesSummaries.reduce((total, item) => total + item.descontosPorTipo[type], 0)))}</p></div>)}</div></section>}
          </>
        )}

        {showBarter && classificationReady && (
          <section className="space-y-4">
            <div><h2 className="flex items-center gap-2 text-xs font-black uppercase text-slate-700 dark:text-slate-200"><ArrowLeftRight size={17} className="text-green-600" /> Posição de trocas / barter</h2><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Obrigações físicas confirmadas por romaneios ou pela alocação em Saldos</p></div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
              {[
                ['Contratado', `${number(totals.barterVolumeContratado)} sc`],
                ['Cumprido / entregue', `${number(totals.barterVolumeEntregue)} sc`],
                ['Saldo físico', `${number(totals.barterSaldoSacas)} sc`],
                ['Valor dos insumos', currency(totals.barterValorInsumos)],
                ['Equivalente entregue', currency(totals.barterValorEntregue)],
                ['Conciliações pendentes', String(totals.barterPendentes)],
              ].map(([label, value], index) => <article key={label} className={`rounded-lg border bg-white p-4 dark:bg-slate-800 ${index === 5 && totals.barterPendentes > 0 ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'}`}><p className="text-[8px] font-black uppercase text-slate-400">{label}</p><p className="mt-2 text-lg font-black text-slate-800 dark:text-white">{value}</p></article>)}
            </div>
          </section>
        )}

        {showReceipts && receiptsReady && (
          <>
            <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"><div className="mb-4"><h2 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Recebimentos da safra</h2><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Programação, baixas reais e saldos globais</p></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{[
              { label: 'Programado', value: totals.recebimentosProgramados, color: 'border-purple-500 text-purple-700 dark:text-purple-300' },
              { label: 'Recebido', value: totals.recebimentosRecebidos, color: 'border-green-500 text-green-700 dark:text-green-300' },
              { label: 'Em aberto', value: totals.recebimentosEmAberto, color: 'border-amber-500 text-amber-700 dark:text-amber-300' },
              { label: 'Vencido', value: totals.recebimentosVencidos, color: 'border-red-500 text-red-700 dark:text-red-300' },
              { label: 'A programar', value: totals.recebimentosAProgramar, color: 'border-slate-400 text-slate-700 dark:text-slate-300' },
              { label: 'Excesso programado', value: totals.recebimentosExcedentes, color: 'border-red-300 text-red-600 dark:text-red-300' },
            ].map((item) => <div key={item.label} className={`border-l-4 pl-3 ${item.color}`}><p className="text-[8px] font-black uppercase text-slate-400">{item.label}</p><p className="mt-1 text-sm font-black">{currency(item.value)}</p></div>)}</div></section>
            <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 md:p-6"><div className="mb-5"><h2 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Fluxo de recebimentos por mês</h2><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Previsto pelo vencimento e recebido pela data da baixa</p></div><RecebimentosChart data={receiptsMonthly} /></section>
          </>
        )}

        {view === 'vendas' && <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 md:p-6"><div className="mb-5"><h2 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Financeiro realizado por mês</h2><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Calculado pela data dos romaneios vinculados aos contratos</p></div><FinanceiroChart data={filteredMonthly} /></section>}

        <section ref={contractsSectionRef} className="scroll-mt-4 space-y-4">
          <div className={`grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 ${view === 'barter' ? 'md:grid-cols-[minmax(0,1fr)_220px]' : 'md:grid-cols-[minmax(0,1fr)_220px_200px]'}`}>
            <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" placeholder={view === 'barter' ? 'Buscar contrato, número ou fornecedor' : 'Buscar contrato ou número'} /></label>
            {view === 'barter' ? <select value={barterStatus} onChange={(event) => setBarterStatus(event.target.value as BarterStatusFilter)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"><option value="todos">Todas as entregas</option>{Object.entries(STATUS_ENTREGA_BARTER_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : <><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><select value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"><option value="todos">Todas as competências</option>{months.map((item) => <option key={item} value={item}>{item.split('-').reverse().join('/')}</option>)}</select></>}
          </div>

          {view === 'barter' ? (
            <>
              <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 md:block"><table className="w-full min-w-[1180px] text-left"><thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-black uppercase text-slate-400 dark:border-slate-700 dark:bg-slate-900/40"><tr><th className="px-4 py-3">Contrato</th><th className="px-4 py-3">Fornecedor</th><th className="px-4 py-3">Cumprimento</th><th className="px-4 py-3 text-right">Cumprido / contratado</th><th className="px-4 py-3 text-right">Saldo</th><th className="px-4 py-3 text-right">Insumos</th><th className="px-4 py-3 text-right">Preço implícito/sc</th><th className="px-4 py-3 text-right">Valor mercado</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-700">{filtered.map((item) => <tr key={item.contratoId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30"><td className="px-4 py-3"><p className="font-black uppercase text-slate-700 dark:text-slate-200">{item.nome}</p><p className="mt-0.5 text-[9px] font-bold text-slate-400">{item.numero || 'S/N'} · {TIPO_CONTRATO_LABELS[item.tipoContrato]}</p></td><td className="px-4 py-3 font-bold text-slate-500">{item.barter?.fornecedor || '—'}</td><td className="px-4 py-3"><span className={`rounded px-2 py-1 text-[9px] font-black uppercase ${barterStatusClasses[item.barterStatusEntrega]}`}>{STATUS_ENTREGA_BARTER_LABELS[item.barterStatusEntrega]}</span>{item.cumpridoPorAlocacao && <p className="mt-1 text-[8px] font-bold uppercase text-slate-400">Alocação em {item.cumprimento?.grupo || item.grupo || 'slot'}</p>}</td><td className="px-4 py-3 text-right font-bold">{number(item.volumeEntregue)} / {number(item.volumeContratado)} sc</td><td className="px-4 py-3 text-right font-black text-amber-700 dark:text-amber-300">{number(item.barterSaldoSacas)} sc</td><td className="px-4 py-3 text-right font-black">{currency(item.barterValorInsumos)}</td><td className="px-4 py-3 text-right font-black">{currency(item.barterPrecoImplicitoSaca)}</td><td className="px-4 py-3 text-right font-black text-green-700 dark:text-green-300">{item.barter?.preco_mercado_saca ? currency(item.barterValorMercado) : '—'}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => setEditingContract(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300" title="Editar contrato e troca"><Edit2 size={15} /></button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-xs font-bold uppercase text-slate-400">Nenhuma troca encontrada</td></tr>}</tbody></table></div>
              <div className="grid grid-cols-1 gap-3 md:hidden">{filtered.map((item) => <article key={item.contratoId} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase">{item.nome}</p><p className="mt-1 text-[9px] font-bold text-slate-400">{item.barter?.fornecedor || 'Fornecedor não informado'}</p></div><span className={`rounded px-2 py-1 text-[8px] font-black uppercase ${barterStatusClasses[item.barterStatusEntrega]}`}>{STATUS_ENTREGA_BARTER_LABELS[item.barterStatusEntrega]}</span></div><div className="mt-4 grid grid-cols-2 gap-3"><div><p className="text-[8px] font-black uppercase text-slate-400">Saldo físico</p><p className="mt-1 text-xs font-black">{number(item.barterSaldoSacas)} sc</p></div><div><p className="text-[8px] font-black uppercase text-slate-400">Valor insumos</p><p className="mt-1 text-xs font-black">{currency(item.barterValorInsumos)}</p></div></div><button type="button" onClick={() => setEditingContract(item)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2.5 text-[10px] font-black uppercase text-white"><Edit2 size={14} /> Editar troca</button></article>)}</div>
            </>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 md:block"><table className="w-full min-w-[1400px] text-left"><thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-black uppercase text-slate-400 dark:border-slate-700 dark:bg-slate-900/40"><tr><th className="px-4 py-3">Contrato</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Status financeiro</th><th className="px-4 py-3">Competência</th><th className="px-4 py-3 text-right">Entregue / contratado</th><th className="px-4 py-3 text-right">Preço/sc</th><th className="px-4 py-3 text-right">Bruto</th><th className="px-4 py-3 text-right">Líquido</th><th className="px-4 py-3 text-right">Recebido</th><th className="px-4 py-3 text-right">Em aberto</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-700">{filtered.map((item) => <tr key={item.contratoId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30"><td className="px-4 py-3"><p className="font-black uppercase text-slate-700 dark:text-slate-200">{item.nome}</p><p className="mt-0.5 text-[9px] font-bold text-slate-400">{item.numero || 'S/N'} {item.armazem ? `· ${item.armazem}` : ''}</p></td><td className="px-4 py-3"><span className="rounded bg-green-100 px-2 py-1 text-[9px] font-black uppercase text-green-700 dark:bg-green-900/30 dark:text-green-300">{TIPO_CONTRATO_LABELS[item.tipoContrato]}</span></td><td className="px-4 py-3">{item.tipoContrato === 'barter' ? <span className={`rounded px-2 py-1 text-[9px] font-black uppercase ${barterStatusClasses[item.barterStatusEntrega]}`}>{STATUS_ENTREGA_BARTER_LABELS[item.barterStatusEntrega]}</span> : <FinanceiroStatusBadge status={item.status} compact />}</td><td className="px-4 py-3 font-bold text-slate-500">{item.competencia ? getMonthKey(item.competencia).split('-').reverse().join('/') : '—'}</td><td className="px-4 py-3 text-right font-bold text-slate-500">{number(item.volumeEntregue)} / {number(item.volumeContratado)} sc</td><td className="px-4 py-3 text-right font-black">{item.precoSaca ? currency(item.precoSaca) : '—'}</td><td className="px-4 py-3 text-right font-black">{currency(item.brutoContratado)}</td><td className="px-4 py-3 text-right font-black text-green-700 dark:text-green-300">{currency(item.liquidoContratado)}</td><td className="px-4 py-3 text-right font-black text-green-700 dark:text-green-300">{currency(item.recebimentosRecebidos)}</td><td className="px-4 py-3 text-right font-black text-amber-700 dark:text-amber-300">{currency(item.recebimentosEmAberto)}</td><td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><button type="button" onClick={() => setReceivingContractId(item.contratoId)} disabled={!receiptsReady || !item.financeiro?.id || item.tipoContrato === 'barter'} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-35 dark:bg-green-900/30 dark:text-green-300" title={item.financeiro?.id ? 'Recebimentos e baixas' : 'Configure o financeiro primeiro'}><ReceiptText size={15} /></button><button type="button" onClick={() => setEditingContract(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300" title="Editar contrato"><Edit2 size={15} /></button></div></td></tr>)}{filtered.length === 0 && <tr><td colSpan={11} className="px-4 py-12 text-center text-xs font-bold uppercase text-slate-400">Nenhum contrato encontrado</td></tr>}</tbody></table></div>
              <div className="grid grid-cols-1 gap-3 md:hidden">{filtered.map((item) => <article key={item.contratoId} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase">{item.nome}</p><p className="mt-1 text-[9px] font-bold text-slate-400">{TIPO_CONTRATO_LABELS[item.tipoContrato]} · {item.numero || 'S/N'}</p></div>{item.tipoContrato === 'barter' ? <span className={`rounded px-2 py-1 text-[8px] font-black uppercase ${barterStatusClasses[item.barterStatusEntrega]}`}>{STATUS_ENTREGA_BARTER_LABELS[item.barterStatusEntrega]}</span> : <FinanceiroStatusBadge status={item.status} compact />}</div><div className="mt-4 grid grid-cols-2 gap-3 text-right"><div><p className="text-[8px] font-black uppercase text-slate-400">Líquido previsto</p><p className="mt-1 text-xs font-black">{currency(item.liquidoContratado)}</p></div><div><p className="text-[8px] font-black uppercase text-green-600">Recebido</p><p className="mt-1 text-xs font-black text-green-700 dark:text-green-300">{currency(item.recebimentosRecebidos)}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={() => setReceivingContractId(item.contratoId)} disabled={!receiptsReady || !item.financeiro?.id || item.tipoContrato === 'barter'} className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2.5 text-[10px] font-black uppercase text-white disabled:opacity-35"><ReceiptText size={14} /> Recebimentos</button><button type="button" onClick={() => setEditingContract(item)} className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2.5 text-[10px] font-black uppercase text-white"><Edit2 size={14} /> Editar</button></div></article>)}</div>
            </>
          )}
        </section>
      </div>

      {editingContract && <ContratoForm safraId={safraId} editData={{ id: editingContract.contratoId, nome: editingContract.nome, numero: editingContract.numero, volume_total: editingContract.volumeContratado, armazem_id: editingContract.armazemId, grupo: editingContract.grupo, tipo_contrato: editingContract.tipoContrato, forma_liquidacao: editingContract.formaLiquidacao, tipo_outro_descricao: editingContract.tipoOutroDescricao }} onClose={() => setEditingContract(null)} onSuccess={() => { refresh(); setEditingContract(null); }} />}
      {receivingContract && <RecebimentosModal summary={receivingContract} onClose={() => setReceivingContractId(null)} onSuccess={refresh} />}
    </main>
  );
}
