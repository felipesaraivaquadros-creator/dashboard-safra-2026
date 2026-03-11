"use client";

import React, { useState, useMemo } from 'react';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Scale, Plus, Layers, Info } from 'lucide-react';
import DraggableItem from './DraggableItem';
import DroppableSlot from './DroppableSlot';
import { supabase } from '../../integrations/supabase/client';
import { showSuccess, showError } from '../../utils/toast';
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
  const [gruposVazios, setGruposVazios] = useState<string[]>([]);
  
  // Estado para o modal de desmembramento
  const [splitTarget, setSplitTarget] = useState<any>(null);

  const todosOsGrupos = useMemo(() => {
    const g = new Set<string>();
    listaSaldos.forEach(s => { if (s.grupo) g.add(s.grupo); });
    listaContratos.forEach(c => { if (c.grupo) g.add(c.grupo); });
    gruposVazios.forEach(name => g.add(name));
    return Array.from(g).sort();
  }, [listaSaldos, listaContratos, gruposVazios]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveData(event.active.data.current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveData(null);

    if (!over) return;

    const itemData = active.data.current;
    const targetId = over.id as string; 
    const targetType = over.data.current?.type;

    if (targetId === 'bank') {
      try {
        if (itemData?.type === 'armazem') {
          const saldoObj = listaSaldos.find(s => s.nome === itemData.nome);
          if (saldoObj?.isCustom) {
            await supabase.from('saldos_custom').update({ grupo: null }).eq('id', saldoObj.db_id);
          } else {
            const { data: armazem } = await supabase.from('armazens').select('id').eq('nome', itemData.nome).single();
            if (armazem) await supabase.from('armazens').update({ grupo: null }).eq('id', armazem.id);
          }
        } else {
          await supabase.from('contratos').update({ grupo: null }).eq('id', itemData?.dbId);
        }
        onRefresh();
        showSuccess("Item removido do grupo.");
        return;
      } catch (err) {
        showError("Erro ao remover item.");
        return;
      }
    }

    if (targetType !== itemData?.type) {
      showError(`Arraste para o slot correto de ${itemData?.type === 'armazem' ? 'Estoque' : 'Compromissos'}.`);
      return;
    }

    const novoGrupo = targetId.split(':')[1];

    try {
      if (itemData?.type === 'armazem') {
        const saldoObj = listaSaldos.find(s => s.nome === itemData.nome);
        if (saldoObj?.isCustom) {
          await supabase.from('saldos_custom').update({ grupo: novoGrupo }).eq('id', saldoObj.db_id);
        } else {
          const { data: armazem } = await supabase.from('armazens').select('id').eq('nome', itemData.nome).single();
          if (armazem) await supabase.from('armazens').update({ grupo: novoGrupo }).eq('id', armazem.id);
        }
      } else {
        await supabase.from('contratos').update({ grupo: novoGrupo }).eq('id', itemData?.dbId);
      }
      
      // Não removemos do gruposVazios imediatamente para evitar que o slot suma antes do refresh
      onRefresh();
      showSuccess(`Item movido para ${novoGrupo}`);
    } catch (err: any) {
      showError("Erro ao mover item: " + err.message);
    }
  };

  const handleCriarGrupo = () => {
    const nome = prompt("Digite o nome do novo Grupo de Cálculo:");
    if (nome) {
      const nomeUpper = nome.trim().toUpperCase();
      if (todosOsGrupos.includes(nomeUpper)) {
        showError("Este grupo já existe.");
        return;
      }
      setGruposVazios([...gruposVazios, nomeUpper]);
      showSuccess(`Slot "${nomeUpper}" criado.`);
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-10 pb-20">
        
        <section className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"><Layers size={20}/></div>
              <div>
                <h2 className="text-sm font-black uppercase italic tracking-tighter">Banco de Itens</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Arraste os itens para os slots abaixo</p>
              </div>
            </div>
            <button 
              onClick={handleCriarGrupo}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg active:scale-95"
            >
              <Plus size={16} /> Novo Slot de Cálculo
            </button>
          </div>

          <DroppableSlot id="bank" type="bank">
            {listaSaldos.filter(s => !s.grupo).map(s => (
              <DraggableItem 
                key={`s-${s.nome}`} 
                id={`s-${s.nome}`} 
                type="armazem" 
                nome={s.nome} 
                valor={s.total} 
                dbId={s.nome} 
                isCustom={s.isCustom}
                onEdit={() => setSplitTarget({ ...s, totalSc: s.total })}
              />
            ))}
            {listaContratos.filter(c => !c.grupo).map(c => (
              <DraggableItem 
                key={`c-${c.db_id}`} 
                id={`c-${c.db_id}`} 
                type="contrato" 
                nome={c.nome} 
                valor={c.total} 
                dbId={c.db_id}
                onEdit={() => onEditContrato(c)}
                onDelete={() => onDeleteContrato(c.db_id)}
              />
            ))}
          </DroppableSlot>
        </section>

        <div className="grid grid-cols-1 gap-12">
          {todosOsGrupos.map(grupoNome => {
            const saldosNoGrupo = listaSaldos.filter(s => s.grupo === grupoNome);
            const contratosNoGrupo = listaContratos.filter(c => c.grupo === grupoNome);
            
            const totalEstoque = saldosNoGrupo.reduce((sum, s) => sum + s.total, 0);
            const totalContratos = contratosNoGrupo.reduce((sum, c) => sum + c.total, 0);
            const saldoDisponivel = totalEstoque - totalContratos;

            return (
              <div key={grupoNome} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 px-2">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-purple-600 dark:text-purple-400 flex items-center gap-2">
                    <Scale size={20} /> Grupo: {grupoNome}
                  </h3>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <DroppableSlot 
                      id={`armazem:${grupoNome}`} 
                      type="armazem" 
                      title="1. Estoque Físico (+)" 
                      total={totalEstoque}
                      colorClass="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                    >
                      {saldosNoGrupo.map(s => (
                        <DraggableItem 
                          key={`s-${s.nome}`} 
                          id={`s-${s.nome}`} 
                          type="armazem" 
                          nome={s.nome} 
                          valor={s.total} 
                          dbId={s.nome} 
                          isCustom={s.isCustom}
                          onEdit={() => setSplitTarget({ ...s, totalSc: s.total })}
                        />
                      ))}
                    </DroppableSlot>
                  </div>

                  <div className="space-y-2">
                    <DroppableSlot 
                      id={`contrato:${grupoNome}`} 
                      type="contrato" 
                      title="2. Compromissos (-)" 
                      total={totalContratos}
                      colorClass="bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30"
                    >
                      {contratosNoGrupo.map(c => (
                        <DraggableItem 
                          key={`c-${c.db_id}`} 
                          id={`c-${c.db_id}`} 
                          type="contrato" 
                          nome={c.nome} 
                          valor={c.total} 
                          dbId={c.db_id}
                          onEdit={() => onEditContrato(c)}
                          onDelete={() => onDeleteContrato(c.db_id)}
                        />
                      ))}
                    </DroppableSlot>
                  </div>

                  <div className={`
                    p-6 rounded-3xl border-2 flex flex-col items-center justify-center text-center shadow-lg transition-all
                    ${saldoDisponivel >= 0 ? 'bg-green-600 border-green-500 text-white' : 'bg-red-600 border-red-500 text-white'}
                  `}>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Saldo Disponível</p>
                    <div className="text-5xl font-black tracking-tighter mb-1">
                      {saldoDisponivel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-[10px] font-black uppercase italic opacity-80">Sacas Livres</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {splitTarget && (
        <SplitSaldoModal 
          safraId={safraId}
          armazem={splitTarget}
          onClose={() => setSplitTarget(null)}
          onSuccess={onRefresh}
        />
      )}

      <DragOverlay>
        {activeId ? (
          <div className="scale-105 rotate-2 shadow-2xl pointer-events-none">
            <DraggableItem 
              id={activeId} 
              type={activeData.type} 
              nome={activeData.nome} 
              valor={activeData.valor} 
              dbId={activeData.dbId} 
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}