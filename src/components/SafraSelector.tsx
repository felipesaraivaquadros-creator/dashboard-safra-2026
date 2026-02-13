"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { SAFRAS_DISPONIVEIS, SafraConfig } from '../data/safraConfig';
import { ChevronDown, Leaf, Wheat, Check } from 'lucide-react';

interface SafraSelectorProps {
  currentSafra: SafraConfig;
}

export default function SafraSelector({ currentSafra }: SafraSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (safraId: string, status: string) => {
    if (status === 'Futura') return;

    // Mantém a sub-rota (ex: /saldos) se existir
    const isSaldosPage = pathname.includes('/saldos');
    const newPath = isSaldosPage ? `/${safraId}/saldos` : `/${safraId}`;
    
    router.push(newPath);
    setIsOpen(false);
  };

  const CurrentIcon = currentSafra.tipo === 'Soja' ? Leaf : Wheat;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all border border-slate-200 dark:border-slate-600 group"
      >
        <div className={`p-1 md:p-1.5 rounded-lg ${currentSafra.tipo === 'Soja' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
          <CurrentIcon size={14} className="md:w-4 md:h-4" />
        </div>
        <div className="text-left">
          <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase leading-none mb-0.5">Safra</p>
          <h3 className="text-[11px] md:text-sm font-black text-slate-800 dark:text-white uppercase italic tracking-tighter leading-none">
            {currentSafra.nome}
          </h3>
        </div>
        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 md:left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 space-y-1">
            {SAFRAS_DISPONIVEIS.map((safra) => {
              const Icon = safra.tipo === 'Soja' ? Leaf : Wheat;
              const isSelected = safra.id === currentSafra.id;
              const isFutura = safra.status === 'Futura';

              return (
                <button
                  key={safra.id}
                  disabled={isFutura}
                  onClick={() => handleSelect(safra.id, safra.status)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-xl transition-all
                    ${isSelected 
                      ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' 
                      : isFutura 
                        ? 'opacity-40 cursor-not-allowed' 
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${safra.tipo === 'Soja' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                      <Icon size={14} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-tight">{safra.nome}</p>
                      <p className="text-[9px] font-bold opacity-60 uppercase">{safra.status === 'Futura' ? 'Em Breve' : safra.tipo}</p>
                    </div>
                  </div>
                  {isSelected && <Check size={16} className="text-purple-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}