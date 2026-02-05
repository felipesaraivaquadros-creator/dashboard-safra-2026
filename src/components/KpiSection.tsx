"use client";

import React from 'react';
import { TrendingUp, Droplets, Target, Info, X } from 'lucide-react';
import { KpiStats } from '../data/types';

interface KpiSectionProps {
  stats: KpiStats;
  fazendaFiltro: string | null;
  prodColor: string;
  prodText: string;
  setShowModalProd: (show: boolean) => void;
}

export default function KpiSection({ stats, fazendaFiltro, prodColor, prodText, setShowModalProd }: KpiSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-green-100 rounded-lg text-green-600"><TrendingUp size={24}/></div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Entregue</p>
          <h3 className="text-xl font-black">{stats.totalLiq.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</h3>
        </div>
      </div>

      <div 
        onClick={() => fazendaFiltro && setShowModalProd(true)} 
        className={`bg-white p-5 rounded-xl border-2 transition-all cursor-pointer shadow-sm flex items-center justify-between group ${fazendaFiltro ? 'border-purple-400 hover:border-purple-500' : 'border-transparent hover:border-slate-300 cursor-default'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg transition-colors ${prodColor} group-hover:bg-purple-600 group-hover:text-white`}>
            <Target size={24}/>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produtividade</p>
            <h3 className={`text-xl font-black ${prodText}`}>{fazendaFiltro ? `${stats.prodLiq} sc/ha` : "Selecione Fazenda"}</h3>
          </div>
        </div>
        <Info size={16} className="text-slate-300" />
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Droplets size={24}/></div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Umidade Média</p>
          <h3 className="text-xl font-black">{stats.umidade}%</h3>
        </div>
      </div>
    </div>
  );
}

interface ProductivityModalProps {
  showModalProd: boolean;
  setShowModalProd: (show: boolean) => void;
  fazendaFiltro: string | null;
  stats: KpiStats;
  romaneiosCount: number; // Alterado para romaneiosCount
}

export function ProductivityModal({ showModalProd, setShowModalProd, fazendaFiltro, stats, romaneiosCount }: ProductivityModalProps) {
  if (!showModalProd) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all" onClick={() => setShowModalProd(false)}>
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase bg-purple-500 w-fit px-2 py-0.5 rounded-full mb-1">Fazenda</span>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">{fazendaFiltro || "Geral"}</h2>
          </div>
          <button onClick={() => setShowModalProd(false)} className="bg-purple-500 hover:bg-purple-400 p-2 rounded-full"><X size={20}/></button>
        </div>
        <div className="p-8 space-y-6">
          {fazendaFiltro ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Área Total</p>
                  <h4 className="text-xl font-black">{stats.areaHa} ha</h4>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Cargas (Romaneios)</p>
                  <h4 className="text-xl font-black">{romaneiosCount} un</h4> {/* Usando romaneiosCount */}
                </div>
              </div>
              <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
                <div><p className="text-[10px] font-black text-orange-400 uppercase">Sacas Bruto</p><h4 className="text-lg font-black text-orange-700">{stats.totalBruta.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</h4></div>
                <div className="text-right"><p className="text-[10px] font-black text-orange-400 uppercase">Rendimento Bruto</p><h4 className="text-xl font-black text-orange-700">{stats.prodBruta} <span className="text-xs">sc/ha</span></h4></div>
              </div>
              <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex justify-between items-center">
                <div><p className="text-[10px] font-black text-green-400 uppercase">Sacas Líquida</p><h4 className="text-lg font-black text-green-700">{stats.totalLiq.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</h4></div>
                <div className="text-right"><p className="text-[10px] font-black text-green-400 uppercase">Rendimento Líquido</p><h4 className="text-xl font-black text-green-700">{stats.prodLiq} <span className="text-xs">sc/ha</span></h4></div>
              </div>
            </>
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs font-bold uppercase italic">Selecione uma fazenda no gráfico para detalhar a produtividade.</div>
          )}
        </div>
      </div>
    </div>
  );
}