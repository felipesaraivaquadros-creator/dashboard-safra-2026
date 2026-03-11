"use client";

import React, { useMemo } from 'react';
import { Warehouse, FileText, Scale, CheckCircle2, AlertCircle, ArrowDown, Inbox } from 'lucide-react';
import { SaldoKpi } from '../../data/saldoTypes';

interface SaldosPorArmazemProps {
  listaSaldos: SaldoKpi[];
}

// Componente Interno para as Seções de Armazém
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
        {/* Card 1: Saldo Físico (AZUL) */}
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

        {/* Card 2: Compromissos (ROXO) */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-purple-50/30 dark:bg-purple-900/10 flex items-center gap-3">
            <ArrowDown size={18} className="text-purple-600" />
            <h3 className="text-xs font-black uppercase italic tracking-tighter">Compromissos / Saídas</h3>
          </div>
          <div className="p-4 flex-1 space-y-2">
            {compromissos.length > 0 ? (
              compromissos.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400">{item.nome}</span>
                  <span className="text-xs font-black text-purple-600 dark:text-purple-400">{item.total.toLocaleString('pt-BR')} sc</span>
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

        {/* Card 3: Saldo Disponível (VERDE) */}
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

export default function SaldosPorArmazem({ listaSaldos }: SaldosPorArmazemProps) {
  // --- SEÇÃO 1: CONCILIAÇÃO COFCO/MATUPÁ (Lógica Especial Soja 25/26) ---
  const contratosFixos = [
    { nome: "Contrato de Venda (72208)", total: 20000 },
    { nome: "Contrato de Adubo (290925M339)", total: 29500 },
    { nome: "Arrendamento IVO (ARR-SLZ)", total: 4050 },
    { nome: "Contrato Comissão (Comissoes)", total: 800 },
  ];

  const totalContratosSc = contratosFixos.reduce((sum, c) => sum + c.total, 0);

  const dadosConciliacao = useMemo(() => {
    const cofco = listaSaldos.find(s => s.nome === "COFCO NSH")?.total || 0;
    const sipalMatupa = listaSaldos.find(s => s.nome === "SIPAL MATUPÁ")?.total || 0;
    const sipalLRVNecessario = Math.max(totalContratosSc - (cofco + sipalMatupa), 0);

    return [
      { nome: "COFCO NSH", sc: cofco, kg: cofco * 60 },
      { nome: "SIPAL MATUPÁ", sc: sipalMatupa, kg: sipalMatupa * 60 },
      { nome: "SIPAL LRV (Alocado)", sc: sipalLRVNecessario, kg: sipalLRVNecessario * 60 },
    ];
  }, [listaSaldos, totalContratosSc]);

  const totalAlocadoSc = dadosConciliacao.reduce((sum, d) => sum + d.sc, 0);
  const saldoConciliacao = totalAlocadoSc - totalContratosSc;

  // --- BUSCA DE SALDOS REAIS ---
  const getSaldo = (nome: string) => listaSaldos.find(s => s.nome.includes(nome))?.total || 0;

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* SEÇÃO DE CONCILIAÇÃO (RESUMO) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Alocação de Contratos Fixados (Soja 25/26)</h2>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-blue-50/30 dark:bg-blue-900/10 flex items-center gap-3">
              <Warehouse size={18} className="text-blue-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">1. Saldos Armazéns</h3>
            </div>
            <div className="p-4 flex-1 space-y-3">
              {dadosConciliacao.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{item.nome}</span>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">{item.kg.toLocaleString('pt-BR')} kg</p>
                    <p className="text-sm font-black text-blue-600 dark:text-blue-400 leading-none">{item.sc.toLocaleString('pt-BR')} sc</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300">Total Alocado</span>
              <span className="text-sm font-black text-blue-800 dark:text-blue-200">{totalAlocadoSc.toLocaleString('pt-BR')} sc</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-purple-50/30 dark:bg-purple-900/10 flex items-center gap-3">
              <FileText size={18} className="text-purple-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">2. Contratos Vinculados</h3>
            </div>
            <div className="p-4 flex-1 space-y-3">
              {contratosFixos.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">{item.nome}</span>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 leading-none mb-1">{(item.total * 60).toLocaleString('pt-BR')} kg</p>
                    <p className="text-sm font-black text-purple-600 dark:text-purple-400 leading-none">{item.total.toLocaleString('pt-BR')} sc</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-purple-50/50 dark:bg-purple-900/20 border-t border-purple-100 dark:border-purple-800 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">Total Contratos</span>
              <span className="text-sm font-black text-purple-800 dark:text-purple-200">{totalContratosSc.toLocaleString('pt-BR')} sc</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center gap-3">
              <Scale size={18} className="text-slate-600" />
              <h3 className="text-xs font-black uppercase italic tracking-tighter">3. Conciliação / Alocação</h3>
            </div>
            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Diferença Final</p>
              <div className={`text-6xl font-black tracking-tighter mb-4 ${saldoConciliacao === 0 ? 'text-slate-800 dark:text-white' : saldoConciliacao > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {saldoConciliacao.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs font-black uppercase italic mb-8">Sacas</p>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase ${saldoConciliacao === 0 ? 'bg-slate-100 text-slate-600' : saldoConciliacao > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {saldoConciliacao === 0 ? <><CheckCircle2 size={14} /> Conciliado</> : saldoConciliacao > 0 ? <><CheckCircle2 size={14} /> Saldo Excedente</> : <><AlertCircle size={14} /> Saldo a Cumprir</>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÕES INDIVIDUAIS POR ARMAZÉM */}
      
      <WarehouseSection 
        titulo="Sipal LRV"
        nomeArmazem="SIPAL LRV"
        saldoReal={getSaldo("SIPAL LRV")}
        compromissos={[
          { nome: "DIFERENÇA COFCO", total: 457 },
          { nome: "BEDIN (6750SC)", total: 6750 },
          { nome: "COMISS A FIXAR", total: 1000 },
        ]}
      />

      <WarehouseSection 
        titulo="Sipal Cláudia"
        nomeArmazem="SIPAL CLÁUDIA"
        saldoReal={getSaldo("SIPAL CLÁUDIA")}
        compromissos={[
          { nome: "ARRENDAMENTO CT (ARR-CST)", total: 10000 },
        ]}
      />

      <WarehouseSection 
        titulo="AC Grãos"
        nomeArmazem="AC GRÃOS"
        saldoReal={getSaldo("AC GRÃOS")}
        compromissos={[]}
      />

      <WarehouseSection 
        titulo="Amaggi Matupá"
        nomeArmazem="AMAGGI MATUPÁ"
        saldoReal={getSaldo("AMAGGI MATUPÁ")}
        compromissos={[]}
      />

      <WarehouseSection 
        titulo="Go Agro"
        nomeArmazem="GO AGRO"
        saldoReal={getSaldo("GO AGRO")}
        compromissos={[]}
      />

      <WarehouseSection 
        titulo="Amaggi Sinop"
        nomeArmazem="AMAGGI SINOP"
        saldoReal={getSaldo("AMAGGI SINOP")}
        compromissos={[]}
      />

    </div>
  );
}