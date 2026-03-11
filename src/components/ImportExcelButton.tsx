"use client";

import React, { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';
import { syncRomaneiosToSupabase } from '../lib/supabaseSync';
import { useParams } from 'next/navigation';
import { Romaneio } from '../data/types';

const ABA_POR_SAFRA: Record<string, string> = {
  'soja2526': 'ROMANEIOS_SOJA',
  'milho26': 'ROMANEIOS_MILHO',
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
      const workbook = XLSX.read(data);
      
      const abaAlvo = ABA_POR_SAFRA[safraId];
      if (!abaAlvo) throw new Error(`Safra ${safraId} não configurada.`);

      const worksheet = workbook.Sheets[abaAlvo];
      if (!worksheet) throw new Error(`Aba "${abaAlvo}" não encontrada na planilha.`);

      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      if (jsonData.length === 0) throw new Error(`A aba "${abaAlvo}" está vazia.`);

      const romaneiosFormatados: Romaneio[] = jsonData.map((linha: any) => ({
        data: linha['Data'] || linha['DATA'] || null,
        contrato: linha['Contrato'] || linha['CONTRATO'] || 'S/C',
        ncontrato: String(linha['ncontrato'] || linha['CONTRATO'] || '').trim() || 'S/C',
        emitente: linha['Emitente'] || linha['EMITENTE'] || null,
        tipoNF: linha['Tipo NF'] || linha['TIPO NF'] || null,
        nfe: Number(linha['NFe'] || linha['NFE']) || null,
        numero: Number(linha['Nº'] || linha['NUMERO']) || null,
        cidadeEntrega: linha['Cidade de Entrega'] || linha['CIDADE'] || null,
        armazem: linha['Armazem'] || linha['ARMAZEM'] || null,
        safra: linha['Safra'] || linha['SAFRA'] || null,
        fazenda: linha['Fazenda'] || linha['FAZENDA'] || null,
        talhao: linha['Talhão'] || linha['TALHAO'] || null,
        motorista: linha['Motorista'] || linha['MOTORISTA'] || null,
        placa: linha['Placa'] || linha['PLACA'] || null,
        pesoBrutoKg: Number(linha['Peso Bruto'] || linha['PESO BRUTO']) || 0,
        pesoLiquidoKg: Number(linha['Peso Liquido'] || linha['PESO LIQUIDO']) || 0,
        sacasBruto: Number(linha['Sacas Bruto'] || linha['SACAS BRUTO']) || 0,
        sacasLiquida: Number(linha['Sacas Liquida'] || linha['SACAS LIQUIDA']) || 0,
        umidade: Number(linha['Umid'] || linha['UMIDADE']) || 0,
        impureza: Number(linha['Impu'] || linha['IMPUREZA']) || 0,
        ardido: Number(linha['Ardi'] || linha['ARDIDO']) || 0,
        avariados: Number(linha['Avari'] || linha['AVARIADOS']) || 0,
        quebrados: Number(linha['Quebr'] || linha['QUEBRADOS']) || 0,
        contaminantes: Number(linha['Contaminantes']) || 0,
        precofrete: Number(linha['precofrete'] || linha['PRECO FRETE']) || null
      }));

      // Atualiza o status do toast
      dismissToast(toastId);
      toastId = showLoading(`Sincronizando ${romaneiosFormatados.length} registros no banco...`);
      
      const total = await syncRomaneiosToSupabase(safraId, romaneiosFormatados);
      
      dismissToast(toastId);
      showSuccess(`${total} romaneios importados com sucesso!`);
      
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message || "Erro desconhecido na importação.");
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