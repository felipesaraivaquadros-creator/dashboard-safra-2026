"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, MapPin, Plus, Trash2, Save, Loader2, X, Edit2, Check } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { showSuccess, showError } from '../../utils/toast';

interface TabelaPrecosReferenciaProps {
  safraId: string;
  onUpdate: () => void;
}

export default function TabelaPrecosReferencia({ safraId, onUpdate }: TabelaPrecosReferenciaProps) {
  const [precos, setPrecos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newPreco, setNewPreco] = useState({ cidade: '', valor: '' });
  
  // Estados para edição de linha
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const fetchPrecos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('precos_frete')
      .select('*')
      .eq('safra_id', safraId)
      .order('cidade');
    if (data) setPrecos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPrecos();
  }, [safraId]);

  const startEditing = (p: any) => {
    setEditingId(p.id);
    setEditValue(Number(p.valor).toFixed(2));
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = async (id: string, cidade: string) => {
    const valorNum = parseFloat(editValue);
    if (isNaN(valorNum)) return;
    
    setSaving(true);
    const { error } = await supabase
      .from('precos_frete')
      .update({ valor: valorNum })
      .eq('id', id);
    
    if (error) showError("Erro ao salvar");
    else {
      showSuccess("Preço atualizado");
      setEditingId(null);
      onUpdate();
      fetchPrecos();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este preço?")) return;
    const { error } = await supabase.from('precos_frete').delete().eq('id', id);
    if (error) showError("Erro ao excluir");
    else {
      showSuccess("Preço removido");
      onUpdate();
      fetchPrecos();
    }
  };

  const handleAdd = async () => {
    if (!newPreco.cidade || !newPreco.valor) return;
    setSaving(true);
    const { error } = await supabase
      .from('precos_frete')
      .insert([{ 
        safra_id: safraId, 
        cidade: newPreco.cidade.toUpperCase(), 
        valor: parseFloat(newPreco.valor) 
      }]);
    
    if (error) showError("Cidade já cadastrada ou erro no banco");
    else {
      showSuccess("Preço adicionado");
      setIsAdding(false);
      setNewPreco({ cidade: '', valor: '' });
      onUpdate();
      fetchPrecos();
    }
    setSaving(false);
  };

  return (
    <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-green-500" />
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Tabela de Preços</h2>
        </div>
        <button 
          onClick={() => { setIsAdding(!isAdding); setEditingId(null); }}
          className="p-1.5 bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white rounded-lg transition-all"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      <div className="space-y-3">
        {isAdding && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800 space-y-2 animate-in slide-in-from-top-2">
            <input 
              placeholder="CIDADE"
              value={newPreco.cidade}
              onChange={e => setNewPreco({...newPreco, cidade: e.target.value})}
              className="w-full bg-white dark:bg-slate-900 border-none rounded-lg px-3 py-1.5 text-[10px] font-black uppercase focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex gap-2">
              <input 
                type="number"
                step="0.01"
                placeholder="VALOR R$"
                value={newPreco.valor}
                onChange={e => setNewPreco({...newPreco, valor: e.target.value})}
                className="flex-1 bg-white dark:bg-slate-900 border-none rounded-lg px-3 py-1.5 text-[10px] font-black focus:ring-2 focus:ring-purple-500"
              />
              <button onClick={handleAdd} className="bg-purple-600 text-white px-3 rounded-lg">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14}/>}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-300" size={20} /></div>
        ) : precos.map((p) => (
          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${editingId === p.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-slate-50 border-slate-100 dark:bg-slate-700/50 dark:border-slate-700'}`}>
            <MapPin size={12} className="text-slate-400 shrink-0" />
            
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 truncate">{p.cidade}</p>
              
              {editingId === p.id ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[9px] font-bold text-blue-500">R$</span>
                  <input 
                    autoFocus
                    type="number"
                    step="0.01"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-white dark:bg-slate-800 border-none p-0 px-1 text-xs font-black text-blue-600 dark:text-blue-400 w-20 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <p className="text-xs font-black text-green-600 dark:text-green-400">
                  R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>

            <div className="flex gap-1">
              {editingId === p.id ? (
                <>
                  <button 
                    onClick={() => handleSaveEdit(p.id, p.cidade)}
                    className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Check size={14} />
                  </button>
                  <button 
                    onClick={cancelEditing}
                    className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => startEditing(p)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 rounded-lg transition-all"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {precos.length === 0 && !isAdding && (
          <p className="text-[10px] text-slate-400 italic text-center py-4">Nenhum preço configurado.</p>
        )}
      </div>
    </section>
  );
}