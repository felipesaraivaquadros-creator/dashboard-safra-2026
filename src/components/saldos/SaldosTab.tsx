"use client";

import React from 'react';
import { Warehouse } from 'lucide-react';
import { SaldoKpi } from '../../data/saldoTypes';

interface SaldosTabProps {
  lista: SaldoKpi[];
  totalSacas: number;
  totalKg: number;
}

export default function SaldosTab({ lista, totalSacas, totalKg }: SaldosTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Warehouse size={20}/></div>
          <h2 className="text-sm font-black uppercase italic tracking-tighter">Estoque Físico por Armazém</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
                <th className="px-6 py-4">Armazém</th>
                <th className="px-6 py-4 text-right">Volume (KG)</th>
                <th className="px-6 py-4 text-right">Volume (Sacas)</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold">
              {lista.map((item, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/30 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 uppercase text-slate-700 dark:text-slate-200">{item.nome}</td>
                  <td className="px-6 py-4 text-right text-slate-400">{(item.totalKg || item.total * 60).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</td>
                  <td className="px-6 py-4 text-right font-black text-blue-600 dark:text-blue-400">{item.total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sc</td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic uppercase text-[10px]">Nenhum saldo encontrado</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-blue-50/50 dark:bg-blue-900/10 font-black text-blue-700 dark:text-blue-300">
              <tr>
                <td className="px-6 py-4 uppercase text-[10px]">Total Geral em Estoque</td>
                <td className="px-6 py-4 text-right">{totalKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</td>
                <td className="px-6 py-4 text-right text-base">{totalSacas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sc</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}