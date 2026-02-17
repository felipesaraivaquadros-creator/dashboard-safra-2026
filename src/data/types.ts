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
  motorista?: string | null; // Adicionado
  placa?: string | null; // Adicionado
  pesoLiquidoKg: number | null;
  pesoBrutoKg: number | null;
  sacasLiquida: number | null;
  sacasBruto: number | null;
  umidade: number | null;
  impureza: number | null;
  ardido: number | null;
  avariados: number | null;
  quebrados: number | null;
  contaminantes?: number | null;
  precofrete?: number | null;
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
  umidadeKg: number;
  impurezaSc: number;
  impurezaKg: number;
  ardidoSc: number;
  ardidoKg: number;
  avariadosSc: number;
  avariadosKg: number;
  contaminantesSc: number;
  contaminantesKg: number;
  quebradosSc: number;
  quebradosKg: number;
  totalDescontosSc: number;
  totalDescontosKg: number;
  percentualDesconto: string;
}

export interface VolumeStats {
  mediaCargaKg: number;
  mediaCargaSc: number;
  mediaDiaKg: number;
  mediaDiaSc: number;
  melhorDiaKg: number;
  melhorDiaSc: number;
  melhorDiaData: string;
  percentualColhido: string;
  metaPercentual: string;
}

export interface KpiStats {
  totalLiq: number;
  totalLiqKg: number;
  totalBruta: number;
  totalBrutaKg: number;
  areaHa: number;
  prodLiq: string;
  prodLiqKg: string;
  prodBruta: string;
  prodBrutaKg: string;
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
  discountStats: DiscountStats;
  volumeStats: VolumeStats;
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