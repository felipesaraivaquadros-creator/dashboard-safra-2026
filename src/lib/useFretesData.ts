"use client";

import { useMemo, useState, useEffect, useCallback } from 'react';
import { Romaneio } from '../data/types';
import { getSafraConfig } from '../data/safraConfig';
import { supabase } from '../integrations/supabase/client';

export type SortKey = 'data' | 'sacasBruto' | 'placa' | 'nfe' | 'armazem' | 'motorista';
export type SortOrder = 'asc' | 'desc';

export function useFretesData(safraId: string) {
  const safraConfig = getSafraConfig(safraId);

  const [motoristaFiltro, setMotoristaFiltro] = useState("");
  const [placaFiltro, setPlacaFiltro] = useState("");
  const [armazemFiltro, setArmazemFiltro] = useState("");
  const [tipoCalculo, setTipoCalculo] = useState<'com' | 'sem'>('com');
  const [modeloRelatorio, setModeloRelatorio] = useState<'simples' | 'fazenda' | 'consolidado' | 'armazem'>('simples');
  const [showRelatorio, setShowRelatorio] = useState(false);
  
  const [romaneios, setRomaneios] = useState<Romaneio[]>([]);
  const [adiantamentos, setAdiantamentos] = useState<any[]>([]);
  const [abastecimentos, setAbastecimentos] = useState<any[]>([]);
  const [precosDb, setPrecosDb] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ 
    key: 'data', 
    order: 'asc' 
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [romRes, adiantRes, abastRes, precosRes] = await Promise.all([
        supabase.from('romaneios').select(`*, fazendas(nome), armazens(nome)`).eq('safra_id', safraId),
        supabase.from('adiantamentos').select('*').eq('safra_id', safraId),
        supabase.from('abastecimentos').select('*').eq('safra_id', safraId),
        supabase.from('precos_frete').select('cidade, valor').eq('safra_id', safraId)
      ]);

      if (romRes.data) {
        setRomaneios(romRes.data.map(d => ({
          data: d.data,
          nfe: d.nfe,
          placa: d.placa,
          motorista: d.motorista,
          armazem: d.armazem_nome || d.armazens?.nome || "Outros",
          fazenda: d.fazendas?.nome || "Outros",
          sacasBruto: Number(d.sacas_bruto) || 0,
          precofrete: Number(d.preco_frete) || 0,
          cidadeEntrega: d.cidade_entrega,
          // Campos obrigatórios da interface Romaneio com valores padrão
          contrato: "S/C",
          ncontrato: "S/C",
          tipoNF: d.tipo_nf || null,
          numero: d.numero_romaneio || null,
          talhao: d.talhao || null,
          pesoLiquidoKg: Number(d.peso_liquid_kg) || 0,
          pesoBrutoKg: Number(d.peso_bruto_kg) || 0,
          sacasLiquida: Number(d.sacas_liquida) || 0,
          umidade: Number(d.umidade) || 0,
          impureza: Number(d.impureza) || 0,
          ardido: Number(d.ardido) || 0,
          avariados: Number(d.avariados) || 0,
          quebrados: Number(d.quebrados) || 0
        })));
      }

      if (adiantRes.data) setAdiantamentos(adiantRes.data);
      if (abastRes.data) setAbastecimentos(abastRes.data);
      
      if (precosRes.data) {
        const map = Object.fromEntries(precosRes.data.map(p => [p.cidade.toUpperCase(), Number(p.valor)]));
        setPrecosDb(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [safraId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    
    const filtrados = romaneios.filter(r => {
      const matchM = !motoristaFiltro || r.motorista === motoristaFiltro;
      const matchP = !placaFiltro || r.placa === placaFiltro;
      const matchA = !armazemFiltro || r.armazem === armazemFiltro;
      return matchM && matchP && matchA;
    });

    const comPrecos = filtrados.map(r => {
      const cidade = (r.cidadeEntrega || "").toUpperCase();
      const precoSugerido = precosDb[cidade] || r.precofrete || 0;
      return { ...r, precofrete: precoSugerido };
    });

    return [...comPrecos].sort((a, b) => {
      const { key, order } = sortConfig;
      let valA: any = a[key as keyof Romaneio] ?? '';
      let valB: any = b[key as keyof Romaneio] ?? '';
      if (key === 'sacasBruto') { valA = Number(valA); valB = Number(valB); }
      if (valA < valB) return order === 'asc' ? -1 : 1;
      if (valA > valB) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [showRelatorio, romaneios, motoristaFiltro, placaFiltro, armazemFiltro, sortConfig, precosDb]);

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

  const fretesPorArmazem = useMemo(() => {
    if (modeloRelatorio !== 'armazem') return {};
    const groups: Record<string, Romaneio[]> = {};
    dadosFretes.forEach(r => {
      const a = r.armazem || "Não Informado";
      if (!groups[a]) groups[a] = [];
      groups[a].push(r);
    });
    return groups;
  }, [dadosFretes, modeloRelatorio]);

  const fretesConsolidados = useMemo(() => {
    if (modeloRelatorio !== 'consolidado') return [];
    const groups: Record<string, { motorista: string, sacasBruto: number, valorTotal: number }> = {};
    dadosFretes.forEach(r => {
      const m = r.motorista || "Não Informado";
      if (!groups[m]) groups[m] = { motorista: m, sacasBruto: 0, valorTotal: 0 };
      const sacasOriginal = Number(r.sacasBruto) || 0;
      const sacasUsada = tipoCalculo === 'com' ? Math.floor(sacasOriginal) : Number(sacasOriginal.toFixed(2));
      const preco = Number(r.precofrete) || 0;
      groups[m].sacasBruto += sacasUsada;
      groups[m].valorTotal += sacasUsada * preco;
    });
    return Object.values(groups).sort((a, b) => b.valorTotal - a.valorTotal);
  }, [dadosFretes, modeloRelatorio, tipoCalculo]);

  const dadosAdiantamentos = useMemo(() => {
    if (!showRelatorio) return [];
    return adiantamentos.filter(a => !motoristaFiltro || a.motorista === motoristaFiltro);
  }, [showRelatorio, adiantamentos, motoristaFiltro]);

  const dadosAbastecimentos = useMemo(() => {
    if (!showRelatorio) return [];
    return abastecimentos.filter(a => !motoristaFiltro || a.motorista === motoristaFiltro);
  }, [showRelatorio, abastecimentos, motoristaFiltro]);

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
  const totalAdiantamentos = useMemo(() => dadosAdiantamentos.reduce((sum, a) => sum + Number(a.valor), 0), [dadosAdiantamentos]);
  const totaisAbastecimento = useMemo(() => dadosAbastecimentos.reduce((acc, a) => {
    acc.litros += Number(a.litros);
    acc.valor += Number(a.total);
    return acc;
  }, { litros: 0, valor: 0 }), [dadosAbastecimentos]);

  return {
    safraConfig,
    motoristaFiltro, setMotoristaFiltro,
    placaFiltro, setPlacaFiltro,
    armazemFiltro, setArmazemFiltro,
    tipoCalculo, setTipoCalculo,
    modeloRelatorio, setModeloRelatorio,
    showRelatorio, setShowRelatorio,
    sortConfig, handleSort,
    motoristas, placas, armazens,
    dadosFretes, fretesPorFazenda, fretesPorArmazem, fretesConsolidados,
    dadosAdiantamentos, dadosAbastecimentos,
    totaisFreteGlobal, totalAdiantamentos, totaisAbastecimento,
    saldoFinal: totaisFreteGlobal.valor - totalAdiantamentos - totaisAbastecimento.valor,
    calcularTotais,
    fetchPrecos: fetchData,
    loading
  };
}