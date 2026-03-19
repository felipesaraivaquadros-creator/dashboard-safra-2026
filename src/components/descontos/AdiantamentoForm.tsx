"use client";

import React, { useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { X, Save, Loader2, HandCoins } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';

interface AdiantamentoFormProps {
  safraId: string;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
  motoristas: string[];
}

export default function AdiantamentoForm({ safraId, onClose, onSuccess, editData, motoristas }: AdiantamentoFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Garante que a data seja apenas a parte YYYY-MM-DD para o input type="date"
  const initialDate = editData?.data ? editData.data.split('T')[0] : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    motorista: editData?.motorista || '',
    data: initialDate,
    valor: editData?.valor || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        safra_id: safraId,
        valor: parseFloat(formData.valor)
      };

      let error;
      if (editData?.id) {
        const { error: updateError } = await supabase
          .from('adiantamentos')
          .update(payload)
          .eq('id', editData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('adiantamentos')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      showSuccess(editData ? "Adiantamento atualizado!" : "Adiantamento registrado!");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError("Erro ao salvar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-orange-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <HandCoins size={20} /> {editData ? 'Editar Adiantamento' : 'Novo Adiantamento'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Motorista</label>
            <input
              required
              list="motoristas-list"
              value={formData.motorista}
              onChange={(e) => setFormData({ ...formData, motorista: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all"
              placeholder="NOME DO MOTORISTA"
            />
            <datalist id="motoristas-list">
              {motoristas.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data</label>
              <input
                required
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Valor (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black uppercase text-xs py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Salvar Adiantamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}