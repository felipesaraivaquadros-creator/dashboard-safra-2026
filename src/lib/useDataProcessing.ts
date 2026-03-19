"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Romaneio, KpiStats, ProcessedContract, ChartData, DataContextType, DiscountStats, VolumeStats } from '../data/types';
import { getSafraConfig } from '../data/safraConfig';
import { CORES_FAZENDAS, CORES_ARMAZENS } from '../data/sharedConfig';
import { supabase } from '../integrations/supabase/client';

export const useDataProcessing = (safraId: string): DataContextType => {
  const [rawDados, setRawDados] = useState<Romaneio[]>([]);
  const [dbContratos, setDbContratos] = useState<any[]>([]);
  const [dbSaldos, setDbSaldos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fazendaFiltro, setFazendaFiltro] = useState<string | null>(null);
  const [armazemFiltro, setArmazemFiltro] = useState<string | null>(null);
  const [customBalances, setCustomBalances] = useState<any[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const config = useMemo(() => getSafraConfig(safraId), [safraId]);

  const refresh = useCallback(() => {
    setRefreshTick(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!safraId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const [romaneiosRes, saldosRes, contratosRes, customRes] = await Promise.all([
          supabase.from('romaneios').select(`*, fazendas(nome), armazens(id, nome, grupo), contratos(numero)`).eq('safra_id', safraId),
          supabase.from('saldos').select('*').eq('safra_id', safraId),
          supabase.from('contratos').select('*').eq('safra_id', safraId),
          supabase.from('saldos_custom').select('*').eq('safra_id', safraId)
        ]);

        if (!isMounted) return;

        setDbSaldos(saldosRes.data || []);
        setCustomBalances(customRes.data || []);
        setDbContratos(contratosRes.data || []);

        if (romaneiosRes.data) {
          const mapped: Romaneio[] = romaneiosRes.data.map(d => ({
            data: d.data,
            contrato: d.contrato_id ? "Contrato" : "S/C",
            ncontrato: d.contratos?.numero || "S/C",
            emitente: d.emitente,
            tipoNF: d.tipo_nf,
            nfe: d.nfe,
            numero: d.numero_romaneio,
            cidadeEntrega: d.cidade_entrega,
            armazem: d.armazem_nome || d.armazens?.nome || "Outros",
            armazem_id: d.armazem_id,
            safra: d.safra_id,
            fazenda: d.fazendas?.nome || "Outros",
            talhao: d.talhao,
            motorista: d.motorista,
            placa: d.placa,
            pesoLiquidoKg: Number(d.peso_liquid_kg) || 0,
            pesoBrutoKg: Number(d.peso_bruto_kg) || 0,
            sacasLiquida: Number(d.sacas_liquida) || 0,
            sacasBruto: Number(d.sacas_bruto) || 0,
            umidade: Number(d.umidade) || 0,
            impureza: Number(d.impureza) || 0,
            ardido: Number(d.ardido) || 0,
            avariados: Number(d.avariados) || 0,
            quebrados: Number(d.quebrados) || 0,
            contaminantes: Number(d.contaminantes) || 0,
            precofrete: Number(d.preco_frete) || null
          }));
          setRawDados(mapped);
        } else {
          setRawDados([]);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [safraId, refreshTick]);

  const getCorFazenda = useCallback((nome: string): string => CORES_FAZENDAS[nome] || CORES_FAZENDAS["Outros"], []);
  const getCorArmazem = useCallback((nome: string): string => CORES_ARMAZENS[nome] || CORES_ARMAZENS["Outros"], []);

  const dadosFiltrados = useMemo(() => {
    return rawDados.filter(d => {
      const matchFazenda = !fazendaFiltro || d.fazenda === fazendaFiltro;
      const matchArmazem = !armazemFiltro || d.armazem === armazemFiltro;
      return matchFazenda && matchArmazem;
    });
  }, [rawDados, fazendaFiltro, armazemFiltro]);

  const { stats, discountStats, volumeStats } = useMemo(() => {
    const liq = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasLiquida) || 0), 0);
    const bruta = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasBruto) || 0), 0);
    const liqKg = dadosFiltrados.reduce((acc, d) => acc + (Number(d.pesoLiquidoKg) || 0), 0);
    const brutaKg = dadosFiltrados.reduce((acc, d) => acc + (Number(d.pesoBrutoKg) || 0), 0);

    const umidKg = dadosFiltrados.reduce((acc, d) => acc + (Number(d.umidade) || 0), 0);
    const impuKg = dadosFiltrados.reduce((acc, d) => acc + (Number(d.impureza) || 0), 0);
    const ardiKg = dadosFiltrados.reduce((acc, d) => acc + (Number(d.ardido) || 0), 0);
    const avariKg = dadosFiltrados.reduce((acc, d) => acc + (Number(d.avariados) || 0), 0);
    const contamKg = dadosFiltrados.reduce((acc, d) => acc + (Number(d.contaminantes) || 0), 0);
    const quebrKg = dadosFiltrados.reduce((acc, d) => acc + (Number(d.quebrados) || 0), 0);
    
    const totalDescontosKg = umidKg + impuKg + ardiKg + avariKg + contamKg + quebrKg;
    const percDesconto = bruta > 0 ? ((totalDescontosKg / 60 / bruta) * 100).toFixed(2) : '0.00';
    
    const area = fazendaFiltro ? config.AREAS_FAZENDAS[fazendaFiltro] || 0 : 
      Object.values(config.AREAS_FAZENDAS).reduce((sum, a) => sum + a, 0);

    const romaneiosCount = dadosFiltrados.length;
    const uniqueDays = new Set(dadosFiltrados.map(d => d.data)).size;
    
    const dailyTotals: Record<string, { sc: number, kg: number }> = {};
    dadosFiltrados.forEach(d => {
      if (!d.data) return;
      if (!dailyTotals[d.data]) dailyTotals[d.data] = { sc: 0, kg: 0 };
      dailyTotals[d.data].sc += d.sacasLiquida || 0;
      dailyTotals[d.data].kg += d.pesoLiquidoKg || 0;
    });

    let melhorDiaData = "";
    let melhorDiaSc = 0;
    let melhorDiaKg = 0;

    Object.entries(dailyTotals).forEach(([data, val]) => {
      if (val.sc > melhorDiaSc) {
        melhorDiaSc = val.sc;
        melhorDiaKg = val.kg;
        melhorDiaData = data;
      }
    });

    return {
      stats: {
        totalLiq: liq, totalLiqKg: liqKg, totalBruta: bruta, totalBrutaKg: brutaKg, areaHa: area,
        prodLiq: area > 0 ? (liq / area).toFixed(4) : '0.0000',
        prodLiqKg: area > 0 ? (liqKg / area).toFixed(4) : '0.0000',
        prodBruta: area > 0 ? (bruta / area).toFixed(4) : '0.0000',
        prodBrutaKg: area > 0 ? (brutaKg / area).toFixed(4) : '0.0000',
        umidade: percDesconto
      },
      discountStats: {
        umidadeSc: umidKg / 60, umidadeKg: umidKg, impurezaSc: impuKg / 60, impurezaKg: impuKg,
        ardidoSc: ardiKg / 60, ardidoKg: ardiKg, avariadosSc: avariKg / 60, avariadosKg: avariKg,
        contaminantesSc: contamKg / 60, contaminantesKg: contamKg, quebradosSc: quebrKg / 60, quebradosKg: quebrKg,
        totalDescontosSc: totalDescontosKg / 60, totalDescontosKg: totalDescontosKg, percentualDesconto: percDesconto
      },
      volumeStats: {
        mediaCargaKg: romaneiosCount > 0 ? liqKg / romaneiosCount : 0,
        mediaCargaSc: romaneiosCount > 0 ? liq / romaneiosCount : 0,
        mediaDiaKg: uniqueDays > 0 ? liqKg / uniqueDays : 0,
        mediaDiaSc: uniqueDays > 0 ? liq / uniqueDays : 0,
        melhorDiaKg,
        melhorDiaSc,
        melhorDiaData,
        percentualColhido: "0",
        metaPercentual: "0"
      }
    };
  }, [dadosFiltrados, fazendaFiltro, config.AREAS_FAZENDAS]);

  const contratosProcessados = useMemo(() => {
    const entregasMap: Record<string, number> = {};
    rawDados.forEach(d => {
      const id = String(d.ncontrato || '').trim().replace(/\.0$/, '').toUpperCase();
      if (id && id !== "S/C") entregasMap[id] = (entregasMap[id] || 0) + (Number(d.sacasLiquida) || 0);
    });

    // Considerar safras finalizadas (onde todos os contratos devem aparecer como cumpridos)
    const isSafraFinalizada = safraId === 'soja2526' || safraId === 'milho25';

    const todos: ProcessedContract[] = dbContratos.map(c => {
      const idNormalizado = String(c.numero).trim().replace(/\.0$/, '').toUpperCase();
      const cumprido = isSafraFinalizada ? c.volume_total : (entregasMap[idNormalizado] || 0);
      const aCumprir = isSafraFinalizada ? 0 : Math.max(c.volume_total - cumprido, 0);
      const perc = isSafraFinalizada ? 100 : (c.volume_total > 0 ? (cumprido / c.volume_total) * 100 : (cumprido > 0 ? 100 : 0));
      
      return { 
        id: String(c.numero), db_id: c.id, nome: c.nome, contratado: c.volume_total, 
        cumprido: parseFloat(cumprido.toFixed(2)), aCumprir: parseFloat(aCumprir.toFixed(2)), 
        porcentagem: Math.min(perc, 100).toFixed(1), isConcluido: isSafraFinalizada || aCumprir < 1, grupo: c.grupo
      };
    });

    return {
      pendentes: todos.filter(x => !x.isConcluido && x.contratado > 0).sort((a,b) => b.cumprido - a.cumprido),
      cumpridos: todos.filter(x => x.isConcluido || x.contratado === 0).sort((a,b) => b.cumprido - a.cumprido)
    };
  }, [rawDados, dbContratos, safraId]);

  const listaSaldos = useMemo(() => {
    const finalSaldos: any[] = [];
    const armazensDesmembrados = new Set(customBalances.map(cb => cb.armazem_id));

    dbSaldos.forEach(s => {
      if (!armazensDesmembrados.has(s.armazem_id)) {
        finalSaldos.push({ 
          nome: s.armazem_nome, total: Number(s.total_sacas), totalKg: Number(s.total_kg), 
          id: s.armazem_id, db_id: s.id, grupo: s.grupo, isCustom: false 
        });
      }
    });

    customBalances.forEach(cb => {
      finalSaldos.push({ 
        nome: cb.nome_exibicao, total: parseFloat((cb.peso_kg / 60).toFixed(2)), totalKg: Number(cb.peso_kg), 
        id: cb.armazem_id, db_id: cb.id, grupo: cb.grupo, isCustom: true 
      });
    });

    return finalSaldos.sort((a, b) => b.total - a.total);
  }, [dbSaldos, customBalances]);

  const totalEstoque = useMemo(() => listaSaldos.reduce((acc, item) => acc + item.total, 0), [listaSaldos]);
  const totalContratos = useMemo(() => {
    const todos = [...contratosProcessados.pendentes, ...contratosProcessados.cumpridos];
    return todos.reduce((acc, item) => acc + item.contratado, 0);
  }, [contratosProcessados]);

  const chartFazendas: ChartData[] = useMemo(() => {
    const totals: Record<string, number> = {};
    rawDados.forEach(d => {
      if (d.fazenda && (!armazemFiltro || d.armazem === armazemFiltro)) {
        totals[d.fazenda] = (totals[d.fazenda] || 0) + (Number(d.sacasLiquida) || 0);
      }
    });
    return Object.keys(totals).map(name => ({ name, sacas: totals[name] })).sort((a,b) => b.sacas - a.sacas);
  }, [rawDados, armazemFiltro]);

  const chartArmazens: ChartData[] = useMemo(() => {
    const totals: Record<string, number> = {};
    rawDados.forEach(d => {
      if (d.armazem && (!fazendaFiltro || d.fazenda === fazendaFiltro)) {
        totals[d.armazem] = (totals[d.armazem] || 0) + (Number(d.sacasLiquida) || 0);
      }
    });
    return Object.keys(totals).map(name => ({ name, sacas: totals[name] })).sort((a,b) => b.sacas - a.sacas);
  }, [rawDados, fazendaFiltro]);

  return {
    safraId, loading, fazendaFiltro, armazemFiltro, setFazendaFiltro, setArmazemFiltro,
    stats, discountStats, volumeStats, romaneiosCount: dadosFiltrados.length,
    contratosProcessados, chartFazendas, chartArmazens, getCorFazenda, getCorArmazem,
    listaSaldos, totalEstoque, totalContratos, saldoGeral: totalEstoque - totalContratos,
    refresh
  };
};