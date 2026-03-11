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
  totalKg?: number; 
  id?: string;
  grupo?: string | null; // Adicionado para suportar agrupamento dinâmico
}