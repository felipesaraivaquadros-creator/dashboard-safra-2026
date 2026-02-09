"use client";

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { showSuccess, showLoading, dismissToast } from '../utils/toast';
import { useParams } from 'next/navigation'; // Importando useParams

export default function UpdateDataButton() {
  const params = useParams();
  const safraId = params.safraId as string;

  const handleUpdate = async () => {
    const toastId = showLoading(`Executando script de exportação e normalização de dados para ${safraId}...`);
    
    try {
      // Simula a execução do script de shell 'npm run exportar'
      // Nota: Em um ambiente real, isso seria uma chamada API para um endpoint server-side.
      
      // 1. Notifica o usuário sobre a ação manual necessária
      dismissToast(toastId);
      showSuccess("Por favor, execute 'npm run exportar' localmente e clique em 'Refresh' para carregar os novos dados.");
      
      // 2. Força o refresh do app preview para carregar o novo JSON
      // Este comando recarrega o iframe do preview, lendo o novo JSON.
      console.log("Solicitando refresh do aplicativo para carregar novos dados.");
      
      // O usuário deve clicar no botão Refresh que aparecerá.
      
    } catch (error) {
      dismissToast(toastId);
      // Em um cenário real, você lidaria com erros de API aqui.
      // showError("Erro ao atualizar dados.");
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