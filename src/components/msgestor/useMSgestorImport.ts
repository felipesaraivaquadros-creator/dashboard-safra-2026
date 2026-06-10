"use client";

import { useState, useCallback, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import { ParsedRow, ColumnMapping, DefaultValues, FilterState, SaveResults, MS_GESTOR_COLUMNS, TARGET_FIELDS } from './types';

export function useMSgestorImport(safraId: string) {
  const [stage, setStage] = useState<'upload' | 'mapping' | 'review' | 'saving' | 'done'>('upload');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
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
    const toastId = showLoading("Lendo arquivo do MS Gestor...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true, raw: false });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: false });

      if (jsonData.length === 0) {
        dismissToast(toastId);
        showError("Arquivo vazio ou sem dados válidos.");
        return;
      }

      // Auto-mapeamento inicial
      const firstRow = jsonData[0] as Record<string, any>;
      const detectedColumns = Object.keys(firstRow);
      const autoMapping: ColumnMapping = {};
      
      detectedColumns.forEach(col => {
        const normalized = col.trim();
        if (MS_GESTOR_COLUMNS[normalized as keyof typeof MS_GESTOR_COLUMNS]) {
          autoMapping[col] = MS_GESTOR_COLUMNS[normalized as keyof typeof MS_GESTOR_COLUMNS];
        }
      });

      setColumnMapping(prev => ({ ...prev, ...autoMapping }));
      localStorage.setItem(`msgestor_mapping_${safraId}`, JSON.stringify({ ...columnMapping, ...autoMapping }));

      // Processa linhas
      const processed: ParsedRow[] = jsonData.map((row: any, index: number) => {
        const mapped: Partial<ParsedRow['mapped']> = {};
        
        Object.entries(columnMapping).forEach(([sourceCol, targetField]) => {
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
            const val = String(mapped[f as keyof typeof mapped]).replace(/\./g, '').replace(',', '.');
            const num = parseFloat(val);
            if (!isNaN(num)) (mapped as any)[f] = num;
          }
        });

        if (mapped.peso_liquid_kg && !mapped.sacas_liquida) {
          mapped.sacas_liquida = Math.round((mapped.peso_liquid_kg / 60) * 100) / 100;
        }
        if (mapped.peso_bruto_kg && !mapped.sacas_bruto) {
          mapped.sacas_bruto = Math.round((mapped.peso_bruto_kg / 60) * 100) / 100;
        }

        const uniqueKey = `${mapped.nfe || ''}-${mapped.numero_romaneio || ''}-${mapped.data || ''}-${mapped.placa || ''}`.toUpperCase();

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

      // Verifica duplicatas no arquivo
      const seenKeys = new Set<string>();
      processed.forEach(row => {
        const key = row.mapped._uniqueKey;
        if (seenKeys.has(key)) {
          row.mapped._status = 'duplicate';
          row.mapped._message = 'Duplicado no arquivo';
        } else {
          seenKeys.add(key);
        }
      });

      setParsedData(processed);
      setStage('mapping');
      dismissToast(toastId);
      showSuccess(`${processed.length} linhas lidas. Configure o mapeamento de colunas.`);
      
    } catch (err: any) {
      dismissToast(toastId);
      showError("Erro ao ler arquivo: " + err.message);
    } finally {
      setLoading(false);
      if (e.target) (e.target as HTMLInputElement).value = "";
    }
  }, [safraId, columnMapping, defaultValues]);

  // ===== DUPLICATE CHECK =====
  const checkDuplicatesInDB = useCallback(async () => {
    const toastId = showLoading("Verificando duplicatas no banco...");
    try {
      const { data: existing } = await supabase
        .from('romaneios')
        .select('nfe, numero_romaneio, data, placa')
        .eq('safra_id', safraId);

      const existingKeys = new Set(
        (existing || []).map(r => 
          `${r.nfe || ''}-${r.numero_romaneio || ''}-${r.data || ''}-${r.placa || ''}`.toUpperCase()
        )
      );

      setParsedData(prev => prev.map(row => {
        if (existingKeys.has(row.mapped._uniqueKey)) {
          return { ...row, mapped: { ...row.mapped, _status: 'duplicate' as const, _message: 'Já existe no banco' } };
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
      return newMapping;
    });
    reprocessData();
  }, [safraId]);

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
        if (filtered[idx].mapped._status !== 'error') {
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
    return parsedData
      .filter((row, idx) => selectedRows.has(idx))
      .filter(row => row.mapped._status !== 'error')
      .map(row => {
        const { _status, _message, _rowIndex, _uniqueKey, ...cleanData } = row.mapped;
        return cleanData;
      });
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
      const batchSize = 50;
      for (let i = 0; i < validRowsToSave.length; i += batchSize) {
        const batch = validRowsToSave.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('romaneios')
          .upsert(batch, { 
            onConflict: 'safra_id,nfe,numero_romaneio,data,placa',
            ignoreDuplicates: false 
          });

        if (error) {
          errorCount += batch.length;
          errorDetails.push(`Lote ${i/batchSize + 1}: ${error.message}`);
        } else {
          successCount += batch.length;
        }
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
  }, [validRowsToSave]);

  // ===== UTILITIES =====
  const downloadTemplate = useCallback(() => {
    const headers = [
      'Data', 'Tp', 'Nº', 'NFe', 'Produto', 'Placa', 'Arm', 'Safra', 'Talhão',
      'Pesol', 'Umid', 'Impu', 'Ardi', 'Avari', 'Verdes', 'Quebr', 'Seca', 'Class',
      'Entrada', 'Saída',
      'Contrato', 'nContrato', 'Emitente', 'CidadeEntrega', 'Fazenda', 'Motorista',
      'PesoLiquido', 'SacasLiquida', 'PrecoFrete'
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