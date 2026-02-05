import { Romaneio } from '../data/types';
import { VOLUMES_CONTRATADOS } from '../data/config';
import { SaldoItem } from '../data/saldoTypes';
import dadosOriginal from '../../romaneios_soja_25_26_normalizado.json';

const typedDadosOriginal: Romaneio[] = dadosOriginal as Romaneio[];

// Contratos com volume fixo (não depósitos)
const CONTRATOS_FIXOS = Object.keys(VOLUMES_CONTRATADOS)
  .filter(id => VOLUMES_CONTRATADOS[id].total > 0)
  .map(id => ({
    ncontrato: id,
    nome: VOLUMES_CONTRATADOS[id].nome,
    total: VOLUMES_CONTRATADOS[id].total,
  }));

/**
 * Calcula os saldos agrupados por Armazém e por Contrato Fixo.
 * O saldo é calculado como Sacas Bruto Entregue - Volume Contratado Fixo.
 */
export function calculateSaldos(): { saldosArmazem: SaldoItem[], saldosContrato: SaldoItem[] } {
  
  // 1. Agrupamento por Contrato (Nome do Contrato)
  const contratoMap: Record<string, { sacasBruto: number, ncontrato: string }> = {};

  typedDadosOriginal.forEach(d => {
    const ncontratoId = String(d.ncontrato).trim();
    const sacasBruto = Number(d.sacasBruto) || 0;

    if (ncontratoId) {
      if (!contratoMap[ncontratoId]) {
        contratoMap[ncontratoId] = { sacasBruto: 0, ncontrato: ncontratoId };
      }
      contratoMap[ncontratoId].sacasBruto += sacasBruto;
    }
  });

  const saldosContrato: SaldoItem[] = CONTRATOS_FIXOS.map(c => {
    const entregue = contratoMap[c.ncontrato]?.sacasBruto || 0;
    const saldo = entregue - c.total;

    return {
      nome: c.nome,
      tipo: 'Contrato',
      sacasBrutoEntregue: parseFloat(entregue.toFixed(2)),
      volumeContratado: c.total,
      saldo: parseFloat(saldo.toFixed(2)),
    };
  }).sort((a, b) => b.saldo - a.saldo);

  // 2. Agrupamento por Armazém
  
  // 2.1 Mapear Contratos Fixos para Armazéns de Entrega
  // Atribui o volume total contratado ao armazém onde a entrega foi feita.
  // Se um contrato foi entregue em múltiplos armazéns, o volume contratado será
  // atribuído ao primeiro armazém encontrado para aquele contrato.
  const armazemContratoMap: Record<string, number> = {}; // Armazem -> Total Contratado Fixo
  const armazemEntregueMap: Record<string, number> = {}; // Armazem -> Total Sacas Bruto Entregue
  const contratosProcessadosIds = new Set<string>();

  typedDadosOriginal.forEach(d => {
    const armazem = d.armazem || 'S/A';
    const sacasBruto = Number(d.sacasBruto) || 0;
    const ncontratoId = String(d.ncontrato).trim();
    
    // Soma o total entregue (Bruto) por armazém
    armazemEntregueMap[armazem] = (armazemEntregueMap[armazem] || 0) + sacasBruto;

    // Atribui o volume contratado fixo ao armazém de destino (apenas uma vez por contrato)
    const contratoFixo = CONTRATOS_FIXOS.find(c => c.ncontrato === ncontratoId);
    
    if (contratoFixo && !contratosProcessadosIds.has(ncontratoId)) {
      armazemContratoMap[armazem] = (armazemContratoMap[armazem] || 0) + contratoFixo.total;
      contratosProcessadosIds.add(ncontratoId);
    }
  });
  
  // 2.2 Calcular Saldo por Armazém
  const saldosArmazem: SaldoItem[] = Object.keys(armazemEntregueMap).map(armazem => {
    const entregue = armazemEntregueMap[armazem];
    const contratado = armazemContratoMap[armazem] || 0;
    const saldo = entregue - contratado;

    return {
      nome: armazem,
      tipo: 'Armazem',
      sacasBrutoEntregue: parseFloat(entregue.toFixed(2)),
      volumeContratado: contratado,
      saldo: parseFloat(saldo.toFixed(2)),
    };
  }).sort((a, b) => b.saldo - a.saldo);

  return { saldosArmazem, saldosContrato };
}