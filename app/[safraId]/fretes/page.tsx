"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Truck, FileText, Calculator, Search, Filter, Printer, Settings2 } from 'lucide-react';
import { getSafraConfig } from '../../../src/data/safraConfig';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import SafraSelector from '../../../src/components/SafraSelector';
import UpdateDataButton from '../../../src/components/UpdateDataButton';
import { Romaneio } from '../../../src/data/types';

const dataMap: Record<string, Romaneio[]> = {
  'soja2526': require('../../../src/data/soja2526/romaneios_normalizados.json'),
  'soja2425': require('../../../src/data/soja2425/romaneios_normalizados.json'),
  'milho25': require('../../../src/data/milho25/romaneios_normalizados.json'),
  'milho26': require('../../../src/data/milho26/romaneios_normalizados.json'),
};

export default function FretesPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);
  const romaneios = dataMap[safraId] || [];

  // Estados dos Filtros
  const [motoristaFiltro, setMotoristaFiltro] = useState("");
  const [placaFiltro, setPlacaFiltro] = useState("");
  const [armazemFiltro, setArmazemFiltro] = useState("");
  const [tipoCalculo, setTipoCalculo] = useState<'com' | 'sem'>('com');
  const [showRelatorio, setShowRelatorio] = useState(false);

  // Opções para os selects
  const motoristas = useMemo(() => Array.from(new Set(romaneios.map(r => r.motorista).filter(Boolean))).sort(), [romaneios]);
  const placas = useMemo(() => Array.from(new Set(romaneios.map(r => r.placa).filter(Boolean))).sort(), [romaneios]);
  const armazens = useMemo(() => Array.from(new Set(romaneios.map(r => r.armazem).filter(Boolean))).sort(), [romaneios]);

  // Lógica do Relatório
  const dadosRelatorio = useMemo(() => {
    if (!showRelatorio) return [];
    return romaneios.filter(r => {
      const matchM = !motoristaFiltro || r.motorista === motoristaFiltro;
      const matchP = !placaFiltro || r.placa === placaFiltro;
      const matchA = !armazemFiltro || r.armazem === armazemFiltro;
      return matchM && matchP && matchA;
    });
  }, [showRelatorio, romaneios, motoristaFiltro, placaFiltro, armazemFiltro]);

  // Cálculo dos totais baseado na escolha do usuário
  const totais = useMemo(() => {
    return dadosRelatorio.reduce((acc, r) => {
      const sacasOriginal = Number(r.sacasBruto) || 0;
      const sacasUsada = tipoCalculo === 'com' ? Math.floor(sacasOriginal) : sacasOriginal;
      const preco = Number(r.precofrete) || 0;
      const subtotal = sacasUsada * preco;

      acc.sacas += sacasUsada;
      acc.valor += subtotal;
      return acc;
    }, { sacas: 0, valor: 0 });
  }, [dadosRelatorio, tipoCalculo]);

  const handleLimpar = () => {
    setMotoristaFiltro("");
    setPlacaFiltro("");
    setArmazemFiltro("");
    setTipoCalculo('com');
    setShowRelatorio(false);
  };

  // Helper para formatar data AAAA-MM-DD para DD-MM-AAAA
  const formatarDataBR = (dataISO: string | null) => {
    if (!dataISO) return "-";
    const partes = dataISO.split('-');
    if (partes.length !== 3) return dataISO;
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
      <header className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href={`/${safraId}`} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate">Fretes & Pagamentos</h1>
          </div>
          <SafraSelector currentSafra={safraConfig} />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
          <Link href={`/${safraId}/saldos`} className="px-3 py-2 text-[10px] font-black uppercase rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md">Saldos</Link>
          <UpdateDataButton />
          <ThemeToggle />
          <button onClick={handleLimpar} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase transition-colors">Limpar</button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Tabela de Preços de Referência */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden print:hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <Calculator size={18} className="text-blue-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Tabela de Preços (Referência)</h2>
          </div>
          <div className="p-6">
            {safraConfig.TABELA_FRETES.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {safraConfig.TABELA_FRETES.map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1 truncate">{item.local}</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">R$ {item.preco.toFixed(2)}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">por saca</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-[10px] font-bold uppercase italic border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-3xl">
                Tabela de preços não configurada para esta safra.
              </div>
            )}
          </div>
        </section>

        {/* Filtros do Relatório */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
          <div className="flex items-center gap-2 mb-6">
            <Filter size={18} className="text-purple-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Gerar Relatório</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Motorista</label>
              <select 
                value={motoristaFiltro} 
                onChange={(e) => setMotoristaFiltro(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="">Todos os Motoristas</option>
                {motoristas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Placa</label>
              <select 
                value={placaFiltro} 
                onChange={(e) => setPlacaFiltro(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="">Todas as Placas</option>
                {placas.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Armazém</label>
              <select 
                value={armazemFiltro} 
                onChange={(e) => setArmazemFiltro(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="">Todos os Armazéns</option>
                {armazens.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
                <Settings2 size={10} /> Cálculo
              </label>
              <select 
                value={tipoCalculo} 
                onChange={(e) => setTipoCalculo(e.target.value as 'com' | 'sem')}
                className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="com">Com Arredondamento</option>
                <option value="sem">Sem Arredondamento</option>
              </select>
            </div>
            <button 
              onClick={() => setShowRelatorio(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Search size={16} /> Gerar Relatório
            </button>
          </div>
        </section>

        {/* Relatório Gerado */}
        {showRelatorio && (
          <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 print:shadow-none print:border-none print:rounded-none">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white mb-1">Relatório de Fretes</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black uppercase text-slate-400">
                  <span>Safra: <span className="text-purple-600">{safraConfig.nome}</span></span>
                  <span>Motorista: <span className="text-slate-600 dark:text-slate-200">{motoristaFiltro || "Geral"}</span></span>
                  <span className="print:hidden">Lógica: <span className="text-blue-600">{tipoCalculo === 'com' ? 'Com Arredondamento' : 'Sem Arredondamento'}</span></span>
                </div>
              </div>
              <button onClick={() => window.print()} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 hover:bg-slate-200 transition-all print:hidden">
                <Printer size={20} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-8 py-4">Data</th>
                    <th className="px-4 py-4">Nº</th>
                    <th className="px-4 py-4">NFe</th>
                    <th className="px-4 py-4">Placa</th>
                    <th className="px-4 py-4">Armazém</th>
                    <th className="px-4 py-4 text-right">Sacas Bruto</th>
                    <th className="px-4 py-4 text-right">Preço Frete</th>
                    <th className="px-8 py-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold">
                  {dadosRelatorio.length > 0 ? (
                    dadosRelatorio.map((r, i) => {
                      const sacasOriginal = Number(r.sacasBruto) || 0;
                      const sacasUsada = tipoCalculo === 'com' ? Math.floor(sacasOriginal) : sacasOriginal;
                      const preco = Number(r.precofrete) || 0;
                      const subtotal = sacasUsada * preco;

                      return (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-8 py-4 text-slate-700 dark:text-slate-300">{formatarDataBR(r.data)}</td>
                          <td className="px-4 py-4">{r.numero || "-"}</td>
                          <td className="px-4 py-4">{r.nfe}</td>
                          <td className="px-4 py-4 uppercase text-[10px]">{r.placa || "-"}</td>
                          <td className="px-4 py-4 uppercase text-[10px]">{r.armazem}</td>
                          <td className="px-4 py-4 text-right">
                            {sacasUsada.toLocaleString('pt-BR', { 
                              maximumFractionDigits: tipoCalculo === 'com' ? 0 : 2,
                              minimumFractionDigits: tipoCalculo === 'com' ? 0 : 2 
                            })}
                          </td>
                          <td className="px-4 py-4 text-right text-blue-600">R$ {preco.toFixed(2)}</td>
                          <td className="px-8 py-4 text-right font-black">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-slate-400 uppercase italic font-black">Nenhum registro encontrado para os filtros selecionados.</td>
                    </tr>
                  )}
                </tbody>
                {dadosRelatorio.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 dark:bg-slate-900/80 font-black text-slate-800 dark:text-white">
                      <td colSpan={5} className="px-8 py-6 text-right uppercase tracking-widest text-[10px]">Totais do Relatório</td>
                      <td className="px-4 py-6 text-right text-lg">
                        {totais.sacas.toLocaleString('pt-BR', { 
                          maximumFractionDigits: tipoCalculo === 'com' ? 0 : 2,
                          minimumFractionDigits: tipoCalculo === 'com' ? 0 : 2 
                        })} 
                        <span className="text-[10px] text-slate-400 ml-1">sc</span>
                      </td>
                      <td className="px-4 py-6 text-right">-</td>
                      <td className="px-8 py-6 text-right text-xl text-green-600 dark:text-green-400">R$ {totais.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}