"use client";

import React from 'react';
import { X, TrendingUp, Target, Truck, Calendar, Zap, Info, ArrowRight } from 'lucide-react';
import { KpiStats, VolumeStats, DiscountStats } from '../data/types';

interface VolumeModalProps {
  show: boolean;
  onClose: () => void;
  stats: KpiStats;
  volumeStats: VolumeStats;
  discountStats: DiscountStats;
  romaneiosCount: number;
  fazendaFiltro: string | null;
}

export default function VolumeModal({ show, onClose, stats, volumeStats, discountStats, romaneiosCount, fazendaFiltro }: VolumeModalProps) {
  if (!show) return null;

  const formatKg = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  const formatSc = (val: number) => val.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-green-600 p-6 text-white flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase bg-green-500 w-fit px-2 py-0.5 rounded-full mb-1">Volumes Detalhados</span>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">{fazendaFiltro || "Geral"}</h2>
          </div>
          <button onClick={onClose} className="bg-green-500 hover:bg-blue-400 p-2 rounded-full transition-colors"><X size={20}/></button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Linha 1 – Destaque */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800">
              <p className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase mb-1">Líquido Entregue</p>
              <h4 className="text-xl font-black text-green-700 dark:text-green-300">{formatSc(stats.totalLiq)} sc</h4>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800">
              <p className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase mb-1">Meta %</p>
              <h4 className="text-xl font-black text-purple-700 dark:text-purple-300">{volumeStats.metaPercentual}%</h4>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800">
              <p className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase mb-1">% Colhido (Est.)</p>
              <h4 className="text-xl font-black text-orange-700 dark:text-orange-300">{volumeStats.percentualColhido}%</h4>
            </div>
          </div>

          {/* Linha 2 – Volume */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} /> Composição de Volume
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Bruto (100%)</span>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-700 dark:text-slate-200">{formatSc(stats.totalBruta)} sc</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-2">({formatKg(stats.totalBrutaKg)} kg)</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                <span className="text-[10px] font-bold text-red-500 uppercase">Descontos ({discountStats.percentualDesconto}%)</span>
                <div className="text-right">
                  <span className="text-sm font-black text-red-600">{formatSc(discountStats.totalDescontosSc)} sc</span>
                  <span className="text-[10px] font-bold text-red-400 ml-2">({formatKg(discountStats.totalDescontosKg)} kg)</span>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                <span className="text-[10px] font-bold text-green-600 uppercase">Líquido Final</span>
                <div className="text-right">
                  <span className="text-sm font-black text-green-700 dark:text-green-300">{formatSc(stats.totalLiq)} sc</span>
                  <span className="text-[10px] font-bold text-green-400 ml-2">({formatKg(stats.totalLiqKg)} kg)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Linha 3 – Operação */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Truck size={14} /> Eficiência Operacional
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Nº Cargas</p>
                <h5 className="text-lg font-black">{romaneiosCount}</h5>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Média / Carga</p>
                <h5 className="text-lg font-black">{formatSc(volumeStats.mediaCargaSc)} sc</h5>
                <p className="text-[8px] text-slate-400">{formatKg(volumeStats.mediaCargaKg)} kg</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Média / Dia</p>
                <h5 className="text-lg font-black">{formatSc(volumeStats.mediaDiaSc)} sc</h5>
                <p className="text-[8px] text-slate-400">{formatKg(volumeStats.mediaDiaKg)} kg</p>
              </div>
            </div>
          </div>

          {/* Linha 5 – Tendência */}
          <div className="pt-6 border-t border-dashed border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Melhor Dia de Colheita</p>
                <h4 className="text-xl font-black text-slate-800 dark:text-white">
                  {formatSc(volumeStats.melhorDiaSc)} sc <span className="text-xs font-bold text-slate-400 ml-2">({volumeStats.melhorDiaData})</span>
                </h4>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800">
              <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-3 flex items-center gap-2">
                <Target size={14} /> Projeção de Meta
              </h4>
              <div className="space-y-2 text-[11px] font-medium text-blue-800 dark:text-blue-300">
                <p className="flex items-center gap-2">
                  <ArrowRight size={12} /> Meta: Entregar 5 cargas/dia (Média 48.000kg bruto / 40.000kg líq.)
                </p>
                <p className="flex items-center gap-2">
                  <ArrowRight size={12} /> Faltam aproximadamente <span className="font-black">840.000 kg</span> para colher e entregar.
                </p>
                <p className="flex items-center gap-2 font-black text-blue-700 dark:text-blue-200 mt-2">
                  <Calendar size={12} /> Estimativa: 4 dias para conclusão da meta.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}