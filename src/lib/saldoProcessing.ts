import { Romaneio } from '../data/types';
import { SaldoKpi } from '../data/saldoTypes';
import { getSafraConfig } from '../data/safraConfig';
import { 
  ESTOQUE_FINAL_SOJA2425, 
  CONTRATOS_SOJA2425, 
  ESTOQUE_TOTAL_SOJA2425, 
  CONTRATO_TOTAL_SOJA2425, 
  SALDO_FINAL_SOJA2425 
} from '../data/soja2425/saldoConfig';
import { 
  ESTOQUE_FINAL_MILHO25, 
  CONTRATOS_MILHO25, 
  ESTOQUE_TOTAL_MILHO25, 
  CONTRATO_TOTAL_MILHO25, 
  SALDO_FINAL_MILHO25 
} from '../data/milho25/saldoConfig';

const dataMap: Record<string, Romaneio[]> = {
  'soja2526': require('../data/soja2526/romaneios_normalizados.json'),
  'soja2425': require('../data/soja2425/romaneios_normalizados.json'),
  'milho25': require('../data/milho25/romaneios_normalizados.json'),
  'milho26': require('../data/milho26/romaneios_normalizados.json'),
};

const CONTRATOS_FIXOS_SOJA2526_IDS = ["72208", "290925M339"];
const ARMAZENS_CONTRATOS_FIXOS = ["COFCO NSH", "SIPAL MATUPÁ"];

function loadSafraData(safraId: string): { dados: Romaneio[], config: ReturnType<typeof getSafraConfig> } {
  const config = getSafraConfig(safraId);
  let dados = dataMap[safraId];
  
  if (!Array.isArray(dados)) {
    console.error(`Erro ao carregar dados para a safra ${safraId} no saldo processing. Retornando array vazio.`);
    dados = [];
  }
  
  const romaneiosValidos = dados.filter(d => d.sacasLiquida > 0 && d.data !== null);

  return { dados: romaneiosValidos, config };
}

