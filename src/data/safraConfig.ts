import { ContractVolume } from './types';

export interface SafraConfig {
  id: string;
  nome: string;
  tipo: 'Soja' | 'Milho';
  status: 'Atual' | 'Passada' | 'Futura';
  dataPath: string; // Caminho para o JSON normalizado
  AREAS_FAZENDAS: Record<string, number>;
  VOLUMES_CONTRATADOS: Record<string, ContractVolume>;
}

// --- CONFIGURAÇÕES DE SAFRAS ---

// 1. SOJA 25/26 (Safra Atual)
const SOJA2526_CONFIG: SafraConfig = {
  id: 'soja2526',
  nome: 'Soja 25/26',
  tipo: 'Soja',
  status: 'Atual',
  dataPath: './soja2526/romaneios_normalizados.json',
  AREAS_FAZENDAS: { 
    "São Luiz": 675, 
    "Castanhal": 600, 
    "Romancini": 435, 
    "Estrelinha": 240 
  },
  VOLUMES_CONTRATADOS: {
    "72208": { nome: "Venda Sipal 20 Mil Sacas", total: 20000 },
    "7.650SC": { nome: "BEDIN", total: 7650 },
    "290925M339": { nome: "Troca Adubo Sipal 29.500 Sacas", total: 29500 },
    "ARR-CST-USIMAT": { nome: "Arrendamento CT", total: 10000 },
    "ARR-SLZ-COFCO": { nome: "Arrendamento SL", total: 4050 },
    "Comissoes": { nome: "Venda 800 Sacas Comissão", total: 800 },
    "DEP-MAT-AMAGGI": { nome: "Depósito Amaggi Matupá", total: 0 }, 
    "DEP-LRV-SIPAL": { nome: "Depósito Sipal LRV", total: 0 },
    "DEP-CLA-SIPAL": { nome: "Depósito Sipal Cláudia", total: 0 },
    "VENDA-ADM-FIXAR": { nome: "Venda ADM a Fixar", total: 0 },
  },
};

// 2. SOJA 24/25 (Safra Passada)
const SOJA2425_CONFIG: SafraConfig = {
  id: 'soja2425',
  nome: 'Soja 24/25',
  tipo: 'Soja',
  status: 'Passada',
  AREAS_FAZENDAS: { 
    "São Luiz": 700, 
    "Castanhal": 600, 
    "Romancini": 435, 
    "Estrelinha": 225 
  },
  dataPath: './soja2425/romaneios_normalizados.json',
  VOLUMES_CONTRATADOS: {
    "9058-8634": { nome: "Barter Amaggi Matupá", total: 5754 },
    "9058-8633": { nome: "Barter Amaggi Sinop", total: 18000 },
    "ARR-PC": { nome: "Arrend. + Plant. + Insumos (PC)", total: 11577 },
    "SERV-D": { nome: "Serviço Dieison", total: 1032 },
    "290925M51": { nome: "Venda Sipal M51", total: 3000 },
    "290925M69": { nome: "Venda Sipal M69", total: 3000 },
    "ILDIANA": { nome: "Venda Amaggi Ildiana", total: 3000 },
    "20240105500994-1": { nome: "Venda Amaggi LRV", total: 18000 },
    "1334P50762S": { nome: "Venda ADM 20 Mil Sacas", total: 20000 },
    "51/2025": { nome: "Venda GO AGRO", total: 5916 },
    "290925M282": { nome: "Venda Sipal M282", total: 3471 },
    "960732": { nome: "Venda ADM 960732 (Ildo)", total: 1000 },
    "ILDO-AMAGGI": { nome: "Venda Amaggi Ildo (Total)", total: 19042 }, // 5013 + 10340 + 671 + 3018
    "960734": { nome: "Venda ADM 960734 (Ildo)", total: 3948 },
    "960737": { nome: "Venda ADM 960737 (Ildiana)", total: 393 },
    "2025-01-055-01160": { nome: "Venda Amaggi LRV 1160", total: 527 },
    "COMISSAO-2425": { nome: "Comissão Funcionários", total: 1500 },
  },
};

// 3. MILHO 25 (Safra Passada)
const MILHO25_CONFIG: SafraConfig = {
  id: 'milho25',
  nome: 'Milho 25',
  tipo: 'Milho',
  status: 'Passada',
  dataPath: './milho25/romaneios_normalizados.json',
  AREAS_FAZENDAS: { 
    "São Luiz": 600, 
    "Castanhal": 600, 
    "Romancini": 435, 
    "Estrelinha": 225 
  },
  VOLUMES_CONTRATADOS: {
    "290924M180": { nome: "Barter Sipal LRV M180", total: 14297 },
    "SEMENTES-KODIAK": { nome: "Barter Kodiak/Agrofértil", total: 5063 },
    "SEMENTES-SIPAL": { nome: "Barter Sipal/Agrofértil (Sementes)", total: 2118 },
    "INSUMOS-SIPAL": { nome: "Barter Sipal/Agrofértil (Insumos)", total: 380 },
    "ARR-INPASA": { nome: "Arrendamento Inpasa", total: 6000 },
    "20240106900533-1": { nome: "Barter Amaggi Matupá", total: 14460 },
    "21960": { nome: "Venda Inpasa (21960)", total: 60000 }, // 27665 + 11073 + 21262 (Aproximado, agrupado)
    "28614": { nome: "Venda Inpasa (28614)", total: 536 },
    "290925M216": { nome: "Venda Sipal M216", total: 10000 },
    "1334P50494M": { nome: "Venda ADM 1334P50494M", total: 23522 },
    "GRAO-DIRETO-AS": { nome: "Venda Grão Direto Amaggi Sinop", total: 694 },
    "GRAO-DIRETO-AM": { nome: "Venda Grão Direto Amaggi Matupá", total: 10050 }, // 6500 + 1000 + 2550
    "COOP-LRV": { nome: "Venda Cooperativa Sipal LRV", total: 21173 }, // 12000 + 9173
    "COOP-SM": { nome: "Venda Cooperativa Sipal Matupá", total: 935 },
    "COOP-SC": { nome: "Venda Cooperativa Sipal Cláudia", total: 7308 },
    "COMISSAO-M25": { nome: "Comissão Funcionários", total: 1500 },
  },
};

// 4. MILHO 26 (Safra Futura)
const MILHO26_CONFIG: SafraConfig = {
  id: 'milho26',
  nome: 'Milho 26',
  tipo: 'Milho',
  status: 'Futura',
  dataPath: './milho26/romaneios_normalizados.json',
  AREAS_FAZENDAS: { 
    "São Luiz": 675, 
    "Castanhal": 600, 
    "Romancini": 435, 
    "Estrelinha": 240 
  },
  VOLUMES_CONTRATADOS: {}, // Sem contratos definidos
};

export const SAFRAS_DISPONIVEIS: SafraConfig[] = [
  MILHO26_CONFIG, // Futura
  SOJA2526_CONFIG, // Atual
  MILHO25_CONFIG, // Passada
  SOJA2425_CONFIG, // Passada
];

export const SAFRAS_MAP: Record<string, SafraConfig> = SAFRAS_DISPONIVEIS.reduce((acc, safra) => {
  acc[safra.id] = acc[safra.id] || safra;
  return acc;
}, {} as Record<string, SafraConfig>);

// Função para obter a configuração de uma safra
export function getSafraConfig(safraId: string): SafraConfig {
  const config = SAFRAS_MAP[safraId];
  if (!config) {
    // Retorna a configuração da safra atual como fallback
    return SOJA2526_CONFIG; 
  }
  return config;
}