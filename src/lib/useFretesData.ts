"use client";

import { useMemo, useState } from 'react';
import { Romaneio } from '../data/types';
import { getSafraConfig } from '../data/safraConfig';

// Importações estáticas
import soja2526Data from '../data/soja2526/romaneios_normalizados.json';
import soja2425Data from '../data/soja2425/romaneios_normalizados.json';
import milho25Data from '../data/milho25/romaneios_normalizados.json';
import milho26Data from '../data/milho26/romaneios_normalizados.json';

import soja2526Adiantamentos from '../data/soja2526/adiantamentos_normalizados.json';
import soja2526Abastecimentos from '../data/soja2526/abastecimentos_normalizados.json';

const dataMap: Record<string, any[]> = {
  'soja2526': soja2526Data,
  'soja2425': soja2425Data,
  'milho25': milho25Data,
  'milho26': milho26Data,
};

const adiantamentosMap: Record<string, any[]> = {
  'soja2526': soja2526Adiantamentos,
};

const abastecimentosMap: Record<string, any[]> = {
  'soja2526': soja2526Abastecimentos,
};

export type SortKey = 'data' | 'sacasBruto' | 'placa' | 'nfe' | 'armazem';
export type SortOrder = 'asc' | 'desc';

export function useFretesData(safraId: string) {
  const safraConfig = getSafraConfig(safraId);
  const isSoja2526 = safraId === 'soja2526';

  const [motoristaFiltro, setMotoristaFiltro] = useState("");
  const [placaFiltro, setPlacaFiltro] = useState("");
  const [armazemFiltro, setArmazemFiltro] = useState("");
  const [tipoCalculo, setTipoCalculo] = useState<'com' | 'sem'>('com');
  const [modeloRelatorio, setModeloRelatorio] = useState<'simples' | 'fazenda'>('simples');
  const [showRelatorio, setShowRelatorio] = useState(false);
  
  // Estado de ordenação: Padrão por data ascendente
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ 
    key: 'data', 
    order: 'asc' 
  });

  const romaneios = useMemo(() => (dataMap[safraId] || []) as Romaneio[], [safraId]);
  const adiantamentosRaw = useMemo(() => adiantamentosMap[safraId] || [], [safraId]);
  const abastecimentosRaw = useMemo(() => abastecimentosMap[safraId] || [], [safraId]);

  const motoristas = useMemo(() => Array.from(new Set(romaneios.map(r => r.motorista).filter(Boolean))).sort() as string[], [romaneios]);
  const placas = useMemo(() => Array.from(new Set(romaneios.map(r => r.placa).filter(Boolean))).sort() as string[], [romaneios]);
  const armazens = useMemo(() => Array.from(new Set(romaneios.map(r => r.armazem).filter(Boolean))).sort() as string[], [romaneios]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const dadosFretes = useMemo(() => {
    if (!showRelatorio) return [];
    
    // 1. Filtrar
    const filtrados = romaneios.filter(r => {
      const matchM = !motoristaFiltro || r.motorista === motoristaFiltro;
      const matchP = !placaFiltro || r.placa === placaFiltro;
      const matchA = !armazemFiltro || r.armazem === armazemFiltro;
      return matchM && matchP && matchA;
    });

    // 2. Ordenar
    return [...filtrados].sort((a, b) => {
      const { key, order } = sortConfig;
      let valA: any = a[key as keyof Romaneio] ?? '';
      let valB: any = b[key as keyof Romaneio] ?? '';

      if (key === 'sacasBruto') {
        valA = Number(valA);
        valB = Number(valB);
      }

      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [showRelatorio, romaneios, motoristaFiltro, placaFiltro, armazemFiltro, sortConfig]);

  const fretesPorFazenda = useMemo(() => {
    if (modeloRelatorio !== 'fazenda') return {};
    const groups: Record<string, Romaneio[]> = {};
    dadosFretes.forEach(r => {
      const f = r.fazenda || "Não Informada";
      if (!groups[f]) groups[f] = [];
      groups[f].push(r);
    });
    return groups;
  }, [dadosFretes, modeloRelatorio]);

  const dadosAdiantamentos = useMemo(() => {
    if (!showRelatorio || !isSoja2526) return [];
    return adiantamentosRaw.filter(a => !motoristaFiltro || a.motorista === motoristaFiltro);
  }, [showRelatorio, isSoja2526, adiantamentosRaw, motoristaFiltro]);

  const dadosAbastecimentos = useMemo(() => {
    if (!showRelatorio || !isSoja2526) return [];
    return abastecimentosRaw.filter(a => !motoristaFiltro || a.motorista === motoristaFiltro);
  }, [showRelatorio, isSoja2526, abastecimentosRaw, motoristaFiltro]);

  const calcularTotais = (lista: Romaneio[]) => {
    return lista.reduce((acc, r) => {
      const sacasOriginal = Number(r.sacasBruto) || 0;
      const sacasUsada = tipoCalculo === 'com' ? Math.floor(sacasOriginal) : Number(sacasOriginal.toFixed(2));
      const preco = Number(r.precofrete) || 0;
      acc.sacas += sacasUsada;
      acc.valor += sacasUsada * preco;
      return acc;
    }, { sacas: 0, valor: 0 });
  };

  const totaisFreteGlobal = useMemo(() => calcularTotais(dadosFretes), [dadosFretes, tipoCalculo]);

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

  const saldoFinal = totaisFreteGlobal.valor - totalAdiantamentos - totaisAbastecimento.valor;

  return {
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
    dadosFretes, fretesPorFazenda,
    dadosAdiantamentos, dadosAbastecimentos,
    totaisFreteGlobal, totalAdiantamentos, totaisAbastecimento,
    saldoFinal,
    calcularTotais
  };
}