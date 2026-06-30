"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Fuel, Loader2, Save, X } from 'lucide-react';
import { showError, showSuccess } from '../../utils/toast';

interface AbastecimentoFormProps {
  safraId: string;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
  motoristas: string[];
}

const parseLocaleNumber = (value: string | number) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const normalized = String(value || '').trim().replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getErrorMessage = (err: any) => {
  const message = err?.message || 'Erro desconhecido';
  if (message.includes('row-level security')) {
    return 'Sem permissao para gravar no banco. Rode o SQL de politicas RLS enviado.';
  }
  return message;
};

export default function AbastecimentoForm({ safraId, onClose, onSuccess, editData, motoristas }: AbastecimentoFormProps) {
  const [loading, setLoading] = useState(false);
  const initialDate = editData?.data ? editData.data.split('T')[0] : new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    motorista: editData?.motorista || '',
    data: initialDate,
    litros: editData?.litros?.toString() || '',
    preco: editData?.preco?.toString() || '',
    total: editData?.total?.toString() || '',
    produto: editData?.produto || 'DIESEL',
  });

  useEffect(() => {
    const litros = parseLocaleNumber(formData.litros);
    const preco = parseLocaleNumber(formData.preco);
    if (litros > 0 && preco > 0) {
      setFormData(prev => ({ ...prev, total: (litros * preco).toFixed(2) }));
    }
  }, [formData.litros, formData.preco]);

  const savePayload = (payload: Record<string, any>) => {
    if (editData?.id) {
      return supabase.from('abastecimentos').update(payload).eq('id', editData.id);
    }
    return supabase.from('abastecimentos').insert([payload]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const motorista = formData.motorista.trim().toUpperCase();
      const litros = parseLocaleNumber(formData.litros);
      const preco = parseLocaleNumber(formData.preco);
      const total = parseLocaleNumber(formData.total) || litros * preco;

      if (!motorista) throw new Error('Informe o motorista.');
      if (!formData.data) throw new Error('Informe a data.');
      if (litros <= 0) throw new Error('Informe a quantidade de litros.');
      if (preco <= 0) throw new Error('Informe o preco unitario.');

      const payload = {
        safra_id: safraId,
        motorista,
        data: formData.data,
        produto: formData.produto || 'DIESEL',
        litros,
        preco,
        total,
      };

      let { error } = await savePayload(payload);

      if (error?.code === '42703' && error.message?.includes('produto')) {
        const { produto, ...payloadSemProduto } = payload;
        const retry = await savePayload(payloadSemProduto);
        error = retry.error;
      }

      if (error) throw error;

      showSuccess(editData ? 'Abastecimento atualizado!' : 'Abastecimento registrado!');
      onSuccess();
      onClose();
    } catch (err: any) {
      showError('Erro ao salvar: ' + getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-red-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Fuel size={20} /> {editData ? 'Editar Abastecimento' : 'Novo Abastecimento'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Produto</label>
              <select
                value={formData.produto}
                onChange={e => setFormData({ ...formData, produto: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all"
              >
                <option value="DIESEL">DIESEL</option>
                <option value="ARLA">ARLA</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Data</label>
              <input
                required
                type="date"
                value={formData.data}
                onChange={e => setFormData({ ...formData, data: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Motorista</label>
            <input
              required
              list="motoristas-list"
              value={formData.motorista}
              onChange={e => setFormData({ ...formData, motorista: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all"
              placeholder="NOME DO MOTORISTA"
            />
            <datalist id="motoristas-list">
              {motoristas.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Litros</label>
              <input
                required
                type="text"
                inputMode="decimal"
                value={formData.litros}
                onChange={e => setFormData({ ...formData, litros: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all"
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Preco Unit. (R$)</label>
              <input
                required
                type="text"
                inputMode="decimal"
                value={formData.preco}
                onChange={e => setFormData({ ...formData, preco: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-red-500 transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800">
            <p className="text-[10px] font-black text-red-400 uppercase mb-1">Valor Total Calculado</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400">
              R$ {Number(parseLocaleNumber(formData.total)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="pt-4">
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Salvar Abastecimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
