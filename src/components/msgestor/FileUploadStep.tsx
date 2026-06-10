"use client";

import React from 'react';
import { FileUp, Loader2, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { MS_GESTOR_COLUMNS } from './types';

interface FileUploadStepProps {
  loading: boolean;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
  columns: Record<string, string>;
}

export function FileUploadStep({ loading, onFileChange, onDownloadTemplate, columns }: FileUploadStepProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-3xl mx-auto p-8 text-center">
      <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
        <FileUp size={40} className="text-blue-600" />
      </div>
      <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Importar do MS Gestor</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
        Faça upload do relatório exportado do MS Gestor (.xls ou .xlsx). 
        O sistema lerá os dados e permitirá configurar o mapeamento das colunas.
      </p>
      
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-left">
        <p className="text-xs font-black uppercase text-slate-400 mb-2">Colunas esperadas do MS Gestor:</p>
        <div className="grid grid-cols-3 gap-1 text-sm text-slate-600 dark:text-slate-300">
          {Object.keys(columns).map(col => (
            <span key={col} className="px-2 py-1 bg-white dark:bg-slate-800 rounded">{col}</span>
          ))}
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        accept=".xls,.xlsx" 
        className="hidden" 
        disabled={loading}
      />
      <button 
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase rounded-2xl transition-all shadow-lg disabled:opacity-50"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <FileUp size={20} />}
        Selecionar Arquivo do MS Gestor
      </button>

      <div className="mt-6 flex gap-4 justify-center">
        <button 
          onClick={onDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
        >
          <Download size={16} /> Baixar Modelo
        </button>
      </div>
    </div>
  );
}