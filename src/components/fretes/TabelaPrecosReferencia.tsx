"use client";

import React from 'react';
import { DollarSign, MapPin } from 'lucide-react';
import { SafraConfig } from '../../data/safraConfig';

interface TabelaPrecosReferenciaProps {
  safraConfig: SafraConfig;
}

export default function TabelaPrecosReferencia({ safraConfig }: TabelaPrecosReferenciaProps) {
  return (
    <section className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign size={18} className="text-green-500" />
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Preços por Cidade</h2>
      </div>
      <div className="space-y-2">
        {safraConfig.TABELA_FRETES.length > 0 ? (
          safraConfig.TABELA_FRETES.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <MapPin size={12} className="text-slate-400" />
                <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{item.local}</span>
              </div>
              <span className="text-xs font-black text-green-600 dark:text-green-400">R$ {item.preco.toFixed(2)}</span>
            </div>
          ))
        ) : (
          <p className="text-[10px] text-slate-400 italic text-center py-4">Nenhum preço configurado para esta safra.</p>
        )}
      </div>
    </section>
  );
}