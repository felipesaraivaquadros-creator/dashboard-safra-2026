"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { useFretesData } from '../../../src/lib/useFretesData';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import SafraSelector from '../../../src/components/SafraSelector';
import NavigationMenu from '../../../src/components/NavigationMenu';

// Novos Componentes Modulares
import TabelaPrecosReferencia from '../../../src/components/fretes/TabelaPrecosReferencia';
import FiltrosFrete from '../../../src/components/fretes/FiltrosFrete';
import TabelaFretes from '../../../src/components/fretes/TabelaFretes';
import TabelaAdiantamentos from '../../../src/components/fretes/TabelaAdiantamentos';
import TabelaAbastecimentos from '../../../src/components/fretes/TabelaAbastecimentos';
import ResumoFinanceiro from '../../../src/components/fretes/ResumoFinanceiro';
import AcoesRelatorio from '../../../src/components/fretes/AcoesRelatorio';
import TabelaConsolidada from '../../../src/components/fretes/TabelaConsolidada';

export default function FretesPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const [mounted, setMounted] = useState(false);

  const {
    safraConfig,
    isSoja2526,
    motoristaFiltro, setMotoristaFiltro,
    placaFiltro, setPlacaFiltro,
    armazemFiltro, setArmazemFiltro,
    tipoCalculo, setTipoCalculo,
    modeloRelatorio, setModeloRelatorio,
    showRelatorio, setShowRelatorio,
    sortConfig, handleSort,
    motoristas, placas, armazens,
    dadosFretes, fretesPorFazenda, fretesConsolidados,
    dadosAdiantamentos, dadosAbastecimentos,
    totaisFreteGlobal, totalAdiantamentos, totaisAbastecimento,
    saldoFinal,
    calcularTotais
  } = useFretesData(safraId);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLimpar = () => {
    setMotoristaFiltro("");
    setPlacaFiltro("");
    setArmazemFiltro("");
    setTipoCalculo('com');
    setModeloRelatorio('simples');
    setShowRelatorio(false);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 print:bg-white print:p-0 print:min-h-0">
      <header className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <NavigationMenu />
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate">Fechamento de Fretes</h1>
          </div>
          <SafraSelector currentSafra={safraConfig} />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
          <Link 
            href={`/${safraId}/saldos`} 
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
          >
            Saldos
          </Link>
          <Link 
            href={`/${safraId}`} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            Painel
          </Link>
          <ThemeToggle />
          <button onClick={handleLimpar} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase transition-colors">Limpar</button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto space-y-8 print:space-y-0">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
          <div className="lg:col-span-4">
            <TabelaPrecosReferencia safraConfig={safraConfig} />
          </div>
          <div className="lg:col-span-8">
            <FiltrosFrete 
              motoristaFiltro={motoristaFiltro} setMotoristaFiltro={setMotoristaFiltro}
              placaFiltro={placaFiltro} setPlacaFiltro={setPlacaFiltro}
              armazemFiltro={armazemFiltro} setArmazemFiltro={setArmazemFiltro}
              tipoCalculo={tipoCalculo} setTipoCalculo={setTipoCalculo}
              modeloRelatorio={modeloRelatorio} setModeloRelatorio={setModeloRelatorio}
              motoristas={motoristas} placas={placas} armazens={armazens}
              onGerar={() => setShowRelatorio(true)}
            />
          </div>
        </div>

        {showRelatorio && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 print:space-y-0">
            
            {/* Cabeçalho Exclusivo para Impressão */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
              <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Relatório de Fretes</h1>
              <div className="grid grid-cols-2 gap-y-1 text-xs font-bold uppercase">
                <p><span className="text-slate-500">Motorista:</span> {motoristaFiltro || "Todos"}</p>
                <p><span className="text-slate-500">Safra:</span> {safraConfig.nome}</p>
                {placaFiltro && <p><span className="text-slate-500">Placa:</span> {placaFiltro}</p>}
                {armazemFiltro && <p><span className="text-slate-500">Armazém:</span> {armazemFiltro}</p>}
                <p><span className="text-slate-500">Modelo:</span> {modeloRelatorio === 'simples' ? 'Simples' : modeloRelatorio === 'fazenda' ? 'Agrupado por Fazenda' : 'Consolidado por Motorista'}</p>
              </div>
            </div>

            {modeloRelatorio === 'simples' && (
              <TabelaFretes 
                lista={dadosFretes} 
                tipoCalculo={tipoCalculo} 
                sortConfig={sortConfig}
                onSort={handleSort}
                calcularTotais={calcularTotais} 
              />
            )}

            {modeloRelatorio === 'fazenda' && (
              <div className="space-y-8 print:space-y-0">
                {Object.entries(fretesPorFazenda).map(([fazenda, lista], idx) => (
                  <TabelaFretes 
                    key={fazenda} 
                    lista={lista} 
                    titulo={`${idx + 1}. Fazenda: ${fazenda}`} 
                    subtotal 
                    tipoCalculo={tipoCalculo}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    calcularTotais={calcularTotais}
                  />
                ))}
                
                <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg flex justify-between items-center print:bg-white print:text-slate-900 print:border-2 print:border-blue-600 print:rounded-none print:mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg print:hidden"><Layers size={20}/></div>
                    <h2 className="text-lg font-black uppercase italic tracking-tighter">Total Geral de Fretes (Todas as Fazendas)</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase opacity-70">Soma dos Subtotais</p>
                    <p className="text-2xl font-black">R$ {totaisFreteGlobal.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            )}

            {modeloRelatorio === 'consolidado' && (
              <TabelaConsolidada lista={fretesConsolidados} />
            )}

            {isSoja2526 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:space-y-8">
                  <TabelaAdiantamentos lista={dadosAdiantamentos} total={totalAdiantamentos} />
                  <TabelaAbastecimentos lista={dadosAbastecimentos} totais={totaisAbastecimento} />
                </div>

                <ResumoFinanceiro 
                  totaisFrete={totaisFreteGlobal.valor}
                  totalAdiantamentos={totalAdiantamentos}
                  totalAbastecimentos={totaisAbastecimento.valor}
                  saldoFinal={saldoFinal}
                />
              </>
            )}

            {/* Botões de Ação Finais */}
            <AcoesRelatorio 
              dados={dadosFretes} 
              motorista={motoristaFiltro} 
              totalValor={isSoja2526 ? saldoFinal : totaisFreteGlobal.valor}
              fazendas={dadosFretes.map(r => r.fazenda || "")}
            />
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 1cm; size: auto; }
          body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
          .animate-in { animation: none !important; transform: none !important; opacity: 1 !important; }
          main { padding: 0 !important; margin: 0 !important; min-height: auto !important; display: block !important; }
          tfoot { display: table-row-group !important; }
          section { break-inside: avoid !important; page-break-inside: avoid !important; margin-top: 0 !important; margin-bottom: 1.5rem !important; }
          .bg-slate-900, .dark\\:bg-purple-950 { background-color: white !important; color: black !important; border: 1px solid #e2e8f0 !important; }
        }
      `}</style>
    </main>
  );
}