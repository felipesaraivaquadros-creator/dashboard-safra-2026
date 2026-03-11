"use client";

import { useMemo, useState, useEffect } from 'react';
import { Romaneio, KpiStats, ProcessedContract, ChartData, DataContextType, DiscountStats, VolumeStats } from '../data/types';
import { getSafraConfig } from '../data/safraConfig';
import { CORES_FAZENDAS, CORES_ARMAZENS } from '../data/sharedConfig';
import { supabase } from '../integrations/supabase/client';

export const useDataProcessing = (safraId: string): DataContextType => {
  const [rawDados, setRawDados] = useState<Romaneio[]>([]);
  const [loading, setLoading] = useState(true);
  const [fazendaFiltro, setFazendaFiltro] = useState<string | null>(null);
  const [armazemFiltro, setArmazemFiltro] = useState<string | null>(null);

  const config = useMemo(() => getSafraConfig(safraId), [safraId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('romaneios')
          .select(`
            *,
            fazendas(nome),
            armazens(nome),
            contratos(numero)
          `)
          .eq('safra_id', safraId);

        if (error) throw error;

        if (data) {
          const mapped: Romaneio[] = data.map(d => ({
            data: d.data,
            contrato: d.contrato_id ? "Contrato" : "S/C",
            ncontrato: d.contratos?.numero || "S/C",
            emitente: d.emitente,
            tipoNF: d.tipo_nf,
            nfe: d.nfe,
            numero: d.numero_romaneio,
            cidadeEntrega: d.cidade_entrega,
            armazem: d.armazem_nome || d.armazens?.nome || "Outros", // Usa a nova coluna ou o join
            safra: d.safra_id,
            fazenda: d.fazendas?.nome || "Outros",
            talhao: d.talhao,
            motorista: d.motorista,
            placa: d.placa,
            pesoLiquidoKg: Number(d.peso_liquido_kg) || 0,
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
        }
      } catch (err) {
        console.error("Erro ao carregar dados da nuvem:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [safraId]);

  const getCorFazenda = (nome: string): string => CORES_FAZENDAS[nome] || CORES_FAZENDAS["Outros"];
  const getCorArmazem = (nome: string): string => {
    const exactMatch = CORES_ARMAZENS[nome];
    if (exactMatch) return exactMatch;
    const baseName = nome.split(' ')[0];
    for (const key in CORES_ARMAZENS) {
      if (key.includes(baseName)) return CORES_ARMAZENS[key];
    }
    return CORES_ARMAZENS["Outros"];
  };

  const dadosFiltrados = useMemo(() => {
    return rawDados.filter(d => {
      const matchFazenda = !fazendaFiltro || d.fazenda === fazendaFiltro;
      const matchArmazem = !armazemFiltro || d.armazem === armazemFiltro;
      return matchFazenda && matchArmazem;
    });
  }, [rawDados, fazendaFiltro, armazemFiltro]);

  const romaneiosCount = useMemo(() => dadosFiltrados.length, [dadosFiltrados]);

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

    const diasMap: Record<string, { kg: number, sc: number }> = {};
    dadosFiltrados.forEach(d => {
      if (d.data) {
        if (!diasMap[d.data]) diasMap[d.data] = { kg: 0, sc: 0 };
        diasMap[d.data].kg += Number(d.pesoLiquidoKg) || 0;
        diasMap[d.data].sc += Number(d.sacasLiquida) || 0;
      }
    });

    const listaDias = Object.entries(diasMap);
    const numDias = listaDias.length || 1;
    
    let melhorDiaData = "";
    let melhorDiaKg = 0;
    let melhorDiaSc = 0;

    listaDias.forEach(([data, val]) => {
      if (val.kg > melhorDiaKg) {
        melhorDiaKg = val.kg;
        melhorDiaSc = val.sc;
        melhorDiaData = data;
      }
    });

    const stats: KpiStats = {
      totalLiq: liq,
      totalLiqKg: liqKg,
      totalBruta: bruta,
      totalBrutaKg: brutaKg,
      areaHa: area,
      prodLiq: area > 0 ? (liq / area).toFixed(4) : '0.0000', 
      prodLiqKg: area > 0 ? (liqKg / area).toFixed(4) : '0.0000',
      prodBruta: area > 0 ? (bruta / area).toFixed(4) : '0.0000',
      prodBrutaKg: area > 0 ? (brutaKg / area).toFixed(4) : '0.0000',
      umidade: percDesconto
    };

    const discountStats: DiscountStats = {
      umidadeSc: umidKg / 60,
      umidadeKg: umidKg,
      impurezaSc: impuKg / 60,
      impurezaKg: impuKg,
      ardidoSc: ardiKg / 60,
      ardidoKg: ardiKg,
      avariadosSc: avariKg / 60,
      avariadosKg: avariKg,
      contaminantesSc: contamKg / 60,
      contaminantesKg: contamKg,
      quebradosSc: quebrKg / 60,
      quebradosKg: quebrKg,
      totalDescontosSc: totalDescontosKg / 60,
      totalDescontosKg: totalDescontosKg,
      percentualDesconto: percDesconto
    };

    const volumeStats: VolumeStats = {
      mediaCargaKg: dadosFiltrados.length > 0 ? liqKg / dadosFiltrados.length : 0,
      mediaCargaSc: dadosFiltrados.length > 0 ? liq / dadosFiltrados.length : 0,
      mediaDiaKg: liqKg / numDias,
      mediaDiaSc: liq / numDias,
      melhorDiaKg,
      melhorDiaSc,
      melhorDiaData,
      percentualColhido: '100.0', 
      metaPercentual: ((liq / 117000) * 100).toFixed(1)
    };

    return { stats, discountStats, volumeStats };
  }, [dadosFiltrados, fazendaFiltro, config.AREAS_FAZENDAS]);

  const contratosProcessados = useMemo(() => {
    const entregasMap: Record<string, number> = {};
    rawDados.forEach(d => {
      const id = String(d.ncontrato || '').trim().replace(/\.0$/, '').toUpperCase();
      if (id && id !== "S/C") {
        entregasMap[id] = (entregasMap[id] || 0) + (Number(d.sacasLiquida) || 0);
      }
    });

    const isSafraPassadaCumprida = safraId === 'soja2425' || safraId === 'milho25';

    const todos: ProcessedContract[] = Object.keys(config.VOLUMES_CONTRATADOS).map(idKey => {
      const c = config.VOLUMES_CONTRATADOS[idKey];
      const idNormalizado = String(idKey).trim().replace(/\.0$/, '').toUpperCase();
      const cumprido = entregasMap[idNormalizado] || 0;
      
      let isConcluido = false;
      let aCumprir = 0;
      let perc = 0;

      if (isSafraPassadaCumprida) {
        isConcluido = true;
        aCumprir = 0;
        perc = c.total > 0 ? 100 : (cumprido > 0 ? 100 : 0);
      } else if (c.total === 0) {
        isConcluido = cumprido > 0;
        aCumprir = 0;
        perc = cumprido > 0 ? 100 : 0;
      } else {
        aCumprir = Math.max(c.total - cumprido, 0);
        perc = (cumprido / c.total) * 100;
        isConcluido = aCumprir < 1; 
      }
      
      return { 
        id: idKey, 
        nome: c.nome, 
        contratado: c.total, 
        cumprido: parseFloat(cumprido.toFixed(2)), 
        aCumprir: parseFloat(aCumprir.toFixed(2)), 
        porcentagem: Math.min(perc, 100).toFixed(1), 
        isConcluido: isConcluido 
      };
    });

    return {
      pendentes: isSafraPassadaCumprida ? [] : todos.filter(x => !x.isConcluido && x.contratado > 0).sort((a,b) => b.cumprido - a.cumprido),
      cumpridos: isSafraPassadaCumprida ? todos.sort((a,b) => b.cumprido - a.cumprido) : todos.filter(x => x.isConcluido || x.contratado === 0).sort((a,b) => b.cumprido - a.cumprido)
    };
  }, [rawDados, config.VOLUMES_CONTRATADOS, safraId]);

  const calculateChartData = (data: Romaneio[], key: keyof Romaneio, allKeys: string[]): ChartData[] => {
    const totals: Record<string, number> = {};
    allKeys.forEach(k => totals[k] = 0);
    data.forEach(d => {
      const groupName = d[key] as string;
      if (groupName) {
        totals[groupName] = (totals[groupName] || 0) + (Number(d.sacasLiquida) || 0);
      }
    });
    return Object.keys(totals)
      .map(name => ({ name, sacas: totals[name] }))
      .filter(d => d.sacas > 0 || allKeys.includes(d.name))
      .sort((a,b) => b.sacas - a.sacas);
  };

  const allFazendas = useMemo(() => Array.from(new Set(rawDados.map(d => d.fazenda).filter(Boolean) as string[])), [rawDados]);
  const allArmazens = useMemo(() => Array.from(new Set(rawDados.map(d => d.armazem).filter(Boolean) as string[])), [rawDados]);

  const chartFazendas: ChartData[] = useMemo(() => {
    const data = rawDados.filter(d => !armazemFiltro || d.armazem === armazemFiltro);
    return calculateChartData(data, 'fazenda', allFazendas);
  }, [rawDados, armazemFiltro, allFazendas]);

  const chartArmazens: ChartData[] = useMemo(() => {
    const data = rawDados.filter(d => !fazendaFiltro || d.fazenda === fazendaFiltro);
    return calculateChartData(data, 'armazem', allArmazens);
  }, [rawDados, fazendaFiltro, allArmazens]);

  return {
    safraId,
    loading,
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
  };
};