import { Romaneio } from '../data/types';
import { VOLUMES_CONTRATADOS } from '../data/config';
import dadosOriginal from '../data/romaneios_normalizados.json';

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
  
  // Novo mapa para armazenar o estoque por armazém para os contratos fixos
  const estoqueArmazensFixosMap: Record<string, number> = {};

  // 1. Volume Fixo Global (Apenas os dois contratos específicos)
  const volumeFixoTotal = CONTRATOS_FIXOS.reduce((acc, c) => acc + c.total, 0);

  // 2. Calcular estoque entregue, filtrando por DEPÓSITO (DEP)
  const kpisArmazemOutrosMap: Record<string, number> = {};
  
  typedDadosOriginal.forEach(d => {
    // CORREÇÃO: Apenas romaneios de DEPÓSITO (DEP) devem ser considerados como estoque entregue.
    if (d.tipoNF !== "DEP") return; 
    
    // Filtra apenas entregas de Ildo Romancini (mantendo a lógica existente para quem entrega)
    if (d.emitente === "Ildo Romancini") {
      const sacas = Number(d.sacasLiquida) || 0;
      const armazem = d.armazem || "Outros";

      if (ARMAZENS_CONTRATOS_FIXOS.includes(armazem)) {
        estoqueTotalContratosFixos += sacas;
        // Armazena o estoque por armazém para a melhoria da UI
        estoqueArmazensFixosMap[armazem] = (estoqueArmazensFixosMap[armazem] || 0) + sacas;
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
    
  // 5. Estrutura de dados para o novo card de estoque fixo
  const estoqueArmazensFixos = Object.entries(estoqueArmazensFixosMap)
    .map(([nome, total]) => ({ nome, total: parseFloat(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);


  return {
    estoqueTotalContratosFixos: parseFloat(estoqueTotalContratosFixos.toFixed(2)),
    volumeFixoTotal,
    saldoContratosFixos: parseFloat(saldoContratosFixos.toFixed(2)),
    contratosFixos: CONTRATOS_FIXOS,
    estoqueTotalOutrosArmazens: parseFloat(estoqueTotalOutrosArmazens.toFixed(2)),
    kpisArmazemOutros,
    estoqueArmazensFixos
  };
}