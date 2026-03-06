"use client";

import React, { useMemo, useState } from 'react';
import { calculateSaldoDashboard } from '../../../src/lib/saldoProcessing';
import { Package, FileText, Scale, LayoutGrid, List } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import { useParams } from 'next/navigation';
import { getSafraConfig } from '../../../src/data/safraConfig';
import SafraSelector from '../../../src/components/SafraSelector';
import NavigationMenu from '../../../src/components/NavigationMenu';

// Componentes de Aba
import SaldosTab from '../../../src/components/saldos/SaldosTab';
import ContratosTab from '../../../src/components/saldos/ContratosTab';
import DisponivelTab from '../../../src/components/saldos/DisponivelTab';
import SaldosPorArmazem from '../../../src/components/saldos/SaldosPorArmazem';

type TabType = 'saldos' | 'contratos' | 'disponivel';
type ScenarioType = 'geral' | 'armazem';

export default function SaldoPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);

  const [activeTab, setActiveTab] = useState<TabType>('saldos');
  const [scenario, setScenario] = useState<ScenarioType>('geral');

  const data = useMemo(() => calculateSaldoDashboard(safraId), [safraId]);

  const isSoja2526 = safraId === 'soja2526';

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
      <header className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <NavigationMenu />
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate">Gestão de Saldos</h1>
          </div>
          <SafraSelector currentSafra={safraConfig} />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
          <Link 
            href={`/${safraId}/fretes`} 
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
          >
            Fretes
          </Link>
          <Link 
            href={`/${safraId}`} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            Painel
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto">
        
        {/* Seletor de Cenário (Apenas para Soja 25/26) */}
        {isSoja2526 && (
          <div className="flex justify-center mb-8">
            <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex gap-1">
              <button 
                onClick={() => setScenario('geral')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${scenario === 'geral' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={14} /> Saldos Gerais
              </button>
              <button 
                onClick={() => setScenario('armazem')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${scenario === 'armazem' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={14} /> Saldos por Armazém
              </button>
            </div>
          </div>
        )}

        {scenario === 'geral' ? (
          <>
            {/* Navegação por Abas */}
            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-[20px] mb-8 shadow-inner max-w-2xl mx-auto">
              <button 
                onClick={() => setActiveTab('saldos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] md:text-xs font-black uppercase rounded-2xl transition-all ${activeTab === 'saldos' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Package size={16} /> Saldos
              </button>
              <button 
                onClick={() => setActiveTab('contratos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] md:text-xs font-black uppercase rounded-2xl transition-all ${activeTab === 'contratos' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <FileText size={16} /> Contratos
              </button>
              <button 
                onClick={() => setActiveTab('disponivel')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] md:text-xs font-black uppercase rounded-2xl transition-all ${activeTab === 'disponivel' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Scale size={16} /> Disponível
              </button>
            </div>

            {/* Conteúdo das Abas */}
            <div className="min-h-[400px]">
              {activeTab === 'saldos' && (
                <SaldosTab 
                  lista={data.listaSaldos} 
                  totalSacas={data.totalEstoque} 
                  totalKg={data.totalEstoque * 60} 
                />
              )}
              
              {activeTab === 'contratos' && (
                <ContratosTab 
                  lista={data.listaContratos} 
                  totalSacas={data.totalContratos} 
                  totalKg={data.totalContratos * 60} 
                />
              )}
              
              {activeTab === 'disponivel' && (
                <DisponivelTab 
                  saldoGeral={data.saldoGeral}
                  saldoSipal={data.saldoContratosFixos}
                  saldoOutros={data.saldoOutros}
                  totalEstoque={data.totalEstoque}
                  totalContratos={data.totalContratos}
                />
              )}
            </div>
          </>
        ) : (
          <SaldosPorArmazem listaSaldos={data.listaSaldos} />
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
        }
      `}</style>
    </main>
  );
}