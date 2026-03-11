"use client";

import React, { useState, useEffect } from 'react';
import { X, Scissors, RotateCcw, Loader2, Scale } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { showSuccess, showError } from '../../utils/toast';

interface SplitSaldoModalProps {
  safraId: string;
  armazem: any; // { id, nome, totalKg, totalSc, isCustom }
  onClose: () => void;
  onSuccess: () => void;
}

export default function SplitSaldoModal({ safraId, armazem, onClose, onSuccess }: SplitSaldoModalProps) {
  const [loading, setLoading] = useState(false);
  const [pesoSplit, setPesoSplit] = useState<number>(0);
  const [sacasSplit, setSacasSplit] = useState<number>(0);

  // Atualiza sacas quando o peso muda
  useEffect(() => {
    setSacasSplit(pesoSplit / 60);
  }, [pesoSplit]);

  const handleSplit = async () => {
    if (pesoSplit <= 0 || pesoSplit >= armazem.totalKg) {
      showError("Informe um valor maior que zero e menor que o total atual.");
      return;
    }

    setLoading(true);
    try {
      const pesoRestante = armazem.totalKg - pesoSplit;
      
      // Se o item já era custom, pegamos o armazem_id real dele
      const realArmazemId = armazem.armazem_id || armazem.id;

      const payload = [
        {
          safra_id: safraId,
          armazem_id: realArmazemId,
          nome_exibicao: `${armazem.nome} (Parte A)`,
          peso_kg: pesoSplit,
          grupo: armazem.grupo || null
        },
        {
          safra_id: safraId,
          armazem_id: realArmazemId,
          nome_exibicao: `${armazem.nome} (Parte B)`,
          peso_kg: pesoRestante,
          grupo: armazem.grupo || null
        }
      ];

      // Se o item atual já era custom, removemos ele antes de criar os novos
      if (armazem.isCustom) {
        await supabase.from('saldos_custom').delete().eq('id', armazem.db_id);
      }

      const { error } = await supabase.from('saldos_custom').insert(payload);
      if (error) throw error;

      showSuccess("Saldo desmembrado com sucesso!");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError("Erro ao desmembrar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Deseja remover todos os desmembramentos deste armazém e voltar ao saldo original?")) return;
    
    setLoading(true);
    try {
      const realArmazemId = armazem.armazem_id || armazem.id;
      const { error } = await supabase
        .from('saldos_custom')
        .delete()
        .eq('armazem_id', realArmazemId)
        .eq('safra_id', safraId);

      if (error) throw error;

      showSuccess("Desmembramentos removidos.");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError("Erro ao resetar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <span className="text-[10px] font-black uppercase bg-blue-500 px-2 py-0.5 rounded-full mb-1 block w-fit">Ajuste de Volume</span>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Desmembrar Saldo</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Volume Atual ({armazem.nome})</p>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-black text-slate-700 dark:text-slate-200">{armazem.totalSc.toLocaleString('pt-BR')} sc</span>
              <span className="text-xs font-bold text-slate-400">{armazem.totalKg.toLocaleString('pt-BR')} kg</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Quantidade em KG para novo volume</label>
            <div className="relative">
              <input 
                type="number"
                value={pesoSplit || ''}
                onChange={(e) => setPesoSplit(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-4 text-lg font-black transition-all outline-none"
                placeholder="0"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">KG</div>
            </div>
            
            <div className="flex items-center gap-2 px-2 text-blue-600 dark:text-blue-400">
              <Scale size={14} />
              <span className="text-xs font-black uppercase">Equivale a: {sacasSplit.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sacas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 pt-4">
            <button 
              disabled={loading || pesoSplit <= 0}
              onClick={handleSplit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Scissors size={18} />}
              Confirmar Desmembramento
            </button>

            {armazem.isCustom && (
              <button 
                disabled={loading}
                onClick={handleReset}
                className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-300 hover:text-red-600 rounded-2xl font-black uppercase text-[10px] py-3 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={14} /> Remover Todos os Desmembramentos
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}