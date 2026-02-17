"use client";

import React from 'react';
import { X, Info, Percent, Scale } from 'lucide-react';
import { DiscountStats } from '../data/types';

export default function UmidadeModal({ 
  showModalUmid, 
  setShowModalUmid, 
  fazendaFiltro, 
  armazemFiltro,
  discountStats,
  totalBruta,
  totalBrutaKg
}: any) {
  if (!showModalUmid) return null;

  const formatSc = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const formatKg = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  const items = [
    { label: "Umidade", sc: discountStats.umidadeSc, kg: discountStats.umidadeKg },
    { label: "Impureza", sc: discountStats.impurezaSc, kg: discountStats.impurezaKg },
    { label: "Ardidos", sc: discountStats.ardidoSc, kg: discountStats.ardidoKg },
    { label: "Avariados", sc: discountStats.avariadosSc, kg: discountStats.avariadosKg },
    { label: "Contaminantes", sc: discountStats.contaminantesSc, kg: discountStats.contaminantesKg },
    { label: "Quebrados", sc: discountStats.quebradosSc, kg: discountStats.quebradosKg },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm transition-all" 
      onClick={() => setShowModalUmid(false)}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-8" 
          onClick={(e) => e.stopPropagation()}
        >
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
                <div key={idx} className="flex justify-between items-baseline p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-600 dark:text-slate-300 block leading-none">{formatSc(item.sc)} sc</span>
                    <span className="text-[9px] font-bold text-slate-400">{formatKg(item.kg)} kg</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-dashed border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-baseline mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total de Descontos</p>
                  <h3 className="text-3xl font-black text-blue-600 tracking-tighter leading-none">
                    {formatSc(discountStats.totalDescontosSc)} <span className="text-sm">sc</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{formatKg(discountStats.totalDescontosKg)} kg</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end text-blue-600 mb-1">
                    <Percent size={14} />
                    <span className="text-lg font-black">{discountStats.percentualDesconto}%</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase italic">Sobre o Bruto</p>
                </div>
              </div>

              <div className="flex justify-between items-baseline p-3 bg-slate-100 dark:bg-slate-700 rounded-xl mb-4 border border-slate-200 dark:border-slate-600">
                <div className="flex items-center gap-2">
                  <Scale size={16} className="text-slate-400" />
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">Volume Bruto Total</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 block leading-none">{formatSc(totalBruta)} sc</span>
                  <span className="text-[9px] font-bold text-slate-400">{formatKg(totalBrutaKg)} kg</span>
                </div>
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
    </div>
  );
}