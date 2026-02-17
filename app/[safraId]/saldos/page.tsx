"use client";

import React, { useMemo } from 'react';
import { calculateSaldoDashboard } from '../../../src/lib/saldoProcessing';
import { Package, FileText, Scale, TrendingUp, Warehouse, AlertTriangle, CheckCircle, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import { useParams } from 'next/navigation';
import { getSafraConfig } from '../../../src/data/safraConfig';
import { SaldoKpi } from '../../../src/data/saldoTypes';
import SafraSelector from '../../../src/components/SafraSelector';
import NavigationMenu from '../../../src/components/NavigationMenu';

interface SaldoCardConfig {
  title: string;
  icon: LucideIcon;
  bg: string;
  border: string;
  text: string;
  subText: string;
  iconBg: string;
  trendingIcon: LucideIcon;
}

function SaldoKpiList({ items, valueColor }: { items: SaldoKpi[], valueColor: string }) {
  const isContractList = items.some(item => item.id);

  return (
    <div className="flex-1 space-y-2 mb-4 max-h-64 overflow-y-auto custom-scrollbar">
      {isContractList && (
        <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 pb-1 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <span className="w-1/3 truncate">Contrato</span>
          <span className="w-1/3 truncate text-center">Nº Contrato</span>
          <span className="w-1/3 truncate text-right">Sacas / KG</span>
        </div>
      )}
      
      {items.map((kpi, i) => (
        <div key={i} className="flex justify-between items-start text-[11px] border-b border-slate-50 dark:border-slate-700 pb-1 pt-1">
          {isContractList ? (
            <>
              <span className="font-bold text-slate-600 dark:text-slate-300 uppercase truncate w-1/3 mt-0.5">{kpi.nome}</span>
              <span className="font-medium text-slate-500 dark:text-slate-400 truncate w-1/3 text-center text-[10px] mt-0.5">{kpi.id || 'N/A'}</span>
              <div className="w-1/3 text-right">
                <span className={`font-black ${valueColor} block leading-none`}>{kpi.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
                <span className="text-[8px] font-bold text-slate-400">{kpi.totalKg?.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</span>
              </div>
            </>
          ) : (
            <>
              <span className="font-bold text-slate-600 dark:text-slate-300 uppercase truncate w-2/3 mt-0.5">{kpi.nome}</span>
              <div className="w-1/3 text-right">
                <span className={`font-black ${valueColor} block leading-none`}>{kpi.total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
                <span className="text-[8px] font-bold text-slate-400">{kpi.totalKg?.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</span>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function SaldoPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);

  const data = useMemo(() => calculateSaldoDashboard(safraId), [safraId]);
  
  const saldo = data.saldoContratosFixos;
  const saldoKg = data.saldoContratosFixosKg;
  const isExcedente = saldo >= 0;
  const saldoAbsoluto = Math.abs(saldo);
  const saldoAbsolutoKg = Math.abs(saldoKg);
  
  const isSafraPassada = safraId === 'soja2425' || safraId === 'milho25';

  const saldoCardConfig: SaldoCardConfig = isExcedente ? {
    title: "Saldo Excedente",
    icon: CheckCircle,
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-200 dark:border-green-800",
    text: "text-green-900 dark:text-green-200",
    subText: "text-green-700/70 dark:text-green-400/70",
    iconBg: "bg-green-200 text-green-700 dark:bg-green-700 dark:text-white",
    trendingIcon: TrendingUp,
  } : {
    title: "Déficit a Cumprir",
    icon: AlertTriangle,
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-900 dark:text-red-200",
    subText: "text-red-700/70 dark:text-green-400/70",
    iconBg: "bg-red-200 text-red-700 dark:bg-red-700 dark:text-white",
    trendingIcon: Scale,
  };
  
  const IconComponent = saldoCardConfig.icon;
  const TrendingIconComponent = saldoCardConfig.trendingIcon;

  const section1Title = isSafraPassada 
    ? "Resumo de Estoque e Contratos (Final de Safra)"
    : "Saldos Sipal destinados para baixa e cumprimento de contratos fixados";

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
      <header className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <NavigationMenu />
            
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate">Resumo de Saldos</h1>
            </div>
          </div>

          <SafraSelector currentSafra={safraConfig} />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Link 
              href={`/${safraId}/fretes`} 
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
            >
              Fretes
            </Link>
            <ThemeToggle />
          </div>
          <Link href={`/${safraId}`} className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto mb-10">
        <h2 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <FileText size={14} /> {section1Title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
                <Package size={16} className="text-blue-500" /> Estoque Entregue
              </h3>
            </div>
            
            <SaldoKpiList items={data.estoqueArmazensFixos} valueColor="text-blue-600 dark:text-blue-400" />

            <div className="pt-3 border-t border-dashed border-slate-100 dark:border-slate-700 flex justify-between items-start">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase italic mt-1">Total Entregue</span>
              <div className="text-right">
                <span className="text-xl font-black text-blue-600 block leading-none">{data.estoqueTotalContratosFixos.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
                <span className="text-[10px] font-bold text-slate-400">{data.estoqueTotalContratosFixosKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest">
                <FileText size={16} className="text-purple-500" /> Volume Contratado
              </h3>
            </div>
            
            <SaldoKpiList items={data.contratosFixos} valueColor="text-purple-600 dark:text-purple-400" />

            <div className="pt-3 border-t border-dashed border-slate-100 dark:border-slate-700 flex justify-between items-start">
              <span className="text-xs font-black text-slate-800 dark:text-white uppercase italic mt-1">Total Contratado</span>
              <div className="text-right">
                <span className="text-xl font-black text-purple-600 block leading-none">{data.volumeFixoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc</span>
                <span className="text-[10px] font-bold text-slate-400">{data.volumeFixoTotalKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</span>
              </div>
            </div>
          </div>

          <div className={`${saldoCardConfig.bg} ${saldoCardConfig.border} border-2 p-6 rounded-3xl shadow-lg flex flex-col justify-between relative overflow-hidden group`}>
            <div className={`absolute -right-4 -top-4 ${saldoCardConfig.text}/50 rotate-12 transition-transform group-hover:scale-110`}>
              <TrendingIconComponent size={120} />
            </div>
            
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-3 rounded-xl ${saldoCardConfig.iconBg}`}>
                <IconComponent size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest italic" style={{ color: saldoCardConfig.subText.split(' ')[0] }}>{saldoCardConfig.title}</span>
            </div>

            <div className="relative z-10 mt-4">
              <p className="text-xs font-black uppercase mb-1" style={{ color: saldoCardConfig.subText.split(' ')[0] }}>{isExcedente ? 'Volume Disponível' : 'Volume Pendente'}</p>
              <h2 className={`text-4xl font-black tracking-tighter ${saldoCardConfig.text} leading-none`}>
                {saldoAbsoluto.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} <span className="text-lg">sc</span>
              </h2>
              <p className={`text-sm font-black mt-1 ${saldoCardConfig.text} opacity-80`}>{saldoAbsolutoKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</p>
              <p className={`text-[10px] font-bold uppercase mt-4 flex items-center gap-1 italic ${saldoCardConfig.subText}`}>
                * Cálculo: Entregue - Contratado
              </p>
            </div>
          </div>
        </div>
      </div>

      {!isSafraPassada && (
        <div className="max-w-[1200px] mx-auto mb-10">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Warehouse size={14} /> Saldo em Outros Armazéns (Total: {data.estoqueTotalOutrosArmazens.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.kpisArmazemOutros.length > 0 ? (
              data.kpisArmazemOutros.map((kpi, i) => {
                return (
                  <div 
                    key={i} 
                    className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md transition-all hover:scale-[1.02] hover:border-blue-500 dark:hover:border-blue-500 cursor-default"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Warehouse size={16} className="text-blue-500 dark:text-blue-400" />
                      <p className="text-[10px] font-black uppercase truncate text-slate-500 dark:text-slate-400">{kpi.nome}</p>
                    </div>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white leading-none">
                      {kpi.total.toLocaleString('pt-BR')} <span className="text-sm font-bold text-slate-400">sc</span>
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{kpi.totalKg?.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg</p>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-10 text-center text-slate-400 text-[10px] font-bold uppercase italic border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                Nenhuma carga encontrada em outros armazéns.
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
      `}</style>
    </main>
  );
}