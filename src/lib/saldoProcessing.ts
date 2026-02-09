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
  let dados = dataMap[safraId];
  
  // Garante que os dados sejam um array válido, caso contrário, retorna um array vazio.
  if (!Array.isArray(dados)) {
    console.error(`Erro ao carregar dados para a safra ${safraId} no saldo processing. Retornando array vazio.`);
    dados = [];
  }
  
  // Filtra quaisquer registros inválidos que possam ter sobrado (como o antigo 'Total')
  const romaneiosValidos = dados.filter(d => d.sacasLiquida > 0 && d.data !== null);

  return { dados: romaneiosValidos, config };
}

export function calculateSaldoDashboard(safraId: string) {
  
  // --- Lógica Específica para Safra 24/25 (Dados Fixos) ---
  if (safraId === 'soja2425') {
    // Para a safra 24/25, usamos os dados fixos fornecidos pelo usuário
    
    // O estoque total é a soma de todos os armazéns
    const estoqueTotal = ESTOQUE_TOTAL_SOJA2425;
    
    // O volume fixo total é a soma de todos os contratos
    const volumeFixoTotal = CONTRATO_TOTAL_SOJA2425;
    
    // O saldo é a diferença
    const saldoContratosFixos = SALDO_FINAL_SOJA2425;

    // Os KPIs de armazéns são todos os itens de estoque
    const kpisArmazemOutros: SaldoKpi[] = ESTOQUE_FINAL_SOJA2425.map(item => ({
      nome: item.nome,
      total: item.estoqueLiquido,
    }));

    // Os contratos fixos são todos os itens de contrato
    const contratosFixos: SaldoKpi[] = CONTRATOS_SOJA2425.map(item => ({
      nome: item.nome,
      total: item.total,
      id: item.id, // Incluindo ID para referência
    }));

    return {
      estoqueTotalContratosFixos: estoqueTotal,
      volumeFixoTotal,
      saldoContratosFixos,
      contratosFixos,
      estoqueTotalOutrosArmazens: 0, // Não aplicável/usado neste contexto
      kpisArmazemOutros: [], // Não aplicável/usado neste contexto
      estoqueArmazensFixos: kpisArmazemOutros, // Usamos todos os armazéns como 'estoque fixo' para o Card 1
    };
  }
  
  // --- Lógica Padrão para Safra 25/26 (Cálculo Dinâmico) ---
  
  const { dados: typedDadosOriginal, config } = loadSafraData(safraId);
  
  const isSoja2526 = safraId === 'soja2526';
  const contratosFixosIds = isSoja2526 ? CONTRATOS_FIXOS_SOJA2526_IDS : [];

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
    if (d.emitente === "Ildo Romancini") {
      const sacas = Number(d.sacasLiquida) || 0;
      const armazem = d.armazem || "Outros";

      if (isSoja2526 && ARMAZENS_CONTRATOS_FIXOS.includes(armazem)) {
        estoqueTotalContratosFixos += sacas;
        estoqueArmazensFixosMap[armazem] = (estoqueArmazensFixosMap[armazem] || 0) + sacas;
      } else {
        // Armazéns que não são COFCO NSH ou SIPAL MATUPÁ (ou qualquer safra que não seja 25/26)
        estoqueTotalOutrosArmazens += sacas;
        kpisArmazemOutrosMap[armazem] = (kpisArmazemOutrosMap[armazem] || 0) + sacas;
      }
    }
  });

  // 3. Saldo Líquido para Contratos Fixos (Estoque - Contratado)
  const saldoContratosFixos = estoqueTotalContratosFixos - volumeFixoTotal;

  // 4. KPIs de Armazéns (Excluindo os de contratos fixos)
  const kpisArmazemOutros: SaldoKpi[] = Object.entries(kpisArmazemOutrosMap)
    .map(([nome, total]) => ({ nome, total: parseFloat(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);
    
  // 5. Estrutura de dados para o novo card de estoque fixo
  const estoqueArmazensFixos: SaldoKpi[] = Object.entries(estoqueArmazensFixosMap)
    .map(([nome, total]) => ({ nome, total: parseFloat(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);

  // 6. Contratos Fixos detalhados
  const contratosFixos: SaldoKpi[] = contratosFixosIds
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