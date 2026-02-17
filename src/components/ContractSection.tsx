"use client";

import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { ProcessedContract } from '../data/types';

interface ContractSectionProps {
  contratosProcessados: {
    pendentes: ProcessedContract[];
    cumpridos: ProcessedContract[];
  };
  romaneiosCount: number; 
}

export default function ContractSection({ contratosProcessados, romaneiosCount }: ContractSectionProps) {
  const [contratoExpandido, setContratoExpandido] = useState<string | null>(null);
  const [abaContratos, setAbaContratos] = useState<'pendentes' | 'cumpridos'>('pendentes');

  const contratosAtivos = contratosProcessados[abaContratos];

  const toggleExpand = (id: string) => {
    setContratoExpandido(contratoExpandido === id ? null : id);
  };

  return (
    <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-[850px] overflow-hidden">
      <div className="p-5 border-b dark:border-slate-700">
        <h2 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase flex items-center justify-between mb-4">
          <span className="flex items-center gap-2"><FileText size={18} /> Contratos</span>
          <span className="text-xs font-black text-slate-400 flex items-center gap-1">
            <Truck size={14} className="text-slate-300" />
            {romaneiosCount} Cargas
          </span>
        </h2>
        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
          <button 
            onClick={() => setAbaContratos('pendentes')} 
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${abaContratos === 'pendentes' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            Pendentes
          </button>
          <button 
            onClick={() => setAbaContratos('cumpridos')} 
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${abaContratos === 'cumpridos' ? 'bg-white dark:bg-slate-800 text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            Cumpridos
          </button>
        </div>
      </div>
      <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-slate-50/20 dark:bg-slate-900/20">
        {contratosAtivos.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase italic">Nenhum contrato pendente.</div>
        )}
        {contratosAtivos.map((c) => {
          const isEx = contratoExpandido === c.id;
          return (
            <div 
              key={c.id} 
              onClick={() => toggleExpand(c.id)} 
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isEx ? 'border-purple-500 bg-purple-50 shadow-sm dark:bg-purple-900/20 dark:border-purple-600' : 'border-white bg-white hover:border-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:hover:border-slate-600'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black uppercase tracking-tight truncate ${isEx ? 'text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-200'}`}>{c.nome}</p>
                  <span className="text-[9px] font-bold text-slate-300">ID: {c.id}</span>
                </div>
                {isEx ? <ChevronUp size={16} className="text-purple-400" /> : <ChevronDown size={16} className="text-slate-300" />}
              </div>
              
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-600 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                <div 
                  className={`h-full transition-all duration-1000 ${c.isConcluido ? 'bg-green-500' : 'bg-purple-600'}`} 
                  style={{ width: `${c.porcentagem}%` }} 
                />
              </div>
              
              <div className="flex justify-between mt-1 text-[9px] font-black text-slate-400 uppercase">
                <span>{c.porcentagem}%</span>
                <span>{c.cumprido.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
              </div>
              
              {isEx && (
                <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-800 grid grid-cols-1 gap-1.5 animate-in slide-in-from-top-1">
                  
                  {/* SALDO CUMPRIDO (Verde) */}
                  <div className="flex justify-between items-baseline bg-green-50 dark:bg-green-900/30 p-2 rounded">
                    <span className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase">Saldo Cumprido</span>
                    <span className="text-xs font-black text-green-700 dark:text-green-300">{c.cumprido.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
                  </div>

                  {/* TOTAL CONTRATO (Neutro) */}
                  <div className="flex justify-between items-baseline bg-white/50 dark:bg-slate-600/50 p-2 rounded">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Total Contrato</span>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">{c.contratado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
                  </div>
                  
                  {/* SALDO A CUMPRIR (Laranja) */}
                  <div className="flex justify-between items-baseline bg-orange-50 dark:bg-orange-900/30 p-2 rounded">
                    <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase">Saldo A Cumprir</span>
                    <span className="text-xs font-black text-orange-700 dark:text-orange-300">{c.aCumprir.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}