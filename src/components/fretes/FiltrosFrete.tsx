"use client";

import React from 'react';
import { Filter, Settings2, LayoutList, Layers, Search } from 'lucide-react';

interface FiltrosFreteProps {
  motoristaFiltro: string;
  setMotoristaFiltro: (v: string) => void;
  placaFiltro: string;
  setPlacaFiltro: (v: string) => void;
  armazemFiltro: string;
  setArmazemFiltro: (v: string) => void;
  tipoCalculo: 'com' | 'sem';
  setTipoCalculo: (v: 'com' | 'sem') => void;
  modeloRelatorio: 'simples' | 'fazenda';
  setModeloRelatorio: (v: 'simples' | 'fazenda') => void;
  motoristas: string[];
  placas: string[];
  armazens: string[];
  onGerar: () => void;
}

export default function FiltrosFrete({
  motoristaFiltro, setMotoristaFiltro,
  placaFiltro, setPlacaFiltro,
  armazemFiltro, setArmazemFiltro,
  tipoCalculo, setTipoCalculo,
  modeloRelatorio, setModeloRelatorio,
  motoristas, placas, armazens,
  onGerar
}: FiltrosFreteProps) {
  return (
    <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Filter size={18} className="text-purple-500" />
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Configurar Fechamento</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Motorista</label>
          <select value={motoristaFiltro} onChange={(e) => setMotoristaFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all">
            <option value="">Todos os Motoristas</option>
            {motoristas.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Placa</label>
          <select value={placaFiltro} onChange={(e) => setPlacaFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all">
            <option value="">Todas as Placas</option>
            {placas.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Armazém</label>
          <select value={armazemFiltro} onChange={(e) => setArmazemFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all">
            <option value="">Todos os Armazéns</option>
            {armazens.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><Settings2 size={10} /> Cálculo</label>
          <select value={tipoCalculo} onChange={(e) => setTipoCalculo(e.target.value as 'com' | 'sem')} className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all">
            <option value="com">Com Arredondamento</option>
            <option value="sem">Sem Arredondamento</option>
          </select>
        </div>
        
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><LayoutList size={10} /> Modelo de Relatório</label>
          <div className="flex bg-slate-50 dark:bg-slate-700 p-1 rounded-xl">
            <button 
              onClick={() => setModeloRelatorio('simples')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${modeloRelatorio === 'simples' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutList size={14} /> Simples
            </button>
            <button 
              onClick={() => setModeloRelatorio('fazenda')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${modeloRelatorio === 'fazenda' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Layers size={14} /> Por Fazenda
            </button>
          </div>
        </div>

        <button onClick={onGerar} className="sm:col-span-2 bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
          <Search size={16} /> Gerar Fechamento
        </button>
      </div>
    </section>
  );
}