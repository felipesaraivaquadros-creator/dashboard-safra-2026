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
 * Calcula os saldos agrupados por Armazém (usando armazemsaldo) e por Contrato Fixo.
 * O saldo é calculado como Sacas Bruto Entregue - Volume Contratado Fixo.
 */
export function calculateSaldos(): { saldosArmazem: SaldoItem[], saldosContrato: SaldoItem[] } {
  
  // 1. Agrupamento por Contrato (Nome do Contrato) - Lógica inalterada
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

  // 2. Agrupamento por Armazém (usando armazemsaldo)
  
  // 2.1 Mapear Contratos Fixos para Armazéns de Saldo (armazemsaldo)
  const armazemContratoMap: Record<string, number> = {}; // ArmazemSaldo -> Total Contratado Fixo
  const armazemEntregueMap: Record<string, number> = {}; // ArmazemSaldo -> Total Sacas Bruto Entregue
  const contratosProcessadosIds = new Set<string>();

  typedDadosOriginal.forEach(d => {
    // Usando 'armazemsaldo' para o agrupamento
    const armazemSaldo = d.armazemsaldo || 'S/A'; 
    const sacasBruto = Number(d.sacasBruto) || 0;
    const ncontratoId = String(d.ncontrato).trim();
    
    // Soma o total entregue (Bruto) por armazemsaldo
    armazemEntregueMap[armazemSaldo] = (armazemEntregueMap[armazemSaldo] || 0) + sacasBruto;

    // Atribui o volume contratado fixo ao armazém de destino (apenas uma vez por contrato)
    const contratoFixo = CONTRATOS_FIXOS.find(c => c.ncontrato === ncontratoId);
    
    // A lógica de atribuição de contrato é complexa, pois um contrato pode ter entregas em vários armazéns.
    // Para simplificar e garantir que o volume contratado seja subtraído UMA VEZ, 
    // vamos atribuir o volume contratado ao armazemsaldo da PRIMEIRA ocorrência do contrato.
    // No entanto, se o contrato for um DEPÓSITO, ele não tem volume contratado fixo (total: 0), então não precisamos nos preocupar.
    
    // Se o contrato é fixo (volume > 0) e ainda não foi processado, atribuímos o total contratado ao armazemsaldo atual.
    // Isso assume que o volume contratado deve ser coberto pelo estoque total que passa por este 'armazemsaldo'.
    if (contratoFixo && !contratosProcessadosIds.has(ncontratoId)) {
      armazemContratoMap[armazemSaldo] = (armazemContratoMap[armazemSaldo] || 0) + contratoFixo.total;
      contratosProcessadosIds.add(ncontratoId);
    }
  });
  
  // 2.2 Calcular Saldo por Armazém
  const saldosArmazem: SaldoItem[] = Object.keys(armazemEntregueMap).map(armazemSaldo => {
    const entregue = armazemEntregueMap[armazemSaldo];
    const contratado = armazemContratoMap[armazemSaldo] || 0;
    const saldo = entregue - contratado;

    return {
      nome: armazemSaldo,
      tipo: 'Armazem',
      sacasBrutoEntregue: parseFloat(entregue.toFixed(2)),
      volumeContratado: contratado,
      saldo: parseFloat(saldo.toFixed(2)),
    };
  }).sort((a, b) => b.saldo - a.saldo);

  return { saldosArmazem, saldosContrato };
}