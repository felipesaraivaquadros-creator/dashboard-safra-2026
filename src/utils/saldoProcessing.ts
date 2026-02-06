import { Romaneio } from '../data/types';
import { VOLUMES_CONTRATADOS } from '../data/config';
import dadosOriginal from '../../romaneios_soja_25_26_normalizado.json';

const typedDadosOriginal: Romaneio[] = dadosOriginal as Romaneio[];

// IDs dos contratos fixos que devem ser pagos pelo estoque da COFCO NSH e SIPAL MATUPÁ
const CONTRATOS_FIXOS_IDS = ["72208", "290925M339"];
const ARMAZENS_CONTRATOS_FIXOS = ["COFCO NSH", "SIPAL MATUPÁ"];

const CONTRATOS_FIXOS = CONTRATOS_FIXOS_IDS
  .map(id => ({
    id,
    nome: VOLUMES_CONTRATADOS[id].nome,
    total: VOLUMES_CONTRATADOS[id].total,
  }));

export function calculateSaldoDashboard() {
  
  let estoqueTotalContratosFixos = 0;
  let estoqueTotalOutrosArmazens = 0;

  // 1. Volume Fixo Global (Apenas os dois contratos específicos)
  const volumeFixoTotal = CONTRATOS_FIXOS.reduce((acc, c) => acc + c.total, 0);

  // 2. Calcular estoque entregue para contratos fixos e para outros armazéns (apenas Ildo Romancini)
  const kpisArmazemOutrosMap: Record<string, number> = {};
  
  typedDadosOriginal.forEach(d => {
    // Filtra apenas entregas de Ildo Romancini
    if (d.emitente === "Ildo Romancini") {
      const sacas = Number(d.sacasLiquida) || 0;
      const armazem = d.armazem || "Outros";

      if (ARMAZENS_CONTRATOS_FIXOS.includes(armazem)) {
        estoqueTotalContratosFixos += sacas;
      } else {
        // Armazéns que não são COFCO NSH ou SIPAL MATUPÁ
        estoqueTotalOutrosArmazens += sacas;
        kpisArmazemOutrosMap[armazem] = (kpisArmazemOutrosMap[armazem] || 0) + sacas;
      }
    }
  });

  // 3. Saldo Líquido para Contratos Fixos (Estoque - Contratado)
  const saldoContratosFixos = estoqueTotalContratosFixos - volumeFixoTotal;

  // 4. KPIs de Armazéns (Excluindo os de contratos fixos)
  const kpisArmazemOutros = Object.entries(kpisArmazemOutrosMap)
    .map(([nome, total]) => ({ nome, total: parseFloat(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);

  return {
    estoqueTotalContratosFixos: parseFloat(estoqueTotalContratosFixos.toFixed(2)),
    volumeFixoTotal,
    saldoContratosFixos: parseFloat(saldoContratosFixos.toFixed(2)),
    contratosFixos: CONTRATOS_FIXOS,
    estoqueTotalOutrosArmazens: parseFloat(estoqueTotalOutrosArmazens.toFixed(2)),
    kpisArmazemOutros
  };
}