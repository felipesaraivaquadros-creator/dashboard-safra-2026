import { SaldoItem } from '../saldoTypes';

// Dados de Estoque Final (Card 1)
export const ESTOQUE_FINAL_MILHO25: SaldoItem[] = [
  { nome: "SIPAL LRV", tipo: "Armazem", estoqueLiquido: 50968, volumeContratado: 0, saldo: 50968 },
  { nome: "KODYAK", tipo: "Armazem", estoqueLiquido: 5063, volumeContratado: 0, saldo: 5063 },
  { nome: "AMAGGI MATUPÁ", tipo: "Armazem", estoqueLiquido: 24510, volumeContratado: 0, saldo: 24510 },
  { nome: "SIPAL MATUPÁ", tipo: "Armazem", estoqueLiquido: 935, volumeContratado: 0, saldo: 935 },
  { nome: "INPASA", tipo: "Armazem", estoqueLiquido: 66536, volumeContratado: 0, saldo: 66536 },
  { nome: "SIPAL CLÁUDIA", tipo: "Armazem", estoqueLiquido: 7308, volumeContratado: 0, saldo: 7308 },
  { nome: "AMAGGI SINOP", tipo: "Armazem", estoqueLiquido: 694, volumeContratado: 0, saldo: 694 },
  { nome: "AC GRÃOS", tipo: "Armazem", estoqueLiquido: 23522, volumeContratado: 0, saldo: 23522 },
];

// Dados de Contratos (Card 2)
export const CONTRATOS_MILHO25 = [
  { nome: "SIPAL LRV (Romancini - BARTER)", id: "290924M180", total: 14297 },
  { nome: "KODIAK/ AGROFÉRTIL (BARTER)", id: "SEMENTES-KODIAK", total: 5063 },
  { nome: "SIPAL LRV/ AGROFERTIL (BARTER)", id: "SEMENTES-SIPAL", total: 2118 },
  { nome: "SIPAL LRV/ AGROFERTIL (BARTER)", id: "INSUMOS-SIPAL", total: 380 },
  { nome: "INPASA (Castanhal - ARRENDAMENTO)", id: "ARR-INPASA", total: 6000 },
  { nome: "AMAGGI MATUPÁ (Estrelinha - BARTER)", id: "20240106900533-1", total: 14460 },
  { nome: "INPASA - 1º Pagamento (VENDA)", id: "21960-1", total: 27665 },
  { nome: "INPASA - 1º Pagamento (VENDA)", id: "21960-2", total: 11073 },
  { nome: "INPASA - 2º Pagamento (VENDA)", id: "21960-3", total: 21262 },
  { nome: "INPASA (VENDA)", id: "28614", total: 536 },
  { nome: "SIPAL LRV (VENDA)", id: "290925M216", total: 10000 },
  { nome: "ADM DO BRASIL (N.S.H.) (VENDA)", id: "1334P50494M", total: 23522 },
  { nome: "AMAGGI SINOP (Grão Direto)", id: "GRAO-DIRETO-AS", total: 694 },
  { nome: "AMAGGI MATUPÁ (Grão Direto)", id: "GRAO-DIRETO-AM-1", total: 6500 },
  { nome: "AMAGGI MATUPÁ (Grão Direto)", id: "GRAO-DIRETO-AM-2", total: 1000 },
  { nome: "AMAGGI MATUPÁ (Grão Direto)", id: "GRAO-DIRETO-AM-3", total: 2550 },
  { nome: "SIPAL LRV (Cooperativa)", id: "COOP-LRV-1", total: 12000 },
  { nome: "SIPAL MATUPÁ (Cooperativa)", id: "COOP-SM", total: 935 },
  { nome: "SIPAL CLÁUDIA (Cooperativa)", id: "COOP-SC", total: 7308 },
  { nome: "SIPAL LRV (Cooperativa)", id: "COOP-LRV-2", total: 9173 },
  { nome: "FUNCIONÁRIOS (PGTO)", id: "COMISSAO-M25", total: 1500 },
];

// Cálculo dos totais
export const ESTOQUE_TOTAL_MILHO25 = ESTOQUE_FINAL_MILHO25.reduce((sum, item) => sum + item.estoqueLiquido, 0);
export const CONTRATO_TOTAL_MILHO25 = CONTRATOS_MILHO25.reduce((sum, item) => sum + item.total, 0);
export const SALDO_FINAL_MILHO25 = ESTOQUE_TOTAL_MILHO25 - CONTRATO_TOTAL_MILHO25;