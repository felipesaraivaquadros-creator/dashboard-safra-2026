"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Truck, FileText, Calculator, Search, Filter, Printer, Settings2, Wallet, Fuel, CheckCircle2 } from 'lucide-react';
import { getSafraConfig } from '../../../src/data/safraConfig';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import SafraSelector from '../../../src/components/SafraSelector';
import UpdateDataButton from '../../../src/components/UpdateDataButton';
import { Romaneio, Adiantamento, Abastecimento } from '../../../src/data/types';

const dataMap: Record<string, any> = {
  'soja2526': {
    romaneios: require('../../../src/data/soja2526/romaneios_normalizados.json'),
    adiantamentos: require('../../../src/data/soja2526/adiantamentos_normalizados.json'),
    diesel: require('../../../src/data/soja2526/diesel_normalizados.json'),
  },
  'soja2425': { romaneios: require('../../../src/data/soja2425/romaneios_normalizados.json'), adiantamentos: [], diesel: [] },
  'milho25': { romaneios: require('../../../src/data/milho25/romaneios_normalizados.json'), adiantamentos: [], diesel: [] },
};

export default function FretesPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);
  const safraData = dataMap[safraId] || { romaneios: [], adiantamentos: [], diesel: [] };

  const [motoristaFiltro, setMotoristaFiltro] = useState("");
  const [placaFiltro, setPlacaFiltro] = useState("");
  const [armazemFiltro, setArmazemFiltro] = useState("");
  const [tipoCalculo, setTipoCalculo] = useState<'com' | 'sem'>('com');
  const [aplicarDescontos, setAplicarDescontos] = useState<'Sim' | 'Não'>('Sim');
  const [showRelatorio, setShowRelatorio] = useState(false);

  const motoristas = useMemo(() => Array.from(new Set(safraData.romaneios.map((r: any) => r.motorista).filter(Boolean))).sort(), [safraData]);
  const placas = useMemo(() => Array.from(new Set(safraData.romaneios.map((r: any) => r.placa).filter(Boolean))).sort(), [safraData]);
  const armazens = useMemo(() => Array.from(new Set(safraData.romaneios.map((r: any) => r.armazem).filter(Boolean))).sort(), [safraData]);

  const dadosRelatorio = useMemo(() => {
    if (!showRelatorio) return { fretes: [], adiantamentos: [], diesel: [] };
    
    const fretes = safraData.romaneios.filter((r: any) => {
      const matchM = !motoristaFiltro || r.motorista === motoristaFiltro;
      const matchP = !placaFiltro || r.placa === placaFiltro;
      const matchA = !armazemFiltro || r.armazem === armazemFiltro;
      return matchM && matchP && matchA;
    });

    const adiantamentos = aplicarDescontos === 'Sim' ? safraData.adiantamentos.filter((a: any) => {
      const matchM = !motoristaFiltro || a.motorista === motoristaFiltro;
      // Adiantamentos não têm placa no Excel fornecido, filtramos apenas por motorista
      return matchM;
    }) : [];

    const diesel = aplicarDescontos === 'Sim' ? safraData.diesel.filter((d: any) => {
      const matchM = !motoristaFiltro || d.motorista === motoristaFiltro;
      return matchM;
    }) : [];

    return { fretes, adiantamentos, diesel };
  }, [showRelatorio, safraData, motoristaFiltro, placaFiltro, armazemFiltro, aplicarDescontos]);

  const totais = useMemo(() => {
    const freteTotal = dadosRelatorio.fretes.reduce((acc: number, r: any) => {
      const sacas = tipoCalculo === 'com' ? Math.floor(Number(r.sacasBruto) || 0) : (Number(r.sacasBruto) || 0);
      return acc + (sacas * (Number(r.precofrete) || 0));
    }, 0);

    const adiantTotal = dadosRelatorio.adiantamentos.reduce((acc: number, a: any) => acc + (Number(a.valor) || 0), 0);
    const dieselTotal = dadosRelatorio.diesel.reduce((acc: number, d: any) => acc + (Number(d.total) || 0), 0);
    const dieselLitros = dadosRelatorio.diesel.reduce((acc: number, d: any) => acc + (Number(d.litros) || 0), 0);

    return {
      frete: freteTotal,
      adiantamentos: adiantTotal,
      diesel: dieselTotal,
      dieselLitros,
      saldo: freteTotal - adiantTotal - dieselTotal
    };
  }, [dadosRelatorio, tipoCalculo]);

  const formatarDataBR = (d: string | null) => d ? d.split('-').reverse().join('-') : "-";

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
          <UpdateDataButton />
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Filtros */}
        <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Motorista</label>
              <select value={motoristaFiltro} onChange={(e) => setMotoristaFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold">
                <option value="">Todos</option>
                {motoristas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Placa</label>
              <select value={placaFiltro} onChange={(e) => setPlacaFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold">
                <option value="">Todas</option>
                {placas.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Armazém</label>
              <select value={armazemFiltro} onChange={(e) => setArmazemFiltro(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold">
                <option value="">Todos</option>
                {armazens.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Cálculo</label>
              <select value={tipoCalculo} onChange={(e) => setTipoCalculo(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold">
                <option value="com">Com Arredondamento</option>
                <option value="sem">Sem Arredondamento</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Aplicar Descontos?</label>
              <select value={aplicarDescontos} onChange={(e) => setAplicarDescontos(e.target.value as any)} className="w-full bg-slate-50 dark:bg-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold">
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>
            <button onClick={() => setShowRelatorio(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs py-3 rounded-xl shadow-lg flex items-center justify-center gap-2">
              <Search size={16} /> Gerar
            </button>
          </div>
        </section>

        {showRelatorio && (
          <div className="space-y-8">
            {/* Bloco Fretes */}
            <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
              <div className="p-8 border-b dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2"><Truck className="text-blue-500"/> Relatório de Fretes</h2>
                <button onClick={() => window.print()} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full print:hidden"><Printer size={20}/></button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-400">
                      <th className="px-6 py-4">Data</th>
                      <th className="px-4 py-4">Nº</th>
                      <th className="px-4 py-4">NFe</th>
                      <th className="px-4 py-4">Placa</th>
                      <th className="px-4 py-4">Armazém</th>
                      <th className="px-4 py-4 text-right">Sacas Bruto</th>
                      <th className="px-4 py-4 text-right">Preço</th>
                      <th className="px-6 py-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-bold">
                    {dadosRelatorio.fretes.map((r: any, i: number) => {
                      const sacas = tipoCalculo === 'com' ? Math.floor(Number(r.sacasBruto) || 0) : (Number(r.sacasBruto) || 0);
                      const sub = sacas * (Number(r.precofrete) || 0);
                      return (
                        <tr key={i} className="border-b dark:border-slate-700/50">
                          <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{formatarDataBR(r.data)}</td>
                          <td className="px-4 py-4">{r.numero || "-"}</td>
                          <td className="px-4 py-4">{r.nfe}</td>
                          <td className="px-4 py-4 uppercase">{r.placa || "-"}</td>
                          <td className="px-4 py-4 uppercase text-[10px]">{r.armazem}</td>
                          <td className="px-4 py-4 text-right">{sacas.toLocaleString('pt-BR', { minimumFractionDigits: tipoCalculo === 'com' ? 0 : 2 })}</td>
                          <td className="px-4 py-4 text-right text-blue-600">R$ {(r.precofrete || 0).toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-black">R$ {sub.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {aplicarDescontos === 'Sim' && (
              <>
                {/* Bloco Adiantamentos */}
                <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                  <div className="p-6 border-b dark:border-slate-700 bg-orange-50/50 dark:bg-orange-900/10">
                    <h2 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2 text-orange-600"><Wallet size={20}/> Adiantamentos</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-400">
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Motorista</th>
                          <th className="px-6 py-4">Banco</th>
                          <th className="px-6 py-4 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-bold">
                        {dadosRelatorio.adiantamentos.map((a: any, i: number) => (
                          <tr key={i} className="border-b dark:border-slate-700/50">
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{formatarDataBR(a.data)}</td>
                            <td className="px-6 py-4 uppercase">{a.motorista}</td>
                            <td className="px-6 py-4 uppercase">{a.banco}</td>
                            <td className="px-6 py-4 text-right text-red-600">R$ {(a.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-black">
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-right uppercase text-[10px]">Total Adiantamentos</td>
                          <td className="px-6 py-4 text-right text-red-600">R$ {totais.adiantamentos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>

                {/* Bloco Abastecimentos */}
                <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
                  <div className="p-6 border-b dark:border-slate-700 bg-amber-50/50 dark:bg-amber-900/10">
                    <h2 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2 text-amber-600"><Fuel size={20}/> Abastecimentos</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-[10px] font-black uppercase text-slate-400">
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Motorista</th>
                          <th className="px-6 py-4 text-right">Litros</th>
                          <th className="px-6 py-4 text-right">Preço Litro</th>
                          <th className="px-6 py-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-bold">
                        {dadosRelatorio.diesel.map((d: any, i: number) => (
                          <tr key={i} className="border-b dark:border-slate-700/50">
                            <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{formatarDataBR(d.data)}</td>
                            <td className="px-6 py-4 uppercase">{d.motorista}</td>
                            <td className="px-6 py-4 text-right">{d.litros?.toLocaleString('pt-BR')} L</td>
                            <td className="px-6 py-4 text-right">R$ {(d.preco || 0).toFixed(3)}</td>
                            <td className="px-6 py-4 text-right text-red-600">R$ {(d.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-black">
                        <tr>
                          <td colSpan={2} className="px-6 py-4 text-right uppercase text-[10px]">Totais Diesel</td>
                          <td className="px-6 py-4 text-right">{totais.dieselLitros.toLocaleString('pt-BR')} L</td>
                          <td className="px-6 py-4 text-right">-</td>
                          <td className="px-6 py-4 text-right text-red-600">R$ {totais.dieselTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </section>
              </>
            )}

            {/* Resumo Final */}
            <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border-4 border-purple-500/30">
              <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-purple-500 rounded-2xl shadow-lg shadow-purple-500/20"><CheckCircle2 size={32}/></div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Fechamento de Saldo</p>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">{motoristaFiltro || "Geral"}</h3>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full md:w-auto">
                  <div className="text-center md:text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400">Total Fretes</p>
                    <p className="text-xl font-black text-blue-400">R$ {totais.frete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400">Total Descontos</p>
                    <p className="text-xl font-black text-red-400">R$ {(totais.adiantamentos + totais.diesel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center md:text-right p-4 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black uppercase text-purple-300">Saldo Líquido</p>
                    <p className="text-3xl font-black text-green-400">R$ {totais.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body { background: white !important; color: black !important; }
          main { padding: 0 !important; }
          section { border: 1px solid #eee !important; box-shadow: none !important; border-radius: 0 !important; margin-bottom: 20px !important; page-break-inside: avoid; }
          tfoot { display: table-footer-group; }
        }
      `}</style>
    </main>
  );
}