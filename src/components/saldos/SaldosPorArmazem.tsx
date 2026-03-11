"use client";

import React, { useMemo } from 'react';
import { Warehouse, Scale, CheckCircle2, AlertCircle, ArrowDown, Inbox } from 'lucide-react';
import { SaldoKpi } from '../../data/saldoTypes';

interface SaldosPorArmazemProps {
  listaSaldos: SaldoKpi[];
  listaContratos: any[]; // Recebe os contratos do banco
}

interface WarehouseSectionProps {
  titulo: string;
  nomeArmazem: string;
  saldoReal: number;
  compromissos: { nome: string, total: number }[];
}

function WarehouseSection({ titulo, nomeArmazem, saldoReal, compromissos }: WarehouseSectionProps) {
  const totalCompromissos = compromissos.reduce((sum, c) => sum + c.total, 0);
  const saldoLiquido = saldoReal - totalCompromissos;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-2">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{titulo}</h2>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10 flex items-center gap-3">
            <Warehouse size={18} className="text-blue-600" />
            <h3 className="text-xs font-black uppercase italic tracking-tighter">Saldo {nomeArmazem}</h3>
          </div>
          <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Estoque Físico</p>
            <div className="text-5xl font-black text-blue-600 tracking-tighter mb-2">
              {saldoReal.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs font-black uppercase italic text-slate-400">Sacas em Estoque</p>
            <p className="text-[10px] font-bold text-slate-300 mt-4">{(saldoReal * 60).toLocaleString('pt-BR')} KG</p>
          </div>
        </div>

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
  // Lista de armazéns únicos que possuem saldo ou contratos
  const armazensUnicos = useMemo(() => {
    const nomes = new Set<string>();
    listaSaldos.forEach(s => nomes.add(s.nome));
    listaContratos.forEach(c => {
      if (c.armazem_nome) nomes.add(c.armazem_nome);
    });
    return Array.from(nomes).sort();
  }, [listaSaldos, listaContratos]);

  const getSaldo = (nome: string) => listaSaldos.find(s => s.nome === nome)?.total || 0;
  
  const getContratosPorArmazem = (nome: string) => 
    listaContratos.filter(c => c.armazem_nome === nome);

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {armazensUnicos.map(nome => (
        <WarehouseSection 
          key={nome}
          titulo={nome}
          nomeArmazem={nome}
          saldoReal={getSaldo(nome)}
          compromissos={getContratosPorArmazem(nome).map(c => ({
            nome: c.nome,
            total: c.total
          }))}
        />
      ))}

      {armazensUnicos.length === 0 && (
        <div className="text-center py-20 text-slate-400 italic uppercase text-xs font-black">
          Nenhum dado de armazém disponível para esta safra.
        </div>
      )}
    </div>
  );
}