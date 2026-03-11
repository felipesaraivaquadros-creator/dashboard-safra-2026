"use client";

import React, { useMemo } from 'react';
import { Warehouse, FileText, Scale, CheckCircle2, AlertCircle, ArrowDown } from 'lucide-react';
import { SaldoKpi } from '../../data/saldoTypes';

interface SaldosPorArmazemProps {
  listaSaldos: SaldoKpi[];
  listaContratos: any[];
}

export default function SaldosPorArmazem({ listaSaldos, listaContratos }: SaldosPorArmazemProps) {
  
  // Agrupa contratos por armazém e calcula os saldos dinamicamente
  const armazensProcessados = useMemo(() => {
    // Pegamos todos os armazéns que têm saldo físico
    return listaSaldos.map(saldoFisico => {
      // Filtra contratos associados a este armazém específico
      const contratosDoArmazem = listaContratos.filter(c => c.armazem_nome === saldoFisico.nome);
      const totalContratado = contratosDoArmazem.reduce((sum, c) => sum + c.total, 0);
      const saldoDisponivel = saldoFisico.total - totalContratado;

      return {
        nome: saldoFisico.nome,
        estoqueFisico: saldoFisico.total,
        contratos: contratosDoArmazem,
        totalContratado,
        saldoDisponivel
      };
    }).sort((a, b) => b.estoqueFisico - a.estoqueFisico);
  }, [listaSaldos, listaContratos]);

  if (armazensProcessados.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-[40px] border border-dashed border-slate-300 dark:border-slate-700">
        <Warehouse size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-sm font-black uppercase text-slate-400 italic">Nenhum armazém com saldo físico detectado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {armazensProcessados.map((armazem, idx) => (
        <section key={idx} className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
              <Warehouse size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white leading-none">
                {armazem.nome}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Detalhamento de Alocação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Estoque Físico */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale size={16} className="text-blue-600" />
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Saldo Físico Total</span>
                </div>
              </div>
              <div className="p-8 text-center">
                <div className="text-5xl font-black text-blue-600 tracking-tighter mb-1">
                  {armazem.estoqueFisico.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs font-black uppercase italic text-slate-400">Sacas Entregues</p>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">≈ {(armazem.estoqueFisico * 60).toLocaleString('pt-BR')} KG</p>
                </div>
              </div>
            </div>

            {/* Card 2: Contratos Alocados */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-purple-50/30 dark:bg-purple-900/10 flex items-center gap-2">
                <FileText size={16} className="text-purple-600" />
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Contratos Vinculados</span>
              </div>
              <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-[200px] custom-scrollbar">
                {armazem.contratos.length > 0 ? (
                  armazem.contratos.map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 truncate">{c.nome}</p>
                        <p className="text-[8px] font-bold text-slate-400">ID: {c.id}</p>
                      </div>
                      <span className="text-xs font-black text-purple-600 dark:text-purple-400 shrink-0 ml-2">
                        -{c.total.toLocaleString('pt-BR')} sc
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-8">
                    <FileText size={24} className="mb-2" />
                    <p className="text-[9px] font-bold uppercase">Nenhum contrato alocado</p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 border-t border-purple-100 dark:border-purple-800 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">Total Comprometido</span>
                <span className="text-sm font-black text-purple-800 dark:text-purple-200">{armazem.totalContratado.toLocaleString('pt-BR')} sc</span>
              </div>
            </div>

            {/* Card 3: Saldo Disponível no Armazém */}
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-600" />
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Saldo Disponível no Local</span>
              </div>
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
                <div className={`text-5xl font-black tracking-tighter mb-1 ${armazem.saldoDisponivel >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {armazem.saldoDisponivel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs font-black uppercase italic text-slate-400">Sacas Livres</p>
                
                <div className={`mt-6 flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase ${armazem.saldoDisponivel >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {armazem.saldoDisponivel >= 0 ? (
                    <><CheckCircle2 size={14} /> Saldo Positivo</>
                  ) : (
                    <><AlertCircle size={14} /> Déficit no Armazém</>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {idx < armazensProcessados.length - 1 && (
            <div className="pt-8 flex justify-center opacity-20">
              <div className="h-px bg-slate-300 dark:bg-slate-700 w-full max-w-md" />
            </div>
          )}
        </section>
      ))}
    </div>
  );
}