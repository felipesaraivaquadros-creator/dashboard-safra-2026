"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { X, Save, Loader2, Warehouse } from 'lucide-react';
import { showSuccess, showError } from '../../utils/toast';

interface ArmazemGrupoFormProps {
  safraId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ArmazemGrupoForm({ safraId, onClose, onSuccess }: ArmazemGrupoFormProps) {
  const [loading, setLoading] = useState(true);
  const [armazens, setArmazens] = useState<any[]>([]);

  useEffect(() => {
    const fetchRelevantArmazens = async () => {
      setLoading(true);
      try {
        // Busca armazéns que possuem romaneios NESTA safra
        const { data: romaneiosData } = await supabase
          .from('romaneios')
          .select('armazem_id')
          .eq('safra_id', safraId);
        
        // Busca armazéns que possuem contratos NESTA safra
        const { data: contratosData } = await supabase
          .from('contratos')
          .select('armazem_id')
          .eq('safra_id', safraId);

        const idsRelevantes = new Set([
          ...(romaneiosData?.map(r => r.armazem_id) || []),
          ...(contratosData?.map(c => c.armazem_id) || [])
        ].filter(Boolean));

        if (idsRelevantes.size === 0) {
          setArmazens([]);
          return;
        }

        const { data: armazensData } = await supabase
          .from('armazens')
          .select('*')
          .in('id', Array.from(idsRelevantes))
          .order('nome');

        if (armazensData) setArmazens(armazensData);
      } catch (err) {
        console.error("Erro ao buscar armazéns relevantes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelevantArmazens();
  }, [safraId]);

  const handleUpdateGrupo = async (id: string, grupo: string) => {
    const { error } = await supabase
      .from('armazens')
      .update({ grupo: grupo.toUpperCase() || null })
      .eq('id', id);
    
    if (error) showError("Erro ao atualizar: " + error.message);
    else {
      setArmazens(armazens.map(a => a.id === id ? { ...a, grupo: grupo.toUpperCase() } : a));
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Warehouse size={20} /> Agrupar Armazéns
          </h2>
          <button onClick={() => { onSuccess(); onClose(); }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : armazens.length > 0 ? (
            <>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">
                Exibindo apenas armazéns com movimentação na safra {safraId}.
              </p>
              {armazens.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 truncate">{a.nome}</p>
                  </div>
                  <div className="w-32">
                    <input 
                      type="text"
                      placeholder="GRUPO"
                      defaultValue={a.grupo || ''}
                      onBlur={(e) => handleUpdateGrupo(a.id, e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-[10px] font-black focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="py-10 text-center text-slate-400 italic uppercase text-[10px]">
              Nenhum armazém vinculado a esta safra ainda.
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
          <button 
            onClick={() => { onSuccess(); onClose(); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs py-3 rounded-xl transition-all shadow-md"
          >
            Concluir Agrupamento
          </button>
        </div>
      </div>
    </div>
  );
}