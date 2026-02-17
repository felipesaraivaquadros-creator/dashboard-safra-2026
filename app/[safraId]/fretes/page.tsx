"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Truck, FileText, Calculator, Search, Filter, 
  Printer, Settings2, HandCoins, Fuel, Wallet, ArrowRight,
  TrendingDown, TrendingUp
} from 'lucide-react';
import { getSafraConfig } from '../../../src/data/safraConfig';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import SafraSelector from '../../../src/components/SafraSelector';
import UpdateDataButton from '../../../src/components/UpdateDataButton';
import { Romaneio } from '../../../src/data/types';

// Mapeamento de dados principais
const dataMap: Record<string, Romaneio[]> = {
  'soja2526': require('../../../src/data/soja2526/romaneios_normalizados.json'),
  'soja2425': require('../../../src/data/soja2425/romaneios_normalizados.json'),
  'milho25': require('../../../src/data/milho25/romaneios_normalizados.json'),
  'milho26': require('../../../src/data/milho26/romaneios_normalizados.json'),
};

// Mapeamento de dados extras
const adiantamentosMap: Record<string, any[]> = {
  'soja2526': require('../../../src/data/soja2526/adiantamentos_normalizados.json'),
};

const abastecimentosMap: Record<string, any[]> = {
  'soja2526': require('../../../src/data/soja2526/abastecimentos_normalizados.json'),
};

