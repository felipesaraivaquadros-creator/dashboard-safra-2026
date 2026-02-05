"use client";

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { showSuccess } from '../utils/toast';

export default function UpdateDataButton() {
  const handleUpdate = () => {
    // 1. Notificar o usuário sobre a ação local necessária
    showSuccess("Execute 'npm run exportar' no seu terminal local e clique em 'Refresh' no painel de controle para carregar os novos dados.");
    
    // 2. Forçar o refresh do app preview para carregar o novo JSON (se o usuário rodou o script)
    // Nota: Em um ambiente real, isso seria uma chamada API para um endpoint que dispara o script.
    // Aqui, simulamos a ação local e pedimos o refresh.
    setTimeout(() => {
      // O comando dyad-command será inserido no app/page.tsx para ser executado após o clique.
    }, 100);
  };

  return (
    <button 
      onClick={handleUpdate} 
      className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
    >
      <RefreshCw size={16} />
      Atualizar
    </button>
  );
}