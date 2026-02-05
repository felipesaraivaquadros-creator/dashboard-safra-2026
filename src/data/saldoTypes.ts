export interface SaldoItem {
  nome: string;
  tipo: 'Armazem' | 'Contrato';
  sacasBrutoEntregue: number;
  volumeContratado: number;
  saldo: number; // sacasBrutoEntregue - volumeContratado
}