export interface SaldoItem {
  nome: string;
  tipo: 'Armazem' | 'Contrato';
  estoqueLiquido: number; // Alterado de sacasBrutoEntregue para estoqueLiquido
  volumeContratado: number;
  saldo: number; // estoqueLiquido - volumeContratado
}