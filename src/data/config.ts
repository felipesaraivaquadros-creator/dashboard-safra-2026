import { ContractVolume } from './types';

// --- CONFIGURAÇÕES DE IDENTIDADE VISUAL ---
export const AREAS_FAZENDAS: Record<string, number> = { 
  "São Luiz": 676, 
  "Castanhal": 600, 
  "Romancini": 435, 
  "Estrelinha": 225 
};

export const CORES_FAZENDAS: Record<string, string> = {
  "São Luiz": "#16a34a",   // green-600
  "Castanhal": "#2563eb",  // blue-600
  "Romancini": "#f59e0b",  // amber-500
  "Estrelinha": "#7c3aed", // violet-600
  "Outros": "#94a3b8"      // slate-400
};

export const CORES_ARMAZENS: Record<string, string> = {
  "COFCO NSH": "#ea580c",      // orange-700
  "SIPAL MATUPÁ": "#854d0e",   // amber-800
  "AMAGGI MATUPÁ": "#059669",  // emerald-600
  "SIPAL CLÁUDIA": "#4338ca",  // indigo-700
  "SIPAL LRV": "#7e22ce",      // purple-700
  "SIPAL CAMPOS DE JULIO": "#1d4ed8", // blue-700
  "Outros": "#64748b"          // slate-500
};

export const VOLUMES_CONTRATADOS: Record<string, ContractVolume> = {
  "72208": { nome: "Venda 20 Mil Sacas", total: 20000 },
  "290925M339": { nome: "Troca Adubo Sipal", total: 29500 },
  "02soja25-26": { nome: "Arrendamento CT", total: 7200 },
  "PLCSRsoja25-26": { nome: "Plantadeira Cesar", total: 2000 },
  "01soja25-26": { nome: "Arrendamento SL", total: 4050 },
  "Comissoes": { nome: "Venda 800 Sacas Comissão", total: 800 }
};