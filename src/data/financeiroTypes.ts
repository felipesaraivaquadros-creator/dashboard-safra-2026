export type StatusPreco = 'a_fixar' | 'fixado';
export type TipoDesconto = 'SENAR' | 'FETHAB' | 'FUNRURAL' | 'IAGRO' | 'COOP' | 'OUTRO';
export type MetodoDesconto = 'percentual' | 'por_saca' | 'valor_fixo';
export type StatusRecebivel = 'em_aberto' | 'parcial' | 'pago' | 'vencido';
export type TipoContrato = 'nao_classificado' | 'venda' | 'barter' | 'misto' | 'outro';
export type FormaLiquidacao = 'nao_definida' | 'financeira' | 'fisica' | 'mista';
export type ResponsavelFrete = 'produtor' | 'comprador' | 'compartilhado' | 'outro';
export type ModalidadeCpr = 'nao_aplicavel' | 'fisica' | 'financeira';
export type StatusConciliacaoBarter = 'pendente' | 'divergente' | 'conciliado';
export type StatusEntregaBarter = 'a_cumprir' | 'cumprido';
export type StatusFinanceiro =
  | 'nao_configurado'
  | 'preco_pendente'
  | 'tributos_pendentes'
  | 'competencia_pendente'
  | 'inconsistente'
  | 'completo'
  | 'baixado'
  | 'vencido';

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

export interface ContratoBarterItem {
  id?: string;
  contrato_barter_id?: string;
  categoria: string;
  descricao: string;
  quantidade: number | null;
  unidade: string;
  valor_unitario: number | null;
  valor_total: number;
}

export interface ContratoBarter {
  id?: string;
  contrato_id: string;
  fornecedor: string | null;
  recebedor_graos: string | null;
  valor_insumos: number;
  data_inicio_entrega: string | null;
  data_fim_entrega: string | null;
  local_entrega: string | null;
  responsavel_frete: ResponsavelFrete;
  qualidade_exigida: string | null;
  numero_cpr: string | null;
  modalidade_cpr: ModalidadeCpr;
  registro_cpr: string | null;
  preco_referencia_saca: number | null;
  preco_mercado_saca: number | null;
  data_preco_mercado: string | null;
  status_conciliacao: StatusConciliacaoBarter;
  observacoes: string | null;
  contratos_barter_itens: ContratoBarterItem[];
}

export interface ContratoCumprimento {
  id?: string;
  contrato_id: string;
  origem: 'alocacao_saldo';
  grupo: string | null;
  volume_sacas: number;
  ativo: boolean;
  confirmado_em: string;
  cancelado_em: string | null;
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
  tipoContrato: TipoContrato;
  formaLiquidacao: FormaLiquidacao;
  tipoOutroDescricao: string | null;
  volumeContratado: number;
  volumeEntregue: number;
  volumeEntregueRomaneios: number;
  volumeCumpridoAlocacao: number;
  cumpridoPorAlocacao: boolean;
  cumprimento: ContratoCumprimento | null;
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
  barter: ContratoBarter | null;
  barterSaldoSacas: number;
  barterPercentualEntregue: number;
  barterStatusEntrega: StatusEntregaBarter;
  barterValorInsumos: number;
  barterValorEntregue: number;
  barterPrecoImplicitoSaca: number;
  barterValorMercado: number;
  barterVariacaoMercado: number;
  barterTotalItens: number;
  barterDivergenciaItens: number;
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

export const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
  nao_classificado: 'Não classificado',
  venda: 'Venda',
  barter: 'Troca / Barter',
  misto: 'Misto',
  outro: 'Outro',
};

export const FORMA_LIQUIDACAO_LABELS: Record<FormaLiquidacao, string> = {
  nao_definida: 'Não definida',
  financeira: 'Financeira',
  fisica: 'Física',
  mista: 'Mista',
};

export const STATUS_ENTREGA_BARTER_LABELS: Record<StatusEntregaBarter, string> = {
  a_cumprir: 'A cumprir',
  cumprido: 'Cumprido',
};
