export interface SaldoItem {
  nome: string;
  tipo: 'Armazem' | 'Contrato';
  estoqueLiquido: number; 
  volumeContratado: number;
  saldo: number; // estoqueLiquido - volumeContratado
}

export interface SaldoKpi {
  nome: string;
  total: number;
  totalKg?: number; // Adicionado campo de peso
  id?: string;
}