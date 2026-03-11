"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { X, Save, Loader2, Layers } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';

interface ContratoFormProps {
  safraId: string;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

export default function ContratoForm({ safraId, onClose, onSuccess, editData }: ContratoFormProps) {
  const [loading, setLoading] = useState(false);
  const [armazens, setArmazens] = useState<any[]>([]);

  useEffect(() => {
    const fetchRelevantArmazens = async () => {
      try {
        // Busca IDs de armazéns que possuem romaneios NESTA safra
        const { data: romaneiosData } = await supabase
          .from('romaneios')
          .select('armazem_id')
          .eq('safra_id', safraId)
          .not('armazem_id', 'is', null);
        
        // Consolida IDs únicos
        const idsRelevantes = Array.from(new Set(romaneiosData?.map(r => r.armazem_id) || []));

        // Busca detalhes dos armazéns ou todos se não houver romaneios ainda
        let query = supabase.from('armazens').select('*').order('nome');
        
        if (idsRelevantes.length > 0) {
          query = query.in('id', idsRelevantes);
        }

        const { data } = await query;
        if (data) setArmazens(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchRelevantArmazens();
  }, [safraId]);

  const [formData, setFormData] = useState({
    nome: editData?.nome || '',
    numero: editData?.numero || '',
    volume_total: editData?.volume_total || 0,
    armazem_id: editData?.armazem_id || '',
    grupo: editData?.grupo || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        safra_id: safraId,
        grupo: formData.grupo || armazens.find(a => a.id === formData.armazem_id)?.grupo || null
      };

      let error;
      if (editData?.id) {
        const { error: updateError } = await supabase
          .from('contratos')
          .update(payload)
          .eq('id', editData.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('contratos')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      showSuccess(editData ? "Contrato atualizado!" : "Contrato cadastrado!");
      onSuccess();
      onClose();
    } catch (err: any) {
      showError("Erro ao salvar contrato: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-black uppercase italic tracking-tighter">
            {editData ? 'Editar Contrato' : 'Novo Contrato'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome do Contrato</label>
            <input
              required
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Ex: Venda Sipal 20 Mil Sacas"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nº Contrato / ID</label>
              <input
                type="text"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="Ex: 72208"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Volume (Sacas)</label>
              <input
                required
                type="number"
                value={formData.volume_total}
                onChange={(e) => setFormData({ ...formData, volume_total: Number(e.target.value) })}
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <Layers size={10} /> Grupo de Abatimento (Opcional)
            </label>
            <input
              type="text"
              value={formData.grupo}
              onChange={(e) => setFormData({ ...formData, grupo: e.target.value.toUpperCase() })}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Ex: SIPAL, AMAGGI, ADM"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Armazém Específico</label>
            <select
              value={formData.armazem_id}
              onChange={(e) => setFormData({ ...formData, armazem_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="">Nenhum (Geral)</option>
              {armazens.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>

          <div className="pt-4">
            <button
              disabled={loading}
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {editData ? 'Salvar Alterações' : 'Cadastrar Contrato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}