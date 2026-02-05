import { Romaneio } from '../data/types';
import { VOLUMES_CONTRATADOS } from '../data/config';
import { SaldoItem } from '../data/saldoTypes';
import dadosOriginal from '../../romaneios_soja_25_26_normalizado.json';

const typedDadosOriginal: Romaneio[] = dadosOriginal as Romaneio[];

// Contratos com volume fixo (não depósitos) - Total deve somar 63.550sc
const CONTRATOS_FIXOS = Object.keys(VOLUMES_CONTRATADOS)
  .filter(id => VOLUMES_CONTRATADOS[id].total > 0)
  .map(id => ({
    ncontrato: id,
    nome: VOLUMES_CONTRATADOS[id].nome,
    total: VOLUMES_CONTRATADOS[id].total,
  }));

/**
 * Calcula os saldos agrupados por Armazém (armazemsaldo) e por Contrato Fixo.
 * O estoque agora é baseado em Sacas Líquidas.
 */
export function calculateSaldos(): { saldosArmazem: SaldoItem[], saldosContrato: SaldoItem[] } {
  
  // 1. Agrupamento por Contrato
  const contratoMap: Record<string, { sacasLiquida: number, ncontrato: string }> = {};

  typedDadosOriginal.forEach(d => {
    const ncontratoId = String(d.ncontrato).trim();
    const sacasLiquida = Number(d.sacasLiquida) || 0;

    if (ncontratoId) {
      if (!contratoMap[ncontratoId]) {
        contratoMap[ncontratoId] = { sacasLiquida: 0, ncontrato: ncontratoId };
      }
      contratoMap[ncontratoId].sacasLiquida += sacasLiquida;
    }
  });

  const saldosContrato: SaldoItem[] = CONTRATOS_FIXOS.map(c => {
    const entregue = contratoMap[c.ncontrato]?.sacasLiquida || 0;
    const saldo = entregue - c.total;

    return {
      nome: c.nome,
      tipo: 'Contrato',
      estoqueLiquido: parseFloat(entregue.toFixed(2)),
      volumeContratado: c.total,
      saldo: parseFloat(saldo.toFixed(2)),
    };
  }).sort((a, b) => b.saldo - a.saldo);

  // 2. Agrupamento por Armazém (usando armazemsaldo)
  const armazemContratoMap: Record<string, number> = {}; 
  const armazemEntregueMap: Record<string, number> = {}; 
  const contratosProcessadosIds = new Set<string>();

  typedDadosOriginal.forEach(d => {
    const armazemSaldo = d.armazemsaldo || 'S/A'; 
    const sacasLiquida = Number(d.sacasLiquida) || 0;
    const ncontratoId = String(d.ncontrato).trim();
    
    // Soma o estoque líquido por armazemsaldo
    armazemEntregueMap[armazemSaldo] = (armazemEntregueMap[armazemSaldo] || 0) + sacasLiquida;

    const contratoFixo = CONTRATOS_FIXOS.find(c => c.ncontrato === ncontratoId);
    
    if (contratoFixo && !contratosProcessadosIds.has(ncontratoId)) {
      armazemContratoMap[armazemSaldo] = (armazemContratoMap[armazemSaldo] || 0) + contratoFixo.total;
      contratosProcessadosIds.add(ncontratoId);
    }
  });
  
  const saldosArmazem: SaldoItem[] = Object.keys(armazemEntregueMap).map(armazemSaldo => {
    const entregue = armazemEntregueMap[armazemSaldo];
    const contratado = armazemContratoMap[armazemSaldo] || 0;
    const saldo = entregue - contratado;

    return {
      nome: armazemSaldo,
      tipo: 'Armazem',
      estoqueLiquido: parseFloat(entregue.toFixed(2)),
      volumeContratado: contratado,
      saldo: parseFloat(saldo.toFixed(2)),
    };
  }).sort((a, b) => b.saldo - a.saldo);

  return { saldosArmazem, saldosContrato };
}