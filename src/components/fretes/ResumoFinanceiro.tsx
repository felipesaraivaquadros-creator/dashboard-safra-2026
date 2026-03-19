"use client";

import React from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

interface ResumoFinanceiroProps {
  totaisFrete: number;
  totalAdiantamentos: number;
  totalAbastecimentos: number;
  saldoFinal: number;
}

export default function ResumoFinanceiro({
  totaisFrete,
  totalAdiantamentos,
  totalAbastecimentos,
  saldoFinal
}: ResumoFinanceiroProps) {
  return (
    <section className="bg-slate-900 dark:bg-purple-950 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group print:bg-white print:text-black print:shadow-none print:border-2 print:border-black print:rounded-none print:p-8 print:mt-10 print:block">
      <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 print:hidden">
        <Wallet size={180} />
      </div>
      
      <div className="relative z-10 print:text-black">
        <div className="flex items-center gap-3 mb-8 print:mb-6">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md print:hidden"><Wallet size={32} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300 print:text-black print:tracking-normal print:font-bold">Resumo Financeiro</p>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter print:text-black print:not-italic print:text-3xl">Fechamento de Saldo</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start print:flex print:flex-col print:gap-4">
          {/* Ganhos - Este já funcionava porque não tinha cor fixa na tag P */}
          <div className="space-y-1 print:flex print:justify-between print:items-center print:border-b print:border-slate-200 print:pb-2">
            <p className="text-[10px] font-black uppercase opacity-50 flex items-center gap-2 print:text-black print:text-xs print:opacity-100">
              <TrendingUp size={12} className="text-green-400 print:text-black"/> Total Fretes (+)
            </p>
            <p className="text-2xl font-black print:text-xl print:text-black">R$ {totaisFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          
          <div className="text-white/30 hidden md:block print:hidden pt-4"><ArrowRight size={24}/></div>

          {/* Descontos */}
          <div className="space-y-4 print:w-full print:space-y-2">
            {totalAdiantamentos > 0 && (
              <div className="space-y-1 print:flex print:justify-between print:items-center print:border-b print:border-slate-200 print:pb-2">
                <p className="text-[10px] font-black uppercase opacity-50 flex items-center gap-2 print:text-black print:text-xs print:opacity-100">
                  <TrendingDown size={12} className="text-orange-400 print:text-black"/> Adiantamentos (-)
                </p>
                <p className="text-xl font-bold print:text-lg print:text-black">R$ {totalAdiantamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
            {totalAbastecimentos > 0 && (
              <div className="space-y-1 print:flex print:justify-between print:items-center print:border-b print:border-slate-200 print:pb-2">
                <p className="text-[10px] font-black uppercase opacity-50 flex items-center gap-2 print:text-black print:text-xs print:opacity-100">
                  <TrendingDown size={12} className="text-red-400 print:text-black"/> Abastecimentos (-)
                </p>
                <p className="text-xl font-bold print:text-lg print:text-black">R$ {totalAbastecimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>

          {/* Resultado Final - CORRIGIDO: Removido text-white e text-purple-300 das tags internas */}
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 md:col-span-1 print:bg-slate-50 print:border-2 print:border-black print:rounded-none print:p-6 print:mt-4 print:w-full print:block">
            <p className="text-[10px] font-black uppercase mb-1 opacity-70 print:text-black print:text-sm print:font-black print:opacity-100">Valor Líquido a Pagar</p>
            <p className="text-4xl font-black tracking-tighter print:text-black print:text-5xl print:my-2">
              R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center print:border-black print:mt-4 print:pt-4">
              <span className="text-[9px] font-bold uppercase opacity-50 italic print:text-black print:not-italic print:text-xs print:font-bold print:opacity-100">Saldo final para acerto</span>
              <div className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-white/20 print:bg-black print:text-white print:text-xs print:px-3 print:py-1">
                {saldoFinal >= 0 ? 'Credor' : 'Devedor'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}