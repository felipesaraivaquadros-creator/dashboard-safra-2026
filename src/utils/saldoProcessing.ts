import { Romaneio } from '../data/types';
import { VOLUMES_CONTRATADOS } from '../data/config';
import dadosOriginal from '../../romaneios_soja_25_26_normalizado.json';

const typedDadosOriginal: Romaneio[] = dadosOriginal as Romaneio[];

// Contratos com volume fixo (não depósitos)
const CONTRATOS_FIXOS = Object.keys(VOLUMES_CONTRATADOS)
  .filter(id => VOLUMES_CONTRATADOS[id].total > 0)
  .map(id => ({
    nome: VOLUMES_CONTRATADOS[id].nome,
    total: VOLUMES_CONTRATADOS[id].total,
  }));

export function calculateSaldoDashboard() {
  // 1. Estoque Líquido (Soma de tudo que foi entregue)
  const estoqueTotal = typedDadosOriginal.reduce((acc, d) => acc + (Number(d.sacasLiquida) || 0), 0);

  // 2. Volume Fixo (Soma das metas dos contratos fixos - Constante 63.550)
  const volumeFixoTotal = CONTRATOS_FIXOS.reduce((acc, c) => acc + c.total, 0);

  // 3. Saldo Líquido (Estoque - Volume Fixo)
  const saldoLiquido = estoqueTotal - volumeFixoTotal;

  return {
    estoqueTotal: parseFloat(estoqueTotal.toFixed(2)),
    volumeFixoTotal,
    saldoLiquido: parseFloat(saldoLiquido.toFixed(2)),
    contratos: CONTRATOS_FIXOS
  };
}