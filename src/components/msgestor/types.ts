export interface Romaneio {
  data: string | null;
  contrato: string;
  ncontrato: string;
  emitente?: string | null;
  tipoNF: string | null;
  nfe: number | null;
  numero: number | null;
  cidadeEntrega: string | null;
  armazem: string | null;
  armazem_id?: string | null;
  safra: string | null;
  fazenda: string | null;
  talhao: string | null;
  motorista?: string | null;
  placa?: string | null;
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
  // Campos do MS Gestor
  produto?: string | null;
  classificacao?: string | null;
  entrada?: string | null;
  saida?: string | null;
  verdes?: number | null;
  seca?: number | null;
}

export interface ParsedRow {
  raw: Record<string, any>;
  mapped: Partial<Romaneio> & {
    _status: 'new' | 'valid' | 'duplicate' | 'error';
    _message?: string;
    _rowIndex: number;
    _uniqueKey: string;
    safra_id: string;
  };
}

export interface ColumnMapping {
  [sourceColumn: string]: string; // target field
}

export interface DefaultValues {
  [field: string]: any;
}

export interface FilterState {
  status: 'all' | 'new' | 'valid' | 'duplicate' | 'error';
  search: string;
}

export interface SaveResults {
  success: number;
  errors: number;
  details: string[];
}

export const MS_GESTOR_COLUMNS: Record<string, string> = {
  'Data': 'data',
  'Tp': 'tipoNF',
  'Nº': 'numero_romaneio',
  'NFe': 'nfe',
  'Produto': 'produto',
  'Placa': 'placa',
  'Arm': 'armazem',
  'Safra': 'safra',
  'Talhão': 'talhao',
  'Pesol': 'peso_bruto_kg',
  'Umid': 'umidade',
  'Impu': 'impureza',
  'Ardi': 'ardido',
  'Avari': 'avariados',
  'Verdes': 'verdes',
  'Quebr': 'quebrados',
  'Seca': 'seca',
  'Class': 'classificacao',
  'Entrada': 'entrada',
  'Saída': 'saida'
};

export const TARGET_FIELDS = [
  { value: '', label: '-- Ignorar --' },
  { value: 'data', label: 'Data' },
  { value: 'tipoNF', label: 'Tipo NF' },
  { value: 'numero_romaneio', label: 'Nº Romaneio' },
  { value: 'nfe', label: 'NFe' },
  { value: 'produto', label: 'Produto' },
  { value: 'placa', label: 'Placa' },
  { value: 'armazem', label: 'Armazém' },
  { value: 'safra', label: 'Safra' },
  { value: 'talhao', label: 'Talhão' },
  { value: 'peso_bruto_kg', label: 'Peso Bruto (kg)' },
  { value: 'peso_liquid_kg', label: 'Peso Líquido (kg)' },
  { value: 'umidade', label: 'Umidade' },
  { value: 'impureza', label: 'Impureza' },
  { value: 'ardido', label: 'Ardido' },
  { value: 'avariados', label: 'Avariados' },
  { value: 'verdes', label: 'Verdes' },
  { value: 'quebrados', label: 'Quebrados' },
  { value: 'seca', label: 'Seca' },
  { value: 'classificacao', label: 'Classificação' },
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
  { value: 'fazenda', label: 'Fazenda' },
  { value: 'motorista', label: 'Motorista' },
  { value: 'cidade_entrega', label: 'Cidade Entrega' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'ncontrato', label: 'Nº Contrato' },
  { value: 'emitente', label: 'Emitente' },
  { value: 'preco_frete', label: 'Preço Frete' }
] as const;