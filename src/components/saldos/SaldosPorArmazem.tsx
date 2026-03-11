"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Warehouse, FileText, Scale, Plus, Trash2, Layers, Info, AlertCircle } from 'lucide-react';
import DraggableItem from './DraggableItem';
import DroppableSlot from './DroppableSlot';
import { supabase } from '../../integrations/supabase/client';
import { showSuccess, showError } from '../../utils/toast';

interface SaldosPorArmazemProps {
  listaSaldos: any[];
  listaContratos: any[];
  onRefresh: () => void;
  onEditContrato: (contrato: any) => void;
  onDeleteContrato: (id: string) => void;
}

export default function SaldosPorArmazem({ listaSaldos, listaContratos, onRefresh, onEditContrato, onDeleteContrato }: SaldosPorArmazemProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeData, setActiveData] = useState<any>(null);

  // Grupos únicos presentes nos dados
  const gruposExistentes = useMemo(() => {
    const g = new Set<string>();
    listaSaldos.forEach(s => { if (s.grupo) g.add(s.grupo); });
    listaContratos.forEach(c => { if (c.grupo) g.add(c.grupo); });
    return Array.from(g).sort();
  }, [listaSaldos, listaContratos]);

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
    const targetId = over.id as string; // Pode ser 'bank' ou o nome de um grupo
    const targetType = over.data.current?.type;

    // Validação: Armazém só vai pra slot de armazém, Contrato pra contrato
    if (targetId !== 'bank' && targetType !== itemData?.type) {
      showError(`Este item deve ser colocado no slot de ${itemData?.type === 'armazem' ? 'Estoque' : 'Contratos'}.`);
      return;
    }

    const novoGrupo = targetId === 'bank' ? null : targetId;

    try {
      if (itemData?.type === 'armazem') {
        // Busca o ID real do armazém pelo nome (já que listaSaldos vem processada)
        const { data: armazem } = await supabase.from('armazens').select('id').eq('nome', itemData.nome).single();
        if (armazem) {
          await supabase.from('armazens').update({ grupo: novoGrupo }).eq('id', armazem.id);
        }
      } else {
        await supabase.from('contratos').update({ grupo: novoGrupo }).eq('id', itemData?.dbId);
      }
      
      onRefresh();
      showSuccess("Vínculo atualizado!");
    } catch (err: any) {
      showError("Erro ao mover item: " + err.message);
    }
  };

  const handleCriarGrupo = () => {
    const nome = prompt("Digite o nome do novo Grupo de Cálculo:");
    if (nome) {
      // Apenas forçamos um refresh, o grupo aparecerá assim que o primeiro item for movido para ele
      // Mas para facilitar a UI, poderíamos ter um estado de 'grupos vazios'
      showSuccess(`Grupo "${nome.toUpperCase()}" pronto. Arraste itens para ele.`);
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-10 pb-20">
        
        {/* 1. BANCO DE ITENS (DISPONÍVEIS) */}
        <section className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"><Layers size={20}/></div>
              <div>
                <h2 className="text-sm font-black uppercase italic tracking-tighter">Banco de Itens</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Arraste os itens abaixo para os slots de cálculo</p>
              </div>
            </div>
            <button 
              onClick={handleCriarGrupo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-md"
            >
              <Plus size={14} /> Novo Grupo
            </button>
          </div>

          <DroppableSlot id="bank" type="bank">
            {listaSaldos.filter(s => !s.grupo).map(s => (
              <DraggableItem key={`s-${s.nome}`} id={`s-${s.nome}`} type="armazem" nome={s.nome} valor={s.total} dbId={s.nome} />
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
            {listaSaldos.filter(s => !s.grupo).length === 0 && listaContratos.filter(c => !c.grupo).length === 0 && (
              <div className="col-span-full py-6 text-center text-slate-300 uppercase text-[10px] font-black italic">
                Todos os itens já estão vinculados a grupos.
              </div>
            )}
          </DroppableSlot>
        </section>

        {/* 2. SLOTS DE CÁLCULO (GRUPOS) */}
        <div className="grid grid-cols-1 gap-12">
          {gruposExistentes.map(grupoNome => {
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
                  {/* SLOT 1: ESTOQUE */}
                  <div className="space-y-2">
                    <DroppableSlot 
                      id={grupoNome} 
                      type="armazem" 
                      title="1. Estoque Físico (+)" 
                      total={totalEstoque}
                      colorClass="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
                    >
                      {saldosNoGrupo.map(s => (
                        <DraggableItem key={`s-${s.nome}`} id={`s-${s.nome}`} type="armazem" nome={s.nome} valor={s.total} dbId={s.nome} />
                      ))}
                    </DroppableSlot>
                  </div>

                  {/* SLOT 2: CONTRATOS */}
                  <div className="space-y-2">
                    <DroppableSlot 
                      id={grupoNome} 
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

                  {/* SLOT 3: RESULTADO (NÃO DROPPABLE) */}
                  <div className={`
                    p-6 rounded-3xl border-2 flex flex-col items-center justify-center text-center shadow-lg transition-all
                    ${saldoDisponivel >= 0 
                      ? 'bg-green-600 border-green-500 text-white' 
                      : 'bg-red-600 border-red-500 text-white'
                    }
                  `}>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">Saldo Disponível</p>
                    <div className="text-5xl font-black tracking-tighter mb-1">
                      {saldoDisponivel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-[10px] font-black uppercase italic opacity-80">Sacas Livres</p>
                    
                    <div className="mt-6 pt-4 border-t border-white/20 w-full flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase opacity-60">Status</span>
                      <span className="text-[10px] font-black uppercase">
                        {saldoDisponivel >= 0 ? 'Excedente' : 'Déficit'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {gruposExistentes.length === 0 && (
            <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Info size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
              <p className="text-sm font-black text-slate-400 uppercase italic">Nenhum grupo de cálculo ativo.</p>
              <p className="text-[10px] text-slate-300 uppercase mt-2">Arraste um item do banco para começar a organizar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Overlay de Arrastar */}
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