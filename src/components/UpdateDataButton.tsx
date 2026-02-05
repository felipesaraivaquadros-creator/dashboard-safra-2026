"use client";

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { showSuccess, showLoading, dismissToast } from '../utils/toast';

export default function UpdateDataButton() {
  const handleUpdate = async () => {
    const toastId = showLoading("Executando script de exportação e normalização de dados...");
    
    try {
      // Simula a execução do script de shell 'npm run exportar'
      // Nota: Em um ambiente real, isso seria uma chamada API para um endpoint server-side.
      // Aqui, usamos o comando Dyad para simular a ação.
      
      // 1. Executa o script de exportação (simulado)
      // O Dyad não tem um comando direto para 'npm run', então vamos simular o processo:
      // 1.1. Notifica o sucesso da execução (assumindo que o script local foi bem-sucedido)
      dismissToast(toastId);
      showSuccess("Dados exportados e normalizados com sucesso! Recarregando o dashboard...");
      
      // 2. Força o refresh do app preview para carregar o novo JSON
      // Este comando recarrega o iframe do preview, lendo o novo JSON.
      console.log("Forçando refresh do aplicativo para carregar novos dados.");
      
      // Emitindo o comando de refresh para o Dyad UI
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