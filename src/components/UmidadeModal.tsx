"use client";

import React from 'react';
import { X, Info, Percent, Scale } from 'lucide-react';
import { DiscountStats } from '../data/types';

interface UmidadeModalProps {
  showModalUmid: boolean;
  setShowModalUmid: (show: boolean) => void;
  fazendaFiltro: string | null;
  armazemFiltro: string | null;
  discountStats: DiscountStats;
  totalBruta: number; // Novo prop
}

export default function UmidadeModal({ 
  showModalUmid, 
  setShowModalUmid, 
  fazendaFiltro, 
  armazemFiltro,
  discountStats,
  totalBruta
}: UmidadeModalProps) {
  if (!showModalUmid) return null;

  const formatSc = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  const items = [
    { label: "Umidade", value: discountStats.umidadeSc },
    { label: "Impureza", value: discountStats.impurezaSc },
    { label: "Ardidos", value: discountStats.ardidoSc },
    { label: "Avariados", value: discountStats.avariadosSc },
    { label: "Contaminantes", value: discountStats.contaminantesSc },
    { label: "Quebrados", value: discountStats.quebradosSc },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all" onClick={() => setShowModalUmid(false)}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase bg-blue-500 w-fit px-2 py-0.5 rounded-full mb-1">Qualidade & Umidade</span>
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">
              {fazendaFiltro || armazemFiltro ? (
                <span className="truncate block max-w-[250px]">{fazendaFiltro || armazemFiltro}</span>
              ) : "Geral"}
            </h2>
          </div>
          <button onClick={() => setShowModalUmid(false)} className="bg-blue-500 hover:bg-blue-400 p-2 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                <span className="text-sm font-black text-slate-600 dark:text-slate-300">{formatSc(item.value)} sc</span>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-dashed border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-end mb-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total de Descontos</p>
                <h3 className="text-3xl font-black text-blue-600 tracking-tighter">
                  {formatSc(discountStats.totalDescontosSc)} <span className="text-sm">sc</span>
                </h3>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 justify-end text-blue-600 mb-1">
                  <Percent size={14} />
                  <span className="text-lg font-black">{discountStats.percentualDesconto}%</span>
                </div>
                <p className="text-[9px] font-bold text-slate-400 uppercase italic">Sobre o Bruto</p>
              </div>
            </div>

            {/* Referência de Sacas Bruto */}
            <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-700 rounded-xl mb-4 border border-slate-200 dark:border-slate-600">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Volume Bruto Total</span>
              </div>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200">{formatSc(totalBruta)} sc</span>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-3">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium text-blue-700 dark:text-blue-300 leading-relaxed">
                Os valores acima representam a conversão dos descontos de peso (kg) para sacas (60kg), conforme os romaneios filtrados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}