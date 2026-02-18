"use client";

import React from 'react';
import { Users, Printer } from 'lucide-react';

interface ConsolidadoItem {
  motorista: string;
  sacasBruto: number;
  valorTotal: number;
}

interface TabelaConsolidadaProps {
  lista: ConsolidadoItem[];
}

export default function TabelaConsolidada({ lista }: TabelaConsolidadaProps) {
  const totalGeralSacas = lista.reduce((sum, item) => sum + item.sacasBruto, 0);
  const totalGeralValor = lista.reduce((sum, item) => sum + item.valorTotal, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden print:shadow-none print:border-slate-300 print:rounded-none print:mb-8">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 print:bg-white print:p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg print:hidden"><Users size={20}/></div>
          <h2 className="text-lg font-black uppercase italic tracking-tighter">Relatório Consolidado por Motorista</h2>
        </div>
        <button onClick={() => window.print()} className="p-2 bg-white dark:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-all print:hidden shadow-sm border dark:border-slate-600"><Printer size={18} /></button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px] print:min-w-full">
          <thead>
            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
              <th className="px-6 py-4">Motorista</th>
              <th className="px-6 py-4 text-right">Sacas Bruto Total</th>
              <th className="px-6 py-4 text-right">Valor Frete Faturado</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold">
            {lista.map((item, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/30 dark:hover:bg-slate-700/20">
                <td className="px-6 py-4 uppercase text-slate-700 dark:text-slate-200">{item.motorista}</td>
                <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{item.sacasBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc</td>
                <td className="px-6 py-4 text-right font-black text-blue-600 dark:text-blue-400">R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-purple-50/50 dark:bg-purple-900/10 font-black text-purple-700 dark:text-purple-300">
              <td className="px-6 py-4 text-right uppercase text-[10px]">Total Geral</td>
              <td className="px-6 py-4 text-right">{totalGeralSacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc</td>
              <td className="px-6 py-4 text-right text-base">R$ {totalGeralValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}