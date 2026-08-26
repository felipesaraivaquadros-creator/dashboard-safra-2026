export type SpreadsheetRow = Record<string, unknown>;

export const AUTO_MAPPING_BY_HEADER: Record<string, string> = {
  data: 'data',
  tp: 'tipoNF',
  tiponf: 'tipoNF',
  n: 'numero_romaneio',
  nromaneio: 'numero_romaneio',
  numero: 'numero_romaneio',
  numeroromaneio: 'numero_romaneio',
  nfe: 'nfe',
  emitente: 'emitente',
  placa: 'placa',
  motorista: 'motorista',
  cidadedeentrega: 'cidade_entrega',
  cidadeentrega: 'cidade_entrega',
  armazem: 'armazem',
  arm: 'armazem',
  contrato: 'contrato',
  ncontrato: 'ncontrato',
  numerocontrato: 'ncontrato',
  safra: 'safra',
  fazenda: 'fazenda',
  talhao: 'talhao',
  pesol: 'peso_liquid_kg',
  pesobruto: 'peso_bruto_kg',
  pesobrutokg: 'peso_bruto_kg',
  pesoliquido: 'peso_liquid_kg',
  pesoliquidokg: 'peso_liquid_kg',
  sacasbruto: 'sacas_bruto',
  sacasbrutas: 'sacas_bruto',
  sacasliquido: 'sacas_liquida',
  sacasliquidos: 'sacas_liquida',
  sacasliquida: 'sacas_liquida',
  sacasliquidas: 'sacas_liquida',
  umid: 'umidade',
  umidade: 'umidade',
  impu: 'impureza',
  impureza: 'impureza',
  ardi: 'ardido',
  ardido: 'ardido',
  avari: 'avariados',
  avariados: 'avariados',
  contaminantes: 'contaminantes',
  quebr: 'quebrados',
  quebrados: 'quebrados',
  precofrete: 'preco_frete',
  precofretesc: 'preco_frete',
  produto: 'produto',
  verdes: 'verdes',
  seca: 'seca',
  class: 'classificacao',
  classificacao: 'classificacao',
  entrada: 'entrada',
  saida: 'saida',
};

const NUMERIC_FIELDS = [
  'peso_bruto_kg',
  'peso_liquid_kg',
  'sacas_bruto',
  'sacas_liquida',
  'umidade',
  'impureza',
  'ardido',
  'avariados',
  'contaminantes',
  'verdes',
  'quebrados',
  'seca',
  'nfe',
  'numero_romaneio',
  'preco_frete',
];

export const normalizeImportText = (value: unknown) => String(value ?? '').trim();

export const normalizeColumnKey = (value: unknown) =>
  normalizeImportText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°ª]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

export const parseSpreadsheetNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  let text = String(value).trim().replace(/\s/g, '');
  if (!text) return null;

  const negative = text.startsWith('-') || /^\(.*\)$/.test(text);
  text = text.replace(/[()]/g, '').replace(/[^0-9,.-]/g, '').replace(/-/g, '');
  if (!text || !/\d/.test(text)) return null;

  let normalized = text;
  if (text.includes(',')) {
    const groups = text.split(',');
    const hasSingleThousandsSeparator = groups.length === 2
      && !text.includes('.')
      && groups[1].length === 3;
    normalized = hasSingleThousandsSeparator
      ? groups.join('')
      : text.replace(/\./g, '').replace(',', '.');
  } else if (text.includes('.')) {
    const groups = text.split('.');
    const lastGroup = groups[groups.length - 1] || '';

    if (groups.length === 2) {
      normalized = lastGroup.length === 3 ? groups.join('') : text;
    } else if (lastGroup.length > 0 && lastGroup.length <= 2) {
      normalized = `${groups.slice(0, -1).join('')}.${lastGroup}`;
    } else {
      normalized = groups.join('');
    }
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? (negative ? -parsed : parsed) : null;
};

const toIsoDate = (year: number, month: number, day: number): string | null => {
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const parseSpreadsheetDate = (value: unknown): string | null => {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const candidate = new Date(excelEpoch + Math.round(value * 86400000));
    return toIsoDate(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, candidate.getUTCDate());
  }

  const text = String(value).trim();
  if (!text) return null;

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
  }

  const brOrUsMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (!brOrUsMatch) return null;

  const first = Number(brOrUsMatch[1]);
  const second = Number(brOrUsMatch[2]);
  const year = Number(brOrUsMatch[3].length === 2 ? `20${brOrUsMatch[3]}` : brOrUsMatch[3]);

  // O app privilegia dd/mm/aaaa. A inversao e aceita apenas quando o segundo numero
  // nao pode ser um mes, caso comum em planilhas antigas formatadas como mm/dd/aa.
  const [day, month] = second > 12 && first <= 12 ? [second, first] : [first, second];
  return toIsoDate(year, month, day);
};

export const normalizeMappedValues = <T extends SpreadsheetRow>(source: T): T => {
  const mapped = { ...source } as SpreadsheetRow;

  if ('data' in mapped) {
    mapped.data = parseSpreadsheetDate(mapped.data);
  }

  NUMERIC_FIELDS.forEach((field) => {
    if (mapped[field] !== null && mapped[field] !== undefined && mapped[field] !== '') {
      mapped[field] = parseSpreadsheetNumber(mapped[field]);
    }
  });

  const pesoLiquido = Number(mapped.peso_liquid_kg) || 0;
  const pesoBruto = Number(mapped.peso_bruto_kg) || 0;
  if (pesoLiquido > 0 && !(Number(mapped.sacas_liquida) > 0)) {
    mapped.sacas_liquida = Math.round((pesoLiquido / 60) * 100) / 100;
  }
  if (pesoBruto > 0 && !(Number(mapped.sacas_bruto) > 0)) {
    mapped.sacas_bruto = Math.round((pesoBruto / 60) * 100) / 100;
  }

  return mapped as T;
};

export interface ExtractedSheetData {
  headerRowIndex: number;
  headers: string[];
  rows: SpreadsheetRow[];
}

const isFilled = (value: unknown) => normalizeImportText(value).length > 0;

export const extractSpreadsheetRows = (matrix: unknown[][]): ExtractedSheetData => {
  let headerRowIndex = -1;
  let bestScore = 0;

  matrix.slice(0, 50).forEach((row, index) => {
    const detectedTargets = new Set(
      row
        .map(normalizeColumnKey)
        .map((column) => AUTO_MAPPING_BY_HEADER[column])
        .filter(Boolean)
    );

    if (detectedTargets.size > bestScore) {
      bestScore = detectedTargets.size;
      headerRowIndex = index;
    }
  });

  if (headerRowIndex < 0 || bestScore < 2) {
    throw new Error('Não foi possível identificar o cabeçalho dos romaneios nesta aba.');
  }

  const columnOccurrences = new Map<string, number>();
  const headers = (matrix[headerRowIndex] || []).map((cell, index) => {
    const baseHeader = normalizeImportText(cell) || `Coluna ${index + 1}`;
    const occurrence = (columnOccurrences.get(baseHeader) || 0) + 1;
    columnOccurrences.set(baseHeader, occurrence);
    return occurrence === 1 ? baseHeader : `${baseHeader} (${occurrence})`;
  });

  const rows = matrix
    .slice(headerRowIndex + 1)
    .filter((row) => row.some(isFilled))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));

  return { headerRowIndex, headers, rows };
};
