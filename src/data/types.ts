export interface Romaneio {
  data: string | null;
  contrato: string;
  ncontrato: string;
  emitente?: string | null; 
  tipoNF: string | null;
  nfe: number | null;
  cidadeEntrega: string | null;
  armazem: string | null;
  armazemsaldo?: string | null;
  safra: string | null;
  fazenda: string | null;
  talhao: string | null;
  pesoLiquidoKg: number | null;
  pesoBrutoKg: number | null;
  sacasLiquida: number | null;
  sacasBruto: number | null;
  umidade: number | null;
  impureza: number | null;
  ardido: number | null;
  avariados: number | null;
  quebrados: number | null;
  contaminantes?: number | null; // Novo campo
}

export interface ContractVolume {
  nome: string;
  total: number;
}

export interface ProcessedContract {
  id: string;
  nome: string;
  contratado: number;
  cumprido: number;
  aCumprir: number;
  porcentagem: string;
  isConcluido: boolean;
}

export interface DiscountStats {
  umidadeSc: number;
  impurezaSc: number;
  ardidoSc: number;
  avariadosSc: number;
  contaminantesSc: number;
  quebradosSc: number;
  totalDescontosSc: number;
  percentualDesconto: string;
}

export interface KpiStats {
  totalLiq: number;
  totalBruta: number;
  areaHa: number;
  prodLiq: string;
  prodBruta: string;
  umidade: string;
}

export interface ChartData {
  name: string;
  sacas: number;
}

export interface DataContextType {
  safraId: string;
  fazendaFiltro: string | null;
  armazemFiltro: string | null;
  setFazendaFiltro: (fazenda: string | null) => void;
  setArmazemFiltro: (armazem: string | null) => void;
  stats: KpiStats;
  discountStats: DiscountStats; // Novo campo
  romaneiosCount: number;
  contratosProcessados: {
    pendentes: ProcessedContract[];
    cumpridos: ProcessedContract[];
  };
  chartFazendas: ChartData[];
  chartArmazens: ChartData[];
  getCorFazenda: (name: string) => string;
  getCorArmazem: (name: string) => string;
}