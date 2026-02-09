"use client";

import React, { useState } from 'react';
import { useDataProcessing } from '../../src/lib/useDataProcessing';
import KpiSection, { ProductivityModal } from '../../src/components/KpiSection';
import ChartSection from '../../src/components/ChartSection';
import ContractSection from '../../src/components/ContractSection';
import UpdateDataButton from '../../src/components/UpdateDataButton';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import Link from 'next/link'; 
import { useParams } from 'next/navigation';
import { getSafraConfig } from '../../src/data/safraConfig';
import { ArrowLeft } from 'lucide-react';

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
    romaneiosCount,
    contratosProcessados,
    chartFazendas,
    chartArmazens,
    getCorFazenda,
    getCorArmazem,
  } = useDataProcessing(safraId);

  const [showModalProd, setShowModalProd] = useState(false);

  // Lógica para determinar a cor do KPI de Produtividade
  const prodColor = fazendaFiltro ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400';
  const prodText = fazendaFiltro ? 'text-purple-600' : 'text-slate-400';

  // Função para limpar todos os filtros
  const handleClearFilters = () => {
    setFazendaFiltro(null);
    setArmazemFiltro(null);
  };

  return (
    <main className="min-h-screen p-4 bg-slate-100 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 relative">
      <header className="max-w-[1400px] mx-auto mb-6 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            {/* Título dinâmico */}
            <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Painel {safraConfig.tipo} - {safraConfig.nome}</h1>
            <div className="flex gap-2 mt-1">
              {fazendaFiltro && <span style={{backgroundColor: getCorFazenda(fazendaFiltro)}} className="text-[10px] text-white px-2 py-0.5 rounded font-bold uppercase">{fazendaFiltro}</span>}
              {armazemFiltro && <span style={{backgroundColor: getCorArmazem(armazemFiltro)}} className="text-[10px] text-white px-2 py-0.5 rounded font-bold uppercase">{armazemFiltro}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <UpdateDataButton />
          
          {/* Novo Botão Saldos com rota dinâmica */}
          <Link 
            href={`/${safraId}/saldos`} 
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
          >
            Saldos
          </Link>
          
          {/* Toggle de Tema */}
          <ThemeToggle />

          <button onClick={handleClearFilters} className="text-xs font-black text-slate-300 hover:text-red-500 uppercase transition-colors dark:text-slate-500 dark:hover:text-red-400">Limpar Global</button>
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
    </main>
  );
}