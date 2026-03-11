"use client";

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Warehouse, FileText, GripVertical, Edit2, Trash2, Scissors } from 'lucide-react';

interface DraggableItemProps {
  id: string;
  type: 'armazem' | 'contrato';
  nome: string;
  valor: number;
  dbId: string;
  isCustom?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function DraggableItem({ id, type, nome, valor, dbId, isCustom, onEdit, onDelete }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { type, dbId, nome, valor }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const isContrato = type === 'contrato';

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={`
        group flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm
        ${isDragging ? 'z-[500] cursor-grabbing' : 'cursor-default'}
        ${isContrato 
          ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800' 
          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
        }
      `}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded">
          <GripVertical size={14} className="text-slate-400" />
        </div>
        <div className={`p-1.5 rounded-lg ${isContrato ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
          {isContrato ? <FileText size={14} /> : <Warehouse size={14} />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-[10px] font-black uppercase truncate text-slate-700 dark:text-slate-200 leading-tight">{nome}</p>
            {isCustom && <Scissors size={10} className="text-blue-400 shrink-0" />}
          </div>
          <p className={`text-[11px] font-black ${isContrato ? 'text-purple-700 dark:text-purple-400' : 'text-blue-700 dark:text-blue-400'}`}>
            {valor.toLocaleString('pt-BR')} sc
          </p>
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className={`p-1.5 rounded-lg transition-colors ${isContrato ? 'hover:bg-purple-200 text-purple-600' : 'hover:bg-blue-200 text-blue-600'}`}>
            {isContrato ? <Edit2 size={12} /> : <Scissors size={12} />}
          </button>
        )}
        {isContrato && onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-red-500 transition-colors">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}