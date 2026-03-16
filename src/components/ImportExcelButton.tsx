"use client";

import React, { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';
import { syncRomaneiosToSupabase } from '../lib/supabaseSync';
import { useParams } from 'next/navigation';
import { Romaneio } from '../data/types';

// Mapeamento de qual aba do Excel pertence a cada Safra ID do sistema
const ABA_POR_SAFRA: Record<string, string> = {
  'soja2526': 'ROMANEIOS_SOJA',
  'milho26': 'ROMANEIOS_MILHO',
  'milho25': 'ROMANEIO MILHO',
  'soja2425': 'ROMANEIO SOJA',
};

export default function ImportExcelButton() {
  const params = useParams();
  const safraId = params.safraId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    let toastId = showLoading("Lendo arquivo Excel...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      
      const abaAlvo = ABA_POR_SAFRA[safraId];
      if (!abaAlvo) throw new Error(`Configuração de aba não encontrada para a safra: ${safraId}`);

      const worksheet = workbook.Sheets[abaAlvo];
      if (!worksheet) throw new Error(`Aba "${abaAlvo}" não encontrada na planilha selecionada.`);

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) throw new Error(`A aba "${abaAlvo}" parece estar vazia.`);

      const romaneiosFormatados: Romaneio[] = jsonData.map((linha: any) => {
        // Helper para buscar valor ignorando case e espaços
        const getVal = (keys: string[]) => {
          const foundKey = Object.keys(linha).find(k => 
            keys.some(target => k.trim().toLowerCase() === target.toLowerCase())
          );
          return foundKey ? linha[foundKey] : null;
        };

        return {
          data: getVal(['Data', 'DATA']),
          contrato: getVal(['Contrato', 'CONTRATO']) || 'S/C',
          ncontrato: String(getVal(['ncontrato', 'Nº Contrato']) || 'S/C').trim(),
          emitente: getVal(['Emitente', 'EMITENTE']),
          tipoNF: getVal(['Tipo NF', 'TIPO NF']),
          nfe: Number(getVal(['NFe', 'NFE'])) || null,
          numero: Number(getVal(['Nº', 'NUMERO', 'Nº Romaneio'])) || null,
          cidadeEntrega: getVal(['Cidade de Entrega', 'CIDADE']),
          armazem: getVal(['Armazem', 'ARMAZEM']),
          safra: getVal(['Safra', 'SAFRA']),
          fazenda: getVal(['Fazenda', 'FAZENDA']),
          talhao: getVal(['Talhão', 'TALHAO']),
          motorista: getVal(['Motorista', 'MOTORISTA']),
          placa: getVal(['Placa', 'PLACA']),
          pesoBrutoKg: Number(getVal(['Peso Bruto', 'PESO BRUTO'])) || 0,
          pesoLiquidoKg: Number(getVal(['Peso Liquido', 'PESO LIQUIDO'])) || 0,
          sacasBruto: Number(getVal(['Sacas Bruto', 'SACAS BRUTO'])) || 0,
          sacasLiquida: Number(getVal(['Sacas Liquida', 'SACAS LIQUIDA'])) || 0,
          umidade: Number(getVal(['Umid', 'UMIDADE', 'Umidade'])) || 0,
          impureza: Number(getVal(['Impu', 'IMPUREZA', 'Impureza'])) || 0,
          ardido: Number(getVal(['Ardi', 'ARDIDO', 'Ardido'])) || 0,
          avariados: Number(getVal(['Avari', 'AVARIADOS', 'Avariados'])) || 0,
          quebrados: Number(getVal(['Quebr', 'QUEBRADOS', 'Quebrados'])) || 0,
          contaminantes: Number(getVal(['Contaminantes', 'CONTAMINANTES'])) || 0,
          precofrete: Number(getVal(['precofrete', 'PRECO FRETE', 'Preço Frete'])) || null
        };
      });

      dismissToast(toastId);
      toastId = showLoading(`Sincronizando ${romaneiosFormatados.length} registros no banco...`);
      
      // A função syncRomaneiosToSupabase já deleta os dados antigos da safra antes de inserir os novos
      const total = await syncRomaneiosToSupabase(safraId, romaneiosFormatados);
      
      dismissToast(toastId);
      showSuccess(`${total} romaneios da safra ${safraId} atualizados com sucesso!`);
      
      // Recarrega para atualizar os gráficos e KPIs
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message || "Erro na importação.");
      console.error("Erro Importação:", err);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".xlsx, .xls" 
        className="hidden" 
      />
      <button 
        disabled={isImporting}
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
      >
        {isImporting ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
        Importar Planilha
      </button>
    </>
  );
}