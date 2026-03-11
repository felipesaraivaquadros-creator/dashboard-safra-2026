"use client";

import React from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface DisponivelTabProps {
  saldoGeral: number;
  totalEstoque: number;
  totalContratos: number;
}

export default function DisponivelTab({ saldoGeral, totalEstoque, totalContratos }: DisponivelTabProps) {
  const isExcedente = saldoGeral >= 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* Card Principal de Saldo */}
      <div className={`p-8 rounded-[40px] border-2 shadow-2xl relative overflow-hidden group ${isExcedente ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
        <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
          {isExcedente ? <CheckCircle size={200} /> : <AlertTriangle size={200} />}
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">Resultado Final da Safra</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">
              {isExcedente ? 'Saldo Excedente' : 'Déficit de Entrega'}
            </h2>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl md:text-7xl font-black tracking-tighter">
                {Math.abs(saldoGeral).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-2xl font-black uppercase italic opacity-80">Sacas</span>
            </div>
            <p className="text-lg font-bold opacity-70 mt-2">
              ≈ {(Math.abs(saldoGeral) * 60).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg disponíveis
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase opacity-60">Total em Estoque (+)</span>
              <span className="text-lg font-black">{totalEstoque.toLocaleString('pt-BR')} sc</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase opacity-60">Total Contratado (-)</span>
              <span className="text-lg font-black">{totalContratos.toLocaleString('pt-BR')} sc</span>
            </div>
            <div className="pt-4 border-t border-white/20 flex justify-between items-center">
              <span className="text-xs font-black uppercase">Saldo Líquido</span>
              <span className="text-2xl font-black">{saldoGeral.toLocaleString('pt-BR')} sc</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-start gap-3 border border-blue-100 dark:border-blue-800">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-[10px] font-medium text-blue-700 dark:text-blue-300 leading-relaxed">
          O <strong>Saldo Disponível</strong> é calculado subtraindo o volume total de contratos (fixados e arrendamentos) do estoque físico total entregue nos armazéns. Valores positivos indicam excedente de produção, enquanto valores negativos indicam a necessidade de mais entregas para cumprir os compromissos.
        </p>
      </div>
    </div>
  );
}