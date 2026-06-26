"use client";

import React from 'react';
import { ArrowLeft, ArrowRight, FileSpreadsheet } from 'lucide-react';

interface SheetSelectionStepProps {
  sheetNames: string[];
  selectedSheet: string;
  onSheetChange: (sheetName: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function SheetSelectionStep({
  sheetNames,
  selectedSheet,
  onSheetChange,
  onBack,
  onNext
}: SheetSelectionStepProps) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
          <FileSpreadsheet size={32} className="text-emerald-600" />
        </div>
        <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Escolher Aba da Planilha</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Selecione a aba que contém os romaneios antes de seguir para o mapeamento.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-5 mb-6 border border-slate-200 dark:border-slate-700">
        <label className="block text-xs font-black uppercase text-slate-400 mb-2">Aba para importar</label>
        <select
          value={selectedSheet}
          onChange={e => onSheetChange(e.target.value)}
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500"
        >
          {sheetNames.map(sheet => (
            <option key={sheet} value={sheet}>{sheet}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {sheetNames.map(sheet => (
          <button
            key={sheet}
            type="button"
            onClick={() => onSheetChange(sheet)}
            className={`text-left px-4 py-3 rounded-xl border transition-all ${
              selectedSheet === sheet
                ? 'bg-purple-600 border-purple-600 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="block text-sm font-black truncate">{sheet}</span>
          </button>
        ))}
      </div>

      <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <button
          disabled={!selectedSheet}
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2 text-sm font-black uppercase rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Processar Aba <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
