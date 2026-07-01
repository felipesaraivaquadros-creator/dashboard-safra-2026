"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Check, DollarSign, Edit2, Loader2, MapPin, Plus, Save, Trash2, Truck, X } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { showError, showSuccess } from '../../utils/toast';

interface PrecoFrete {
  id: string;
  safra_id: string;
  motorista: string | null;
  cidade: string;
  valor: number;
}

interface PrecoForm {
  motorista: string;
  cidade: string;
  valor: string;
}

interface TabelaPrecosReferenciaProps {
  safraId: string;
  motoristas: string[];
  cidades: string[];
  onUpdate: () => void;
}

const emptyForm: PrecoForm = { motorista: '', cidade: '', valor: '' };

const normalizeText = (value: string) =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const parseLocaleNumber = (value: string) => {
  const text = String(value || '').trim().replace(/\s/g, '');
  const normalized = text.includes(',')
    ? text.replace(/\./g, '').replace(',', '.')
    : text;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function TabelaPrecosReferencia({ safraId, motoristas, cidades, onUpdate }: TabelaPrecosReferenciaProps) {
  const [precos, setPrecos] = useState<PrecoFrete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newPreco, setNewPreco] = useState<PrecoForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPreco, setEditPreco] = useState<PrecoForm>(emptyForm);

  const motoristasOrdenados = useMemo(() => [...motoristas].sort(), [motoristas]);
  const cidadesOrdenadas = useMemo(() => [...cidades].sort(), [cidades]);

  const fetchPrecos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('precos_frete')
      .select('*')
      .eq('safra_id', safraId)
      .order('motorista')
      .order('cidade');

    if (error) {
      showError(`Erro ao carregar precos: ${error.message}`);
      setPrecos([]);
    } else {
      setPrecos((data || []) as PrecoFrete[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrecos();
  }, [safraId]);

  const validateForm = (form: PrecoForm) => {
    const motorista = normalizeText(form.motorista);
    const cidade = normalizeText(form.cidade);
    const valor = parseLocaleNumber(form.valor);

    if (!motorista) return { error: 'Informe o motorista.' };
    if (!cidade) return { error: 'Informe a cidade.' };
    if (valor <= 0) return { error: 'Informe um valor maior que zero.' };

    return { motorista, cidade, valor };
  };

  const handleAdd = async () => {
    const validated = validateForm(newPreco);
    if ('error' in validated) {
      showError(validated.error);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('precos_frete')
      .upsert([{
        safra_id: safraId,
        motorista: validated.motorista,
        cidade: validated.cidade,
        valor: validated.valor
      }], { onConflict: 'safra_id,motorista,cidade' });

    if (error) {
      showError(`Erro ao salvar preco: ${error.message}`);
    } else {
      showSuccess('Preco salvo');
      setIsAdding(false);
      setNewPreco(emptyForm);
      await fetchPrecos();
      onUpdate();
    }
    setSaving(false);
  };

  const startEditing = (preco: PrecoFrete) => {
    setIsAdding(false);
    setEditingId(preco.id);
    setEditPreco({
      motorista: preco.motorista || '',
      cidade: preco.cidade || '',
      valor: Number(preco.valor || 0).toFixed(2)
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditPreco(emptyForm);
  };

  const handleSaveEdit = async (id: string) => {
    const validated = validateForm(editPreco);
    if ('error' in validated) {
      showError(validated.error);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('precos_frete')
      .update({
        motorista: validated.motorista,
        cidade: validated.cidade,
        valor: validated.valor
      })
      .eq('id', id);

    if (error) {
      showError(`Erro ao atualizar preco: ${error.message}`);
    } else {
      showSuccess('Preco atualizado');
      cancelEditing();
      await fetchPrecos();
      onUpdate();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este preco de frete?')) return;

    const { error } = await supabase.from('precos_frete').delete().eq('id', id);
    if (error) {
      showError(`Erro ao excluir preco: ${error.message}`);
    } else {
      showSuccess('Preco removido');
      await fetchPrecos();
      onUpdate();
    }
  };

  const FormFields = ({
    form,
    onChange
  }: {
    form: PrecoForm;
    onChange: (form: PrecoForm) => void;
  }) => (
    <div className="space-y-2">
      <input
        list="frete-motoristas"
        placeholder="MOTORISTA"
        value={form.motorista}
        onChange={e => onChange({ ...form, motorista: e.target.value })}
        className="w-full bg-white dark:bg-slate-900 border-none rounded-lg px-3 py-2 text-[10px] font-black uppercase focus:ring-2 focus:ring-purple-500"
      />
      <input
        list="frete-cidades"
        placeholder="CIDADE"
        value={form.cidade}
        onChange={e => onChange({ ...form, cidade: e.target.value })}
        className="w-full bg-white dark:bg-slate-900 border-none rounded-lg px-3 py-2 text-[10px] font-black uppercase focus:ring-2 focus:ring-purple-500"
      />
      <input
        inputMode="decimal"
        placeholder="VALOR R$ / SC"
        value={form.valor}
        onChange={e => onChange({ ...form, valor: e.target.value })}
        className="w-full bg-white dark:bg-slate-900 border-none rounded-lg px-3 py-2 text-[10px] font-black focus:ring-2 focus:ring-purple-500"
      />
    </div>
  );

  return (
    <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <datalist id="frete-motoristas">
        {motoristasOrdenados.map(motorista => <option key={motorista} value={motorista} />)}
      </datalist>
      <datalist id="frete-cidades">
        {cidadesOrdenadas.map(cidade => <option key={cidade} value={cidade} />)}
      </datalist>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-green-500" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Precos por Motorista</h2>
        </div>
        <button
          type="button"
          onClick={() => { setIsAdding(!isAdding); cancelEditing(); }}
          className="p-1.5 bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-all"
          title={isAdding ? 'Cancelar' : 'Adicionar preco'}
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      <div className="space-y-3">
        {isAdding && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 space-y-3 animate-in slide-in-from-top-2">
            <FormFields form={newPreco} onChange={setNewPreco} />
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Salvar preco
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-300" size={20} /></div>
        ) : precos.map(preco => {
          const isEditing = editingId === preco.id;
          const motoristaLabel = preco.motorista || 'GERAL';

          return (
            <div key={preco.id} className={`p-3 rounded-xl border transition-all group ${isEditing ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-100 dark:bg-slate-700/50 dark:border-slate-700'}`}>
              {isEditing ? (
                <div className="space-y-3">
                  <FormFields form={editPreco} onChange={setEditPreco} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(preco.id)}
                      disabled={saving}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-[10px] font-black uppercase"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-3 py-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Truck size={13} className="text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-200 truncate">{motoristaLabel}</p>
                    <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={10} /> {preco.cidade}
                    </p>
                    <p className="text-xs font-black text-green-600 dark:text-green-400 mt-1">
                      R$ {Number(preco.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEditing(preco)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(preco.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {precos.length === 0 && !loading && !isAdding && (
          <p className="text-[10px] text-slate-400 italic text-center py-4">Nenhum preco configurado.</p>
        )}
      </div>
    </section>
  );
}
