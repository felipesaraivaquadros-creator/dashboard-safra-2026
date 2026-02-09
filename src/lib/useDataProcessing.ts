import { useMemo, useState } from 'react';
import { Romaneio, KpiStats, ProcessedContract, ChartData, DataContextType } from '../data/types';
import { getSafraConfig, SafraConfig } from '../data/safraConfig';
import { CORES_FAZENDAS, CORES_ARMAZENS } from '../data/sharedConfig';

// Mapeamento para carregar os dados JSON dinamicamente
const dataMap: Record<string, Romaneio[]> = {
  'soja2526': require('../data/soja2526/romaneios_normalizados.json'),
  'soja2425': require('../data/soja2425/romaneios_normalizados.json'),
  'milho25': require('../data/milho25/romaneios_normalizados.json'),
  'milho26': require('../data/milho26/romaneios_normalizados.json'),
};

interface SafraData {
  dados: Romaneio[];
  config: SafraConfig;
  totalConsolidadoLiq: number;
}

// Função auxiliar para carregar dados e config
function loadSafraData(safraId: string): SafraData {
  const config = getSafraConfig(safraId);
  let dados = dataMap[safraId];
  
  if (!Array.isArray(dados)) {
    console.error(`Erro ao carregar dados para a safra ${safraId}. Retornando array vazio.`);
    dados = [];
  }
  
  let totalConsolidadoLiq = 0;
  let romaneiosValidos = dados;

  // Lógica para safras passadas que usam o registro de 'Total' no final do arquivo
  if (safraId === 'soja2425' || safraId === 'milho25') {
    const ultimoRegistro = dados[dados.length - 1];
    if (ultimoRegistro && ultimoRegistro.data === null && ultimoRegistro.sacasLiquida !== null) {
      totalConsolidadoLiq = Number(ultimoRegistro.sacasLiquida) || 0;
      // Remove o registro de total para que ele não seja processado como um romaneio normal
      romaneiosValidos = dados.slice(0, -1);
    }
  }

  return { dados: romaneiosValidos, config, totalConsolidadoLiq };
}

export const useDataProcessing = (safraId: string): DataContextType => {
  const { dados: typedDadosOriginal, config, totalConsolidadoLiq } = useMemo(() => loadSafraData(safraId), [safraId]);
  
  const [fazendaFiltro, setFazendaFiltro] = useState<string | null>(null);
  const [armazemFiltro, setArmazemFiltro] = useState<string | null>(null);

  // Auxiliares de Cor (Usando sharedConfig)
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
  }, [typedDadosOriginal, fazendaFiltro, armazemFiltro]);

  // Contagem de Romaneios (Cargas)
  const romaneiosCount = useMemo(() => dadosFiltrados.length, [dadosFiltrados]);

  // 2. KPIS (Depende de dadosFiltrados)
  const stats: KpiStats = useMemo(() => {
    const isConsolidated = safraId === 'soja2425' || safraId === 'milho25';
    
    let liq: number;
    let bruta: number;
    let umidMed: string;

    if (isConsolidated && !fazendaFiltro && !armazemFiltro) {
      // Se for safra consolidada e não houver filtros, usa o total consolidado
      liq = totalConsolidadoLiq;
      
      // Para safras consolidadas, o cálculo de bruta e umidade média ainda precisa ser feito
      // somando os romaneios, pois o registro de total não é filtrável.
      const brutaSum = typedDadosOriginal.reduce((acc, d) => acc + (Number(d.sacasBruto) || 0), 0);
      const somaUmid = typedDadosOriginal.reduce((acc, d) => acc + (Number(d.umidade) || 0), 0);
      
      bruta = brutaSum;
      umidMed = typedDadosOriginal.length > 0 ? (somaUmid / typedDadosOriginal.length / 100).toFixed(1) : '0.0';

    } else {
      // Lógica normal: soma os romaneios filtrados
      liq = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasLiquida) || 0), 0);
      bruta = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasBruto) || 0), 0);
      
      const somaUmid = dadosFiltrados.reduce((acc, d) => acc + (Number(d.umidade) || 0), 0);
      umidMed = dadosFiltrados.length > 0 ? (somaUmid / dadosFiltrados.length / 100).toFixed(1) : '0.0';
    }
    
    const area = fazendaFiltro ? config.AREAS_FAZENDAS[fazendaFiltro] || 0 : 
      Object.values(config.AREAS_FAZENDAS).reduce((sum, a) => sum + a, 0);

    return {
      totalLiq: liq,
      totalBruta: bruta,
      areaHa: area,
      prodLiq: area > 0 ? (liq / area).toFixed(2) : '0.00', 
      prodBruta: area > 0 ? (bruta / area).toFixed(2) : '0.00',
      umidade: umidMed
    };
  }, [dadosFiltrados, fazendaFiltro, armazemFiltro, config.AREAS_FAZENDAS, safraId, totalConsolidadoLiq, typedDadosOriginal]);

  // 3. CONTRATOS
  const contratosProcessados = useMemo(() => {
    const entregasMap: Record<string, number> = {};
    typedDadosOriginal.forEach(d => {
      const id = String(d.ncontrato).trim();
      if (id && id !== "S/C") {
        entregasMap[id] = (entregasMap[id] || 0) + (Number(d.sacasLiquida) || 0);
      }
    });

    // Define se a safra é uma safra passada onde os contratos são considerados cumpridos
    const isSafraPassadaCumprida = safraId === 'soja2425' || safraId === 'milho25';

    const todos: ProcessedContract[] = Object.keys(config.VOLUMES_CONTRATADOS).map(id => {
      const c = config.VOLUMES_CONTRATADOS[id];
      const cumprido = entregasMap[id] || 0;
      
      let isConcluido = false;
      let aCumprir = 0;
      let perc = 0;

      if (isSafraPassadaCumprida) {
        // Para safras passadas, consideramos todos os contratos como cumpridos
        isConcluido = true;
        aCumprir = 0;
        perc = c.total > 0 ? 100 : (cumprido > 0 ? 100 : 0);
      } else if (c.total === 0) {
        // Contratos de depósito/venda a fixar (volume 0)
        isConcluido = cumprido > 0;
        aCumprir = 0;
        perc = cumprido > 0 ? 100 : 0;
      } else {
        // Contratos com volume fixo (lógica normal)
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
      .filter(d => d.sacas > 0 || allKeys.includes(d.name))
      .sort((a,b) => b.sacas - a.sacas);
  };

  // Obtém todos os nomes únicos de fazendas e armazéns dos dados originais
  const allFazendas = useMemo(() => Array.from(new Set(typedDadosOriginal.map(d => d.fazenda).filter(Boolean) as string[])), [typedDadosOriginal]);
  const allArmazens = useMemo(() => Array.from(new Set(typedDadosOriginal.map(d => d.armazem).filter(Boolean) as string[])), [typedDadosOriginal]);

  // Dados para o Gráfico de Fazendas: Filtrado apenas por Armazém (se houver)
  const dadosParaChartFazendas = useMemo(() => {
    return typedDadosOriginal.filter(d => !armazemFiltro || d.armazem === armazemFiltro);
  }, [typedDadosOriginal, armazemFiltro]);

  const chartFazendas: ChartData[] = useMemo(() => {
    return calculateChartData(dadosParaChartFazendas, 'fazenda', allFazendas);
  }, [dadosParaChartFazendas, allFazendas]);

  // Dados para o Gráfico de Armazéns: Filtrado apenas por Fazenda (se houver)
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
    romaneiosCount, 
    contratosProcessados,
    chartFazendas,
    chartArmazens,
    getCorFazenda,
    getCorArmazem,
  };
};