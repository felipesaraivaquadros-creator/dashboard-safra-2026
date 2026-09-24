"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CircleDollarSign } from 'lucide-react';
import { useFinanceiroData } from '../../lib/useFinanceiroData';
import FinanceiroChart from './FinanceiroChart';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function FinanceiroResumoDashboard({ safraId }: { safraId: string }) {
  const { loading, schemaReady, summaries, monthly, totals } = useFinanceiroData(safraId);
  if (loading) return <div className="h-56 animate-pulse rounded-2xl bg-white dark:bg-slate-800" />;

  const configured = summaries.some((summary) => summary.financeiro);
  if (!schemaReady || !configured) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2 text-green-700 dark:bg-green-900/30 dark:text-green-300"><CircleDollarSign size={20} /></div>
          <div><h2 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Financeiro da Safra</h2><p className="mt-1 text-[10px] font-bold text-slate-400">Configure os contratos para visualizar bruto, descontos e líquido.</p></div>
        </div>
        <Link href={`/${safraId}/financeiro`} className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-[10px] font-black uppercase text-white hover:bg-purple-700">Abrir financeiro <ArrowRight size={14} /></Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="flex items-center gap-2 text-xs font-black uppercase text-slate-700 dark:text-slate-200"><CircleDollarSign size={17} className="text-green-600" /> Financeiro da Safra</h2><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Valores realizados pelas entregas vinculadas</p></div>
        <Link href={`/${safraId}/financeiro`} className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-purple-600 hover:text-purple-700">Ver detalhes <ArrowRight size={13} /></Link>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2">
        <div><p className="text-[8px] font-black uppercase text-slate-400">Bruto realizado</p><p className="mt-1 truncate text-xs font-black text-slate-800 dark:text-white">{currency(totals.brutoRealizado)}</p></div>
        <div><p className="text-[8px] font-black uppercase text-amber-600">Descontos</p><p className="mt-1 truncate text-xs font-black text-amber-700 dark:text-amber-300">{currency(totals.descontosRealizados)}</p></div>
        <div><p className="text-[8px] font-black uppercase text-green-600">Líquido realizado</p><p className="mt-1 truncate text-xs font-black text-green-700 dark:text-green-300">{currency(totals.liquidoRealizado)}</p></div>
      </div>
      <FinanceiroChart data={monthly.slice(-6)} compact />
    </section>
  );
}
