"use client";

import React from 'react';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, Loader2, Save } from 'lucide-react';
import { ParsedRow, ColumnMapping, TARGET_FIELDS } from './types';

interface ColumnMappingStepProps {
  parsedData: ParsedRow[];
  columnMapping: ColumnMapping;
  onMappingChange: (source: string, target: string) => void;
  onNext: () => void;
  onBack: () => void;
  defaultValues: Record<string, any>;
  onDefaultChange: (field: string, value: any) => void;
}

export function ColumnMappingStep({ 
  parsedData, 
  columnMapping, 
  onMappingChange, 
  onNext, 
  onBack,
  defaultValues,
  onDefaultChange
}: ColumnMappingStepProps) {
  const sampleRow = parsedData[0]?.raw;
  const allSourceColumns = sampleRow ? Object.keys(sampleRow) : [];
  const mappedSources = Object.keys(columnMapping);
  const unmappedSources = allSourceColumns.filter(c => !mappedSources.includes(c));

  const canProceed = parsedData.length > 0 && 
    (columnMapping['Data'] || columnMapping['NFe'] || columnMapping['Nº']);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-black uppercase italic tracking-tighter mb-2">Mapeamento de Colunas</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Associe cada coluna do arquivo ao campo correspondente no banco de dados.
          Colunas não mapeadas serão ignoradas.
        </p>
      </div>

      {/* Default Values Quick Set */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-100 dark:border-blue-800">
        <h4 className="text-sm font-black uppercase text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
          <CheckCircle size={16} /> Valores Padrão (Preenchem campos vazios automaticamente)
        </h4>
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
              <label className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">{cfg.label}</label>
              <input
                type={cfg.type || 'text'}
                step={cfg.step}
                value={defaultValues[cfg.field] || ''}
                onChange={e => onDefaultChange(cfg.field, e.target.value)}
                placeholder={`Padrão: ${cfg.label}`}
                className="w-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mapping Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-black uppercase text-slate-400 border-b dark:border-slate-700">
              <th className="px-3 py-2 text-left">Coluna no Arquivo</th>
              <th className="px-3 py-2 text-left">Campo no Banco</th>
              <th className="px-3 py-2 text-left">Amostra</th>
              <th className="px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {/* Mapped columns */}
            {Object.entries(columnMapping).map(([source, target]) => {
              const sample = sampleRow?.[source];
              const isRequired = ['data', 'nfe', 'numero_romaneio'].includes(target);
              return (
                <tr key={source} className="border-b dark:border-slate-700/50">
                  <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-300">{source}</td>
                  <td className="px-3 py-2">
                    <select
                      value={target}
                      onChange={e => onMappingChange(source, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-purple-500"
                    >
                      {TARGET_FIELDS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-xs truncate">{sample != null ? String(sample) : 'vazio'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isRequired ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {isRequired ? 'Obrigatório' : 'Mapeado'}
                    </span>
                  </td>
                </tr>
              )
            })}
            
            {/* Unmapped columns */}
            {unmappedSources.map(source => {
              const sample = sampleRow?.[source];
              return (
                <tr key={source} className="border-b dark:border-slate-700/50 bg-yellow-50 dark:bg-yellow-900/10">
                  <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-300">{source}</td>
                  <td className="px-3 py-2">
                    <select
                      value=""
                      onChange={e => onMappingChange(source, e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-2 py-1 text-sm font-bold focus:ring-2 focus:ring-purple-500"
                    >
                      {TARGET_FIELDS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-xs truncate">{sample != null ? String(sample) : 'vazio'}</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-yellow-100 text-yellow-600">
                      Não mapeado
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <button 
          disabled={!canProceed}
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 text-sm font-black uppercase rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continuar para Revisão <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}