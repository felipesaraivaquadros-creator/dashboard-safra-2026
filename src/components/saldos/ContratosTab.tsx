"use client";

import React from 'react';
import { FileText } from 'lucide-react';
import { SaldoKpi } from '../../data/saldoTypes';

interface ContratosTabProps {
  lista: SaldoKpi[];
  totalSacas: number;
  totalKg: number;
}

export default function ContratosTab({ lista, totalSacas, totalKg }: ContratosTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><FileText size={20}/></div>
          <h2 className="text-sm font-black uppercase italic tracking-tighter">Contratos de Venda e Arrendamento</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
                <th className="px-6 py-4">Nome do Contrato</th>
                <th className="px-6 py-4 text-center">Nº Contrato</th>
                <th className="px-6 py-4 text-right">Volume (KG)</th>
                <th className="px-6 py-4 text-right">Volume (Sacas)</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold">
              {lista.map((item, i) => (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/30 dark:hover:bg-slate-700/20 transition-colors">
                  <td className="px-6 py-4 uppercase text-slate-700 dark:text-slate-200">{item.nome}</td>
                  <td className="px-6 py-4 text-center text-slate-400 font-mono">{item.id || 'S/N'}</td>
                  <td className="px-6 py-4 text-right text-slate-400">{(item.totalKg || item.total * 60).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</td>
                  <td className="px-6 py-4 text-right font-black text-purple-600 dark:text-purple-400">{item.total.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sc</td>
                </tr>
              ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic uppercase text-[10px]">Nenhum contrato encontrado</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-purple-50/50 dark:bg-purple-900/10 font-black text-purple-700 dark:text-purple-300">
              <tr>
                <td colSpan={2} className="px-6 py-4 uppercase text-[10px]">Total Compromissado</td>
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