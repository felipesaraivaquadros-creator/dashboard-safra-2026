import { SaldoItem } from '../saldoTypes';

// Dados de Estoque Final (Card 1)
export const ESTOQUE_FINAL_SOJA2425: SaldoItem[] = [
  { nome: "AMAGGI MATUPÁ", tipo: "Armazem", estoqueLiquido: 17230, volumeContratado: 0, saldo: 17230 },
  { nome: "AMAGGI SINOP", tipo: "Armazem", estoqueLiquido: 29011, volumeContratado: 0, saldo: 29011 },
  { nome: "AC GRÃOS STA HELENA", tipo: "Armazem", estoqueLiquido: 37951, volumeContratado: 0, saldo: 37951 },
  { nome: "SIPAL (BUNGE)", tipo: "Armazem", estoqueLiquido: 247, volumeContratado: 0, saldo: 247 },
  { nome: "SIPAL LRV", tipo: "Armazem", estoqueLiquido: 9225, volumeContratado: 0, saldo: 9225 },
  { nome: "AMAGGI LRV", tipo: "Armazem", estoqueLiquido: 18527, volumeContratado: 0, saldo: 18527 },
  { nome: "SIPAL CLÁUDIA", tipo: "Armazem", estoqueLiquido: 528, volumeContratado: 0, saldo: 528 },
  { nome: "GO AGRO ARMAZENS GERAIS LTDA", tipo: "Armazem", estoqueLiquido: 5916, volumeContratado: 0, saldo: 5916 },
];

// Dados de Contratos (Card 2)
// Nota: O campo 'total' aqui representa o volume contratado.
export const CONTRATOS_SOJA2425 = [
  { nome: "AMAGGI MATUPÁ", id: "9058-8634", total: 5754 },
  { nome: "AMAGGI SINOP", id: "9058-8633", total: 18000 },
  { nome: "ADM STA HELENA (AC GRÃOS)", id: "ARR-PC", total: 11577 },
  { nome: "ADM STA HELENA (AC GRÃOS)", id: "SERV-D", total: 1032 },
  { nome: "SIPAL", id: "290925M51", total: 3000 },
  { nome: "SIPAL", id: "290925M69", total: 3000 },
  { nome: "AMAGGI MATUPÁ", id: "ILDIANA", total: 3000 },
  { nome: "AMAGGI LRV", id: "20240105500994-1", total: 18000 },
  { nome: "ADM STA HELENA (AC GRÃOS)", id: "1334P50762S", total: 20000 },
  { nome: "GO AGRO ARMAZENS GERAIS LTDA", id: "51/2025", total: 5916 },
  { nome: "SIPAL", id: "290925M282", total: 3471 },
  { nome: "ADM STA HELENA (AC GRÃOS)", id: "960732", total: 1000 },
  { nome: "AMAGGI MATUPÁ", id: "ILDO-AMAGGI", total: 5013 },
  { nome: "AMAGGI SINOP", id: "ILDO-AMAGGI", total: 10340 },
  { nome: "AMAGGI SINOP", id: "ILDO-AMAGGI", total: 671 },
  { nome: "ADM STA HELENA (AC GRÃOS)", id: "960734", total: 3948 },
  { nome: "ADM STA HELENA (AC GRÃOS)", id: "960737", total: 393 },
  { nome: "AMAGGI MATUPÁ", id: "ILDO-AMAGGI", total: 3018 },
  { nome: "AMAGGI LRV", id: "2025-01-055-01160", total: 527 },
  { nome: "FUNCIONÁRIOS", id: "COMISSAO-2425", total: 1500 },
];

// Cálculo dos totais
export const ESTOQUE_TOTAL_SOJA2425 = ESTOQUE_FINAL_SOJA2425.reduce((sum, item) => sum + item.estoqueLiquido, 0);
export const CONTRATO_TOTAL_SOJA2425 = CONTRATOS_SOJA2425.reduce((sum, item) => sum + item.total, 0);
export const SALDO_FINAL_SOJA2425 = ESTOQUE_TOTAL_SOJA2425 - CONTRATO_TOTAL_SOJA2425;