"use client";

import React from 'react';
import lastUpdate from '../data/lastUpdate.json';
import { Clock } from 'lucide-react';

export default function LastUpdateBar() {
  const date = new Date(lastUpdate.timestamp);
  
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const formattedTime = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="w-full bg-orange-600 dark:bg-orange-700 py-1 px-4 flex justify-center items-center gap-2 shadow-sm z-[100]">
      <Clock size={12} className="text-white/80" />
      <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider">
        Última atualização: <span className="opacity-90">{formattedDate}</span> 
        <span className="mx-1.5 opacity-50">|</span> 
        <span className="opacity-90">{formattedTime}</span>
      </p>
    </div>
  );
}