export function calculateSaldoDashboard(safraId: string) {
  
  if (safraId === 'soja2425') {
    const estoqueTotal = ESTOQUE_TOTAL_SOJA2425;
    const volumeFixoTotal = CONTRATO_TOTAL_SOJA2425;
    const saldoContratosFixos = SALDO_FINAL_SOJA2425;

    const estoqueArmazensFixos: SaldoKpi[] = ESTOQUE_FINAL_SOJA2425.map(item => ({
      nome: item.nome,
      total: item.estoqueLiquido,
      totalKg: item.estoqueLiquido * 60
    }));

    const contratosFixos: SaldoKpi[] = CONTRATOS_SOJA2425.map(item => ({
      nome: item.nome,
      total: item.total,
      totalKg: item.total * 60,
      id: item.id,
    }));

    return {
      estoqueTotalContratosFixos: estoqueTotal,
      estoqueTotalContratosFixosKg: estoqueTotal * 60,
      volumeFixoTotal,
      volumeFixoTotalKg: volumeFixoTotal * 60,
      saldoContratosFixos,
      saldoContratosFixosKg: saldoContratosFixos * 60,
      contratosFixos,
      estoqueTotalOutrosArmazens: 0,
      estoqueTotalOutrosArmazensKg: 0,
      kpisArmazemOutros: [],
      estoqueArmazensFixos,
    };
  }
  
  if (safraId === 'milho25') {
    const estoqueTotal = ESTOQUE_TOTAL_MILHO25;
    const volumeFixoTotal = CONTRATO_TOTAL_MILHO25;
    const saldoContratosFixos = SALDO_FINAL_MILHO25;

    const estoqueArmazensFixos: SaldoKpi[] = ESTOQUE_FINAL_MILHO25.map(item => ({
      nome: item.nome,
      total: item.estoqueLiquido,
      totalKg: item.estoqueLiquido * 60
    }));

    const contratosFixos: SaldoKpi[] = CONTRATOS_MILHO25.map(item => ({
      nome: item.nome,
      total: item.total,
      totalKg: item.total * 60,
      id: item.id,
    }));

    return {
      estoqueTotalContratosFixos: estoqueTotal,
      estoqueTotalContratosFixosKg: estoqueTotal * 60,
      volumeFixoTotal,
      volumeFixoTotalKg: volumeFixoTotal * 60,
      saldoContratosFixos,
      saldoContratosFixosKg: saldoContratosFixos * 60,
      contratosFixos,
      estoqueTotalOutrosArmazens: 0,
      estoqueTotalOutrosArmazensKg: 0,
      kpisArmazemOutros: [],
      estoqueArmazensFixos,
    };
  }
  
  const { dados: typedDadosOriginal, config } = loadSafraData(safraId);
  
  const isSoja2526 = safraId === 'soja2526';
  const contratosFixosIds = isSoja2526 ? CONTRATOS_FIXOS_SOJA2526_IDS : [];

  let estoqueTotalContratosFixos = 0;
  let estoqueTotalContratosFixosKg = 0;
  let estoqueTotalOutrosArmazens = 0;
  let estoqueTotalOutrosArmazensKg = 0;
  
  const estoqueArmazensFixosMap: Record<string, { sc: number, kg: number }> = {};
  const kpisArmazemOutrosMap: Record<string, { sc: number, kg: number }> = {};

  const volumeFixoTotal = contratosFixosIds.reduce((acc, id) => {
    const contrato = config.VOLUMES_CONTRATADOS[id];
    return acc + (contrato ? contrato.total : 0);
  }, 0);

  typedDadosOriginal.forEach(d => {
    if (d.tipoNF !== "DEP" && d.tipoNF !== "VEN-FIXAR") return; 
    
    if (d.emitente === "Ildo Romancini") {
      const sacas = Number(d.sacasLiquida) || 0;
      const kg = Number(d.pesoLiquidoKg) || 0;
      const armazem = d.armazem || "Outros";

      if (isSoja2526 && ARMAZENS_CONTRATOS_FIXOS.includes(armazem)) {
        estoqueTotalContratosFixos += sacas;
        estoqueTotalContratosFixosKg += kg;
        if (!estoqueArmazensFixosMap[armazem]) estoqueArmazensFixosMap[armazem] = { sc: 0, kg: 0 };
        estoqueArmazensFixosMap[armazem].sc += sacas;
        estoqueArmazensFixosMap[armazem].kg += kg;
      } else {
        estoqueTotalOutrosArmazens += sacas;
        estoqueTotalOutrosArmazensKg += kg;
        if (!kpisArmazemOutrosMap[armazem]) kpisArmazemOutrosMap[armazem] = { sc: 0, kg: 0 };
        kpisArmazemOutrosMap[armazem].sc += sacas;
        kpisArmazemOutrosMap[armazem].kg += kg;
      }
    }
  });

  const saldoContratosFixos = estoqueTotalContratosFixos - volumeFixoTotal;
  const saldoContratosFixosKg = estoqueTotalContratosFixosKg - (volumeFixoTotal * 60);

  const kpisArmazemOutros: SaldoKpi[] = Object.entries(kpisArmazemOutrosMap)
    .map(([nome, val]) => ({ nome, total: parseFloat(val.sc.toFixed(2)), totalKg: val.kg }))
    .sort((a, b) => b.total - a.total);
    
  const estoqueArmazensFixos: SaldoKpi[] = Object.entries(estoqueArmazensFixosMap)
    .map(([nome, val]) => ({ nome, total: parseFloat(val.sc.toFixed(2)), totalKg: val.kg }))
    .sort((a, b) => b.total - a.total);

  const contratosFixos: SaldoKpi[] = contratosFixosIds
    .map(id => ({
      id,
      nome: config.VOLUMES_CONTRATADOS[id].nome,
      total: config.VOLUMES_CONTRATADOS[id].total,
      totalKg: config.VOLUMES_CONTRATADOS[id].total * 60
    }));


  return {
    estoqueTotalContratosFixos: parseFloat(estoqueTotalContratosFixos.toFixed(2)),
    estoqueTotalContratosFixosKg,
    volumeFixoTotal,
    volumeFixoTotalKg: volumeFixoTotal * 60,
    saldoContratosFixos: parseFloat(saldoContratosFixos.toFixed(2)),
    saldoContratosFixosKg,
    contratosFixos,
    estoqueTotalOutrosArmazens: parseFloat(estoqueTotalOutrosArmazens.toFixed(2)),
    estoqueTotalOutrosArmazensKg,
    kpisArmazemOutros,
    estoqueArmazensFixos
  };
}