"use client";

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Grid3X3, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { parseSpreadsheetNumber } from '../../lib/spreadsheetImport';
import { showError, showSuccess } from '../../utils/toast';

interface FazendaOption {
  id: string;
  nome: string;
}

interface TalhaoItem {
  id: string;
  nome: string;
  fazendaId: string;
  fazendaNome: string;
  area: string;
}

interface TalhoesManagerProps {
  safraId: string;
}

const formatArea = (value: number) => value.toLocaleString('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function TalhoesManager({ safraId }: TalhoesManagerProps) {
  const [fazendas, setFazendas] = useState<FazendaOption[]>([]);
  const [talhoes, setTalhoes] = useState<TalhaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newFazendaId, setNewFazendaId] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newArea, setNewArea] = useState('');
  const [adding, setAdding] = useState(false);

  const totalArea = useMemo(
    () => talhoes.reduce((total, talhao) => total + (parseSpreadsheetNumber(talhao.area) || 0), 0),
    [talhoes]
  );

  const loadTalhoes = async () => {
    setLoading(true);
    try {
      const [fazendasResult, talhoesResult] = await Promise.all([
        supabase.from('fazendas').select('id, nome').order('nome'),
        supabase
          .from('talhoes')
          .select('id, nome, fazenda_id, area_ha, fazendas(nome)')
          .eq('safra_id', safraId)
          .order('nome'),
      ]);

      if (fazendasResult.error) throw fazendasResult.error;
      if (talhoesResult.error) {
        throw new Error('A tabela de talhões ainda não existe. Execute o SQL de talhões no Supabase.');
      }

      const farms = (fazendasResult.data || []) as FazendaOption[];
      setFazendas(farms);
      setNewFazendaId((current) => current || farms[0]?.id || '');
      setTalhoes((talhoesResult.data || []).map((talhao: any) => ({
        id: talhao.id,
        nome: talhao.nome,
        fazendaId: talhao.fazenda_id,
        fazendaNome: talhao.fazendas?.nome || 'Fazenda não encontrada',
        area: String(Number(talhao.area_ha) || ''),
      })));
    } catch (error: any) {
      showError(error.message || 'Não foi possível carregar os talhões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTalhoes();
  }, [safraId]);

  const updateTalhao = (id: string, field: keyof Pick<TalhaoItem, 'nome' | 'fazendaId' | 'area'>, value: string) => {
    setTalhoes((current) => current.map((talhao) => (
      talhao.id === id ? { ...talhao, [field]: value } : talhao
    )));
  };

  const addTalhao = async (event: FormEvent) => {
    event.preventDefault();
    const nome = newNome.trim();
    const areaHa = parseSpreadsheetNumber(newArea);

    if (!newFazendaId) {
      showError('Cadastre ou selecione uma fazenda antes de criar o talhão.');
      return;
    }
    if (!nome) {
      showError('Informe o nome do talhão.');
      return;
    }
    if (!areaHa || areaHa <= 0) {
      showError('Informe uma área de talhão maior que zero.');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase.from('talhoes').insert({
        safra_id: safraId,
        fazenda_id: newFazendaId,
        nome,
        area_ha: areaHa,
      });
      if (error) throw error;

      setNewNome('');
      setNewArea('');
      await loadTalhoes();
      showSuccess(`Talhão ${nome} cadastrado nesta safra.`);
    } catch (error: any) {
      showError(`Erro ao cadastrar talhão: ${error.message || 'erro desconhecido'}`);
    } finally {
      setAdding(false);
    }
  };

  const saveTalhao = async (item: TalhaoItem) => {
    const nome = item.nome.trim();
    const areaHa = parseSpreadsheetNumber(item.area);
    if (!nome || !item.fazendaId || !areaHa || areaHa <= 0) {
      showError('Informe fazenda, nome e área maior que zero antes de salvar.');
      return;
    }

    setSavingId(item.id);
    try {
      const { error } = await supabase
        .from('talhoes')
        .update({
          nome,
          fazenda_id: item.fazendaId,
          area_ha: areaHa,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
      if (error) throw error;

      await loadTalhoes();
      showSuccess(`Talhão ${nome} atualizado.`);
    } catch (error: any) {
      showError(`Erro ao salvar talhão: ${error.message || 'erro desconhecido'}`);
    } finally {
      setSavingId(null);
    }
  };

  const removeTalhao = async (item: TalhaoItem) => {
    if (!window.confirm(`Excluir o talhão ${item.nome} desta safra? Os romaneios não serão apagados.`)) return;

    setSavingId(item.id);
    try {
      const { error } = await supabase.from('talhoes').delete().eq('id', item.id);
      if (error) throw error;

      setTalhoes((current) => current.filter((talhao) => talhao.id !== item.id));
      showSuccess(`Talhão ${item.nome} excluído.`);
    } catch (error: any) {
      showError(`Erro ao excluir talhão: ${error.message || 'erro desconhecido'}`);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-slate-400">
        <Loader2 className="animate-spin" size={28} />
        <span className="text-xs font-black uppercase">Carregando talhões...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-700 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-600">
            <Grid3X3 size={20} />
            <span className="text-xs font-black uppercase">Planejamento da Safra</span>
          </div>
          <h2 className="mt-2 text-2xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white">Talhões</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Cadastre o tamanho de cada talhão para calcular a produtividade por hectare.</p>
        </div>
        <div className="border-l-4 border-amber-500 pl-4">
          <p className="text-[10px] font-black uppercase text-slate-400">Área dos Talhões</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{formatArea(totalArea)} <span className="text-sm text-slate-400">ha</span></p>
        </div>
      </section>

      <form onSubmit={addTalhao} className="grid grid-cols-1 gap-3 border-b border-slate-200 pb-6 dark:border-slate-700 md:grid-cols-[minmax(180px,0.8fr)_minmax(0,1fr)_160px_auto]">
        <select
          value={newFazendaId}
          onChange={(event) => setNewFazendaId(event.target.value)}
          className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          <option value="">Selecione a fazenda</option>
          {fazendas.map((fazenda) => <option key={fazenda.id} value={fazenda.id}>{fazenda.nome}</option>)}
        </select>
        <input
          value={newNome}
          onChange={(event) => setNewNome(event.target.value)}
          placeholder="Nome do talhão"
          className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <input
          value={newArea}
          onChange={(event) => setNewArea(event.target.value)}
          inputMode="decimal"
          placeholder="Área em ha"
          className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={adding || fazendas.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-black uppercase text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Cadastrar
        </button>
      </form>

      {fazendas.length === 0 && (
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Cadastre uma fazenda primeiro na tela Áreas Plantadas.</p>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:bg-slate-900/40">
              <tr>
                <th className="px-5 py-3">Fazenda</th>
                <th className="px-5 py-3">Talhão</th>
                <th className="px-5 py-3">Área (ha)</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {talhoes.map((item) => {
                const isSaving = savingId === item.id;
                return (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 dark:border-slate-700/70">
                    <td className="px-5 py-3.5">
                      <select
                        value={item.fazendaId}
                        onChange={(event) => updateTalhao(item.id, 'fazendaId', event.target.value)}
                        className="w-full min-w-[180px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        {fazendas.map((fazenda) => <option key={fazenda.id} value={fazenda.id}>{fazenda.nome}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        value={item.nome}
                        onChange={(event) => updateTalhao(item.id, 'nome', event.target.value)}
                        className="w-full min-w-[180px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        value={item.area}
                        onChange={(event) => updateTalhao(item.id, 'area', event.target.value)}
                        inputMode="decimal"
                        className="w-36 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => saveTalhao(item)}
                          disabled={isSaving}
                          title={`Salvar ${item.nome}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-amber-600 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTalhao(item)}
                          disabled={isSaving}
                          title={`Excluir ${item.nome}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/60 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {talhoes.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm font-medium text-slate-400">Nenhum talhão cadastrado nesta safra.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
