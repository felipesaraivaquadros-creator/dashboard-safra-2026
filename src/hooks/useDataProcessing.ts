import { useMemo, useState } from 'react';
import { Romaneio, KpiStats, ProcessedContract, ChartData, DataContextType } from '../data/types';
import { AREAS_FAZENDAS, CORES_FAZENDAS, CORES_ARMAZENS, VOLUMES_CONTRATADOS } from '../data/config';

// Importa os dados normalizados
import dadosOriginal from '../../romaneios_soja_25_26_normalizado.json';

const typedDadosOriginal: Romaneio[] = dadosOriginal as Romaneio[];

export const useDataProcessing = (): DataContextType => {
  const [fazendaFiltro, setFazendaFiltro] = useState<string | null>(null);
  const [armazemFiltro, setArmazemFiltro] = useState<string | null>(null);

  // Auxiliares de Cor
  const getCorFazenda = (nome: string): string => CORES_FAZENDAS[nome] || CORES_FAZENDAS["Outros"];
  const getCorArmazem = (nome: string): string => {
    // Tenta encontrar a cor exata, se não, tenta encontrar a cor base (ex: 'SIPAL LRV' -> 'Sipal')
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

  // 1. FILTRAGEM
  const dadosFiltrados = useMemo(() => {
    return typedDadosOriginal.filter(d => {
      const matchFazenda = !fazendaFiltro || d.fazenda === fazendaFiltro;
      const matchArmazem = !armazemFiltro || d.armazem === armazemFiltro;
      return matchFazenda && matchArmazem;
    });
  }, [fazendaFiltro, armazemFiltro]);

  // 2. KPIS
  const stats: KpiStats = useMemo(() => {
    const liq = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasLiquida) || 0), 0);
    const bruta = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasBruto) || 0), 0);
    
    const area = fazendaFiltro ? AREAS_FAZENDAS[fazendaFiltro] || 0 : 
      Object.values(AREAS_FAZENDAS).reduce((sum, a) => sum + a, 0); // Soma todas as áreas se não houver filtro

    const somaUmid = dadosFiltrados.reduce((acc, d) => acc + (Number(d.umidade) || 0), 0);
    const umidMed = dadosFiltrados.length > 0 ? (somaUmid / dadosFiltrados.length / 100).toFixed(1) : '0.0'; // Umidade é em centésimos

    return {
      totalLiq: liq,
      totalBruta: bruta,
      areaHa: area,
      prodLiq: area > 0 ? (liq / area).toFixed(1) : '0.0',
      prodBruta: area > 0 ? (bruta / area).toFixed(1) : '0.0',
      umidade: umidMed
    };
  }, [dadosFiltrados, fazendaFiltro]);

  // 3. CONTRATOS
  const contratosProcessados = useMemo(() => {
    const entregasMap: Record<string, number> = {};
    typedDadosOriginal.forEach(d => {
      const id = String(d.ncontrato).trim();
      if (id && id !== "S/C") {
        entregasMap[id] = (entregasMap[id] || 0) + (Number(d.sacasLiquida) || 0);
      }
    });

    const todos: ProcessedContract[] = Object.keys(VOLUMES_CONTRATADOS).map(id => {
      const c = VOLUMES_CONTRATADOS[id];
      const cumprido = entregasMap[id] || 0;
      const aCumprir = Math.max(c.total - cumprido, 0);
      const perc = c.total > 0 ? (cumprido / c.total) * 100 : (cumprido > 0 ? 100 : 0);
      
      return { 
        id, 
        nome: c.nome, 
        contratado: c.total, 
        cumprido: parseFloat(cumprido.toFixed(2)), 
        aCumprir: parseFloat(aCumprir.toFixed(2)), 
        porcentagem: Math.min(perc, 100).toFixed(1), 
        isConcluido: perc >= 100 
      };
    });

    return {
      pendentes: todos.filter(x => !x.isConcluido).sort((a,b) => b.cumprido - a.cumprido),
      cumpridos: todos.filter(x => x.isConcluido).sort((a,b) => b.cumprido - a.cumprido)
    };
  }, []);

  // 4. GRÁFICOS
  const chartFazendas: ChartData[] = useMemo(() => {
    const g: Record<string, number> = {};
    dadosFiltrados.forEach(d => { 
      if(d.fazenda) g[d.fazenda] = (g[d.fazenda] || 0) + (Number(d.sacasLiquida) || 0); 
    });
    return Object.keys(g).map(name => ({ name, sacas: g[name] })).sort((a,b) => b.sacas - a.sacas);
  }, [dadosFiltrados]);

  const chartArmazens: ChartData[] = useMemo(() => {
    const g: Record<string, number> = {};
    dadosFiltrados.forEach(d => { 
      if(d.armazem) g[d.armazem] = (g[d.armazem] || 0) + (Number(d.sacasLiquida) || 0); 
    });
    return Object.keys(g).map(name => ({ name, sacas: g[name] })).sort((a,b) => b.sacas - a.sacas);
  }, [dadosFiltrados]);

  return {
    fazendaFiltro,
    armazemFiltro,
    setFazendaFiltro,
    setArmazemFiltro,
    stats,
    contratosProcessados,
    chartFazendas,
    chartArmazens,
    getCorFazenda,
    getCorArmazem,
  };
};