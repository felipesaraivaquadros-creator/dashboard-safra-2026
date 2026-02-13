import { useMemo, useState } from 'react';
import { Romaneio, KpiStats, ProcessedContract, ChartData, DataContextType, DiscountStats, VolumeStats } from '../data/types';
import { getSafraConfig, SafraConfig } from '../data/safraConfig';
import { CORES_FAZENDAS, CORES_ARMAZENS } from '../data/sharedConfig';

const dataMap: Record<string, Romaneio[]> = {
  'soja2526': require('../data/soja2526/romaneios_normalizados.json'),
  'soja2425': require('../data/soja2425/romaneios_normalizados.json'),
  'milho25': require('../data/milho25/romaneios_normalizados.json'),
  'milho26': require('../data/milho26/romaneios_normalizados.json'),
};

interface SafraData {
  dados: Romaneio[];
  config: SafraConfig;
}

function loadSafraData(safraId: string): SafraData {
  const config = getSafraConfig(safraId);
  let dados = dataMap[safraId];
  
  if (!Array.isArray(dados)) {
    console.error(`Erro ao carregar dados para a safra ${safraId}. Retornando array vazio.`);
    dados = [];
  }
  
  const romaneiosValidos = dados.filter(d => d.sacasLiquida > 0 && d.data !== null);

  return { dados: romaneiosValidos, config };
}

export const useDataProcessing = (safraId: string): DataContextType => {
  const { dados: typedDadosOriginal, config } = useMemo(() => loadSafraData(safraId), [safraId]);
  
  const [fazendaFiltro, setFazendaFiltro] = useState<string | null>(null);
  const [armazemFiltro, setArmazemFiltro] = useState<string | null>(null);

  const getCorFazenda = (nome: string): string => CORES_FAZENDAS[nome] || CORES_FAZENDAS["Outros"];
  const getCorArmazem = (nome: string): string => {
    const exactMatch = CORES_ARMAZENS[nome];
    if (exactMatch) return exactMatch;

    const baseName = nome.split(' ')[0];
    for (const key in CORES_ARMAZENS) {
      if (key.includes(baseName)) {
        return CORES_ARMAZENS[key];
      }
    }
    return CORES_ARMAZENS["Outros"];
  };

  const dadosFiltrados = useMemo(() => {
    return typedDadosOriginal.filter(d => {
      const matchFazenda = !fazendaFiltro || d.fazenda === fazendaFiltro;
      const matchArmazem = !armazemFiltro || d.armazem === armazemFiltro;
      return matchFazenda && matchArmazem;
    });
  }, [typedDadosOriginal, fazendaFiltro, armazemFiltro]);

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

    // Cálculos de Operação e Tendência
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

    const totalContratado = Object.values(config.VOLUMES_CONTRATADOS).reduce((sum, c) => sum + c.total, 0);

    const stats: KpiStats = {
      totalLiq: liq,
      totalLiqKg: liqKg,
      totalBruta: bruta,
      totalBrutaKg: brutaKg,
      areaHa: area,
      prodLiq: area > 0 ? (liq / area).toFixed(2) : '0.00', 
      prodLiqKg: area > 0 ? (liqKg / area).toFixed(2) : '0.00',
      prodBruta: area > 0 ? (bruta / area).toFixed(2) : '0.00',
      prodBrutaKg: area > 0 ? (brutaKg / area).toFixed(2) : '0.00',
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
      percentualColhido: area > 0 ? ((liq / (area * 65)) * 100).toFixed(1) : '0.0', // Estimativa baseada em 65 sc/ha
      metaPercentual: totalContratado > 0 ? ((liq / totalContratado) * 100).toFixed(1) : '0.0'
    };

    return { stats, discountStats, volumeStats };
  }, [dadosFiltrados, fazendaFiltro, config.AREAS_FAZENDAS, config.VOLUMES_CONTRATADOS]);

  const contratosProcessados = useMemo(() => {
    const entregasMap: Record<string, number> = {};
    typedDadosOriginal.forEach(d => {
      const id = String(d.ncontrato).trim();
      if (id && id !== "S/C") {
        entregasMap[id] = (entregasMap[id] || 0) + (Number(d.sacasLiquida) || 0);
      }
    });

    const isSafraPassadaCumprida = safraId === 'soja2425' || safraId === 'milho25';

    const todos: ProcessedContract[] = Object.keys(config.VOLUMES_CONTRATADOS).map(id => {
      const c = config.VOLUMES_CONTRATADOS[id];
      const cumprido = entregasMap[id] || 0;
      
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
        id, 
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
  }, [typedDadosOriginal, config.VOLUMES_CONTRATADOS, safraId]);

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

  const allFazendas = useMemo(() => Array.from(new Set(typedDadosOriginal.map(d => d.fazenda).filter(Boolean) as string[])), [typedDadosOriginal]);
  const allArmazens = useMemo(() => Array.from(new Set(typedDadosOriginal.map(d => d.armazem).filter(Boolean) as string[])), [typedDadosOriginal]);

  const dadosParaChartFazendas = useMemo(() => {
    return typedDadosOriginal.filter(d => !armazemFiltro || d.armazem === armazemFiltro);
  }, [typedDadosOriginal, armazemFiltro]);

  const chartFazendas: ChartData[] = useMemo(() => {
    return calculateChartData(dadosParaChartFazendas, 'fazenda', allFazendas);
  }, [dadosParaChartFazendas, allFazendas]);

  const dadosParaChartArmazens = useMemo(() => {
    return typedDadosOriginal.filter(d => !fazendaFiltro || d.fazenda === fazendaFiltro);
  }, [typedDadosOriginal, fazendaFiltro]);

  const chartArmazens: ChartData[] = useMemo(() => {
    return calculateChartData(dadosParaChartArmazens, 'armazem', allArmazens);
  }, [dadosParaChartArmazens, allArmazens]);


  return {
    safraId,
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