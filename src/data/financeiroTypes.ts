export type StatusPreco = 'a_fixar' | 'fixado';
export type TipoDesconto = 'SENAR' | 'FETHAB' | 'FUNRURAL' | 'IAGRO' | 'COOP' | 'OUTRO';
export type MetodoDesconto = 'percentual' | 'por_saca' | 'valor_fixo';
export type StatusRecebivel = 'em_aberto' | 'parcial' | 'pago' | 'vencido';
export type StatusFinanceiro =
  | 'nao_configurado'
  | 'preco_pendente'
  | 'tributos_pendentes'
  | 'competencia_pendente'
  | 'inconsistente'
  | 'completo';

export interface ContratoDesconto {
  id?: string;
  contrato_financeiro_id?: string;
  tipo: TipoDesconto;
  descricao?: string | null;
  metodo: MetodoDesconto;
  valor: number;
}

export interface ContratoFinanceiro {
  id?: string;
  contrato_id: string;
  status_preco: StatusPreco;
  preco_saca: number | null;
  data_contrato: string | null;
  competencia: string | null;
  tributos_revisados: boolean;
  aceita_excedente: boolean;
  observacoes?: string | null;
  contratos_descontos: ContratoDesconto[];
}

export interface ContratoBaixa {
  id?: string;
  recebivel_id?: string;
  data_recebimento: string;
  valor_recebido: number;
  forma_recebimento?: string | null;
  referencia?: string | null;
  observacoes?: string | null;
}

export interface ContratoRecebivel {
  id?: string;
  contrato_financeiro_id: string;
  numero_parcela: number;
  descricao?: string | null;
  data_vencimento: string;
  valor_previsto: number;
  observacoes?: string | null;
  contratos_baixas: ContratoBaixa[];
  totalRecebido: number;
  saldoAberto: number;
  status: StatusRecebivel;
}

export interface ContratoFinanceiroResumo {
  contratoId: string;
  safraId: string;
  nome: string;
  numero: string;
  armazem: string | null;
  armazemId: string | null;
  grupo: string | null;
  volumeContratado: number;
  volumeEntregue: number;
  volumeFinanceiroRealizado: number;
  precoSaca: number | null;
  competencia: string | null;
  status: StatusFinanceiro;
  pendencias: string[];
  financeiro: ContratoFinanceiro | null;
  brutoContratado: number;
  brutoRealizado: number;
  descontosContratados: number;
  descontosRealizados: number;
  liquidoContratado: number;
  liquidoRealizado: number;
  descontosPorTipo: Record<TipoDesconto, number>;
  recebiveis: ContratoRecebivel[];
  recebimentosProgramados: number;
  recebimentosRecebidos: number;
  recebimentosEmAberto: number;
  recebimentosVencidos: number;
  recebimentosAProgramar: number;
  recebimentosExcedentes: number;
}

export interface FinanceiroMensal {
  mes: string;
  label: string;
  bruto: number;
  descontos: number;
  liquido: number;
}

export interface RecebimentosMensais {
  mes: string;
  label: string;
  previsto: number;
  recebido: number;
}

export const TIPOS_DESCONTO: TipoDesconto[] = ['SENAR', 'FETHAB', 'FUNRURAL', 'IAGRO', 'COOP', 'OUTRO'];
