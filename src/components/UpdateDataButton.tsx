"use client";

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { showSuccess, showLoading, dismissToast } from '../utils/toast';
import { useParams } from 'next/navigation'; 

export default function UpdateDataButton() {
  const params = useParams();
  const safraId = params.safraId as string;
  
  const exportCommand = `npm run exportar:${safraId}`;

  const handleUpdate = async () => {
    const toastId = showLoading(`Executando script de exportação e normalização de dados para ${safraId}...`);
    
    try {
      dismissToast(toastId);
      showSuccess(`Por favor, execute '${exportCommand}' localmente e clique em 'Refresh' para carregar os novos dados.`);
      
      console.log("Solicitando refresh do aplicativo para carregar novos dados.");
      
    } catch (error) {
      dismissToast(toastId);
    }
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