"use client";

import React from 'react';
import { Wallet, TrendingUp, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';

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
  const isCredor = saldoFinal >= 0;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden print:shadow-none print:border-t-2 print:border-b-2 print:border-slate-900 print:rounded-none print:mt-10">
      <div className="p-6 md:p-8">
        <div className="flex items-center gap-3 mb-8 print:mb-6">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl print:hidden">
            <Wallet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white">Resumo Financeiro</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fechamento Consolidado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          
          {/* Coluna 1: Ganhos */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col print:bg-white print:border-none print:p-0">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-[10px] font-black uppercase text-slate-400">Total Bruto de Fretes</span>
            </div>
            <div className="mt-auto">
              <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                R$ {totaisFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Coluna 2: Descontos Totais */}
          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col print:bg-white print:border-none print:p-0">
            <div className="flex items-center gap-2 mb-6">
              <TrendingDown size={16} className="text-red-500" />
              <span className="text-[10px] font-black uppercase text-slate-400">Total de Descontos</span>
            </div>
            <div className="mt-auto">
              <p className="text-2xl md:text-3xl font-black text-red-600 dark:text-red-400 tracking-tighter">
                R$ {(totalAdiantamentos + totalAbastecimentos).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex gap-3 text-[9px] font-bold text-slate-400 uppercase">
                <span>Adiant: R$ {totalAdiantamentos.toLocaleString('pt-BR')}</span>
                <span>Diesel: R$ {totalAbastecimentos.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Coluna 3: Saldo Final (Destaque) */}
          <div className={`p-6 rounded-2xl border-2 flex flex-col shadow-sm print:bg-white print:border-none print:p-0 ${isCredor ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30' : 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900/30'}`}>
            <div className="flex justify-between items-start mb-6">
              <span className={`text-[10px] font-black uppercase ${isCredor ? 'text-green-600' : 'text-red-600'}`}>Valor Líquido a Pagar</span>
              {isCredor ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertCircle size={16} className="text-red-500" />}
            </div>
            <div className="mt-auto">
              <p className={`text-3xl md:text-4xl font-black tracking-tighter ${isCredor ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isCredor ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {isCredor ? 'SALDO CREDOR' : 'SALDO DEVEDOR'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Rodapé do Card (Apenas tela) */}
      <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center print:hidden">
        <p className="text-[10px] font-medium text-slate-400 italic">
          * Este resumo considera o arredondamento de sacas conforme configurado nos filtros.
        </p>
        <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-black text-[10px] uppercase">
          Conferido <CheckCircle2 size={14} />
        </div>
      </div>
    </section>
  );
}