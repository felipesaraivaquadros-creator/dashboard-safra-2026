"use client";

import React, { useMemo, useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { ProcessedContract } from '../data/types';
import {
  ContratoFinanceiroResumo,
  STATUS_ENTREGA_BARTER_LABELS,
} from '../data/financeiroTypes';
import { isContractFinanciallyFulfilled } from '../lib/financeiroCalculations';
import FinanceiroStatusBadge from './financeiro/FinanceiroStatusBadge';

type DashboardContract = ProcessedContract & {
  financeiroResumo: ContratoFinanceiroResumo | null;
};

interface ContractSectionProps {
  contratosProcessados: {
    pendentes: ProcessedContract[];
    cumpridos: ProcessedContract[];
  };
  financeiroSummaries: ContratoFinanceiroResumo[];
  romaneiosCount: number; 
}

const barterStatusClasses = {
  a_cumprir: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  cumprido: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export default function ContractSection({ contratosProcessados, financeiroSummaries, romaneiosCount }: ContractSectionProps) {
  const [contratoExpandido, setContratoExpandido] = useState<string | null>(null);
  const [abaContratos, setAbaContratos] = useState<'pendentes' | 'cumpridos'>('pendentes');

  const contratosPorStatus = useMemo(() => {
    const summaryById = new Map(financeiroSummaries.map((summary) => [summary.contratoId, summary]));
    const allContracts = Array.from(new Map(
      [...contratosProcessados.pendentes, ...contratosProcessados.cumpridos]
        .map((contract) => [contract.db_id || contract.id, contract]),
    ).values());

    const enriched: DashboardContract[] = allContracts.map((contract) => {
      const financeiroResumo = contract.db_id ? summaryById.get(contract.db_id) || null : null;
      const cumprido = financeiroResumo?.volumeEntregue ?? contract.cumprido;
      const aCumprir = Math.max(contract.contratado - cumprido, 0);
      const porcentagem = contract.contratado > 0
        ? Math.min((cumprido / contract.contratado) * 100, 100)
        : (cumprido > 0 ? 100 : 0);

      return {
        ...contract,
        cumprido: Number(cumprido.toFixed(2)),
        aCumprir: Number(aCumprir.toFixed(2)),
        porcentagem: porcentagem.toFixed(1),
        isConcluido: financeiroResumo ? isContractFinanciallyFulfilled(financeiroResumo) : false,
        financeiroResumo,
      };
    });

    return {
      pendentes: enriched.filter((contract) => !contract.isConcluido).sort((a, b) => b.cumprido - a.cumprido),
      cumpridos: enriched.filter((contract) => contract.isConcluido).sort((a, b) => b.cumprido - a.cumprido),
    };
  }, [contratosProcessados, financeiroSummaries]);

  const contratosAtivos = contratosPorStatus[abaContratos];

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
            Pendentes <span className="ml-1 opacity-70">({contratosPorStatus.pendentes.length})</span>
          </button>
          <button 
            onClick={() => setAbaContratos('cumpridos')} 
            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${abaContratos === 'cumpridos' ? 'bg-white dark:bg-slate-800 text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            Cumpridos <span className="ml-1 opacity-70">({contratosPorStatus.cumpridos.length})</span>
          </button>
        </div>
      </div>
      <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-slate-50/20 dark:bg-slate-900/20">
        {contratosAtivos.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase italic">
            {abaContratos === 'pendentes' ? 'Nenhum contrato pendente.' : 'Nenhum contrato cumprido.'}
          </div>
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
                  {c.financeiroResumo && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.financeiroResumo.tipoContrato !== 'barter' && c.financeiroResumo.tipoContrato !== 'arrendamento' && (
                        <FinanceiroStatusBadge status={c.financeiroResumo.status} compact />
                      )}
                      {(c.financeiroResumo.tipoContrato === 'barter' || c.financeiroResumo.tipoContrato === 'misto') && (
                        <span className={`rounded px-2 py-1 text-[8px] font-black uppercase ${barterStatusClasses[c.financeiroResumo.barterStatusEntrega]}`}>
                          {STATUS_ENTREGA_BARTER_LABELS[c.financeiroResumo.barterStatusEntrega]}
                        </span>
                      )}
                    </div>
                  )}
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
