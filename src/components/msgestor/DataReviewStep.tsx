"use client";

import React, { useMemo } from 'react';
import { 
  Search, Filter, CheckCircle, AlertCircle, Trash2, 
  Download, UploadCloud, ArrowLeft, Minus, Plus,
  Square, CheckSquare, MinusSquare
} from 'lucide-react';
import { ParsedRow, FilterState } from './types';

interface DataReviewStepProps {
  parsedData: ParsedRow[];
  columnMapping: Record<string, string>;
  defaultValues: Record<string, any>;
  selectedRows: Set<number>;
  filters: FilterState;
  validRowsToSave: any[];
  loading: boolean;
  onFiltersChange: (filters: FilterState) => void;
  onSelectionChange: (rows: Set<number>) => void;
  onToggleRow: (index: number) => void;
  onToggleAll: () => void;
  onUpdateField: (index: number, field: string, value: any) => void;
  onUpdateDefault: (field: string, value: any) => void;
  onUpdateMapping: (source: string, target: string) => void;
  onRemoveRows: (indices: number[]) => void;
  onCheckDuplicates: () => void;
  onExport: () => void;
  onBack: () => void;
  onSave: () => void;
  getFilteredData: () => ParsedRow[];
}

export function DataReviewStep({
  parsedData,
  columnMapping,
  defaultValues,
  selectedRows,
  filters,
  validRowsToSave,
  loading,
  onFiltersChange,
  onSelectionChange,
  onToggleRow,
  onToggleAll,
  onUpdateField,
  onUpdateDefault,
  onUpdateMapping,
  onRemoveRows,
  onCheckDuplicates,
  onExport,
  onBack,
  onSave,
  getFilteredData
}: DataReviewStepProps) {
  const filteredData = getFilteredData();
  
  const stats = useMemo(() => ({
    total: parsedData.length,
    valid: parsedData.filter(r => r.mapped._status === 'valid' || r.mapped._status === 'new').length,
    duplicate: parsedData.filter(r => r.mapped._status === 'duplicate').length,
    error: parsedData.filter(r => r.mapped._status === 'error').length,
    selected: selectedRows.size
  }), [parsedData, selectedRows]);

  const allSelected = filteredData.length > 0 && 
    filteredData.every((_, idx) => selectedRows.has(parsedData.indexOf(filteredData[idx])));

  const someSelected = filteredData.some((_, idx) => selectedRows.has(parsedData.indexOf(filteredData[idx])));

  return (
    <div className="max-w-full">
      {/* Header Stats */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter">Revisão de Dados</h3>
            <p className="text-sm text-slate-500">Complete os campos obrigatórios e remova duplicatas antes de salvar</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={onCheckDuplicates} className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all">
              <Search size={16} /> Verificar Duplicatas no Banco
            </button>
            <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">
              <Download size={16} /> Exportar Processados
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
            { label: 'Válidos', value: stats.valid, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
            { label: 'Duplicados', value: stats.duplicate, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
            { label: 'Erros', value: stats.error, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
            { label: 'Selecionados', value: stats.selected, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
          ].map(s => (
            <div key={s.label} className={`p-3 rounded-xl ${s.color}`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs font-bold uppercase">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters & Bulk Actions */}
        <div className="flex flex-wrap gap-3 items-center mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Buscar em todos os campos..."
              value={filters.search}
              onChange={e => onFiltersChange({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={filters.status}
            onChange={e => onFiltersChange({...filters, status: e.target.value as FilterState['status']})}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Todos</option>
            <option value="new">Novos</option>
            <option value="valid">Válidos</option>
            <option value="duplicate">Duplicados</option>
            <option value="error">Erros</option>
          </select>
          
          {stats.selected > 0 && (
            <>
              <button onClick={onToggleAll} className="px-3 py-2 text-xs font-bold uppercase text-slate-500 hover:text-slate-700">
                {allSelected ? 'Desmarcar Todos' : someSelected ? 'Marcar Todos Visíveis' : 'Marcar Todos Visíveis'}
              </button>
              <button onClick={() => onRemoveRows(Array.from(selectedRows))} className="px-4 py-2 text-sm font-bold uppercase rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition-all">
                <Trash2 size={14} className="inline" /> Excluir Selecionados
              </button>
            )}
          </div>
        </div>

        {/* Default Values Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-black uppercase text-slate-400 flex items-center gap-2">
              <Plus size={16} /> Valores Padrão (Preenchem campos vazios)
            </h4>
            <button 
              onClick={() => { Object.keys(defaultValues).forEach(k => onUpdateDefault(k, '')); }}
              className="text-xs text-red-500 hover:underline"
            >Limpar todos</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { field: 'fazenda', label: 'Fazenda' },
              { field: 'motorista', label: 'Motorista' },
              { field: 'cidade_entrega', label: 'Cidade Entrega' },
              { field: 'contrato', label: 'Contrato' },
              { field: 'ncontrato', label: 'Nº Contrato' },
              { field: 'emitente', label: 'Emitente' },
              { field: 'preco_frete', label: 'Preço Frete', type: 'number', step: '0.01' },
              { field: 'tipoNF', label: 'Tipo NF' },
            ].map(cfg => (
              <div key={cfg.field} className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">{cfg.label}</label>
                <input
                  type={cfg.type || 'text'}
                  step={cfg.step}
                  value={defaultValues[cfg.field] || ''}
                  onChange={e => onUpdateDefault(cfg.field, e.target.value)}
                  placeholder={`Padrão: ${cfg.label}`}
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-purple-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
                  <th className="px-3 py-3 w-12">
                    <input 
                      type="checkbox" 
                      checked={allSelected} 
                      indeterminate={someSelected && !allSelected}
                      onChange={onToggleAll} 
                      className="rounded border-slate-300" 
                    />
                  </th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Data</th>
                  <th className="px-3 py-3">NFe</th>
                  <th className="px-3 py-3">Nº Rom.</th>
                  <th className="px-3 py-3">Placa</th>
                  <th className="px-3 py-3">Armazém</th>
                  <th className="px-3 py-3">Fazenda</th>
                  <th className="px-3 py-3">Motorista</th>
                  <th className="px-3 py-3">Peso Bruto</th>
                  <th className="px-3 py-3">Peso Liq.</th>
                  <th className="px-3 py-3">Sacas Bruto</th>
                  <th className="px-3 py-3">Sacas Liq.</th>
                  <th className="px-3 py-3">Umid/Imp</th>
                  <th className="px-3 py-3">Preço Frete</th>
                  <th className="px-3 py-3">Contrato</th>
                  <th className="px-3 py-3 w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, displayIdx) => {
                  const realIndex = parsedData.indexOf(row);
                  const isSelected = selectedRows.has(realIndex);
                  const m = row.mapped;
                  return (
                    <tr 
                      key={realIndex} 
                      className={`border-b dark:border-slate-700/50 transition-colors ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''} ${m._status === 'duplicate' ? 'bg-orange-50 dark:bg-orange-900/10' : ''} ${m._status === 'error' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                    >
                      <td className="px-3 py-2">
                        <input type="checkbox" checked={isSelected} onChange={() => onToggleRow(realIndex)} className="rounded border-slate-300" />
                      </td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${m._status === 'valid' || m._status === 'new' ? 'bg-green-100 text-green-600' : m._status === 'duplicate' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                          {m._status === 'duplicate' ? 'Duplicado' : m._status === 'error' ? 'Erro' : 'OK'}
                        </span>
                        {m._message && <span className="ml-1 text-[8px] text-slate-400">({m._message})</span>}
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="date" 
                          value={m.data || ''} 
                          onChange={e => onUpdateField(realIndex, 'data', e.target.value)}
                          className="w-full bg-transparent border-none text-sm font-bold focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          value={m.nfe || ''} 
                          onChange={e => onUpdateField(realIndex, 'nfe', parseInt(e.target.value) || null)}
                          className="w-20 bg-transparent border-none text-sm font-bold focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={m.numero_romaneio || ''} 
                          onChange={e => onUpdateField(realIndex, 'numero_romaneio', e.target.value)}
                          className="w-24 bg-transparent border-none text-sm font-bold focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={m.placa || ''} 
                          onChange={e => onUpdateField(realIndex, 'placa', e.target.value.toUpperCase())}
                          className="w-24 bg-transparent border-none text-sm font-bold uppercase focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={m.armazem || ''} 
                          onChange={e => onUpdateField(realIndex, 'armazem', e.target.value)}
                          className="w-32 bg-transparent border-none text-sm font-bold focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={m.fazenda || ''} 
                          onChange={e => onUpdateField(realIndex, 'fazenda', e.target.value)}
                          className="w-28 bg-transparent border-none text-sm font-bold focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={m.motorista || ''} 
                          onChange={e => onUpdateField(realIndex, 'motorista', e.target.value.toUpperCase())}
                          className="w-28 bg-transparent border-none text-sm font-bold uppercase focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          value={m.peso_bruto_kg || ''} 
                          onChange={e => onUpdateField(realIndex, 'peso_bruto_kg', parseFloat(e.target.value) || null)}
                          className="w-24 bg-transparent border-none text-sm font-bold text-right focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          value={m.peso_liquid_kg || ''} 
                          onChange={e => onUpdateField(realIndex, 'peso_liquid_kg', parseFloat(e.target.value) || null)}
                          className="w-24 bg-transparent border-none text-sm font-bold text-right focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          value={m.sacas_bruto || ''} 
                          onChange={e => onUpdateField(realIndex, 'sacas_bruto', parseFloat(e.target.value) || null)}
                          className="w-20 bg-transparent border-none text-sm font-bold text-right focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          value={m.sacas_liquida || ''} 
                          onChange={e => onUpdateField(realIndex, 'sacas_liquida', parseFloat(e.target.value) || null)}
                          className="w-20 bg-transparent border-none text-sm font-bold text-right text-green-600 focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-slate-500">
                        {(m.umidade || 0).toFixed(1)} / {(m.impureza || 0).toFixed(1)}
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="number" 
                          step="0.01"
                          value={m.preco_frete || ''} 
                          onChange={e => onUpdateField(realIndex, 'preco_frete', parseFloat(e.target.value) || null)}
                          className="w-20 bg-transparent border-none text-sm font-bold text-right focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input 
                          type="text" 
                          value={m.contrato || ''} 
                          onChange={e => onUpdateField(realIndex, 'contrato', e.target.value)}
                          className="w-24 bg-transparent border-none text-sm font-bold focus:ring-2 focus:ring-purple-500 rounded px-1"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => onUpdateField(realIndex, '_status', 'valid')} className="p-1 text-green-500 hover:bg-green-100 rounded" title="Marcar como válido"><CheckCircle size={14} /></button>
                          <button onClick={() => onRemoveRows([realIndex])} className="p-1 text-red-500 hover:bg-red-100 rounded" title="Excluir"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={17} className="px-6 py-12 text-center text-slate-400 italic">Nenhum registro encontrado</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end gap-4">
          <button 
            onClick={onBack}
            className="px-6 py-3 text-sm font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={16} className="inline mr-1" /> Voltar ao Mapeamento
          </button>
          <button 
            disabled={validRowsToSave.length === 0 || loading}
            onClick={onSave}
            className="px-8 py-3 text-sm font-black uppercase rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <UploadCloud size={18} /> Salvar {validRowsToSave.length} Romaneios no Banco
          </button>
        </div>
      </div>
    );
  }
}