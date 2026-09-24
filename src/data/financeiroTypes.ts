export type StatusPreco = 'a_fixar' | 'fixado';
export type TipoDesconto = 'SENAR' | 'FETHAB' | 'FUNRURAL' | 'IAGRO' | 'COOP' | 'OUTRO';
export type MetodoDesconto = 'percentual' | 'por_saca' | 'valor_fixo';
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
}

export interface FinanceiroMensal {
  mes: string;
  label: string;
  bruto: number;
  descontos: number;
  liquido: number;
}

export const TIPOS_DESCONTO: TipoDesconto[] = ['SENAR', 'FETHAB', 'FUNRURAL', 'IAGRO', 'COOP', 'OUTRO'];
