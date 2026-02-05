"use client";

import React, { useMemo } from 'react';
import { calculateSaldos } from '../../src/utils/saldoProcessing';
import { SaldoItem } from '../../src/data/saldoTypes';
import { FileText, Warehouse, ArrowLeft, Package, MinusCircle } from 'lucide-react';
import Link from 'next/link';

// Componente de Card de Saldo
function SaldoCard({ item }: { item: SaldoItem }) {
  const isNegative = item.saldo < 0;
  const saldoText = item.saldo.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-black uppercase text-slate-800">{item.nome}</h3>
        <Warehouse size={24} className="text-slate-400" />
      </div>
      
      <div className="space-y-3">
        {/* Entregue (Estoque Bruto) */}
        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1"><Package size={14} /> Estoque Bruto (Entregue)</span>
          <span className="text-base font-black text-slate-700">
            {item.sacasBrutoEntregue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sc
          </span>
        </div>

        {/* Contratado (Volume Fixo) */}
        <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
          <span className="text-[10px] font-black text-orange-600 uppercase flex items-center gap-1"><MinusCircle size={14} /> Contratado Fixo</span>
          <span className="text-base font-black text-orange-700">
            {item.volumeContratado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc
          </span>
        </div>

        {/* Saldo Líquido */}
        <div className={`flex justify-between items-center p-4 rounded-xl border-2 ${isNegative ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`}>
          <span className={`text-sm font-black uppercase ${isNegative ? 'text-red-700' : 'text-green-700'}`}>Saldo Líquido (Bruto)</span>
          <span className={`text-2xl font-black ${isNegative ? 'text-red-700' : 'text-green-700'}`}>
            {saldoText} sc
          </span>
        </div>
      </div>
    </div>
  );
}

// Componente de Tabela de Contratos (para referência)
function ContratoTable({ data }: { data: SaldoItem[] }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-full lg:col-span-2">
      <h2 className="text-xl font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
        <FileText size={20} className="text-purple-600" /> Contratos Fixos (Referência)
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider w-1/2">Contrato</th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Volume Contratado</th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Entregue (Líquido)</th>
              <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider w-1/4">Saldo</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.nome} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{item.nome}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-600">
                  {item.volumeContratado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-600">
                  {/* Nota: O cálculo de saldo por contrato usa Sacas Líquidas no dashboard principal. Aqui, usamos o campo sacasBrutoEntregue para manter a consistência com a estrutura SaldoItem, mas o valor é o total entregue para aquele contrato. */}
                  {item.sacasBrutoEntregue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sc
                </td>
                <td className={`px-4 py-3 whitespace-nowrap text-sm font-black text-right ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.saldo.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sc
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default function SaldoPage() {
  // Calcula os saldos uma única vez
  const { saldosArmazem, saldosContrato } = useMemo(() => calculateSaldos(), []);

  return (
    <main className="min-h-screen p-4 bg-slate-100 font-sans text-slate-900">
      <header className="max-w-[1400px] mx-auto mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Saldos de Estoque (Sacas Bruto)</h1>
        <Link href="/" className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors shadow-md">
          <ArrowLeft size={16} />
          Voltar ao Dashboard
        </Link>
      </header>

      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Seção de Saldos por Armazém (armazemsaldo) */}
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-wider mt-8">Saldo Líquido por Destino (Estoque Bruto - Contratos Fixos)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {saldosArmazem.map((item) => (
            <SaldoCard key={item.nome} item={item} />
          ))}
        </div>

        {/* Seção de Referência de Contratos */}
        <ContratoTable 
          data={saldosContrato} 
        />
        
      </div>
    </main>
  );
}