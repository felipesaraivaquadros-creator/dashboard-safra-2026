"use client";

import React, { useMemo } from 'react';
import { calculateSaldos } from '../../src/utils/saldoProcessing';
import { SaldoItem } from '../../src/data/saldoTypes';
import { FileText, Warehouse, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Componente de Tabela Reutilizável
function SaldoTable({ title, data, icon: Icon }: { title: string, data: SaldoItem[], icon: React.ElementType }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 h-full">
      <h2 className="text-xl font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
        <Icon size={20} className="text-purple-600" /> {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-wider w-1/3">Nome</th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Entregue (Bruto)</th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider">Contratado</th>
              <th className="px-4 py-3 text-right text-xs font-black uppercase tracking-wider w-1/4">Saldo</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.nome} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">{item.nome}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-600">
                  {item.sacasBrutoEntregue.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sc
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-slate-600">
                  {item.volumeContratado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc
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

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <SaldoTable 
          title="Saldos Agrupados por Armazém" 
          data={saldosArmazem} 
          icon={Warehouse} 
        />

        <SaldoTable 
          title="Saldos Agrupados por Contrato Fixo" 
          data={saldosContrato} 
          icon={FileText} 
        />
        
      </div>
    </main>
  );
}