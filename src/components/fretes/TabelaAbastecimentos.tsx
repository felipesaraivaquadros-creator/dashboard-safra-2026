"use client";

import React from 'react';
import { Fuel } from 'lucide-react';

interface TabelaAbastecimentosProps {
  lista: any[];
  totais: { litros: number, valor: number };
}

export default function TabelaAbastecimentos({ lista, totais }: TabelaAbastecimentosProps) {
  if (lista.length === 0) return null;

  const formatarDataBR = (dataISO: string | null) => {
    if (!dataISO) return "-";
    const partes = dataISO.split('-');
    if (partes.length !== 3) return dataISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden print:break-inside-avoid print:shadow-none print:border-slate-300 print:rounded-none">
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-red-50/30 dark:bg-red-900/10 print:bg-white print:p-4">
        <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg print:hidden"><Fuel size={20}/></div>
        <h2 className="text-sm font-black uppercase italic tracking-tighter">3. Abastecimentos (Diesel)</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[400px] print:min-w-full">
          <thead>
            <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
              <th className="px-6 py-3 print:px-2">Data</th>
              <th className="px-4 py-3 text-right print:px-2">Litros</th>
              <th className="px-4 py-3 text-right print:px-2">Preço</th>
              <th className="px-6 py-3 text-right print:px-2">Total</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold">
            {lista.map((a, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50">
                <td className="px-6 py-3 text-slate-500 dark:text-slate-400 print:px-2">{formatarDataBR(a.data)}</td>
                <td className="px-4 py-3 text-right print:px-2">{(Number(a.litros) || 0).toLocaleString('pt-BR')} L</td>
                <td className="px-4 py-3 text-right text-slate-400 print:px-2">R$ {(Number(a.preco) || 0).toFixed(2)}</td>
                <td className="px-6 py-3 text-right text-red-600 print:px-2">R$ {(Number(a.total) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-red-50/50 dark:bg-red-900/10 font-black text-red-700 dark:text-red-400">
              <td className="px-6 py-3 text-right uppercase text-[9px] print:px-2">Totais</td>
              <td className="px-4 py-3 text-right print:px-2">{totais.litros.toLocaleString('pt-BR')} L</td>
              <td className="px-4 py-3 print:px-2">-</td>
              <td className="px-6 py-3 text-right print:px-2">R$ {totais.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}