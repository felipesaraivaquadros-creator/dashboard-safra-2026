"use client";

import React from 'react';
import { HandCoins } from 'lucide-react';

interface TabelaAdiantamentosProps {
  lista: any[];
  total: number;
}

export default function TabelaAdiantamentos({ lista, total }: TabelaAdiantamentosProps) {
  if (lista.length === 0) return null;

  const formatarDataBR = (dataISO: string | null) => {
    if (!dataISO) return "-";
    const partes = dataISO.split('-');
    if (partes.length !== 3) return dataISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden print:break-inside-avoid print:shadow-none print:border-slate-300 print:rounded-none">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-orange-50/30 dark:bg-orange-900/10 print:bg-white print:p-4">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg print:hidden"><HandCoins size={20}/></div>
        <h2 className="text-sm font-black uppercase italic tracking-tighter">2. Adiantamentos</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[400px] print:min-w-full">
          <thead>
            <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
              <th className="px-6 py-3 print:px-2">Data</th>
              <th className="px-4 py-3 print:px-2">Motorista</th>
              <th className="px-6 py-3 text-right print:px-2">Valor</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold">
            {lista.map((a, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50">
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400 print:px-2">{formatarDataBR(a.data)}</td>
                <td className="px-4 py-3 uppercase text-[10px] print:px-2">{a.motorista}</td>
                <td className="px-6 py-3 text-right text-red-600 print:px-2">R$ {(Number(a.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-orange-50/50 dark:bg-orange-900/10 font-black text-orange-700 dark:text-orange-400">
              <td colSpan={2} className="px-6 py-3 text-right uppercase text-[9px] print:px-2">Total Adiantamentos</td>
              <td className="px-6 py-3 text-right print:px-2">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}