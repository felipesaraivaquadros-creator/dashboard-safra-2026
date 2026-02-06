"use client";

import React, { useMemo } from 'react';
import { calculateSaldoDashboard } from '../../src/utils/saldoProcessing';
import { ArrowLeft, Package, FileText, Scale, TrendingUp, Warehouse } from 'lucide-react';
import Link from 'next/link';

export default function SaldoPage() {
  const data = useMemo(() => calculateSaldoDashboard(), []);

  // Definição das cores solicitadas para rotação, incluindo suporte a dark mode
  const colors = [
    { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-900 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' }, // Amarelo
    { bg: 'bg-[#fdf8f6] dark:bg-amber-900/20', text: 'text-[#4a3728] dark:text-amber-300', border: 'border-[#e5d5c8] dark:border-amber-800' }, // Marrom
    { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-900 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },  // Verde
    { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-900 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' } // Roxo
  ];

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
      <header className="max-w-[1200px] mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Resumo de Saldos</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Safra 25/26 - Soja</p>
        </div>
        <Link href="/" className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
      </header>

      {/* SEÇÃO DE KPIS POR ARMAZÉM (ILDO ROMANCINI) */}
      <div className="max-w-[1200px] mx-auto mb-10">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Warehouse size={14} /> Entregas Ildo Romancini por Armazém
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {data.kpisArmazem.length > 0 ? (
            data.kpisArmazem.map((kpi, i) => {
              const color = colors[i % colors.length];
              return (
                <div key={i} className={`${color.bg} ${color.border} border-2 p-5 rounded-3xl shadow-sm transition-transform hover:scale-[1.02]`}>
                  <p className={`text-[10px] font-black uppercase truncate mb-2 opacity-70 ${color.text}`}>{kpi.nome}</p>
                  <h4 className={`text-xl font-black ${color.text}`}>
                    {kpi.total.toLocaleString('pt-BR')} <span className="text-xs font-bold opacity-60">sc</span>
                  </h4>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-10 text-center text-slate-400 text-[10px] font-bold uppercase italic border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
              Nenhuma carga encontrada para Ildo Romancini.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* CARD 1: ESTOQUE LÍQUIDO */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[320px]">
          <div className="flex justify-between items-start">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl dark:bg-blue-900/30 dark:text-blue-400">
              <Package size={32} />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Estoque Global</span>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase mb-1">Total Entregue (Líquido)</p>
            <h2 className="text-4xl font-black text-slate-800 dark:text-white">
              {data.estoqueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-lg text-slate-400 font-bold">sc</span>
            </h2>
          </div>
        </div>

        {/* CARD 2: LISTA DE CONTRATOS */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[320px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
              <FileText size={16} className="text-purple-500" /> Contratos Fixados
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar">
            {data.contratos.map((c, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] border-b border-slate-50 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-600 dark:text-slate-300 uppercase truncate w-2/3">{c.nome}</span>
                <span className="font-black text-slate-800 dark:text-white">{c.total.toLocaleString('pt-BR')} sc</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t-2 border-dashed border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs font-black text-slate-800 dark:text-white uppercase italic">Volume Fixo</span>
            <span className="text-xl font-black text-purple-600">{data.volumeFixoTotal.toLocaleString('pt-BR')} sc</span>
          </div>
        </div>

        {/* CARD 3: SALDO LÍQUIDO */}
        <div className="bg-green-100 dark:bg-green-900/30 p-8 rounded-[2.5rem] border border-green-200 dark:border-green-800 shadow-lg flex flex-col justify-between h-[320px] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-green-200/50 dark:text-green-900/50 rotate-12 transition-transform group-hover:scale-110">
            <TrendingUp size={180} />
          </div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="p-4 bg-green-200 text-green-700 rounded-2xl dark:bg-green-700 dark:text-white">
              <Scale size={32} />
            </div>
            <span className="text-[10px] font-black text-green-600/60 dark:text-green-400/60 uppercase tracking-widest italic">Disponível</span>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-black text-green-700 dark:text-green-300 uppercase mb-1">Saldo Líquido</p>
            <h2 className="text-5xl font-black text-green-900 dark:text-green-200 tracking-tighter">
              {data.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xl">sc</span>
            </h2>
            <p className="text-[10px] font-bold text-green-700/70 dark:text-green-400/70 uppercase mt-4 flex items-center gap-1 italic">
              * Estoque entregue menos fixados
            </p>
          </div>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b; /* slate-800 */
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569; /* slate-600 */
        }
      `}</style>
    </main>
  );
}