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

function loadSafraData(safraId: string): { dados: Romaneio[], config: any } {
  const config = getSafraConfig(safraId);
  let dados = dataMap[safraId];
  
  if (!Array.isArray(dados)) {
    dados = [];
  }
  
  const romaneiosValidos = dados.filter(d => d.sacasLiquida > 0 && d.data !== null);
  return { dados: romaneiosValidos, config };
}

export function calculateSaldoDashboard(safraId: string) {
  // Lógica para Safras Passadas (Dados Estáticos)
  if (safraId === 'soja2425' || safraId === 'milho25') {
    const isSoja = safraId === 'soja2425';
    const estoqueFinal = isSoja ? ESTOQUE_FINAL_SOJA2425 : ESTOQUE_FINAL_MILHO25;
    const contratosFinal = isSoja ? CONTRATOS_SOJA2425 : CONTRATOS_MILHO25;
    
    const listaSaldos: SaldoKpi[] = estoqueFinal.map(item => ({
      nome: item.nome,
      total: item.estoqueLiquido,
      totalKg: item.estoqueLiquido * 60
    }));

    const listaContratos: SaldoKpi[] = contratosFinal.map(item => ({
      nome: item.nome,
      total: item.total,
      totalKg: item.total * 60,
      id: item.id,
    }));

    const totalEstoque = isSoja ? ESTOQUE_TOTAL_SOJA2425 : ESTOQUE_TOTAL_MILHO25;
    const totalContratos = isSoja ? CONTRATO_TOTAL_SOJA2425 : CONTRATO_TOTAL_MILHO25;
    const saldoGeral = isSoja ? SALDO_FINAL_SOJA2425 : SALDO_FINAL_MILHO25;

    return {
      listaSaldos,
      listaContratos,
      totalEstoque,
      totalContratos,
      saldoGeral,
      // Mantendo compatibilidade com grupos se necessário
      estoqueArmazensFixos: listaSaldos,
      contratosFixos: listaContratos,
      saldoContratosFixos: saldoGeral,
      estoqueTotalContratosFixos: totalEstoque,
      volumeFixoTotal: totalContratos,
      kpisArmazemOutros: [],
      outrosContratos: [],
      saldoOutros: 0
    };
  }
  
  // Lógica para Safra Atual (Dinâmica)
  const { dados: typedDadosOriginal, config } = loadSafraData(safraId);
  const isSoja2526 = safraId === 'soja2526';

  const saldosMap: Record<string, { sc: number, kg: number }> = {};
  
  typedDadosOriginal.forEach(d => {
    if (d.tipoNF !== "DEP" && d.tipoNF !== "VEN-FIXAR") return; 
    if (d.emitente === "Ildo Romancini") {
      const armazem = d.armazem || "Outros";
      if (!saldosMap[armazem]) saldosMap[armazem] = { sc: 0, kg: 0 };
      saldosMap[armazem].sc += Number(d.sacasLiquida) || 0;
      saldosMap[armazem].kg += Number(d.pesoLiquidoKg) || 0;
    }
  });

  const listaSaldos: SaldoKpi[] = Object.entries(saldosMap)
    .map(([nome, val]) => ({ nome, total: parseFloat(val.sc.toFixed(2)), totalKg: val.kg }))
    .sort((a, b) => b.total - a.total);

  const listaContratos: SaldoKpi[] = Object.keys(config.VOLUMES_CONTRATADOS).map(id => ({
    id,
    nome: config.VOLUMES_CONTRATADOS[id].nome,
    total: config.VOLUMES_CONTRATADOS[id].total,
    totalKg: config.VOLUMES_CONTRATADOS[id].total * 60
  })).sort((a, b) => b.total - a.total);

  const totalEstoque = listaSaldos.reduce((acc, item) => acc + item.total, 0);
  const totalContratos = listaContratos.reduce((acc, item) => acc + item.total, 0);
  const saldoGeral = totalEstoque - totalContratos;

  // Lógica de Grupos (Sipal vs Outros) para a aba Disponível
  const estoqueSipal = listaSaldos
    .filter(s => ARMAZENS_CONTRATOS_FIXOS.includes(s.nome))
    .reduce((acc, s) => acc + s.total, 0);
  
  const contratosSipal = listaContratos
    .filter(c => CONTRATOS_FIXOS_SOJA2526_IDS.includes(c.id || ""))
    .reduce((acc, c) => acc + c.total, 0);

  return {
    listaSaldos,
    listaContratos,
    totalEstoque,
    totalContratos,
    saldoGeral,
    // Dados para grupos específicos
    estoqueArmazensFixos: listaSaldos.filter(s => ARMAZENS_CONTRATOS_FIXOS.includes(s.nome)),
    contratosFixos: listaContratos.filter(c => CONTRATOS_FIXOS_SOJA2526_IDS.includes(c.id || "")),
    estoqueTotalContratosFixos: estoqueSipal,
    volumeFixoTotal: contratosSipal,
    saldoContratosFixos: estoqueSipal - contratosSipal,
    kpisArmazemOutros: listaSaldos.filter(s => !ARMAZENS_CONTRATOS_FIXOS.includes(s.nome)),
    outrosContratos: listaContratos.filter(c => !CONTRATOS_FIXOS_SOJA2526_IDS.includes(c.id || "")),
    saldoOutros: (totalEstoque - estoqueSipal) - (totalContratos - contratosSipal)
  };
}