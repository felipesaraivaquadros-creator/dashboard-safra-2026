"use client";

import React, { useState } from 'react';
import { RefreshCw, UploadCloud, Loader2 } from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';
import { useParams } from 'next/navigation'; 
import { syncRomaneiosToSupabase } from '../lib/supabaseSync';

// Importação dinâmica dos dados locais para sincronismo
const dataMap: Record<string, any> = {
  'soja2526': () => import('../data/soja2526/romaneios_normalizados.json'),
  'soja2425': () => import('../data/soja2425/romaneios_normalizados.json'),
  'milho25': () => import('../data/milho25/romaneios_normalizados.json'),
};

export default function UpdateDataButton() {
  const params = useParams();
  const safraId = params.safraId as string;
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncCloud = async () => {
    if (!dataMap[safraId]) {
      showError("Dados locais não encontrados para esta safra.");
      return;
    }

    setIsSyncing(true);
    const toastId = showLoading(`Sincronizando romaneios de ${safraId} com o banco de dados...`);
    
    try {
      const module = await dataMap[safraId]();
      const dadosLocais = module.default;
      
      const total = await syncRomaneiosToSupabase(safraId, dadosLocais);
      
      dismissToast(toastId);
      showSuccess(`${total} romaneios sincronizados com sucesso no banco de dados!`);
    } catch (error: any) {
      dismissToast(toastId);
      showError("Erro na sincronização: " + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button 
        disabled={isSyncing}
        onClick={handleSyncCloud} 
        className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
      >
        {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
        Sincronizar Banco
      </button>
    </div>
  );
}