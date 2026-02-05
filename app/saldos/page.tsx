"use client";

import React, { useMemo } from 'react';
import { calculateSaldoDashboard } from '../../src/utils/saldoProcessing';
import { ArrowLeft, Package, FileText, Scale, TrendingUp, Warehouse } from 'lucide-react';
import Link from 'next/link';

export default function SaldoPage() {
  const data = useMemo(() => calculateSaldoDashboard(), []);

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 font-sans text-slate-900">
      <header className="max-w-[1200px] mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Resumo de Saldos</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Safra 25/26 - Soja</p>
        </div>
        <Link href="/" className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all shadow-sm">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
      </header>

      {/* SEÇÃO DE KPIS POR ARMAZÉM (ILDO ROMANCINI) */}
      <div className="max-w-[1200px] mx-auto mb-10">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <Warehouse size={14} /> Entregas Ildo Romancini por Armazém
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {data.kpisArmazem.length > 0 ? (
            data.kpisArmazem.map((kpi, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase truncate mb-1">{kpi.nome}</p>
                <h4 className="text-sm font-black text-slate-800">
                  {kpi.total.toLocaleString('pt-BR')} <span className="text-[10px] text-slate-400 font-bold">sc</span>
                </h4>
              </div>
            ))
          ) : (
            <div className="col-span-full py-6 text-center text-slate-400 text-[10px] font-bold uppercase italic border-2 border-dashed border-slate-200 rounded-2xl">
              Nenhuma entrega encontrada para Ildo Romancini nos dados atuais.
            </div>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* CARD 1: ESTOQUE LÍQUIDO */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-between h-[300px]">
          <div className="flex justify-between items-start">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
              <Package size={32} />
            </div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Estoque Atual</span>
          </div>
          <div>
            <p className="text-xs font-black text-slate-400 uppercase mb-1">Estoque Líquido Total</p>
            <h2 className="text-4xl font-black text-slate-800">
              {data.estoqueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-lg text-slate-400">sc</span>
            </h2>
          </div>
        </div>

        {/* CARD 2: LISTA DE CONTRATOS */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2">
              <FileText size={16} className="text-purple-500" /> Contratos Fixados
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-4 custom-scrollbar">
            {data.contratos.map((c, i) => (
              <div key={i} className="flex justify-between items-center text-[11px] border-b border-slate-50 pb-2">
                <span className="font-bold text-slate-600 uppercase truncate w-2/3">{c.nome}</span>
                <span className="font-black text-slate-800">{c.total.toLocaleString('pt-BR')} sc</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t-2 border-dashed border-slate-100 flex justify-between items-center">
            <span className="text-xs font-black text-slate-800 uppercase italic">Volume Fixo Total</span>
            <span className="text-xl font-black text-purple-600">{data.volumeFixoTotal.toLocaleString('pt-BR')} sc</span>
          </div>
        </div>

        {/* CARD 3: SALDO LÍQUIDO */}
        <div className="bg-green-100 p-8 rounded-[2rem] border border-green-200 shadow-md flex flex-col justify-between h-[300px] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-green-200/50 rotate-12 transition-transform group-hover:scale-110">
            <TrendingUp size={160} />
          </div>
          
          <div className="flex justify-between items-start relative z-10">
            <div className="p-4 bg-green-200 text-green-700 rounded-2xl">
              <Scale size={32} />
            </div>
            <span className="text-[10px] font-black text-green-600/60 uppercase tracking-widest">Saldo de Safra</span>
          </div>

          <div className="relative z-10">
            <p className="text-xs font-black text-green-700 uppercase mb-1">Saldo Líquido</p>
            <h2 className="text-5xl font-black text-green-900 tracking-tighter">
              {data.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xl">sc</span>
            </h2>
            <p className="text-[10px] font-bold text-green-700/70 uppercase mt-4 flex items-center gap-1 italic">
              * Estoque entregue menos contratos fixos
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
      `}</style>
    </main>
  );
}