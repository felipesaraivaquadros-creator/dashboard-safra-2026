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

  // 1. FILTRAGEM GLOBAL (Usada para KPIs e Contratos)
  const dadosFiltrados = useMemo(() => {
    return typedDadosOriginal.filter(d => {
      const matchFazenda = !fazendaFiltro || d.fazenda === fazendaFiltro;
      const matchArmazem = !armazemFiltro || d.armazem === armazemFiltro;
      return matchFazenda && matchArmazem;
    });
  }, [fazendaFiltro, armazemFiltro]);

  // Contagem de Romaneios (Cargas)
  const romaneiosCount = useMemo(() => dadosFiltrados.length, [dadosFiltrados]);

  // 2. KPIS (Depende de dadosFiltrados)
  const stats: KpiStats = useMemo(() => {
    const liq = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasLiquida) || 0), 0);
    const bruta = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasBruto) || 0), 0);
    
    const area = fazendaFiltro ? AREAS_FAZENDAS[fazendaFiltro] || 0 : 
      Object.values(AREAS_FAZENDAS).reduce((sum, a) => sum + a, 0);

    const somaUmid = dadosFiltrados.reduce((acc, d) => acc + (Number(d.umidade) || 0), 0);
    const umidMed = dadosFiltrados.length > 0 ? (somaUmid / dadosFiltrados.length / 100).toFixed(1) : '0.0';

    return {
      totalLiq: liq,
      totalBruta: bruta,
      areaHa: area,
      prodLiq: area > 0 ? (liq / area).toFixed(1) : '0.0',
      prodBruta: area > 0 ? (bruta / area).toFixed(1) : '0.0',
      umidade: umidMed
    };
  }, [dadosFiltrados, fazendaFiltro]);

  // 3. CONTRATOS (Mantido inalterado)
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
      
      const isConcluido = aCumprir < 1; 
      
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
      pendentes: todos.filter(x => !x.isConcluido).sort((a,b) => b.cumprido - a.cumprido),
      cumpridos: todos.filter(x => x.isConcluido).sort((a,b) => b.cumprido - a.cumprido)
    };
  }, []);

  // 4. GRÁFICOS
  
  // Função auxiliar para calcular totais de sacas líquidas para um conjunto de dados
  const calculateChartData = (data: Romaneio[], key: keyof Romaneio, allKeys: string[]): ChartData[] => {
    const totals: Record<string, number> = {};
    
    // Inicializa todos os grupos com 0
    allKeys.forEach(k => totals[k] = 0);

    // Soma os volumes
    data.forEach(d => {
      const groupName = d[key] as string;
      if (groupName) {
        totals[groupName] = (totals[groupName] || 0) + (Number(d.sacasLiquida) || 0);
      }
    });
    
    return Object.keys(totals)
      .map(name => ({ name, sacas: totals[name] }))
      .filter(d => d.sacas > 0 || allKeys.includes(d.name)) // Garante que todos os nomes originais estejam presentes
      .sort((a,b) => b.sacas - a.sacas);
  };

  // Obtém todos os nomes únicos de fazendas e armazéns dos dados originais
  const allFazendas = useMemo(() => Array.from(new Set(typedDadosOriginal.map(d => d.fazenda).filter(Boolean) as string[])), []);
  const allArmazens = useMemo(() => Array.from(new Set(typedDadosOriginal.map(d => d.armazem).filter(Boolean) as string[])), []);

  // Dados para o Gráfico de Fazendas: Filtrado apenas por Armazém (se houver)
  const dadosParaChartFazendas = useMemo(() => {
    return typedDadosOriginal.filter(d => !armazemFiltro || d.armazem === armazemFiltro);
  }, [armazemFiltro]);

  const chartFazendas: ChartData[] = useMemo(() => {
    return calculateChartData(dadosParaChartFazendas, 'fazenda', allFazendas);
  }, [dadosParaChartFazendas, allFazendas]);

  // Dados para o Gráfico de Armazéns: Filtrado apenas por Fazenda (se houver)
  const dadosParaChartArmazens = useMemo(() => {
    return typedDadosOriginal.filter(d => !fazendaFiltro || d.fazenda === fazendaFiltro);
  }, [fazendaFiltro]);

  const chartArmazens: ChartData[] = useMemo(() => {
    return calculateChartData(dadosParaChartArmazens, 'armazem', allArmazens);
  }, [dadosParaChartArmazens, allArmazens]);


  return {
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
  };
};