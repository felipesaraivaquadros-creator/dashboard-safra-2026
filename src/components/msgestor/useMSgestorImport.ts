"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import { ParsedRow, ColumnMapping, DefaultValues, FilterState, SaveResults, MS_GESTOR_COLUMNS, TARGET_FIELDS } from './types';

const normalizeText = (value: any) => String(value || '').trim();
const normalizeMapKey = (value: any) => normalizeText(value).toUpperCase();
const normalizeColumnKey = (value: any) =>
  normalizeText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°ª]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

const MS_GESTOR_NORMALIZED_COLUMNS: Record<string, string> = {
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
  preçofrete: 'preco_frete',
  precofretesc: 'preco_frete',
  produto: 'produto',
  verdes: 'verdes',
  seca: 'seca',
  class: 'classificacao',
  classificacao: 'classificacao',
  entrada: 'entrada',
  saida: 'saida',
};

const SHEET_BY_SAFRA: Record<string, string> = {
  milho26: 'ROMANEIOS_MILHO',
  soja2526: 'ROMANEIOS_SOJA',
  milho25: 'ROMANEIO MILHO',
  soja2425: 'ROMANEIO SOJA',
};

const parseNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const text = String(value).trim().replace(/\s/g, '');
  if (!text) return null;

  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text.includes('.') && /^\d{1,3}(\.\d{3})+$/.test(text)
      ? text.replace(/\./g, '')
      : text.replace(/,/g, '');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const findWorksheet = (workbook: XLSX.WorkBook, safraId: string) => {
  const desiredSheet = SHEET_BY_SAFRA[safraId];
  const normalizedDesired = desiredSheet ? normalizeColumnKey(desiredSheet) : '';
  const sheetName = workbook.SheetNames.find(name => normalizeColumnKey(name) === normalizedDesired)
    || workbook.SheetNames[0];

  return {
    sheetName,
    worksheet: sheetName ? workbook.Sheets[sheetName] : undefined
  };
};

const buildImportKey = (row: {
  safra_id?: string | null;
  nfe?: number | string | null;
  numero_romaneio?: number | string | null;
}) => [
  normalizeMapKey(row.safra_id),
  normalizeMapKey(row.numero_romaneio).replace(/\.0$/, ''),
  normalizeMapKey(row.nfe).replace(/\.0$/, '')
].join('-');

const hasImportKey = (row: {
  safra_id?: string | null;
  nfe?: number | string | null;
  numero_romaneio?: number | string | null;
}) => Boolean(normalizeText(row.safra_id) && normalizeText(row.numero_romaneio) && normalizeText(row.nfe));

const rowCompletenessScore = (row: Record<string, any>) => {
  let score = 0;
  if (Number(row.peso_bruto_kg) > 0) score += 100;
  if (Number(row.peso_liquid_kg) > 0) score += 80;
  if (Number(row.sacas_bruto) > 0) score += 40;
  if (Number(row.sacas_liquida) > 0) score += 40;
  if (normalizeText(row.motorista)) score += 20;
  if (normalizeText(row.placa)) score += 20;
  if (normalizeText(row.armazem) || normalizeText(row.armazem_nome) || normalizeText(row.armazem_id)) score += 10;
  if (normalizeText(row.fazenda) || normalizeText(row.fazenda_id)) score += 10;
  if (normalizeText(row.data)) score += 5;
  return score;
};

const pickBetterRow = <T extends Record<string, any>>(current: T, candidate: T) => {
  const currentScore = rowCompletenessScore(current);
  const candidateScore = rowCompletenessScore(candidate);
  return candidateScore >= currentScore ? candidate : current;
};

