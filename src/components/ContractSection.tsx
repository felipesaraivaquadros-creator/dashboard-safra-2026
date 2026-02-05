"use client";

import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { ProcessedContract } from '../data/types';

interface ContractSectionProps {
  contratosProcessados: {
    pendentes: ProcessedContract[];
    cumpridos: ProcessedContract[];
  };
}

export default function ContractSection({ contratosProcessados }: ContractSectionProps) {
  const [contratoExpandido, setContratoExpandido] = useState<string | null>(null);
  const [abaContratos, setAbaContratos] = useState<'pendentes' | 'cumpridos'>('pendentes');

  const contratosAtivos = contratosProcessados[abaContratos];

  const toggleExpand = (id: string) => {
    setContratoExpandido(contratoExpandido === id ? null : id);
  };

  return (
    <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[850px] overflow-hidden">
      <div className="p-5 border-b">
        <h2 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2 mb-4"><FileText size={18} /> Contratos</h2>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setAbaContratos('pendentes')} 
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${abaContratos === 'pendentes' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Não Cumpridos
          </button>
          <button 
            onClick={() => setAbaContratos('cumpridos')} 
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${abaContratos === 'cumpridos' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Cumpridos
          </button>
        </div>
      </div>
      <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-slate-50/20">
        {contratosAtivos.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase italic">Nenhum contrato nesta aba.</div>
        )}
        {contratosAtivos.map((c) => {
          const isEx = contratoExpandido === c.id;
          return (
            <div 
              key={c.id} 
              onClick={() => toggleExpand(c.id)} 
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isEx ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-white bg-white hover:border-slate-100'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className={`text-xs font-black uppercase tracking-tight ${isEx ? 'text-purple-700' : 'text-slate-700'}`}>{c.nome}</p>
                  <span className="text-[9px] font-bold text-slate-300">ID: {c.id}</span>
                </div>
                {isEx ? <ChevronUp size={16} className="text-purple-400" /> : <ChevronDown size={16} className="text-slate-300" />}
              </div>
              
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
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
                <div className="mt-4 pt-4 border-t border-purple-200 grid grid-cols-1 gap-1.5 animate-in slide-in-from-top-1">
                  
                  {/* NOVO CAMPO: SALDO CUMPRIDO */}
                  <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                    <span className="text-[9px] font-bold text-green-600 uppercase">Saldo Cumprido</span>
                    <span className="text-xs font-black text-green-700">{c.cumprido.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
                  </div>

                  <div className="flex justify-between items-center bg-white/50 p-2 rounded">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Total Contrato</span>
                    <span className="text-xs font-black text-slate-700">{c.contratado.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-orange-50 p-2 rounded">
                    <span className="text-[9px] font-bold text-orange-600 uppercase">Saldo Restante</span>
                    <span className="text-xs font-black text-orange-700">{c.aCumprir.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
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