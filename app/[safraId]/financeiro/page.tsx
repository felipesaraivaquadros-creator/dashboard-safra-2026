"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CircleDollarSign,
  Edit2,
  FileWarning,
  Loader2,
  ReceiptText,
  Search,
  WalletCards,
} from 'lucide-react';
import ContratoForm from '../../../src/components/saldos/ContratoForm';
import FinanceiroChart from '../../../src/components/financeiro/FinanceiroChart';
import FinanceiroStatusBadge from '../../../src/components/financeiro/FinanceiroStatusBadge';
import NavigationMenu from '../../../src/components/NavigationMenu';
import SafraSelector from '../../../src/components/SafraSelector';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import { StatusFinanceiro, TIPOS_DESCONTO, TipoDesconto } from '../../../src/data/financeiroTypes';
import { getSafraConfig } from '../../../src/data/safraConfig';
import { buildMonthlyFinancials, getMonthKey, roundMoney } from '../../../src/lib/financeiroCalculations';
import { useFinanceiroData } from '../../../src/lib/useFinanceiroData';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const number = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

type StatusFilter = StatusFinanceiro | 'todos' | 'pendentes';

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

export default function FinanceiroPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);
  const { loading, schemaReady, summaries, deliveries, totals, refresh } = useFinanceiroData(safraId);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [month, setMonth] = useState('todos');
  const [editingContract, setEditingContract] = useState<any>(null);

  const months = useMemo(() => Array.from(new Set(
    summaries.map((item) => getMonthKey(item.competencia)).filter(Boolean),
  )).sort(), [summaries]);

  const filtered = useMemo(() => summaries.filter((item) => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    const matchesSearch = !term || item.nome.toLocaleLowerCase('pt-BR').includes(term) || item.numero.toLocaleLowerCase('pt-BR').includes(term);
    const matchesStatus = status === 'todos'
      || (status === 'pendentes' ? item.status !== 'completo' : item.status === status);
    const matchesMonth = month === 'todos' || getMonthKey(item.competencia) === month;
    return matchesSearch && matchesStatus && matchesMonth;
  }), [summaries, search, status, month]);

  const filteredMonthly = useMemo(
    () => buildMonthlyFinancials(filtered, deliveries),
    [filtered, deliveries],
  );

  const filteredTotals = useMemo(() => {
    const discountsByType = Object.fromEntries(TIPOS_DESCONTO.map((type) => [type, 0])) as Record<TipoDesconto, number>;
    filtered.forEach((item) => TIPOS_DESCONTO.forEach((type) => {
      discountsByType[type] = roundMoney(discountsByType[type] + item.descontosPorTipo[type]);
    }));
    return {
      bruto: roundMoney(filtered.reduce((total, item) => total + item.brutoContratado, 0)),
      brutoRealizado: roundMoney(filtered.reduce((total, item) => total + item.brutoRealizado, 0)),
      descontos: roundMoney(filtered.reduce((total, item) => total + item.descontosContratados, 0)),
      liquido: roundMoney(filtered.reduce((total, item) => total + item.liquidoContratado, 0)),
      incompletos: filtered.filter((item) => item.status !== 'completo').length,
      discountsByType,
    };
  }, [filtered]);

  if (loading) {
    return <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="mb-4 animate-spin text-purple-600" size={36} /><p className="text-xs font-black uppercase text-slate-400">Carregando financeiro...</p></div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 dark:bg-slate-900 dark:text-slate-100 md:p-8">
      <header className="mx-auto mb-6 flex max-w-[1400px] flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><NavigationMenu /><div><h1 className="truncate text-xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white md:text-3xl">Financeiro</h1><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Contratos, tributos e valores gerados</p></div></div>
          <SafraSelector currentSafra={safraConfig} />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-700 md:border-0 md:pt-0">
          <Link href={`/${safraId}/saldos`} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-[10px] font-black uppercase text-white hover:bg-purple-700"><WalletCards size={14} /> Saldos</Link>
          <Link href={`/${safraId}`} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><ArrowLeft size={14} /> Painel</Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] space-y-6">
        {!schemaReady && (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" /><div><p className="text-sm font-black uppercase">Módulo financeiro aguardando banco</p><p className="mt-1 text-xs font-bold">Execute `docs/supabase_contratos_financeiros.sql` no Supabase. Os contratos e saldos atuais continuam funcionando normalmente.</p></div>
          </div>
        )}

        {totals.incompletos > 0 && schemaReady && (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300"><FileWarning size={18} /><p className="text-xs font-black uppercase">{totals.incompletos} contrato(s) precisam de complementação financeira</p></div>
            <button type="button" onClick={() => setStatus('pendentes')} className="text-[10px] font-black uppercase text-amber-800 underline dark:text-amber-300">Ver contratos</button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Bruto contratado', value: filteredTotals.bruto, icon: CircleDollarSign, color: 'text-slate-700 dark:text-slate-200' },
            { label: 'Bruto realizado', value: filteredTotals.brutoRealizado, icon: ReceiptText, color: 'text-purple-600' },
            { label: 'Descontos previstos', value: filteredTotals.descontos, icon: FileWarning, color: 'text-amber-700 dark:text-amber-300' },
            { label: 'Líquido a receber', value: filteredTotals.liquido, icon: WalletCards, color: 'text-green-700 dark:text-green-300' },
          ].map((item) => {
            const Icon = item.icon;
            return <article key={item.label} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-center gap-2 text-slate-400"><Icon size={16} /><p className="text-[9px] font-black uppercase">{item.label}</p></div><p className={`mt-3 text-xl font-black tracking-tight ${item.color}`}>{currency(item.value)}</p></article>;
          })}
          <article className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20"><div className="flex items-center gap-2 text-amber-700 dark:text-amber-300"><AlertTriangle size={16} /><p className="text-[9px] font-black uppercase">Incompletos</p></div><p className="mt-3 text-xl font-black text-amber-800 dark:text-amber-200">{filteredTotals.incompletos}</p></article>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-4"><h2 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Descontos por tipo</h2><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Valores previstos nos contratos filtrados</p></div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {TIPOS_DESCONTO.map((type) => <div key={type} className="border-l-4 border-amber-500 pl-3"><p className="text-[9px] font-black uppercase text-slate-400">{type}</p><p className="mt-1 text-sm font-black text-slate-700 dark:text-slate-200">{currency(filteredTotals.discountsByType[type])}</p></div>)}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 md:p-6">
          <div className="mb-5"><h2 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Financeiro realizado por mês</h2><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Calculado pela data dos romaneios vinculados aos contratos</p></div>
          <FinanceiroChart data={filteredMonthly} />
        </section>

        <section className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-[minmax(0,1fr)_220px_200px]">
            <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" placeholder="Buscar contrato ou número" /></label>
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            <select value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"><option value="todos">Todas as competências</option>{months.map((item) => <option key={item} value={item}>{item.split('-').reverse().join('/')}</option>)}</select>
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 md:block">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50 text-[9px] font-black uppercase text-slate-400 dark:border-slate-700 dark:bg-slate-900/40"><tr><th className="px-4 py-3">Contrato</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Competência</th><th className="px-4 py-3 text-right">Entregue / contratado</th><th className="px-4 py-3 text-right">Preço/sc</th><th className="px-4 py-3 text-right">Bruto contratado</th><th className="px-4 py-3 text-right">Descontos previstos</th><th className="px-4 py-3 text-right">Líquido previsto</th><th className="px-4 py-3"></th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-700">
                {filtered.map((item) => <tr key={item.contratoId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30"><td className="px-4 py-3"><p className="font-black uppercase text-slate-700 dark:text-slate-200">{item.nome}</p><p className="mt-0.5 text-[9px] font-bold text-slate-400">{item.numero || 'S/N'} {item.armazem ? `· ${item.armazem}` : ''}</p></td><td className="px-4 py-3"><FinanceiroStatusBadge status={item.status} compact /></td><td className="px-4 py-3 font-bold text-slate-500">{item.competencia ? getMonthKey(item.competencia).split('-').reverse().join('/') : '—'}</td><td className="px-4 py-3 text-right font-bold text-slate-500">{number(item.volumeEntregue)} / {number(item.volumeContratado)} sc</td><td className="px-4 py-3 text-right font-black">{item.precoSaca ? currency(item.precoSaca) : '—'}</td><td className="px-4 py-3 text-right font-black">{currency(item.brutoContratado)}</td><td className="px-4 py-3 text-right font-black text-amber-700 dark:text-amber-300">{currency(item.descontosContratados)}</td><td className="px-4 py-3 text-right font-black text-green-700 dark:text-green-300">{currency(item.liquidoContratado)}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => setEditingContract(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300" title="Editar contrato e financeiro"><Edit2 size={15} /></button></td></tr>)}
                {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-12 text-center text-xs font-bold uppercase text-slate-400">Nenhum contrato encontrado</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((item) => <article key={item.contratoId} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">{item.nome}</p><p className="mt-1 text-[9px] font-bold text-slate-400">{item.numero || 'S/N'} {item.competencia ? `· ${getMonthKey(item.competencia).split('-').reverse().join('/')}` : ''}</p></div><FinanceiroStatusBadge status={item.status} compact /></div><div className="mt-4 grid grid-cols-2 gap-3 text-right"><div><p className="text-[8px] font-black uppercase text-slate-400">Bruto contratado</p><p className="mt-1 text-xs font-black">{currency(item.brutoContratado)}</p></div><div><p className="text-[8px] font-black uppercase text-green-600">Líquido previsto</p><p className="mt-1 text-xs font-black text-green-700 dark:text-green-300">{currency(item.liquidoContratado)}</p></div></div><button type="button" onClick={() => setEditingContract(item)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-3 py-2.5 text-[10px] font-black uppercase text-white"><Edit2 size={14} /> Editar financeiro</button></article>)}
          </div>
        </section>
      </div>

      {editingContract && (
        <ContratoForm
          safraId={safraId}
          editData={{
            id: editingContract.contratoId,
            nome: editingContract.nome,
            numero: editingContract.numero,
            volume_total: editingContract.volumeContratado,
            armazem_id: editingContract.armazemId,
            grupo: editingContract.grupo,
          }}
          onClose={() => setEditingContract(null)}
          onSuccess={() => { refresh(); setEditingContract(null); }}
        />
      )}
    </main>
  );
}
