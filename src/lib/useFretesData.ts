"use client";

import { useMemo, useState } from 'react';
import { Romaneio } from '../data/types';
import { getSafraConfig } from '../data/safraConfig';

const dataMap: Record<string, Romaneio[]> = {
  'soja2526': require('../data/soja2526/romaneios_normalizados.json'),
  'soja2425': require('../data/soja2425/romaneios_normalizados.json'),
  'milho25': require('../data/milho25/romaneios_normalizados.json'),
  'milho26': require('../data/milho26/romaneios_normalizados.json'),
};

const adiantamentosMap: Record<string, any[]> = {
  'soja2526': require('../data/soja2526/adiantamentos_normalizados.json'),
};

const abastecimentosMap: Record<string, any[]> = {
  'soja2526': require('../data/soja2526/abastecimentos_normalizados.json'),
};

export function useFretesData(safraId: string) {
  const safraConfig = getSafraConfig(safraId);
  const isSoja2526 = safraId === 'soja2526';

  const [motoristaFiltro, setMotoristaFiltro] = useState("");
  const [placaFiltro, setPlacaFiltro] = useState("");
  const [armazemFiltro, setArmazemFiltro] = useState("");
  const [tipoCalculo, setTipoCalculo] = useState<'com' | 'sem'>('com');
  const [modeloRelatorio, setModeloRelatorio] = useState<'simples' | 'fazenda'>('simples');
  const [showRelatorio, setShowRelatorio] = useState(false);

  const romaneios = useMemo(() => dataMap[safraId] || [], [safraId]);
  const adiantamentosRaw = useMemo(() => adiantamentosMap[safraId] || [], [safraId]);
  const abastecimentosRaw = useMemo(() => abastecimentosMap[safraId] || [], [safraId]);

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
  }, [showRelatorio, romaneios, motoristaFiltro, placaFiltro, armazemFiltem]);

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
    motoristas, placas, armazens,
    dadosFretes, fretesPorFazenda,
    dadosAdiantamentos, dadosAbastecimentos,
    totaisFreteGlobal, totalAdiantamentos, totaisAbastecimento,
    saldoFinal,
    calcularTotais
  };
}