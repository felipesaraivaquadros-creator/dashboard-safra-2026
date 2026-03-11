"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Scale, Plus, Layers, Save, Loader2 } from 'lucide-react';
import DraggableItem from './DraggableItem';
import DroppableSlot from './DroppableSlot';
import { supabase } from '../../integrations/supabase/client';
import { showSuccess, showError, showLoading, dismissToast } from '../../utils/toast';
import SplitSaldoModal from './SplitSaldoModal';

interface SaldosPorArmazemProps {
  listaSaldos: any[];
  listaContratos: any[];
  onRefresh: () => void;
  onEditContrato: (contrato: any) => void;
  onDeleteContrato: (id: string) => void;
  safraId: string;
}

export default function SaldosPorArmazem({ listaSaldos, listaContratos, onRefresh, onEditContrato, onDeleteContrato, safraId }: SaldosPorArmazemProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);
  
  const [localSaldos, setLocalSaldos] = useState<any[]>([]);
  const [localContratos, setLocalContratos] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gruposVazios, setGruposVazios] = useState<string[]>([]);
  
  const [splitTarget, setSplitTarget] = useState<any>(null);

  // Inicializa e normaliza os dados para garantir IDs únicos na interface
  useEffect(() => {
    const saldosNormalizados = listaSaldos.map(s => ({
      ...s,
      // ID único para o DND não bugar com nomes iguais
      uiId: s.isCustom ? `custom-${s.db_id}` : `real-${s.id}`,
      // ID real para o banco
      databaseId: s.isCustom ? s.db_id : s.id
    }));

    const contratosNormalizados = listaContratos.map(c => ({
      ...c,
      uiId: `contrato-${c.db_id}`,
      databaseId: c.db_id
    }));

    setLocalSaldos(saldosNormalizados);
    setLocalContratos(contratosNormalizados);
    setIsDirty(false);
  }, [listaSaldos, listaContratos]);

  const todosOsGrupos = useMemo(() => {
    const g = new Set<string>();
    localSaldos.forEach(s => { if (s.grupo) g.add(s.grupo); });
    localContratos.forEach(c => { if (c.grupo) g.add(c.grupo); });
    gruposVazios.forEach(name => g.add(name));
    return Array.from(g).sort();
  }, [localSaldos, localContratos, gruposVazios]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveData(active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveData(null);

    if (!over) return;

    const itemData = active.data.current;
    const targetId = over.id as string; 
    const targetType = over.data.current?.type;

    // Ação: Remover do grupo (voltar para o banco)
    if (targetId === 'bank') {
      if (itemData?.type === 'armazem') {
        setLocalSaldos(prev => prev.map(s => s.uiId === active.id ? { ...s, grupo: null } : s));
      } else {
        setLocalContratos(prev => prev.map(c => c.uiId === active.id ? { ...c, grupo: null } : c));
      }
      setIsDirty(true);
      return;
    }

    // Validação de tipo de slot
    if (targetType !== itemData?.type) {
      showError(`Item do tipo ${itemData?.type === 'armazem' ? 'Estoque' : 'Contrato'} deve ser solto no campo correto.`);
      return;
    }

    const novoGrupo = targetId.split(':')[1];

    // Atualização local com troca forçada de grupo
    if (itemData?.type === 'armazem') {
      setLocalSaldos(prev => prev.map(s => s.uiId === active.id ? { ...s, grupo: novoGrupo } : s));
    } else {
      setLocalContratos(prev => prev.map(c => c.uiId === active.id ? { ...c, grupo: novoGrupo } : c));
    }
    
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = showLoading("Sincronizando grupos com o servidor...");

    try {
      const updates = [];

      // 1. Atualiza Armazéns Reais
      const reais = localSaldos.filter(s => !s.isCustom);
      for (const s of reais) {
        if (s.databaseId) {
          updates.push(supabase.from('armazens').update({ grupo: s.grupo }).eq('id', s.databaseId));
        }
      }

      // 2. Atualiza Saldos Customizados
      const customs = localSaldos.filter(s => s.isCustom);
      for (const s of customs) {
        if (s.databaseId) {
          updates.push(supabase.from('saldos_custom').update({ grupo: s.grupo }).eq('id', s.databaseId));
        }
      }

      // 3. Atualiza Contratos
      for (const c of localContratos) {
        if (c.databaseId) {
          updates.push(supabase.from('contratos').update({ grupo: c.grupo }).eq('id', c.databaseId));
        }
      }

      const results = await Promise.all(updates);
      const hasError = results.some(r => r.error);

      if (hasError) {
        throw new Error("Falha ao atualizar alguns registros. Tente novamente.");
      }

      dismissToast(toastId);
      showSuccess("Organização salva com sucesso!");
      setIsDirty(false);
      onRefresh(); // Força recarregamento completo do useDataProcessing
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCriarGrupo = () => {
    const nome = prompt("Nome do novo Grupo de Cálculo:");
    if (nome) {
      const nomeUpper = nome.trim().toUpperCase();
      if (todosOsGrupos.includes(nomeUpper)) return;
      setGruposVazios([...gruposVazios, nomeUpper]);
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-10 pb-32">
        
        {isDirty && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[500] animate-in slide-in-from-bottom-10 duration-300">
            <div className="bg-slate-900 dark:bg-purple-900 text-white px-6 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-6 backdrop-blur-xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase text-purple-300">Alterações Pendentes</span>
                <p className="text-xs font-bold">Clique em gravar para confirmar as mudanças.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onRefresh()} className="px-4 py-2 text-[10px] font-black uppercase rounded-xl bg-white/10 hover:bg-white/20 transition-all">Descartar</button>
                <button disabled={isSaving} onClick={handleSave} className="flex items-center gap-2 px-6 py-2 text-[10px] font-black uppercase rounded-xl bg-green-500 hover:bg-green-400 text-slate-900 transition-all shadow-lg">
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Gravar Alterações
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"><Layers size={20}/></div>
              <div>
                <h2 className="text-sm font-black uppercase italic tracking-tighter">Banco de Itens</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Itens aguardando alocação</p>
              </div>
            </div>
            <button onClick={handleCriarGrupo} className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg">
              <Plus size={16} /> Novo Slot
            </button>
          </div>

          <DroppableSlot id="bank" type="bank">
            {localSaldos.filter(s => !s.grupo).map(s => (
              <DraggableItem 
                key={s.uiId} 
                id={s.uiId} 
                type="armazem" 
                nome={s.nome} 
                valor={s.total} 
                dbId={s.databaseId} 
                isCustom={s.isCustom}
                onEdit={() => setSplitTarget({ ...s, totalSc: s.total })}
              />
            ))}
            {localContratos.filter(c => !c.grupo).map(c => (
              <DraggableItem 
                key={c.uiId} 
                id={c.uiId} 
                type="contrato" 
                nome={c.nome} 
                valor={c.contratado} 
                dbId={c.databaseId}
                onEdit={() => onEditContrato(c)}
                onDelete={() => onDeleteContrato(c.databaseId)}
              />
            ))}
          </DroppableSlot>
        </section>

        <div className="grid grid-cols-1 gap-12">
          {todosOsGrupos.map(grupoNome => {
            const saldosNoGrupo = localSaldos.filter(s => s.grupo === grupoNome);
            const contratosNoGrupo = localContratos.filter(c => c.grupo === grupoNome);
            const totalEstoque = saldosNoGrupo.reduce((sum, s) => sum + s.total, 0);
            const totalContratos = contratosNoGrupo.reduce((sum, c) => sum + c.contratado, 0);
            const saldoDisponivel = totalEstoque - totalContratos;

            return (
              <div key={grupoNome} className="space-y-4">
                <div className="flex items-center gap-4 px-2">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <Scale size={20} /> Grupo: {grupoNome}
                  </h3>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <DroppableSlot id={`armazem:${grupoNome}`} type="armazem" title="1. Estoque Físico (+)" total={totalEstoque} colorClass="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                    {saldosNoGrupo.map(s => (
                      <DraggableItem key={s.uiId} id={s.uiId} type="armazem" nome={s.nome} valor={s.total} dbId={s.databaseId} isCustom={s.isCustom} onEdit={() => setSplitTarget({ ...s, totalSc: s.total })} />
                    ))}
                  </DroppableSlot>

                  <DroppableSlot id={`contrato:${grupoNome}`} type="contrato" title="2. Compromissos (-)" total={totalContratos} colorClass="bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
                    {contratosNoGrupo.map(c => (
                      <DraggableItem key={c.uiId} id={c.uiId} type="contrato" nome={c.nome} valor={c.contratado} dbId={c.databaseId} onEdit={() => onEditContrato(c)} onDelete={() => onDeleteContrato(c.databaseId)} />
                    ))}
                  </DroppableSlot>

                  <div className={`p-6 rounded-3xl border-2 flex flex-col items-center justify-center text-center shadow-lg ${saldoDisponivel >= 0 ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Saldo Disponível</p>
                    <div className="text-5xl font-black tracking-tighter mb-1">{saldoDisponivel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                    <p className="text-[10px] font-black uppercase italic opacity-80">Sacas Livres</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {splitTarget && <SplitSaldoModal safraId={safraId} armazem={splitTarget} onClose={() => setSplitTarget(null)} onSuccess={onRefresh} />}

      <DragOverlay>
        {activeId ? (
          <div className="scale-105 rotate-2 shadow-2xl pointer-events-none">
            <DraggableItem id={activeId} type={activeData.type} nome={activeData.nome} valor={activeData.valor} dbId={activeData.dbId} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}