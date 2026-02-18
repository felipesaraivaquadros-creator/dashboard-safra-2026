"use client";

import React, { useState } from 'react';
import { useDataProcessing } from '../../src/lib/useDataProcessing';
import KpiSection, { ProductivityModal } from '../../src/components/KpiSection';
import ChartSection from '../../src/components/ChartSection';
import ContractSection from '../../src/components/ContractSection';
import UmidadeModal from '../../src/components/UmidadeModal';
import VolumeModal from '../../src/components/VolumeModal';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import Link from 'next/link'; 
import { useParams } from 'next/navigation';
import { getSafraConfig } from '../../src/data/safraConfig';
import SafraSelector from '../../src/components/SafraSelector';
import NavigationMenu from '../../src/components/NavigationMenu';

export default function Dashboard() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);

  const {
    fazendaFiltro,
    armazemFiltro,
    setFazendaFiltro,
    setArmazemFiltro,
    stats,
    discountStats,
    volumeStats,
    romaneiosCount,
    contratosProcessados,
    chartFazendas,
    chartArmazens,
    getCorFazenda,
    getCorArmazem,
  } = useDataProcessing(safraId);

  const [showModalProd, setShowModalProd] = useState(false);
  const [showModalUmid, setShowModalUmid] = useState(false);
  const [showModalVolume, setShowModalVolume] = useState(false);

  const prodColor = fazendaFiltro ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400';
  const prodText = fazendaFiltro ? 'text-orange-600' : 'text-slate-400';

  const handleClearFilters = () => {
    setFazendaFiltro(null);
    setArmazemFiltro(null);
  };

  return (
    <main className="min-h-screen p-4 bg-slate-100 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 relative">
      <header className="max-w-[1400px] mx-auto mb-6 bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <NavigationMenu />
            
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate">
                Painel
              </h1>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {fazendaFiltro && <span style={{backgroundColor: getCorFazenda(fazendaFiltro)}} className="text-[8px] md:text-[10px] text-white px-1.5 py-0.5 rounded font-bold uppercase">{fazendaFiltro}</span>}
                {armazemFiltro && <span style={{backgroundColor: getCorArmazem(armazemFiltro)}} className="text-[8px] md:text-[10px] text-white px-1.5 py-0.5 rounded font-bold uppercase">{armazemFiltro}</span>}
              </div>
            </div>
          </div>

          <SafraSelector currentSafra={safraConfig} />
        </div>
        
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Link 
              href={`/${safraId}/fretes`} 
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
            >
              Fretes
            </Link>
            <Link 
              href={`/${safraId}/saldos`} 
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
            >
              Saldos
            </Link>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button 
              onClick={handleClearFilters} 
              className="text-[10px] md:text-xs font-black text-slate-400 hover:text-red-500 uppercase transition-colors dark:text-slate-500 dark:hover:text-red-400"
            >
              Limpar
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          
          <KpiSection 
            stats={stats} 
            fazendaFiltro={fazendaFiltro} 
            prodColor={prodColor} 
            prodText={prodText} 
            setShowModalProd={setShowModalProd} 
            setShowModalUmid={setShowModalUmid}
            setShowModalVolume={setShowModalVolume}
          />

          <ChartSection
            chartFazendas={chartFazendas}
            chartArmazens={chartArmazens}
            fazendaFiltro={fazendaFiltro}
            armazemFiltro={armazemFiltro}
            handleFiltroFazenda={setFazendaFiltro}
            handleFiltroArmazem={setArmazemFiltro}
            getCorFazenda={getCorFazenda}
            getCorArmazem={getCorArmazem}
          />
        </div>

        <ContractSection contratosProcessados={contratosProcessados} romaneiosCount={romaneiosCount} />
      </div>

      <ProductivityModal 
        showModalProd={showModalProd} 
        setShowModalProd={setShowModalProd} 
        fazendaFiltro={fazendaFiltro} 
        stats={stats} 
        romaneiosCount={romaneiosCount}
      />

      <UmidadeModal 
        showModalUmid={showModalUmid}
        setShowModalUmid={setShowModalUmid}
        fazendaFiltro={fazendaFiltro}
        armazemFiltro={armazemFiltro}
        discountStats={discountStats}
        totalBruta={stats.totalBruta}
        totalBrutaKg={stats.totalBrutaKg}
      />

      <VolumeModal 
        show={showModalVolume}
        onClose={() => setShowModalVolume(false)}
        stats={stats}
        volumeStats={volumeStats}
        discountStats={discountStats}
        romaneiosCount={romaneiosCount}
        fazendaFiltro={fazendaFiltro}
      />
    </main>
  );
}