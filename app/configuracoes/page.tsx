"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/integrations/supabase/client';
import { Settings, Plus, Trash2, Save, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import NavigationMenu from '../../src/components/NavigationMenu';
import { showSuccess, showError } from '../../src/utils/toast';

export default function ConfiguracoesPage() {
  const [safras, setSafras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSafras = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('safras')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) showError("Erro ao carregar safras");
    else setSafras(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSafras();
  }, []);

  const handleAddSafra = () => {
    const newId = `nova_safra_${Date.now()}`;
    setSafras([{
      id: newId,
      nome: 'Nova Safra',
      tipo: 'Soja',
      status: 'Futura',
      isNew: true
    }, ...safras]);
  };

  const handleUpdateLocal = (id: string, field: string, value: string) => {
    setSafras(safras.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = async (safra: any) => {
    setSaving(true);
    try {
      // Gerar um ID amigável se for nova (ex: soja2627)
      let finalId = safra.id;
      if (safra.isNew) {
        const anoMatch = safra.nome.match(/\d+/g);
        const ano = anoMatch ? anoMatch.join('') : '00';
        finalId = `${safra.tipo.toLowerCase()}${ano}`;
      }

      const payload = {
        id: finalId,
        nome: safra.nome,
        tipo: safra.tipo,
        status: safra.status
      };

      const { error } = await supabase
        .from('safras')
        .upsert(payload);

      if (error) throw error;
      
      showSuccess("Safra salva com sucesso!");
      fetchSafras();
    } catch (err: any) {
      showError("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza? Isso não apagará os romaneios, mas a safra sumirá do painel.")) return;
    
    const { error } = await supabase.from('safras').delete().eq('id', id);
    if (error) showError("Erro ao excluir");
    else {
      showSuccess("Safra removida");
      fetchSafras();
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans">
      <header className="max-w-[1000px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <NavigationMenu />
          <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Configurações do Sistema</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all shadow-sm">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-[1000px] mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg"><Settings size={20}/></div>
              <div>
                <h2 className="text-sm font-black uppercase italic tracking-tighter">Gerenciar Safras</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Adicione ou altere o status das safras</p>
              </div>
            </div>
            <button 
              onClick={handleAddSafra}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg"
            >
              <Plus size={16} /> Nova Safra
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={32} /></div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {safras.map((safra) => (
                  <div key={safra.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 group">
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Nome da Safra</label>
                      <input 
                        type="text" 
                        value={safra.nome}
                        onChange={(e) => handleUpdateLocal(safra.id, 'nome', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                    </div>

                    <div className="w-full md:w-40 space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Cultura</label>
                      <select 
                        value={safra.tipo}
                        onChange={(e) => handleUpdateLocal(safra.id, 'tipo', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="Soja">Soja</option>
                        <option value="Milho">Milho</option>
                      </select>
                    </div>

                    <div className="w-full md:w-40 space-y-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Status</label>
                      <select 
                        value={safra.status}
                        onChange={(e) => handleUpdateLocal(safra.id, 'status', e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-none rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-purple-500 transition-all"
                      >
                        <option value="Atual">Safra Atual</option>
                        <option value="Passada">Safra Passada</option>
                        <option value="Futura">Futura / Em Breve</option>
                      </select>
                    </div>

                    <div className="flex gap-2 pt-4 md:pt-0">
                      <button 
                        onClick={() => handleSave(safra)}
                        className="p-2.5 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Salvar"
                      >
                        <Save size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(safra.id)}
                        className="p-2.5 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
            <strong>Atenção:</strong> Ao criar uma nova safra, o sistema gera automaticamente um ID baseado no tipo e ano (ex: soja2526). Certifique-se de que o nome da safra contenha o ano para que o ID seja gerado corretamente. Safras com status "Futura" não aparecem no seletor de painéis até serem alteradas para "Atual" ou "Passada".
          </p>
        </div>
      </div>
    </main>
  );
}