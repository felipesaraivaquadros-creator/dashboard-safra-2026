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
    <section className="bg-slate-900 dark:bg-purple-950 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group print:bg-white print:text-slate-900 print:shadow-none print:border print:border-slate-300 print:break-inside-avoid print:rounded-none print:p-6 print:mt-8">
      <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 print:hidden">
        <Wallet size={180} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-8 print:mb-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md print:hidden"><Wallet size={32} /></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300 print:text-slate-500">Resumo Financeiro</p>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter print:text-slate-900">Saldo Líquido do Motorista</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start print:grid-cols-3 print:gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-white/50 flex items-center gap-2 print:text-slate-500"><TrendingUp size={12} className="text-green-400"/> Total Fretes (+)</p>
            <p className="text-2xl font-black print:text-slate-900">R$ {totaisFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          
          <div className="text-white/30 hidden md:block print:hidden pt-4"><ArrowRight size={24}/></div>

          <div className="space-y-4 print:space-y-2">
            {totalAdiantamentos > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/50 flex items-center gap-2 print:text-slate-500"><TrendingDown size={12} className="text-orange-400"/> Adiantamentos (-)</p>
                <p className="text-xl font-bold text-orange-200 print:text-orange-600">R$ {totalAdiantamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
            {totalAbastecimentos > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-white/50 flex items-center gap-2 print:text-slate-500"><TrendingDown size={12} className="text-red-400"/> Abastecimentos (-)</p>
                <p className="text-xl font-bold text-red-200 print:text-red-600">R$ {totalAbastecimentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>

          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 md:col-span-1 print:bg-slate-50 print:border-slate-300 print:rounded-xl print:p-4">
            <p className="text-[10px] font-black uppercase text-purple-300 mb-1 print:text-slate-500">Valor a Pagar</p>
            <p className={`text-4xl font-black tracking-tighter ${saldoFinal >= 0 ? 'text-green-400 print:text-green-600' : 'text-red-400 print:text-red-600'}`}>
              R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center print:border-slate-200 print:mt-2 print:pt-2">
              <span className="text-[9px] font-bold uppercase text-white/40 italic print:text-slate-400">* Sujeito a conferência final</span>
              <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${saldoFinal >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {saldoFinal >= 0 ? 'Credor' : 'Devedor'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}