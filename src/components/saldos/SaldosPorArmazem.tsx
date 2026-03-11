"use client";

import React, { useMemo } from 'react';
import { Warehouse, Scale, CheckCircle2, AlertCircle, ArrowDown, Inbox, Layers } from 'lucide-react';
import { SaldoKpi } from '../../data/saldoTypes';

interface SaldosPorArmazemProps {
  listaSaldos: SaldoKpi[];
  listaContratos: any[]; 
}

interface GroupSectionProps {
  titulo: string;
  isGrupo: boolean;
  armazensNomes: string[];
  saldoReal: number;
  compromissos: { nome: string, total: number }[];
}

function GroupSection({ titulo, isGrupo, armazensNomes, saldoReal, compromissos }: GroupSectionProps) {
  const totalCompromissos = compromissos.reduce((sum, c) => sum + c.total, 0);
  const saldoLiquido = saldoReal - totalCompromissos;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-2">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center gap-2">
          {isGrupo && <Layers size={12} className="text-purple-500" />}
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            {isGrupo ? `GRUPO: ${titulo}` : titulo}
          </h2>
        </div>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Estoque */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Warehouse size={18} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">Estoque Físico</h3>
            </div>
            {isGrupo && <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase">Soma de {armazensNomes.length} locais</span>}
          </div>
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
            <div className="text-5xl font-black text-blue-600 tracking-tighter mb-2">
              {saldoReal.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs font-black uppercase italic text-slate-400">Sacas em Estoque</p>
            <div className="mt-4 space-y-1">
              {armazensNomes.map(n => (
                <p key={n} className="text-[8px] font-bold text-slate-300 uppercase tracking-wider">{n}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Card de Compromissos */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-purple-50/30 dark:bg-purple-900/10 flex items-center gap-3">
            <ArrowDown size={18} className="text-purple-600" />
            <h3 className="text-xs font-black uppercase italic tracking-tighter">Compromissos / Saídas</h3>
          </div>
          <div className="p-4 flex-1 space-y-2">
            {compromissos.length > 0 ? (
              compromissos.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 truncate mr-2">{item.nome}</span>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400 shrink-0">{item.total.toLocaleString('pt-BR')} sc</span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-8">
                <Inbox size={24} className="mb-2 opacity-20" />
                <p className="text-[9px] font-black uppercase">Nenhum contrato vinculado</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 border-t border-purple-100 dark:border-purple-800 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">Total Compromissos</span>
            <span className="text-sm font-black text-purple-800 dark:text-purple-200">{totalCompromissos.toLocaleString('pt-BR')} sc</span>
          </div>
        </div>

        {/* Card de Saldo Disponível */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-green-50/30 dark:bg-green-900/10 flex items-center gap-3">
            <Scale size={18} className="text-green-600" />
            <h3 className="text-xs font-black uppercase italic tracking-tighter">Saldo Disponível</h3>
          </div>
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Resultado Líquido</p>
            <div className={`text-6xl font-black tracking-tighter mb-4 ${saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {saldoLiquido.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs font-black uppercase italic mb-8">Sacas Livres</p>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase ${saldoLiquido >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {saldoLiquido >= 0 ? <><CheckCircle2 size={14} /> Saldo Positivo</> : <><AlertCircle size={14} /> Saldo Negativo</>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SaldosPorArmazem({ listaSaldos, listaContratos }: SaldosPorArmazemProps) {
  
  // Lógica de Agrupamento
  const groupedData = useMemo(() => {
    const groups: Record<string, { 
      armazens: string[], 
      saldoTotal: number, 
      contratos: { nome: string, total: number }[] 
    }> = {};

    // 1. Processar Saldos (Estoque Físico)
    listaSaldos.forEach(s => {
      // Se o armazém tem um grupo definido no banco, usamos ele. 
      // Caso contrário, usamos o próprio nome do armazém como chave única.
      const key = s.grupo || s.nome;
      if (!groups[key]) groups[key] = { armazens: [], saldoTotal: 0, contratos: [] };
      
      groups[key].armazens.push(s.nome);
      groups[key].saldoTotal += s.total;
    });

    // 2. Processar Contratos
    listaContratos.forEach(c => {
      // Prioridade: Grupo do Contrato -> Nome do Armazém vinculado -> "Outros"
      const key = c.grupo || c.armazem_nome || "Outros";
      
      if (!groups[key]) groups[key] = { armazens: [c.armazem_nome || "Geral"], saldoTotal: 0, contratos: [] };
      
      groups[key].contratos.push({ nome: c.nome, total: c.total });
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [listaSaldos, listaContratos]);

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {groupedData.map(([key, data]) => {
        // Verifica se é um grupo real (tem mais de um armazém ou o nome da chave é diferente do único armazém)
        const isGrupo = data.armazens.length > 1 || (data.armazens.length === 1 && data.armazens[0] !== key);

        return (
          <GroupSection 
            key={key}
            titulo={key}
            isGrupo={isGrupo}
            armazensNomes={data.armazens}
            saldoReal={data.saldoTotal}
            compromissos={data.contratos}
          />
        );
      })}

      {groupedData.length === 0 && (
        <div className="text-center py-20 text-slate-400 italic uppercase text-xs font-black">
          Nenhum dado disponível para esta safra.
        </div>
      )}
    </div>
  );
}