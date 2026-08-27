"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, CheckCircle2, Grid3X3, Loader2, Map, Plus, Save, Settings, Trash2 } from 'lucide-react';
import { supabase } from '../../src/integrations/supabase/client';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import NavigationMenu from '../../src/components/NavigationMenu';
import AreasPlantadasManager from '../../src/components/areas/AreasPlantadasManager';
import TalhoesManager from '../../src/components/talhoes/TalhoesManager';
import { showSuccess, showError } from '../../src/utils/toast';

type ConfigTab = 'safras' | 'areas' | 'talhoes';

const tabs: Array<{ id: ConfigTab; label: string; icon: React.ElementType; activeClass: string }> = [
  { id: 'safras', label: 'Safras', icon: Settings, activeClass: 'text-purple-600' },
  { id: 'areas', label: 'Áreas', icon: Map, activeClass: 'text-emerald-600' },
  { id: 'talhoes', label: 'Talhões', icon: Grid3X3, activeClass: 'text-amber-600' },
];

export default function ConfiguracoesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSafraId = searchParams.get('safraId') || '';
  const [activeTab, setActiveTab] = useState<ConfigTab>('safras');
  const [safras, setSafras] = useState<any[]>([]);
  const [selectedSafraId, setSelectedSafraId] = useState(requestedSafraId);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSafras = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('safras')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar safras');
    } else {
      const loadedSafras = data || [];
      setSafras(loadedSafras);
      setSelectedSafraId((current) => {
        if (current && loadedSafras.some((safra) => safra.id === current)) return current;
        if (requestedSafraId && loadedSafras.some((safra) => safra.id === requestedSafraId)) return requestedSafraId;
        return loadedSafras.find((safra) => safra.status === 'Atual')?.id || loadedSafras[0]?.id || '';
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSafras();
  }, []);

  const handleAddSafra = () => {
    const newId = `nova_safra_${Date.now()}`;
    setSafras((current) => [{
      id: newId,
      nome: 'Nova Safra',
      tipo: 'Soja',
      status: 'Futura',
      isNew: true,
    }, ...current]);
  };

  const handleUpdateLocal = (id: string, field: string, value: string) => {
    setSafras((current) => current.map((safra) => safra.id === id ? { ...safra, [field]: value } : safra));
  };

  const handleSave = async (safra: any) => {
    setSaving(true);
    try {
      let finalId = safra.id;
      if (safra.isNew) {
        const anoMatch = safra.nome.match(/\d+/g);
        const ano = anoMatch ? anoMatch.join('') : '00';
        finalId = `${safra.tipo.toLowerCase()}${ano}`;
      }

      const { error } = await supabase.from('safras').upsert({
        id: finalId,
        nome: safra.nome,
        tipo: safra.tipo,
        status: safra.status,
      });
      if (error) throw error;

      showSuccess('Safra salva com sucesso!');
      await fetchSafras();
    } catch (error: any) {
      showError(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza? Isso não apagará os romaneios, mas a safra sumirá do painel.')) return;

    const { error } = await supabase.from('safras').delete().eq('id', id);
    if (error) {
      showError('Erro ao excluir');
      return;
    }

    showSuccess('Safra removida');
    await fetchSafras();
  };

  const handleSafraChange = (safraId: string) => {
    setSelectedSafraId(safraId);
    router.replace(`/configuracoes?safraId=${safraId}`);
  };

  const selectedSafra = safras.find((safra) => safra.id === selectedSafraId);

  return (
    <main className="min-h-screen bg-slate-50 p-4 font-sans dark:bg-slate-900 md:p-8">
      <header className="mx-auto mb-8 flex max-w-[1200px] flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <NavigationMenu />
          <div>
            <h1 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white md:text-3xl">Configurações</h1>
            <p className="mt-1 text-[10px] font-bold uppercase text-slate-400">Safras, áreas plantadas e talhões</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={selectedSafraId ? `/${selectedSafraId}` : '/'}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase text-slate-600 shadow-sm transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ArrowLeft size={16} /> Voltar
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] space-y-6">
        <nav className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1.5 dark:bg-slate-800" aria-label="Seções de configurações">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-3 text-[10px] font-black uppercase transition-all md:text-xs ${isActive ? `bg-white shadow-sm dark:bg-slate-700 ${tab.activeClass}` : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab !== 'safras' && (
          <section className="flex flex-col gap-3 border-y border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Configurar a safra</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{selectedSafra?.nome || 'Selecione uma safra'}</p>
            </div>
            <select
              value={selectedSafraId}
              onChange={(event) => handleSafraChange(event.target.value)}
              className="min-w-[240px] rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Selecione uma safra</option>
              {safras.filter((safra) => !safra.isNew).map((safra) => (
                <option key={safra.id} value={safra.id}>{safra.nome}</option>
              ))}
            </select>
          </section>
        )}

        {activeTab === 'safras' && (
          <div className="space-y-5">
            <section className="flex flex-col gap-4 border-y border-slate-200 bg-white px-5 py-5 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30"><Settings size={20} /></div>
                <div>
                  <h2 className="text-sm font-black uppercase italic tracking-tighter">Gerenciar Safras</h2>
                  <p className="text-[9px] font-bold uppercase text-slate-400">Adicione ou altere cultura e situação</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddSafra}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2.5 text-xs font-black uppercase text-white shadow-sm transition-colors hover:bg-purple-700"
              >
                <Plus size={16} /> Nova Safra
              </button>
            </section>

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-600" size={32} /></div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {safras.map((safra) => (
                  <article key={safra.id} className="grid grid-cols-1 items-end gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:grid-cols-[minmax(0,1fr)_160px_180px_auto]">
                    <label className="space-y-1">
                      <span className="ml-1 block text-[8px] font-black uppercase text-slate-400">Nome da Safra</span>
                      <input type="text" value={safra.nome} onChange={(event) => handleUpdateLocal(safra.id, 'nome', event.target.value)} className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 dark:bg-slate-900" />
                    </label>
                    <label className="space-y-1">
                      <span className="ml-1 block text-[8px] font-black uppercase text-slate-400">Cultura</span>
                      <select value={safra.tipo} onChange={(event) => handleUpdateLocal(safra.id, 'tipo', event.target.value)} className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 dark:bg-slate-900">
                        <option value="Soja">Soja</option><option value="Milho">Milho</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="ml-1 block text-[8px] font-black uppercase text-slate-400">Situação</span>
                      <select value={safra.status} onChange={(event) => handleUpdateLocal(safra.id, 'status', event.target.value)} className="w-full rounded-lg border-0 bg-slate-50 px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-purple-500 dark:bg-slate-900">
                        <option value="Atual">Safra Atual</option><option value="Passada">Safra Passada</option><option value="Futura">Futura / Em Breve</option>
                      </select>
                    </label>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => handleSave(safra)} disabled={saving} title="Salvar safra" className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 transition-colors hover:bg-green-600 hover:text-white disabled:opacity-50">
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                      </button>
                      <button type="button" onClick={() => handleDelete(safra.id)} title="Excluir safra" className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors hover:bg-red-600 hover:text-white"><Trash2 size={18} /></button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="flex items-start gap-3 border border-amber-100 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-[10px] font-medium leading-relaxed text-amber-800 dark:text-amber-300"><strong>Atenção:</strong> ao criar uma safra, inclua o período no nome, por exemplo Soja 26/27. Safras futuras permanecem bloqueadas no seletor até mudarem para Atual ou Passada.</p>
            </div>
          </div>
        )}

        {activeTab === 'areas' && selectedSafraId && (
          <section className="border-y border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 md:p-7"><AreasPlantadasManager key={selectedSafraId} safraId={selectedSafraId} /></section>
        )}

        {activeTab === 'talhoes' && selectedSafraId && (
          <section className="border-y border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 md:p-7"><TalhoesManager key={selectedSafraId} safraId={selectedSafraId} /></section>
        )}

        {activeTab !== 'safras' && !selectedSafraId && !loading && (
          <div className="flex items-center justify-center gap-2 border border-slate-200 bg-white py-16 text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800"><CheckCircle2 size={18} /> Cadastre ou selecione uma safra para continuar.</div>
        )}
      </div>
    </main>
  );
}
