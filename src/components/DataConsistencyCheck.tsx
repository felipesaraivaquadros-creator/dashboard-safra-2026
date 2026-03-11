"use client";

import React from 'react';
import { CheckCircle2, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { useSupabaseStats } from '../lib/useSupabaseStats';

interface DataConsistencyCheckProps {
  safraId: string;
  localCount: number;
  localSacas: number;
}

export default function DataConsistencyCheck({ safraId, localCount, localSacas }: DataConsistencyCheckProps) {
  const { dbStats, loading, refresh } = useSupabaseStats(safraId);

  if (loading && !dbStats) return null;

  const isMatch = dbStats && 
    dbStats.count === localCount && 
    Math.abs(dbStats.totalSacas - localSacas) < 0.1;

  return (
    <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${isMatch ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isMatch ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
          {isMatch ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
            <Database size={10} /> Status da Nuvem (Supabase)
          </h4>
          <p className="text-xs font-bold">
            {isMatch 
              ? "Dados 100% Sincronizados" 
              : `Divergência: ${dbStats?.count || 0}/${localCount} romaneios no banco`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-[9px] font-black text-slate-400 uppercase">Volume no Banco</p>
          <p className="text-xs font-black text-slate-700 dark:text-slate-200">
            {dbStats?.totalSacas.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc
          </p>
        </div>
        <button 
          onClick={refresh}
          className="p-2 hover:bg-white/50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-purple-600"
          title="Atualizar conferência"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}