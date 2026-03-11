"use client";

import React, { useMemo } from 'react';
import { Warehouse, FileText, Scale, CheckCircle2, AlertCircle, ArrowDown } from 'lucide-react';
import { SaldoKpi } from '../../data/saldoTypes';

interface SaldosPorArmazemProps {
  listaSaldos: SaldoKpi[];
}

export default function SaldosPorArmazem({ listaSaldos }: SaldosPorArmazemProps) {
  // --- SEÇÃO 1: CONCILIAÇÃO COFCO/MATUPÁ ---
  const contratosFixos = [
    { nome: "Contrato de Venda", total: 20000 },
    { nome: "Contrato de Adubo", total: 29500 },
    { nome: "Contrato Arrendamento IVO", total: 4050 },
    { nome: "Contrato Comissão", total: 800 },
  ];

  const totalContratosSc = contratosFixos.reduce((sum, c) => sum + c.total, 0);

  const dadosCard1 = useMemo(() => {
    const cofco = listaSaldos.find(s => s.nome === "COFCO NSH")?.total || 0;
    const sipalMatupa = listaSaldos.find(s => s.nome === "SIPAL MATUPÁ")?.total || 0;
    const sipalLRVNecessario = Math.max(totalContratosSc - (cofco + sipalMatupa), 0);

    return [
      { nome: "COFCO NSH", sc: cofco, kg: cofco * 60 },
      { nome: "SIPAL MATUPÁ", sc: sipalMatupa, kg: sipalMatupa * 60 },
      { nome: "SIPAL LRV (Alocado)", sc: sipalLRVNecessario, kg: sipalLRVNecessario * 60 },
    ];
  }, [listaSaldos, totalContratosSc]);

  const totalAlocadoSc = dadosCard1.reduce((sum, d) => sum + d.sc, 0);
  const saldoConciliacao = totalAlocadoSc - totalContratosSc;

  // --- SEÇÃO 2: DETALHAMENTO SIPAL LRV ---
  const sipalLRVReal = listaSaldos.find(s => s.nome === "SIPAL LRV")?.total || 28066;
  
  const compromissosLRV = [
    { nome: "DIFERENÇA COFCO", total: 457 },
    { nome: "VENDA", total: 3000 },
    { nome: "VENDA", total: 5000 },
    { nome: "BEDIN", total: 6750 },
    { nome: "COMISS A FIXAR", total: 1100 },
  ];

  const totalCompromissosLRV = compromissosLRV.reduce((sum, c) => sum + c.total, 0);
  const saldoFinalLRV = sipalLRVReal - totalCompromissosLRV;

  // --- SEÇÃO 3: DETALHAMENTO SIPAL CLÁUDIA (NOVO) ---
  const sipalClaudiaReal = listaSaldos.find(s => s.nome === "SIPAL CLÁUDIA")?.total || 0;
  
  const compromissosClaudia = [
    { nome: "ARRENDAMENTO CT", total: 10000 },
  ];

  const totalCompromissosClaudia = compromissosClaudia.reduce((sum, c) => sum + c.total, 0);
  const saldoFinalClaudia = sipalClaudiaReal - totalCompromissosClaudia;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      
      {/* PRIMEIRA SEÇÃO: CONCILIAÇÃO GERAL */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Alocação de Contratos Fixados</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                {saldoConciliacao === 0 ? <><CheckCircle2 size={14} /> Conciliado</> : saldoConciliacao > 0 ? <><CheckCircle2 size={14} /> Saldo Excedente</> : <><AlertCircle size={14} /> Saldo a Cumprir</>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEGUNDA SEÇÃO: DETALHAMENTO SIPAL LRV */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sipal LRV</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10 flex items-center gap-3">
              <Warehouse size={18} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">Saldo Físico</h3>
            </div>
            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">SIPAL LRV</p>
              <div className="text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tighter mb-2">
                {sipalLRVReal.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs font-black uppercase italic text-slate-400">Sacas em Estoque</p>
              <p className="text-[10px] font-bold text-slate-300 mt-4">{(sipalLRVReal * 60).toLocaleString('pt-BR')} KG</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-orange-50/30 dark:bg-orange-900/10 flex items-center gap-3">
              <ArrowDown size={18} className="text-orange-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">Compromissos / Saídas</h3>
            </div>
            <div className="p-4 flex-1 space-y-2">
              {compromissosLRV.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{item.nome}</span>
                  <span className="text-xs font-black text-orange-600 dark:text-orange-400">{item.total.toLocaleString('pt-BR')} sc</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 border-t border-orange-100 dark:border-orange-800 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-orange-700 dark:text-orange-300">Total Compromissos</span>
              <span className="text-sm font-black text-orange-800 dark:text-orange-200">{totalCompromissosLRV.toLocaleString('pt-BR')} sc</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-green-50/30 dark:bg-green-900/10 flex items-center gap-3">
              <Scale size={18} className="text-green-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">Saldo Disponível (LRV)</h3>
            </div>
            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Resultado Líquido</p>
              <div className={`text-6xl font-black tracking-tighter mb-4 ${saldoFinalLRV >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {saldoFinalLRV.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs font-black uppercase italic mb-8">Sacas Livres</p>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase ${saldoFinalLRV >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {saldoFinalLRV >= 0 ? <><CheckCircle2 size={14} /> Saldo Positivo</> : <><AlertCircle size={14} /> Saldo Negativo</>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TERCEIRA SEÇÃO: DETALHAMENTO SIPAL CLÁUDIA (NOVA) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sipal Cláudia</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Saldo Físico Cláudia */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10 flex items-center gap-3">
              <Warehouse size={18} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">Saldo Físico</h3>
            </div>
            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">SIPAL CLÁUDIA</p>
              <div className="text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tighter mb-2">
                {sipalClaudiaReal.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs font-black uppercase italic text-slate-400">Sacas em Estoque</p>
              <p className="text-[10px] font-bold text-slate-300 mt-4">{(sipalClaudiaReal * 60).toLocaleString('pt-BR')} KG</p>
            </div>
          </div>

          {/* Card 2: Compromissos Cláudia */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-orange-50/30 dark:bg-orange-900/10 flex items-center gap-3">
              <ArrowDown size={18} className="text-orange-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">Compromissos / Saídas</h3>
            </div>
            <div className="p-4 flex-1 space-y-2">
              {compromissosClaudia.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{item.nome}</span>
                  <span className="text-xs font-black text-orange-600 dark:text-orange-400">{item.total.toLocaleString('pt-BR')} sc</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-orange-50/50 dark:bg-orange-900/20 border-t border-orange-100 dark:border-orange-800 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-orange-700 dark:text-orange-300">Total Compromissos</span>
              <span className="text-sm font-black text-orange-800 dark:text-orange-200">{totalCompromissosClaudia.toLocaleString('pt-BR')} sc</span>
            </div>
          </div>

          {/* Card 3: Saldo Final Cláudia */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-green-50/30 dark:bg-green-900/10 flex items-center gap-3">
              <Scale size={18} className="text-green-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">Saldo Disponível (Cláudia)</h3>
            </div>
            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Resultado Líquido</p>
              <div className={`text-6xl font-black tracking-tighter mb-4 ${saldoFinalClaudia >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {saldoFinalClaudia.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs font-black uppercase italic mb-8">Sacas Livres</p>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase ${saldoFinalClaudia >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {saldoFinalClaudia >= 0 ? <><CheckCircle2 size={14} /> Saldo Positivo</> : <><AlertCircle size={14} /> Saldo Negativo</>}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}