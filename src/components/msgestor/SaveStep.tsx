"use client";

import React from 'react';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { SaveResults } from './types';

interface SaveStepProps {
  loading: boolean;
  done?: boolean;
  saveResults?: SaveResults | null;
  onNewImport?: () => void;
  onBackToReview?: () => void;
}

export function SaveStep({ loading, done, saveResults, onNewImport, onBackToReview }: SaveStepProps) {
  if (loading && !done) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
        <Loader2 className="w-16 h-16 mx-auto mb-6 text-green-600 animate-spin" />
        <h2 className="text-xl font-black uppercase italic tracking-tighter mb-2">Salvando no Banco...</h2>
        <p className="text-slate-500">Por favor, aguarde. Isso pode levar alguns instantes.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Importação Concluída!</h2>
        <div className="grid grid-cols-2 gap-4 mb-8 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
          <div>
            <p className="text-3xl font-black text-green-600">{saveResults?.success || 0}</p>
            <p className="text-sm font-bold uppercase text-slate-400">Salvos com Sucesso</p>
          </div>
          <div>
            <p className="text-3xl font-black text-red-600">{saveResults?.errors || 0}</p>
            <p className="text-sm font-bold uppercase text-slate-400">Erros</p>
          </div>
        </div>
        {saveResults?.details.length && (
          <details className="mb-6 text-left">
            <summary className="text-sm font-bold text-slate-500 cursor-pointer">Ver detalhes dos erros</summary>
            <ul className="mt-2 text-xs text-red-600 space-y-1 max-h-40 overflow-auto">
              {saveResults.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          </details>
        )}
        <div className="flex gap-4 justify-center">
          <button onClick={onNewImport} className="px-6 py-3 text-sm font-black uppercase rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all">
            Novo Arquivo
          </button>
          <button onClick={onBackToReview} className="px-6 py-3 text-sm font-black uppercase rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all">
            Voltar à Revisão
          </button>
        </div>
      </div>
    );
  }

  return null;
}