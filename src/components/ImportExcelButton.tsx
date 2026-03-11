"use client";

import React, { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';
import { syncRomaneiosToSupabase } from '../lib/supabaseSync';
import { useParams } from 'next/navigation';

export default function ImportExcelButton() {
  const params = useParams();
  const safraId = params.safraId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const toastId = showLoading("Lendo arquivo Excel...");

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const romaneiosFormatados = jsonData.map((linha: any) => ({
        data: linha['Data'] || linha['DATA'],
        nfe: linha['NFe'] || linha['NFE'],
        numero: linha['Nº'] || linha['NUMERO'],
        emitente: linha['Emitente'] || linha['EMITENTE'],
        tipoNF: linha['Tipo NF'] || linha['TIPO NF'],
        fazenda: linha['Fazenda'] || linha['FAZENDA'],
        armazem: linha['Armazem'] || linha['ARMAZEM'],
        talhao: linha['Talhão'] || linha['TALHAO'],
        motorista: linha['Motorista'] || linha['MOTORISTA'],
        placa: linha['Placa'] || linha['PLACA'],
        pesoBrutoKg: linha['Peso Bruto'] || linha['PESO BRUTO'],
        pesoLiquidoKg: linha['Peso Liquido'] || linha['PESO LIQUIDO'],
        sacasBruto: linha['Sacas Bruto'] || linha['SACAS BRUTO'],
        sacasLiquida: linha['Sacas Liquida'] || linha['SACAS LIQUIDA'],
        umidade: linha['Umid'] || linha['UMIDADE'],
        impureza: linha['Impu'] || linha['IMPUREZA'],
        ncontrato: String(linha['ncontrato'] || linha['CONTRATO'] || '').trim(),
        precofrete: linha['precofrete'] || linha['PRECO FRETE']
      }));

      dismissToast(toastId);
      showLoading(`Enviando ${romaneiosFormatados.length} registros para o banco...`);
      
      const total = await syncRomaneiosToSupabase(safraId, romaneiosFormatados);
      
      showSuccess(`${total} romaneios importados com sucesso!`);
      window.location.reload();
    } catch (err: any) {
      showError("Erro na importação: " + err.message);
    } finally {
      setIsImporting(false);
      dismissToast(toastId);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" />
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