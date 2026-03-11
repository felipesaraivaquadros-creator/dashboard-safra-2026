"use client";

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

interface DroppableSlotProps {
  id: string;
  type: 'armazem' | 'contrato' | 'bank';
  children: React.ReactNode;
  title?: string;
  total?: number;
  colorClass?: string;
}

export default function DroppableSlot({ id, type, children, title, total, colorClass }: DroppableSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: { type }
  });

  const isBank = type === 'bank';

  return (
    <div 
      ref={setNodeRef}
      className={`
        flex flex-col rounded-2xl border-2 transition-all min-h-[120px]
        ${isOver ? 'border-dashed border-purple-500 bg-purple-50/50 dark:bg-purple-900/10 scale-[1.01]' : 'border-transparent bg-slate-50/50 dark:bg-slate-900/30'}
        ${isBank ? 'p-4' : ''}
      `}
    >
      {!isBank && (
        <div className={`p-3 border-b flex justify-between items-center rounded-t-2xl ${colorClass || 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{title}</span>
          {total !== undefined && (
            <span className="text-xs font-black">{total.toLocaleString('pt-BR')} sc</span>
          )}
        </div>
      )}
      
      <div className={`p-3 space-y-2 flex-1 ${isBank ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3' : ''}`}>
        {children}
        
        {/* Placeholder visual quando vazio */}
        {React.Children.count(children) === 0 && !isBank && (
          <div className="h-full flex flex-col items-center justify-center py-6 text-slate-300 dark:text-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <Plus size={20} className="mb-1 opacity-20" />
            <p className="text-[8px] font-black uppercase">Arraste aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}