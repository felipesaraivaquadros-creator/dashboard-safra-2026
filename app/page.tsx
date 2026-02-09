"use client";

import React from 'react';
import Link from 'next/link';
import { SAFRAS_DISPONIVEIS } from '../src/data/safraConfig';
import { Leaf, Wheat, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '../src/components/ThemeToggle';

// Mapeamento de ícones e cores para o tipo de safra
const SafraIconMap: Record<string, { icon: React.ElementType, color: string }> = {
  'Soja': { icon: Leaf, color: 'text-green-600' },
  'Milho': { icon: Wheat, color: 'text-amber-500' },
};

// Mapeamento de status para cores e textos
const StatusMap: Record<string, { text: string, color: string, icon: React.ElementType }> = {
  'Atual': { text: 'Safra Atual', color: 'bg-green-500', icon: CheckCircle },
  'Passada': { text: 'Safra Passada', color: 'bg-blue-500', icon: CheckCircle },
  'Futura': { text: 'Futura', color: 'bg-slate-400', icon: Clock },
};

export default function SafraSelectorPage() {
  return (
    <main className="min-h-screen p-8 bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
      <header className="max-w-[1000px] mx-auto mb-12 flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
          Selecione a Safra
        </h1>
        <ThemeToggle />
      </header>

      {/* Alterado para grid-cols-1 para empilhar verticalmente */}
      <div className="max-w-[600px] mx-auto grid grid-cols-1 gap-6">
        {SAFRAS_DISPONIVEIS.map((safra) => {
          const { icon: SafraIcon, color: safraColor } = SafraIconMap[safra.tipo] || { icon: Leaf, color: 'text-slate-500' };
          const { text: statusText, color: statusColor, icon: StatusIcon } = StatusMap[safra.status] || StatusMap['Futura'];
          
          const isDisabled = safra.status === 'Futura';

          return (
            <Link 
              key={safra.id} 
              href={`/${safra.id}`} 
              className={`
                block p-6 rounded-2xl shadow-lg transition-all duration-300 
                ${isDisabled 
                  ? 'bg-slate-200/50 dark:bg-slate-800/50 cursor-not-allowed opacity-60' 
                  : 'bg-white dark:bg-slate-800 hover:shadow-xl hover:scale-[1.02] border-2 border-transparent hover:border-purple-500 dark:hover:border-purple-500'
                }
              `}
              aria-disabled={isDisabled}
              onClick={(e) => { if (isDisabled) e.preventDefault(); }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${safraColor} bg-opacity-10 dark:bg-opacity-20`}>
                  <SafraIcon size={28} />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase text-white ${statusColor}`}>
                  <div className="flex items-center gap-1">
                    <StatusIcon size={12} />
                    {statusText}
                  </div>
                </div>
              </div>
              
              <h2 className="text-xl font-black uppercase tracking-tight mb-1 text-slate-800 dark:text-white">{safra.nome}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase">{safra.tipo}</p>

              <div className={`mt-6 pt-4 border-t border-dashed ${isDisabled ? 'border-slate-300/50 dark:border-slate-700/50' : 'border-slate-200 dark:border-slate-700'} flex justify-between items-center`}>
                <span className="text-xs font-black uppercase text-purple-600 dark:text-purple-400">
                  {isDisabled ? 'Em Breve' : 'Acessar Painel'}
                </span>
                <ArrowRight size={16} className="text-purple-600 dark:text-purple-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}