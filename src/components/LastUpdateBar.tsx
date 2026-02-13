"use client";

import React, { useEffect, useState } from 'react';
import lastUpdate from '../data/lastUpdate.json';
import { Clock } from 'lucide-react';

export default function LastUpdateBar() {
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    // Garantimos que a conversão de fuso horário aconteça apenas no navegador do usuário
    const date = new Date(lastUpdate.timestamp);
    
    setFormattedDate(date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }));
    
    setFormattedTime(date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }));
  }, []);

  // Enquanto não monta no cliente, não exibe nada ou exibe um placeholder para evitar erro de hidratação
  if (!formattedDate) return <div className="w-full h-6 bg-green-600 dark:bg-green-700" />;

  return (
    <div className="w-full bg-green-600 dark:bg-green-700 py-1 px-4 flex justify-center items-center gap-2 shadow-sm z-[100]">
      <Clock size={12} className="text-white/80" />
      <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-wider">
        Última atualização: <span className="opacity-90">{formattedDate}</span> 
        <span className="mx-1.5 opacity-50">|</span> 
        <span className="opacity-90">{formattedTime}</span>
      </p>
    </div>
  );
}