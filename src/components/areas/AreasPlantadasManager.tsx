"use client";

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Map as MapIcon, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { parseSpreadsheetNumber } from '../../lib/spreadsheetImport';
import { showError, showSuccess } from '../../utils/toast';

interface FazendaArea {
  fazendaId: string;
  nome: string;
  area: string;
  areaSalva: boolean;
}

interface AreasPlantadasManagerProps {
  safraId: string;
}

const formatArea = (value: number) => value.toLocaleString('pt-BR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function AreasPlantadasManager({ safraId }: AreasPlantadasManagerProps) {
  const [areas, setAreas] = useState<FazendaArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmArea, setNewFarmArea] = useState('');
  const [addingFarm, setAddingFarm] = useState(false);

  const totalArea = useMemo(
    () => areas.reduce((total, item) => total + (parseSpreadsheetNumber(item.area) || 0), 0),
    [areas]
  );

  const loadAreas = async () => {
    setLoading(true);
    try {
      const [fazendasResult, areasResult] = await Promise.all([
        supabase.from('fazendas').select('id, nome').order('nome'),
        supabase
          .from('areas_plantadas')
          .select('fazenda_id, area_ha')
          .eq('safra_id', safraId),
      ]);

      if (fazendasResult.error) throw fazendasResult.error;
      if (areasResult.error) {
        throw new Error('A tabela de áreas por safra ainda não existe. Execute o SQL de áreas plantadas no Supabase.');
      }

      const areasPorFazenda = new Map(
        (areasResult.data || []).map((item) => [item.fazenda_id, Number(item.area_ha) || 0])
      );

      setAreas((fazendasResult.data || []).map((fazenda) => {
        const area = areasPorFazenda.get(fazenda.id);
        return {
          fazendaId: fazenda.id,
          nome: fazenda.nome,
          area: area === undefined ? '' : String(area),
          areaSalva: area !== undefined,
        };
      }));
    } catch (error: any) {
      showError(error.message || 'Não foi possível carregar as áreas plantadas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, [safraId]);

  const updateAreaValue = (fazendaId: string, area: string) => {
    setAreas((current) => current.map((item) => (
      item.fazendaId === fazendaId ? { ...item, area } : item
    )));
  };

  const saveArea = async (item: FazendaArea) => {
    const areaHa = parseSpreadsheetNumber(item.area);
    if (!areaHa || areaHa <= 0) {
      showError('Informe uma área plantada maior que zero.');
      return;
    }

    setSavingId(item.fazendaId);
    try {
      const { error } = await supabase.from('areas_plantadas').upsert({
        safra_id: safraId,
        fazenda_id: item.fazendaId,
        area_ha: areaHa,
      }, { onConflict: 'safra_id,fazenda_id' });

      if (error) throw error;

      setAreas((current) => current.map((area) => (
        area.fazendaId === item.fazendaId
          ? { ...area, area: String(areaHa), areaSalva: true }
          : area
      )));
      showSuccess(`Área de ${item.nome} salva para esta safra.`);
    } catch (error: any) {
      showError(`Erro ao salvar área: ${error.message || 'erro desconhecido'}`);
    } finally {
      setSavingId(null);
    }
  };

  const removeArea = async (item: FazendaArea) => {
    if (!item.areaSalva || !window.confirm(`Remover a área plantada de ${item.nome} somente desta safra?`)) return;

    setSavingId(item.fazendaId);
    try {
      const { error } = await supabase
        .from('areas_plantadas')
        .delete()
        .eq('safra_id', safraId)
        .eq('fazenda_id', item.fazendaId);

      if (error) throw error;

      setAreas((current) => current.map((area) => (
        area.fazendaId === item.fazendaId ? { ...area, area: '', areaSalva: false } : area
      )));
      showSuccess(`Área de ${item.nome} removida desta safra.`);
    } catch (error: any) {
      showError(`Erro ao remover área: ${error.message || 'erro desconhecido'}`);
    } finally {
      setSavingId(null);
    }
  };

  const addFarmWithArea = async (event: React.FormEvent) => {
    event.preventDefault();
    const nome = newFarmName.trim();
    const areaHa = parseSpreadsheetNumber(newFarmArea);

    if (!nome) {
      showError('Informe o nome da fazenda.');
      return;
    }
    if (!areaHa || areaHa <= 0) {
      showError('Informe uma área plantada maior que zero.');
      return;
    }

    setAddingFarm(true);
    try {
      const { error: upsertFarmError } = await supabase
        .from('fazendas')
        .upsert({ nome }, { onConflict: 'nome' });
      if (upsertFarmError) throw upsertFarmError;

      const { data: farm, error: farmError } = await supabase
        .from('fazendas')
        .select('id, nome')
        .eq('nome', nome)
        .single();
      if (farmError) throw farmError;

      const { error: areaError } = await supabase.from('areas_plantadas').upsert({
        safra_id: safraId,
        fazenda_id: farm.id,
        area_ha: areaHa,
      }, { onConflict: 'safra_id,fazenda_id' });
      if (areaError) throw areaError;

      setNewFarmName('');
      setNewFarmArea('');
      await loadAreas();
      showSuccess(`${farm.nome} cadastrada com ${formatArea(areaHa)} ha nesta safra.`);
    } catch (error: any) {
      showError(`Erro ao cadastrar fazenda: ${error.message || 'erro desconhecido'}`);
    } finally {
      setAddingFarm(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="animate-spin" size={28} />
        <span className="text-xs font-black uppercase">Carregando áreas plantadas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-6 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2 text-emerald-600">
            <MapIcon size={20} />
            <span className="text-xs font-black uppercase">Planejamento da Safra</span>
          </div>
          <h2 className="mt-2 text-2xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white">Áreas Plantadas</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Defina a área efetivamente plantada em cada fazenda para esta safra.</p>
        </div>
        <div className="border-l-4 border-emerald-500 pl-4">
          <p className="text-[10px] font-black uppercase text-slate-400">Total da Safra</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white">{formatArea(totalArea)} <span className="text-sm text-slate-400">ha</span></p>
        </div>
      </section>

      <form onSubmit={addFarmWithArea} className="grid grid-cols-1 gap-3 border-b border-slate-200 pb-6 md:grid-cols-[minmax(0,1fr)_180px_auto] dark:border-slate-700">
        <input
          value={newFarmName}
          onChange={(event) => setNewFarmName(event.target.value)}
          placeholder="Nova fazenda"
          className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <input
          value={newFarmArea}
          onChange={(event) => setNewFarmArea(event.target.value)}
          inputMode="decimal"
          placeholder="Área em ha"
          className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          disabled={addingFarm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-black uppercase text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {addingFarm ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Cadastrar
        </button>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-black uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:bg-slate-900/40">
              <tr>
                <th className="px-5 py-3">Fazenda</th>
                <th className="px-5 py-3">Área Plantada (ha)</th>
                <th className="px-5 py-3">Situação</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((item) => {
                const isSaving = savingId === item.fazendaId;
                return (
                  <tr key={item.fazendaId} className="border-b border-slate-100 last:border-0 dark:border-slate-700/70">
                    <td className="px-5 py-3.5 font-black uppercase text-slate-700 dark:text-slate-100">{item.nome}</td>
                    <td className="px-5 py-3.5">
                      <input
                        value={item.area}
                        onChange={(event) => updateAreaValue(item.fazendaId, event.target.value)}
                        inputMode="decimal"
                        placeholder="0,00"
                        className="w-40 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${item.areaSalva ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300'}`}>
                        {item.areaSalva ? 'Cadastrada' : 'Não cadastrada'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => saveArea(item)}
                          disabled={isSaving}
                          title={`Salvar área de ${item.nome}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeArea(item)}
                          disabled={!item.areaSalva || isSaving}
                          title={`Remover área de ${item.nome} desta safra`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-900/60 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {areas.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-sm font-medium text-slate-400">Nenhuma fazenda cadastrada ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
