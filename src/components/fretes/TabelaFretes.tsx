"use client";

import React from 'react';
import { Truck, Printer } from 'lucide-react';
import { Romaneio } from '../../data/types';

interface TabelaFretesProps {
  lista: Romaneio[];
  titulo?: string;
  subtotal?: boolean;
  tipoCalculo: 'com' | 'sem';
  calcularTotais: (lista: Romaneio[]) => { sacas: number, valor: number };
}

export default function TabelaFretes({ lista, titulo, subtotal, tipoCalculo, calcularTotais }: TabelaFretesProps) {
  const totais = calcularTotais(lista);

  const formatarDataBR = (dataISO: string | null) => {
    if (!dataISO) return "-";
    const partes = dataISO.split('-');
    if (partes.length !== 3) return dataISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden print:shadow-none print:border-slate-300 print:rounded-none print:mb-8 print:break-inside-auto">
      <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 print:bg-white print:p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg print:hidden"><Truck size={20}/></div>
          <h2 className="text-lg font-black uppercase italic tracking-tighter">{titulo || "Relatório de Fretes (Ganhos)"}</h2>
        </div>
        {!titulo && (
          <button onClick={() => window.print()} className="p-2 bg-white dark:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-all print:hidden shadow-sm border dark:border-slate-600"><Printer size={18} /></button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px] print:min-w-full">
          <thead>
            <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
              <th className="px-6 py-4 print:px-2">Data</th>
              <th className="px-4 py-4 print:px-2">NFe</th>
              <th className="px-4 py-4 print:px-2">Placa</th>
              <th className="px-4 py-4 print:px-2">Armazém</th>
              <th className="px-4 py-4 text-right print:px-2">Sacas Bruto</th>
              <th className="px-4 py-4 text-right print:px-2">Preço</th>
              <th className="px-6 py-4 text-right print:px-2">Subtotal</th>
            </tr>
          </thead>
          <tbody className="text-xs font-bold">
            {lista.map((r, i) => {
              const sacasOriginal = Number(r.sacasBruto) || 0;
              const sacas = tipoCalculo === 'com' ? Math.floor(sacasOriginal) : Number(sacasOriginal.toFixed(2));
              const subtotalValor = sacas * (Number(r.precofrete) || 0);
              return (
                <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/30 dark:hover:bg-slate-700/20">
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 print:px-2">{formatarDataBR(r.data)}</td>
                  <td className="px-4 py-4 print:px-2">{r.nfe}</td>
                  <td className="px-4 py-4 uppercase text-[10px] print:px-2">{r.placa}</td>
                  <td className="px-4 py-4 uppercase text-[10px] print:px-2">{r.armazem}</td>
                  <td className="px-4 py-4 text-right print:px-2">{sacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-4 py-4 text-right text-blue-600 print:px-2">R$ {(Number(r.precofrete) || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-black print:px-2">R$ {subtotalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="print:table-row-group">
            <tr className="bg-blue-50/50 dark:bg-blue-900/10 font-black text-blue-700 dark:text-blue-300">
              <td colSpan={4} className="px-6 py-4 text-right uppercase text-[10px] print:px-2">{subtotal ? "Subtotal Fazenda" : "Total Fretes"}</td>
              <td className="px-4 py-4 text-right print:px-2">{totais.sacas.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc</td>
              <td className="px-4 py-4 print:px-2">-</td>
              <td className="px-6 py-4 text-right text-base print:px-2">R$ {totais.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}