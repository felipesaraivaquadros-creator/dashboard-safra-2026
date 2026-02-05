import { Romaneio } from '../data/types';
import { VOLUMES_CONTRATADOS } from '../data/config';
import dadosOriginal from '../../romaneios_soja_25_26_normalizado.json';

const typedDadosOriginal: Romaneio[] = dadosOriginal as Romaneio[];

const CONTRATOS_FIXOS = Object.keys(VOLUMES_CONTRATADOS)
  .filter(id => VOLUMES_CONTRATADOS[id].total > 0)
  .map(id => ({
    nome: VOLUMES_CONTRATADOS[id].nome,
    total: VOLUMES_CONTRATADOS[id].total,
  }));

export function calculateSaldoDashboard() {
  // 1. Estoque Líquido Global (Tudo que foi entregue)
  const estoqueTotal = typedDadosOriginal.reduce((acc, d) => acc + (Number(d.sacasLiquida) || 0), 0);

  // 2. Volume Fixo Global
  const volumeFixoTotal = CONTRATOS_FIXOS.reduce((acc, c) => acc + c.total, 0);

  // 3. Saldo Líquido Global
  const saldoLiquido = estoqueTotal - volumeFixoTotal;

  // 4. KPI de cada Armazém (Somente Ildo Romancini)
  const kpisArmazemMap: Record<string, number> = {};
  
  typedDadosOriginal.forEach(d => {
    // Filtragem solicitada: Emitente == "Ildo Romancini"
    // Nota: Como o arquivo normalizado foi atualizado, d.emitente deve estar presente.
    // Se não estiver, verificamos o raw data ou assumimos que o script foi rodado.
    if (d.emitente === "Ildo Romancini") {
      const armazem = d.armazem || "Outros";
      kpisArmazemMap[armazem] = (kpisArmazemMap[armazem] || 0) + (Number(d.sacasLiquida) || 0);
    }
  });

  const kpisArmazem = Object.entries(kpisArmazemMap)
    .map(([nome, total]) => ({ nome, total: parseFloat(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);

  return {
    estoqueTotal: parseFloat(estoqueTotal.toFixed(2)),
    volumeFixoTotal,
    saldoLiquido: parseFloat(saldoLiquido.toFixed(2)),
    contratos: CONTRATOS_FIXOS,
    kpisArmazem
  };
}