export function useMSgestorImport(safraId: string) {
  const [stage, setStage] = useState<'upload' | 'sheet' | 'mapping' | 'review' | 'saving' | 'done'>('upload');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [pendingWorkbook, setPendingWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [defaultValues, setDefaultValues] = useState<DefaultValues>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<FilterState>({ status: 'all', search: '' });
  const [loading, setLoading] = useState(false);
  const [saveResults, setSaveResults] = useState<SaveResults | null>(null);

  // Carregar configurações salvas
  useEffect(() => {
    const savedMapping = localStorage.getItem(`msgestor_mapping_${safraId}`);
    const savedDefaults = localStorage.getItem(`msgestor_defaults_${safraId}`);
    if (savedMapping) setColumnMapping(JSON.parse(savedMapping));
    if (savedDefaults) setDefaultValues(JSON.parse(savedDefaults));
  }, [safraId]);

  // ===== FILE UPLOAD & PARSING =====
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const toastId = showLoading("Lendo abas do arquivo...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true, raw: false });
      const sheets = workbook.SheetNames;
      if (sheets.length === 0) {
        dismissToast(toastId);
        showError("Nenhuma aba encontrada na planilha.");
        return;
      }

      const { sheetName } = findWorksheet(workbook, safraId);
      setPendingWorkbook(workbook);
      setSheetNames(sheets);
      setSelectedSheet(sheetName || sheets[0]);
      setParsedData([]);
      setStage('sheet');
      dismissToast(toastId);
      showSuccess(`${sheets.length} aba(s) encontrada(s). Escolha qual deseja importar.`);
    } catch (err: any) {
      dismissToast(toastId);
      showError("Erro ao ler arquivo: " + err.message);
    } finally {
      setLoading(false);
      if (e.target) (e.target as HTMLInputElement).value = "";
    }
  }, [safraId]);

  const processSelectedSheet = useCallback(() => {
    if (!pendingWorkbook || !selectedSheet) {
      showError("Selecione uma aba antes de continuar.");
      return;
    }

    setLoading(true);
    const toastId = showLoading(`Lendo aba "${selectedSheet}"...`);

    try {
      const worksheet = pendingWorkbook.Sheets[selectedSheet];
      if (!worksheet) {
        dismissToast(toastId);
        showError(`Aba "${selectedSheet}" não encontrada na planilha.`);
        return;
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });

      if (jsonData.length === 0) {
        dismissToast(toastId);
        showError(`A aba "${selectedSheet}" está vazia ou sem dados válidos.`);
        return;
      }

      // Auto-mapeamento inicial
      const firstRow = jsonData[0] as Record<string, any>;
      const detectedColumns = Object.keys(firstRow);
      const autoMapping: ColumnMapping = {};
      
      detectedColumns.forEach(col => {
        const normalized = col.trim();
        const normalizedKey = normalizeColumnKey(col);
        if (MS_GESTOR_NORMALIZED_COLUMNS[normalizedKey]) {
          autoMapping[col] = MS_GESTOR_NORMALIZED_COLUMNS[normalizedKey];
        } else if (MS_GESTOR_COLUMNS[normalized as keyof typeof MS_GESTOR_COLUMNS]) {
          autoMapping[col] = MS_GESTOR_COLUMNS[normalized as keyof typeof MS_GESTOR_COLUMNS];
        }
      });

      const effectiveMapping = { ...columnMapping, ...autoMapping };
      setColumnMapping(effectiveMapping);
      localStorage.setItem(`msgestor_mapping_${safraId}`, JSON.stringify(effectiveMapping));

      // Processa linhas
      const processed: ParsedRow[] = jsonData.map((row: any, index: number) => {
        const mapped: Partial<ParsedRow['mapped']> = {};
        
        Object.entries(effectiveMapping).forEach(([sourceCol, targetField]) => {
          const value = row[sourceCol];
          if (value !== null && value !== undefined && value !== '') {
            (mapped as any)[targetField] = value;
          }
        });

        Object.entries(defaultValues).forEach(([field, value]) => {
          if (!mapped[field as keyof typeof mapped] && value) {
            (mapped as any)[field] = value;
          }
        });

        // Normalizações
        if (mapped.data && typeof mapped.data === 'string') {
          const dateStr = mapped.data;
          if (dateStr.includes('T')) {
            mapped.data = dateStr.split('T')[0];
          } else if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) {
              mapped.data = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            }
          }
        }

        const numericFields = ['peso_bruto_kg', 'peso_liquid_kg', 'sacas_bruto', 'sacas_liquida', 'umidade', 'impureza', 'ardido', 'avariados', 'verdes', 'quebrados', 'seca', 'nfe', 'numero_romaneio', 'preco_frete'];
        numericFields.forEach(f => {
          if (mapped[f as keyof typeof mapped]) {
            const num = parseNumber(mapped[f as keyof typeof mapped]);
            if (num !== null) (mapped as any)[f] = num;
          }
        });

        if (mapped.peso_liquid_kg && !mapped.sacas_liquida) {
          mapped.sacas_liquida = Math.round((mapped.peso_liquid_kg / 60) * 100) / 100;
        }
        if (mapped.peso_bruto_kg && !mapped.sacas_bruto) {
          mapped.sacas_bruto = Math.round((mapped.peso_bruto_kg / 60) * 100) / 100;
        }

        const uniqueKey = buildImportKey({ ...mapped, safra_id: safraId });

        return {
          raw: row,
          mapped: {
            ...mapped,
            safra_id: safraId,
            _uniqueKey: uniqueKey,
            _status: 'new' as const,
            _rowIndex: index
          }
        };
      });

      const bestRowByKey = new Map<string, ParsedRow>();
      processed.forEach(row => {
        if (!hasImportKey(row.mapped)) {
          row.mapped._status = 'error';
          row.mapped._message = 'Informe safra, numero do romaneio e NFe para atualizar sem duplicar';
          return;
        }

        const key = row.mapped._uniqueKey;
        const current = bestRowByKey.get(key);
        if (!current) {
          bestRowByKey.set(key, row);
          return;
        }

        const better = pickBetterRow(current.mapped, row.mapped) === row.mapped ? row : current;
        const duplicate = better === row ? current : row;
        duplicate.mapped._status = 'duplicate';
        duplicate.mapped._message = 'Duplicado no arquivo; outra linha mais completa sera usada';
        better.mapped._status = 'valid';
        better.mapped._message = 'Linha mais completa para este romaneio/NF';
        bestRowByKey.set(key, better);
      });

      setParsedData(processed);
      setStage('mapping');
      dismissToast(toastId);
      showSuccess(`${processed.length} linhas lidas da aba "${selectedSheet}". Configure o mapeamento de colunas.`);
      
    } catch (err: any) {
      dismissToast(toastId);
      showError("Erro ao processar aba: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [pendingWorkbook, selectedSheet, safraId, columnMapping, defaultValues]);

  // ===== DUPLICATE CHECK =====
  const checkDuplicatesInDB = useCallback(async () => {
    const toastId = showLoading("Verificando duplicatas no banco...");
    try {
      const { data: existing } = await supabase
        .from('romaneios')
        .select('safra_id, nfe, numero_romaneio')
        .eq('safra_id', safraId);

      const existingKeys = new Set(
        (existing || []).map(r => buildImportKey(r))
      );

      setParsedData(prev => prev.map(row => {
        if (existingKeys.has(row.mapped._uniqueKey)) {
          return { ...row, mapped: { ...row.mapped, _status: 'valid' as const, _message: 'Ja existe no banco e sera atualizado' } };
        }
        return row;
      }));

      dismissToast(toastId);
      showSuccess("Verificação de duplicatas concluída.");
    } catch (err: any) {
      dismissToast(toastId);
      showError("Erro ao verificar duplicatas: " + err.message);
    }
  }, [safraId]);

  // ===== DATA MANIPULATION =====
  const updateRowField = useCallback((index: number, field: string, value: any) => {
    setParsedData(prev => prev.map((row, i) => 
      i === index ? { ...row, mapped: { ...row.mapped, [field]: value, _status: 'valid' as const } } : row
    ));
  }, []);

  const updateDefaultValue = useCallback((field: string, value: any) => {
    setDefaultValues(prev => {
      const newDefaults = { ...prev, [field]: value };
      localStorage.setItem(`msgestor_defaults_${safraId}`, JSON.stringify(newDefaults));
      return newDefaults;
    });
    setParsedData(prev => prev.map(row => 
      !row.mapped[field as keyof typeof row.mapped] ? 
        { ...row, mapped: { ...row.mapped, [field]: value } } : row
    ));
  }, [safraId]);

  const updateColumnMapping = useCallback((sourceCol: string, targetField: string) => {
    setColumnMapping(prev => {
      const newMapping = { ...prev, [sourceCol]: targetField };
      localStorage.setItem(`msgestor_mapping_${safraId}`, JSON.stringify(newMapping));
      setParsedData(prevData => prevData.map(row => {
        const mapped: Partial<ParsedRow['mapped']> = {};

        Object.entries(newMapping).forEach(([source, target]) => {
          if (!target) return;
          const value = row.raw[source];
          if (value !== null && value !== undefined && value !== '') {
            (mapped as any)[target] = value;
          }
        });

        Object.entries(defaultValues).forEach(([field, value]) => {
          if (!mapped[field as keyof typeof mapped] && value) {
            (mapped as any)[field] = value;
          }
        });

        const numericFields = ['peso_bruto_kg', 'peso_liquid_kg', 'sacas_bruto', 'sacas_liquida', 'umidade', 'impureza', 'ardido', 'avariados', 'verdes', 'quebrados', 'seca', 'nfe', 'numero_romaneio', 'preco_frete'];
        numericFields.forEach(f => {
          if (mapped[f as keyof typeof mapped]) {
            const num = parseNumber(mapped[f as keyof typeof mapped]);
            if (num !== null) (mapped as any)[f] = num;
          }
        });

        if (mapped.data && typeof mapped.data === 'string' && mapped.data.includes('/')) {
          const parts = mapped.data.split('/');
          if (parts.length === 3) {
            mapped.data = `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
          }
        }

        if ((mapped as any).peso_liquid_kg && !mapped.sacas_liquida) {
          mapped.sacas_liquida = Math.round(((mapped as any).peso_liquid_kg / 60) * 100) / 100;
        }
        if (mapped.peso_bruto_kg && !mapped.sacas_bruto) {
          mapped.sacas_bruto = Math.round((mapped.peso_bruto_kg / 60) * 100) / 100;
        }

        const uniqueKey = buildImportKey({ ...mapped, safra_id: safraId });

        return {
          ...row,
          mapped: {
            ...mapped,
            _uniqueKey: uniqueKey,
            _rowIndex: row.mapped._rowIndex,
            safra_id: safraId,
            _message: row.mapped._message,
            _status: row.mapped._status === 'error' ? 'valid' as const : row.mapped._status
          }
        };
      }));
      return newMapping;
    });
  }, [safraId, defaultValues]);

  const reprocessData = useCallback(() => {
    setParsedData(prev => prev.map(row => {
      const mapped: Partial<ParsedRow['mapped']> = {};
      Object.entries(columnMapping).forEach(([sourceCol, targetField]) => {
        const value = row.raw[sourceCol];
        if (value !== null && value !== undefined && value !== '') {
          (mapped as any)[targetField] = value;
        }
      });
      Object.entries(defaultValues).forEach(([field, value]) => {
        if (!mapped[field as keyof typeof mapped] && value) {
          (mapped as any)[field] = value;
        }
      });
      return { ...row, mapped: { ...row.mapped, ...mapped } };
    }));
  }, [columnMapping, defaultValues]);

  const removeRows = useCallback((indices: number[]) => {
    const indexSet = new Set(indices);
    setParsedData(prev => prev.filter((_, i) => !indexSet.has(i)));
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      indices.forEach(i => newSet.delete(i));
      return newSet;
    });
  }, []);

  const toggleRowSelection = useCallback((index: number) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) newSet.delete(index);
      else newSet.add(index);
      return newSet;
    });
  }, []);

  const toggleAllSelection = useCallback(() => {
    const filtered = getFilteredData();
    const allSelected = filtered.every((_, idx) => selectedRows.has(parsedData.indexOf(filtered[idx])));
    
    if (allSelected) {
      filtered.forEach((_, idx) => {
        const realIdx = parsedData.indexOf(filtered[idx]);
        selectedRows.delete(realIdx);
      });
      setSelectedRows(new Set(selectedRows));
    } else {
      const newSet = new Set(selectedRows);
      filtered.forEach((_, idx) => {
        const realIdx = parsedData.indexOf(filtered[idx]);
        if (filtered[idx].mapped._status !== 'error' && filtered[idx].mapped._status !== 'duplicate') {
          newSet.add(realIdx);
        }
      });
      setSelectedRows(newSet);
    }
  }, [selectedRows]);

  // ===== FILTERED DATA =====
  const getFilteredData = useCallback(() => {
    return parsedData.filter((row) => {
      const matchesSearch = !filters.search || 
        JSON.stringify(row.mapped).toLowerCase().includes(filters.search.toLowerCase());
      const matchesStatus = filters.status === 'all' || row.mapped._status === filters.status;
      return matchesSearch && matchesStatus;
    });
  }, [parsedData, filters]);

  const filteredData = useMemo(() => getFilteredData(), [getFilteredData]);

  // ===== VALID ROWS TO SAVE =====
  const validRowsToSave = useMemo(() => {
    const rowsByKey = new Map<string, any>();

    parsedData
      .filter((row, idx) => selectedRows.has(idx))
      .filter(row => row.mapped._status !== 'error' && row.mapped._status !== 'duplicate')
      .filter(row => hasImportKey(row.mapped))
      .forEach(row => {
        const { _status, _message, _rowIndex, _uniqueKey, ...cleanData } = row.mapped;
        const current = rowsByKey.get(_uniqueKey);
        rowsByKey.set(_uniqueKey, current ? pickBetterRow(current, cleanData) : cleanData);
      });

    return Array.from(rowsByKey.values());
  }, [parsedData, selectedRows]);

  // ===== SAVE =====
  const handleSave = useCallback(async () => {
    if (validRowsToSave.length === 0) {
      showError("Nenhuma linha válida selecionada para salvar.");
      return;
    }

    setStage('saving');
    const toastId = showLoading(`Salvando ${validRowsToSave.length} romaneios...`);
    let successCount = 0;
    let errorCount = 0;
    const errorDetails: string[] = [];

    try {
      const fazendasUnicas = Array.from(new Set(validRowsToSave.map(r => normalizeText(r.fazenda)).filter(Boolean)));
      const armazensUnicos = Array.from(new Set(validRowsToSave.map(r => normalizeText(r.armazem)).filter(Boolean)));

      if (fazendasUnicas.length > 0) {
        const { error } = await supabase
          .from('fazendas')
          .upsert(fazendasUnicas.map(nome => ({ nome })), { onConflict: 'nome' });
        if (error) throw error;
      }

      if (armazensUnicos.length > 0) {
        const { error } = await supabase
          .from('armazens')
          .upsert(armazensUnicos.map(nome => ({ nome })), { onConflict: 'nome' });
        if (error) throw error;
      }

      const contratosUnicos = Array.from(new Map(
        validRowsToSave
          .map(row => {
            const numero = normalizeText(row.ncontrato || row.contrato).replace(/\.0$/, '');
            if (!numero) return null;
            return [normalizeMapKey(numero), {
              safra_id: safraId,
              numero,
              nome: normalizeText(row.contrato) || numero,
              volume_total: 0
            }];
          })
          .filter(Boolean) as [string, { safra_id: string; numero: string; nome: string; volume_total: number }][]
      ).values());

      if (contratosUnicos.length > 0) {
        const { error } = await supabase
          .from('contratos')
          .upsert(contratosUnicos, { onConflict: 'safra_id,numero' });
        if (error) throw error;
      }

      const [{ data: fazendasDB }, { data: armazensDB }, { data: contratosDB }] = await Promise.all([
        supabase.from('fazendas').select('id, nome'),
        supabase.from('armazens').select('id, nome'),
        supabase.from('contratos').select('id, numero').eq('safra_id', safraId)
      ]);

      const fazendaMap = Object.fromEntries((fazendasDB || []).map(f => [normalizeMapKey(f.nome), f.id]));
      const armazemMap = Object.fromEntries((armazensDB || []).map(a => [normalizeMapKey(a.nome), a.id]));
      const contratoMap = Object.fromEntries((contratosDB || []).map(c => [normalizeMapKey(c.numero), c.id]));

      const rowsToSave = validRowsToSave.map(row => {
        const fazendaNome = normalizeText(row.fazenda);
        const armazemNome = normalizeText(row.armazem);
        const contratoNumero = normalizeText(row.ncontrato || row.contrato).replace(/\.0$/, '');

        return {
          safra_id: safraId,
          data: row.data || null,
          nfe: row.nfe || null,
          numero_romaneio: row.numero_romaneio || null,
          emitente: row.emitente || null,
          tipo_nf: row.tipoNF || row.tipo_nf || null,
          talhao: row.talhao || null,
          motorista: row.motorista || null,
          placa: row.placa || null,
          cidade_entrega: row.cidade_entrega || null,
          peso_bruto_kg: row.peso_bruto_kg || null,
          peso_liquid_kg: row.peso_liquid_kg || null,
          sacas_bruto: row.sacas_bruto || null,
          sacas_liquida: row.sacas_liquida || null,
          umidade: row.umidade || 0,
          impureza: row.impureza || 0,
          ardido: row.ardido || 0,
          avariados: row.avariados || 0,
          quebrados: row.quebrados || 0,
          contaminantes: row.contaminantes || 0,
          preco_frete: row.preco_frete || null,
          fazenda_id: fazendaMap[normalizeMapKey(fazendaNome)] || null,
          armazem_id: armazemMap[normalizeMapKey(armazemNome)] || null,
          armazem_nome: armazemNome || null,
          contrato_id: contratoMap[normalizeMapKey(contratoNumero)] || null
        };
      });

      const importKeys = new Set(rowsToSave.filter(row => hasImportKey(row)).map(row => buildImportKey(row)));
      const { data: existingRows, error: existingError } = await supabase
        .from('romaneios')
        .select('id,safra_id,numero_romaneio,nfe,peso_bruto_kg,peso_liquid_kg,sacas_bruto,sacas_liquida,motorista,placa,armazem_id,fazenda_id,data,created_at')
        .eq('safra_id', safraId);

      if (existingError) throw existingError;

      const existingByKey = new Map<string, any>();
      const duplicatedExistingIds: string[] = [];

      (existingRows || []).forEach(row => {
        const key = buildImportKey(row);
        if (!importKeys.has(key)) return;

        const current = existingByKey.get(key);
        if (!current) {
          existingByKey.set(key, row);
          return;
        }

        const better = pickBetterRow(current, row) === row ? row : current;
        const duplicate = better === row ? current : row;
        if (duplicate?.id) duplicatedExistingIds.push(duplicate.id);
        existingByKey.set(key, better);
      });

      const deleteChunkSize = 100;
      for (let i = 0; i < duplicatedExistingIds.length; i += deleteChunkSize) {
        const chunk = duplicatedExistingIds.slice(i, i + deleteChunkSize);
        const { error } = await supabase.from('romaneios').delete().in('id', chunk);
        if (error) throw error;
      }

      for (const row of rowsToSave) {
        if (!hasImportKey(row)) {
          errorCount += 1;
          errorDetails.push(`Romaneio sem chave de importacao: ${JSON.stringify({ numero_romaneio: row.numero_romaneio, nfe: row.nfe })}`);
          continue;
        }

        const key = buildImportKey(row);
        const existing = existingByKey.get(key);
        const { error } = existing?.id
          ? await supabase.from('romaneios').update(row).eq('id', existing.id)
          : await supabase.from('romaneios').insert(row);

        if (error) {
          errorCount += 1;
          errorDetails.push(`Romaneio ${row.numero_romaneio} / NFe ${row.nfe}: ${error.message}`);
        } else {
          successCount += 1;
        }
      }

      const { data: saldoRows, error: saldoRowsError } = await supabase
        .from('romaneios')
        .select('armazem_id,armazem_nome,peso_liquid_kg,sacas_liquida')
        .eq('safra_id', safraId);

      if (saldoRowsError) throw saldoRowsError;

      const saldosAgrupados = new Map<string, { armazem_id: string; armazem_nome: string; total_kg: number; total_sacas: number }>();
      (saldoRows || []).forEach(row => {
        if (!row.armazem_id) return;
        const current = saldosAgrupados.get(row.armazem_id) || {
          armazem_id: row.armazem_id,
          armazem_nome: row.armazem_nome || 'Outros',
          total_kg: 0,
          total_sacas: 0
        };
        current.total_kg += Number(row.peso_liquid_kg) || 0;
        current.total_sacas += Number(row.sacas_liquida) || 0;
        saldosAgrupados.set(row.armazem_id, current);
      });

      const { error: deleteSaldosError } = await supabase.from('saldos').delete().eq('safra_id', safraId);
      if (deleteSaldosError) throw deleteSaldosError;

      const saldosPayload = Array.from(saldosAgrupados.values()).map(row => ({
        safra_id: safraId,
        armazem_id: row.armazem_id,
        armazem_nome: row.armazem_nome,
        total_kg: Math.round(row.total_kg),
        total_sacas: Number(row.total_sacas.toFixed(2))
      }));

      if (saldosPayload.length > 0) {
        const { error: insertSaldosError } = await supabase.from('saldos').insert(saldosPayload);
        if (insertSaldosError) throw insertSaldosError;
      }

      dismissToast(toastId);
      
      if (errorCount > 0) {
        showError(`${successCount} salvos, ${errorCount} erros.`);
      } else {
        showSuccess(`${successCount} romaneios salvos com sucesso!`);
      }

      setSaveResults({ success: successCount, errors: errorCount, details: errorDetails });
      setStage('done');
      setSelectedRows(new Set());
      
    } catch (err: any) {
      dismissToast(toastId);
      showError("Erro crítico ao salvar: " + err.message);
      setStage('review');
    }
  }, [validRowsToSave, safraId]);

  // ===== UTILITIES =====
  const downloadTemplate = useCallback(() => {
    const headers = [
      'Data', 'Tipo NF', 'Nº', 'NFe', 'Emitente', 'Destinatário', 'Placa',
      'Motorista', 'Cidade de Entrega', 'Armazem', 'Contrato', 'ncontrato',
      'Venc.', 'Safra', 'Fazenda', 'Talhão', 'Peso Bruto', 'Umid', 'Impu',
      'Ardi', 'Avari', 'Contaminantes', 'Quebr', 'Peso Liquido',
      'Sacas Bruto', 'Sacas Liquido', 'precofrete'
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo_MS_Gestor");
    XLSX.writeFile(wb, `Modelo_Importacao_MS_Gestor_${safraId}.xlsx`);
  }, [safraId]);

  const exportProcessedData = useCallback(() => {
    const dataToExport = parsedData.map(row => ({
      ...row.raw,
      ...row.mapped,
      _status: row.mapped._status,
      _message: row.mapped._message
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Processados");
    XLSX.writeFile(wb, `Processados_MS_Gestor_${safraId}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }, [parsedData, safraId]);

  return {
    stage,
    setStage,
    parsedData,
    setParsedData,
    sheetNames,
    selectedSheet,
    setSelectedSheet,
    columnMapping,
    setColumnMapping,
    defaultValues,
    setDefaultValues,
    selectedRows,
    setSelectedRows,
    filters,
    setFilters,
    validRowsToSave,
    loading,
    saveResults,
    handleFileChange,
    processSelectedSheet,
    checkDuplicatesInDB,
    updateRowField,
    updateDefaultValue,
    updateColumnMapping,
    removeRows,
    toggleRowSelection,
    toggleAllSelection,
    handleSave,
    downloadTemplate,
    exportProcessedData,
    reprocessData,
    getFilteredData,
    filteredData
  };
}
