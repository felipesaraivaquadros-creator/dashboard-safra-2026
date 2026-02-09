import { Romaneio } from '../data/types';
import { getSafraConfig } from '../data/safraConfig';

// Mapeamento para carregar os dados JSON dinamicamente
const dataMap: Record<string, Romaneio[]> = {
  'soja2526': require('../data/soja2526/romaneios_normalizados.json'),
  'soja2425': require('../data/soja2425/romaneios_normalizados.json'),
  'milho25': require('../data/milho25/romaneios_normalizados.json'),
  'milho26': require('../data/milho26/romaneios_normalizados.json'),
};

// IDs dos contratos fixos que devem ser pagos pelo estoque da COFCO NSH e SIPAL MATUPÁ
// Estes IDs são específicos da safra Soja 25/26, mas a lógica deve ser genérica.
const CONTRATOS_FIXOS_SOJA2526_IDS = ["72208", "290925M339"];
const ARMAZENS_CONTRATOS_FIXOS = ["COFCO NSH", "SIPAL MATUPÁ"];

// Função auxiliar para carregar dados e config
function loadSafraData(safraId: string): { dados: Romaneio[], config: ReturnType<typeof getSafraConfig> } {
  const config = getSafraConfig(safraId);
  const dados = dataMap[safraId] || [];
  return { dados, config };
}

export function calculateSaldoDashboard(safraId: string) {
  const { dados: typedDadosOriginal, config } = loadSafraData(safraId);
  
  // Define quais contratos são considerados 'fixos' para o cálculo de saldo.
  // Para Soja 25/26, usamos os IDs definidos. Para outras safras, assumimos que não há saldo fixo.
  const contratosFixosIds = safraId === 'soja2526' ? CONTRATOS_FIXOS_SOJA2526_IDS : [];

  let estoqueTotalContratosFixos = 0;
  let estoqueTotalOutrosArmazens = 0;
  
  const estoqueArmazensFixosMap: Record<string, number> = {};

  // 1. Volume Fixo Total (Apenas os contratos específicos)
  const volumeFixoTotal = contratosFixosIds.reduce((acc, id) => {
    const contrato = config.VOLUMES_CONTRATADOS[id];
    return acc + (contrato ? contrato.total : 0);
  }, 0);

  // 2. Calcular estoque entregue, filtrando por DEPÓSITO (DEP)
  const kpisArmazemOutrosMap: Record<string, number> = {};
  
  typedDadosOriginal.forEach(d => {
    // Considera DEP e VEN-FIXAR como entregas de estoque
    if (d.tipoNF !== "DEP" && d.tipoNF !== "VEN-FIXAR") return; 
    
    // Filtra apenas entregas de Ildo Romancini (mantendo a lógica existente para quem entrega)
    // Nota: Em um cenário real, a lógica de quem entrega para saldo fixo pode variar por safra.
    if (d.emitente === "Ildo Romancini") {
      const sacas = Number(d.sacasLiquida) || 0;
      const armazem = d.armazem || "Outros";

      if (ARMAZENS_CONTRATOS_FIXOS.includes(armazem)) {
        estoqueTotalContratosFixos += sacas;
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

  // 6. Contratos Fixos detalhados
  const contratosFixos = contratosFixosIds
    .map(id => ({
      id,
      nome: config.VOLUMES_CONTRATADOS[id].nome,
      total: config.VOLUMES_CONTRATADOS[id].total,
    }));


  return {
    estoqueTotalContratosFixos: parseFloat(estoqueTotalContratosFixos.toFixed(2)),
    volumeFixoTotal,
    saldoContratosFixos: parseFloat(saldoContratosFixos.toFixed(2)),
    contratosFixos,
    estoqueTotalOutrosArmazens: parseFloat(estoqueTotalOutrosArmazens.toFixed(2)),
    kpisArmazemOutros,
    estoqueArmazensFixos
  };
}