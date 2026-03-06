"use client";

import React, { useMemo } from 'react';
import { Warehouse, FileText, Scale, CheckCircle2, AlertCircle } from 'lucide-react';
import { SaldoKpi } from '../../data/saldoTypes';

interface SaldosPorArmazemProps {
  listaSaldos: SaldoKpi[];
}

export default function SaldosPorArmazem({ listaSaldos }: SaldosPorArmazemProps) {
  // 1. Definição dos Contratos Fixos (Card 2)
  const contratosFixos = [
    { nome: "Contrato de Venda", total: 20000 },
    { nome: "Contrato de Adubo", total: 29500 },
    { nome: "Contrato Arrendamento IVO", total: 4050 },
    { nome: "Contrato Comissão", total: 800 },
  ];

  const totalContratosSc = contratosFixos.reduce((sum, c) => sum + c.total, 0);
  const totalContratosKg = totalContratosSc * 60;

  // 2. Lógica de Alocação de Armazéns (Card 1)
  const dadosCard1 = useMemo(() => {
    const cofco = listaSaldos.find(s => s.nome === "COFCO NSH")?.total || 0;
    const sipalMatupa = listaSaldos.find(s => s.nome === "SIPAL MATUPÁ")?.total || 0;
    
    // Diferença necessária do Sipal LRV para zerar a conta
    const sipalLRVNecessario = Math.max(totalContratosSc - (cofco + sipalMatupa), 0);

    return [
      { nome: "COFCO NSH", sc: cofco, kg: cofco * 60 },
      { nome: "SIPAL MATUPÁ", sc: sipalMatupa, kg: sipalMatupa * 60 },
      { nome: "SIPAL LRV (Alocado)", sc: sipalLRVNecessario, kg: sipalLRVNecessario * 60 },
    ];
  }, [listaSaldos, totalContratosSc]);

  const totalAlocadoSc = dadosCard1.reduce((sum, d) => sum + d.sc, 0);
  const totalAlocadoKg = totalAlocadoSc * 60;

  // 3. Saldo de Conciliação (Card 3)
  const saldoConciliacao = totalAlocadoSc - totalContratosSc;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1º Card: Saldos Armazéns */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10 flex items-center gap-3">
          <Warehouse size={18} className="text-blue-600" />
          <h3 className="text-xs font-black uppercase italic tracking-tighter">1. Saldos Armazéns</h3>
        </div>
        <div className="p-4 flex-1 space-y-3">
          {dadosCard1.map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{item.nome}</span>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">{item.kg.toLocaleString('pt-BR')} kg</p>
                <p className="text-sm font-black text-blue-600 dark:text-blue-400 leading-none">{item.sc.toLocaleString('pt-BR')} sc</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">Total Alocado</span>
          <span className="text-sm font-black text-blue-800 dark:text-blue-200">{totalAlocadoSc.toLocaleString('pt-BR')} sc</span>
        </div>
      </div>

      {/* 2º Card: Contratos */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-purple-50/30 dark:bg-purple-900/10 flex items-center gap-3">
          <FileText size={18} className="text-purple-600" />
          <h3 className="text-xs font-black uppercase italic tracking-tighter">2. Contratos Vinculados</h3>
        </div>
        <div className="p-4 flex-1 space-y-3">
          {contratosFixos.map((item, i) => (
            <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{item.nome}</span>
              <div className="text-right">
                <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">{(item.total * 60).toLocaleString('pt-BR')} kg</p>
                <p className="text-sm font-black text-purple-600 dark:text-purple-400 leading-none">{item.total.toLocaleString('pt-BR')} sc</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 border-t border-purple-100 dark:border-purple-800 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">Total Contratos</span>
          <span className="text-sm font-black text-purple-800 dark:text-purple-200">{totalContratosSc.toLocaleString('pt-BR')} sc</span>
        </div>
      </div>

      {/* 3º Card: Saldo de Conciliação */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center gap-3">
          <Scale size={18} className="text-slate-600" />
          <h3 className="text-xs font-black uppercase italic tracking-tighter">3. Conciliação / Alocação</h3>
        </div>
        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Diferença Final</p>
          
          <div className={`text-6xl font-black tracking-tighter mb-4 ${saldoConciliacao === 0 ? 'text-slate-800 dark:text-white' : saldoConciliacao > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {saldoConciliacao.toLocaleString('pt-BR')}
          </div>
          
          <p className="text-xs font-black uppercase italic mb-8">Sacas</p>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase ${saldoConciliacao === 0 ? 'bg-slate-100 text-slate-600' : saldoConciliacao > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {saldoConciliacao === 0 ? (
              <><CheckCircle2 size={14} /> Conciliado</>
            ) : saldoConciliacao > 0 ? (
              <><CheckCircle2 size={14} /> Saldo Excedente</>
            ) : (
              <><AlertCircle size={14} /> Saldo a Cumprir</>
            )}
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[9px] text-slate-400 text-center font-medium italic">
            * Este cenário aloca automaticamente o saldo do Sipal LRV para cobrir os contratos listados.
          </p>
        </div>
      </div>

    </div>
  );
}