export default function FretesPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);
  const isSoja2526 = safraId === 'soja2526';

  const romaneios = dataMap[safraId] || [];
  const adiantamentosRaw = adiantamentosMap[safraId] || [];
  const abastecimentosRaw = abastecimentosMap[safraId] || [];

  const [motoristaFiltro, setMotoristaFiltro] = useState("");
  const [placaFiltro, setPlacaFiltro] = useState("");
  const [armazemFiltro, setArmazemFiltro] = useState("");
  const [tipoCalculo, setTipoCalculo] = useState<'com' | 'sem'>('com');
  const [showRelatorio, setShowRelatorio] = useState(false);

  const motoristas = useMemo(() => Array.from(new Set(romaneios.map(r => r.motorista).filter(Boolean))).sort(), [romaneios]);
  const placas = useMemo(() => Array.from(new Set(romaneios.map(r => r.placa).filter(Boolean))).sort(), [romaneios]);
  const armazens = useMemo(() => Array.from(new Set(romaneios.map(r => r.armazem).filter(Boolean))).sort(), [romaneios]);

  const dadosFretes = useMemo(() => {
    if (!showRelatorio) return [];
    return romaneios.filter(r => {
      const matchM = !motoristaFiltro || r.motorista === motoristaFiltro;
      const matchP = !placaFiltro || r.placa === placaFiltro;
      const matchA = !armazemFiltro || r.armazem === armazemFiltro;
      return matchM && matchP && matchA;
    });
  }, [showRelatorio, romaneios, motoristaFiltro, placaFiltro, armazemFiltro]);

  const dadosAdiantamentos = useMemo(() => {
    if (!showRelatorio || !isSoja2526) return [];
    return adiantamentosRaw.filter(a => !motoristaFiltro || a.motorista === motoristaFiltro);
  }, [showRelatorio, isSoja2526, adiantamentosRaw, motoristaFiltro]);

  const dadosAbastecimentos = useMemo(() => {
    if (!showRelatorio || !isSoja2526) return [];
    return abastecimentosRaw.filter(a => !motoristaFiltro || a.motorista === motoristaFiltro);
  }, [showRelatorio, isSoja2526, abastecimentosRaw, motoristaFiltro]);

  const totaisFrete = useMemo(() => {
    return dadosFretes.reduce((acc, r) => {
      const sacasOriginal = Number(r.sacasBruto) || 0;
      const sacasUsada = tipoCalculo === 'com' ? Math.floor(sacasOriginal) : sacasOriginal;
      const preco = Number(r.precofrete) || 0;
      acc.sacas += sacasUsada;
      acc.valor += sacasUsada * preco;
      return acc;
    }, { sacas: 0, valor: 0 });
  }, [dadosFretes, tipoCalculo]);

  const totalAdiantamentos = useMemo(() => 
    dadosAdiantamentos.reduce((sum, a) => sum + (Number(a.valor) || 0), 0)
  , [dadosAdiantamentos]);

  const totaisAbastecimento = useMemo(() => 
    dadosAbastecimentos.reduce((acc, a) => {
      acc.litros += (Number(a.litros) || 0);
      acc.valor += (Number(a.total) || 0);
      return acc;
    }, { litros: 0, valor: 0 })
  , [dadosAbastecimentos]);

  const saldoFinal = totaisFrete.valor - totalAdiantamentos - totaisAbastecimento.valor;

  const handleLimpar = () => {
    setMotoristaFiltro("");
    setPlacaFiltro("");
    setArmazemFiltro("");
    setTipoCalculo('com');
    setShowRelatorio(false);
  };

  const formatarDataBR = (dataISO: string | null) => {
    if (!dataISO) return "-";
    const partes = dataISO.split('-');
    if (partes.length !== 3) return dataISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 print:bg-white print:p-0 print:min-h-0">
      <header className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href={`/${safraId}`} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors shrink-0">
              <ArrowLeft size={24} />
            </Link>
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate">Fechamento de Fretes</h1>
          </div>
          <SafraSelector currentSafra={safraConfig} />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
          <UpdateDataButton />
          <ThemeToggle />
          <button onClick={handleLimpar} className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase transition-colors">Limpar</button>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto space-y-8 print:space-y-6">
        
        {/* Filtros */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
          <div className="flex items-center gap-2 mb-6">
            <Filter size={18} className="text-purple-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Configurar Fechamento</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Motorista</label>
              <select value={motoristaFiltro} onChange={(e) => setMotoristaFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all">
                <option value="">Todos os Motoristas</option>
                {motoristas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Placa</label>
              <select value={placaFiltro} onChange={(e) => setPlacaFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all">
                <option value="">Todas as Placas</option>
                {placas.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Armazém</label>
              <select value={armazemFiltro} onChange={(e) => setArmazemFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all">
                <option value="">Todos os Armazéns</option>
                {armazens.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1"><Settings2 size={10} /> Cálculo</label>
              <select value={tipoCalculo} onChange={(e) => setTipoCalculo(e.target.value as 'com' | 'sem')} className="w-full bg-slate-50 dark:bg-slate-700 border-none rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all">
                <option value="com">Com Arredondamento</option>
                <option value="sem">Sem Arredondamento</option>
              </select>
            </div>
            <button onClick={() => setShowRelatorio(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
              <Search size={16} /> Gerar Fechamento
            </button>
          </div>
        </section>

        {showRelatorio && (
          <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 print:space-y-6">
            
            {/* Cabeçalho Exclusivo para Impressão */}
            <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
              <h1 className="text-2xl font-black uppercase tracking-tighter mb-2">Relatório de Fretes</h1>
              <div className="grid grid-cols-2 gap-y-1 text-xs font-bold uppercase">
                <p><span className="text-slate-500">Motorista:</span> {motoristaFiltro || "Todos"}</p>
                <p><span className="text-slate-500">Safra:</span> {safraConfig.nome}</p>
                {placaFiltro && <p><span className="text-slate-500">Placa:</span> {placaFiltro}</p>}
                {armazemFiltro && <p><span className="text-slate-500">Armazém:</span> {armazemFiltro}</p>}
              </div>
            </div>

            {/* BLOCO 1: RELATÓRIO DE FRETES */}
            <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden print:shadow-none print:border-slate-300 print:rounded-none">
              <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20 print:bg-white print:p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg print:hidden"><Truck size={20}/></div>
                  <h2 className="text-lg font-black uppercase italic tracking-tighter">1. Relatório de Fretes (Ganhos)</h2>
                </div>
                <button onClick={() => window.print()} className="p-2 bg-white dark:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-all print:hidden shadow-sm border dark:border-slate-600"><Printer size={18} /></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px] print:min-w-full">
                  <thead>
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
                      <th className="px-6 py-4 print:px-2">Data</th>
                      <th className="px-4 py-4 print:px-2">NFe</th>
                      <th className="px-4 py-4 print:px-2">Placa</th>
                      <th className="px-4 py-4 print:px-2">Armazém</th>
                      <th className="px-4 py-4 text-right print:px-2">Sacas Bruto</th>
                      <th className="px-4 py-4 text-right print:px-2">Preço</th>
                      <th className="px-6 py-4 text-right print:px-2">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold">
                    {dadosFretes.map((r, i) => {
                      const sacas = tipoCalculo === 'com' ? Math.floor(Number(r.sacasBruto) || 0) : (Number(r.sacasBruto) || 0);
                      const subtotal = sacas * (Number(r.precofrete) || 0);
                      return (
                        <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/30 dark:hover:bg-slate-700/20">
                          <td className="px-6 py-4 text-slate-500 dark:text-slate-400 print:px-2">{formatarDataBR(r.data)}</td>
                          <td className="px-4 py-4 print:px-2">{r.nfe}</td>
                          <td className="px-4 py-4 uppercase text-[10px] print:px-2">{r.placa}</td>
                          <td className="px-4 py-4 uppercase text-[10px] print:px-2">{r.armazem}</td>
                          <td className="px-4 py-4 text-right print:px-2">{sacas.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                          <td className="px-4 py-4 text-right text-blue-600 print:px-2">R$ {(Number(r.precofrete) || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-black print:px-2">R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="print:table-row-group">
                    <tr className="bg-blue-50/50 dark:bg-blue-900/10 font-black text-blue-700 dark:text-blue-300">
                      <td colSpan={4} className="px-6 py-4 text-right uppercase text-[10px] print:px-2">Total Fretes</td>
                      <td className="px-4 py-4 text-right print:px-2">{totaisFrete.sacas.toLocaleString('pt-BR')} sc</td>
                      <td className="px-4 py-4 print:px-2">-</td>
                      <td className="px-6 py-4 text-right text-base print:px-2">R$ {totaisFrete.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            {isSoja2526 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-6">
                  
                  {/* BLOCO 2: ADIANTAMENTOS */}
                  <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden print:break-inside-avoid print:shadow-none print:border-slate-300 print:rounded-none">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-orange-50/30 dark:bg-orange-900/10 print:bg-white print:p-4">
                      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg print:hidden"><HandCoins size={20}/></div>
                      <h2 className="text-sm font-black uppercase italic tracking-tighter">2. Adiantamentos</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[400px] print:min-w-full">
                        <thead>
                          <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
                            <th className="px-6 py-3 print:px-2">Data</th>
                            <th className="px-4 py-3 print:px-2">Motorista</th>
                            <th className="px-6 py-3 text-right print:px-2">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-bold">
                          {dadosAdiantamentos.length > 0 ? dadosAdiantamentos.map((a, i) => (
                            <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50">
                              <td className="px-6 py-3 text-slate-500 dark:text-slate-400 print:px-2">{formatarDataBR(a.data)}</td>
                              <td className="px-4 py-3 uppercase text-[10px] print:px-2">{a.motorista}</td>
                              <td className="px-6 py-3 text-right text-red-600 print:px-2">R$ {(Number(a.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan={3} className="py-8 text-center text-slate-400 italic text-[10px] uppercase">Nenhum adiantamento</td></tr>
                          )}
                        </tbody>
                        {dadosAdiantamentos.length > 0 && (
                          <tfoot>
                            <tr className="bg-orange-50/50 dark:bg-orange-900/10 font-black text-orange-700 dark:text-orange-400">
                              <td colSpan={2} className="px-6 py-3 text-right uppercase text-[9px] print:px-2">Total Adiantamentos</td>
                              <td className="px-6 py-3 text-right print:px-2">R$ {totalAdiantamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </section>

                  {/* BLOCO 3: ABASTECIMENTOS */}
                  <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden print:break-inside-avoid print:shadow-none print:border-slate-300 print:rounded-none">
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 bg-red-50/30 dark:bg-red-900/10 print:bg-white print:p-4">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-lg print:hidden"><Fuel size={20}/></div>
                      <h2 className="text-sm font-black uppercase italic tracking-tighter">3. Abastecimentos (Diesel)</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[400px] print:min-w-full">
                        <thead>
                          <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
                            <th className="px-6 py-3 print:px-2">Data</th>
                            <th className="px-4 py-3 text-right print:px-2">Litros</th>
                            <th className="px-4 py-3 text-right print:px-2">Preço</th>
                            <th className="px-6 py-3 text-right print:px-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-bold">
                          {dadosAbastecimentos.length > 0 ? dadosAbastecimentos.map((a, i) => (
                            <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50">
                              <td className="px-6 py-3 text-slate-500 dark:text-slate-400 print:px-2">{formatarDataBR(a.data)}</td>
                              <td className="px-4 py-3 text-right print:px-2">{(Number(a.litros) || 0).toLocaleString('pt-BR')} L</td>
                              <td className="px-4 py-3 text-right text-slate-400 print:px-2">R$ {(Number(a.preco) || 0).toFixed(2)}</td>
                              <td className="px-6 py-3 text-right text-red-600 print:px-2">R$ {(Number(a.total) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          )) : (
                            <tr><td colSpan={4} className="py-8 text-center text-slate-400 italic text-[10px] uppercase">Nenhum abastecimento</td></tr>
                          )}
                        </tbody>
                        {dadosAbastecimentos.length > 0 && (
                          <tfoot>
                            <tr className="bg-red-50/50 dark:bg-red-900/10 font-black text-red-700 dark:text-red-400">
                              <td colSpan={2} className="px-6 py-3 text-right uppercase text-[9px] print:px-2">Totais</td>
                              <td className="px-4 py-3 text-right print:px-2">{totaisAbastecimento.litros.toLocaleString('pt-BR')} L</td>
                              <td className="px-4 py-3 print:px-2">-</td>
                              <td className="px-6 py-3 text-right print:px-2">R$ {totaisAbastecimento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </section>
                </div>

                {/* BLOCO 4: TOTALIZADOR DE SALDO MOTORISTA */}
                <section className="bg-slate-900 dark:bg-purple-950 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden group print:bg-white print:text-slate-900 print:shadow-none print:border print:border-slate-300 print:break-inside-avoid print:rounded-none print:p-6">
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 print:hidden">
                    <Wallet size={180} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8 print:mb-4">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md print:hidden"><Wallet size={32} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-300 print:text-slate-500">Resumo Financeiro</p>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter print:text-slate-900">Saldo Líquido do Motorista</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-center print:grid-cols-3 print:gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-white/50 flex items-center gap-2 print:text-slate-500"><TrendingUp size={12} className="text-green-400"/> Total Fretes (+)</p>
                        <p className="text-2xl font-black print:text-slate-900">R$ {totaisFrete.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                      
                      <div className="text-white/30 hidden md:block print:hidden"><ArrowRight size={24}/></div>

                      <div className="space-y-4 print:space-y-2">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-white/50 flex items-center gap-2 print:text-slate-500"><TrendingDown size={12} className="text-orange-400"/> Adiantamentos (-)</p>
                          <p className="text-xl font-bold text-orange-200 print:text-orange-600">R$ {totalAdiantamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase text-white/50 flex items-center gap-2 print:text-slate-500"><TrendingDown size={12} className="text-red-400"/> Abastecimentos (-)</p>
                          <p className="text-xl font-bold text-red-200 print:text-red-600">R$ {totaisAbastecimento.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      </div>

                      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/10 md:col-span-1 print:bg-slate-50 print:border-slate-300 print:rounded-xl print:p-4">
                        <p className="text-[10px] font-black uppercase text-purple-300 mb-1 print:text-slate-500">Valor a Pagar</p>
                        <p className={`text-4xl font-black tracking-tighter ${saldoFinal >= 0 ? 'text-green-400 print:text-green-600' : 'text-red-400 print:text-red-600'}`}>
                          R$ {saldoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center print:border-slate-200 print:mt-2 print:pt-2">
                          <span className="text-[9px] font-bold uppercase text-white/40 italic print:text-slate-400">* Sujeito a conferência final</span>
                          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${saldoFinal >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {saldoFinal >= 0 ? 'Credor' : 'Devedor'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Estilos globais para impressão */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 1cm;
            size: auto;
          }
          body {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Remove paddings do container principal */
          main {
            padding: 0 !important;
            margin: 0 !important;
            min-height: auto !important;
          }
          /* Força o tfoot a se comportar como um grupo de linhas normal para não repetir */
          tfoot {
            display: table-row-group !important;
          }
          /* Evita quebras dentro de seções críticas */
          section {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-top: 0 !important;
            margin-bottom: 1.5rem !important;
          }
          /* Ajuste de cores para economia de tinta e clareza */
          .bg-slate-900, .dark\\:bg-purple-950 {
            background-color: white !important;
            color: black !important;
            border: 1px solid #e2e8f0 !important;
          }
          /* Garante que o relatório comece no topo */
          .max-w-\\[1200px\\] {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
        }
      `}</style>
    </main>
  );
}