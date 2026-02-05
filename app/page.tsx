"use client";

import React, { useState } from 'react';
import { useDataProcessing } from '../src/hooks/useDataProcessing';
import KpiSection, { ProductivityModal } from '../src/components/KpiSection';
import ChartSection from '../src/components/ChartSection';
import ContractSection from '../src/components/ContractSection';
import UpdateDataButton from '../src/components/UpdateDataButton';

export default function Dashboard() {
  const {
    fazendaFiltro,
    armazemFiltro,
    setFazendaFiltro,
    setArmazemFiltro,
    stats,
    romaneiosCount, // Novo: Contagem de romaneios
    contratosProcessados,
    chartFazendas,
    chartArmazens,
    getCorFazenda,
    getCorArmazem,
  } = useDataProcessing();

  const [showModalProd, setShowModalProd] = useState(false);

  // Lógica para determinar a cor do KPI de Produtividade
  const prodColor = fazendaFiltro ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400';
  const prodText = fazendaFiltro ? 'text-purple-600' : 'text-slate-400';

  // Função para limpar todos os filtros
  const handleClearFilters = () => {
    setFazendaFiltro(null);
    setArmazemFiltro(null);
  };

  // Função para lidar com a atualização de dados (simulação)
  const handleDataUpdate = () => {
    // Esta função é chamada pelo UpdateDataButton.
    // Como estamos em um ambiente simulado, instruímos o usuário e forçamos o refresh.
    // O componente UpdateDataButton já exibe o toast.
    
    // Força o refresh do preview para carregar o novo JSON
    // Nota: O comando dyad-command deve ser emitido aqui para ser executado no ambiente Dyad.
    // No entanto, como o botão está em um componente separado, vou emitir a instrução de refresh
    // para o usuário após o toast ser exibido.
  };

  return (
    <main className="min-h-screen p-4 bg-slate-100 font-sans text-slate-900 relative">
      <header className="max-w-[1400px] mx-auto mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          {/* Título alterado */}
          <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Painel Soja - Safra 25/26</h1>
          <div className="flex gap-2 mt-1">
            {fazendaFiltro && <span style={{backgroundColor: getCorFazenda(fazendaFiltro)}} className="text-[10px] text-white px-2 py-0.5 rounded font-bold uppercase">{fazendaFiltro}</span>}
            {armazemFiltro && <span style={{backgroundColor: getCorArmazem(armazemFiltro)}} className="text-[10px] text-white px-2 py-0.5 rounded font-bold uppercase">{armazemFiltro}</span>}
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <UpdateDataButton />
          <button onClick={handleClearFilters} className="text-xs font-black text-slate-300 hover:text-red-500 uppercase transition-colors">Limpar Global</button>
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
        romaneiosCount={romaneiosCount} // Passando a contagem correta
      />
    </main>
  );
}