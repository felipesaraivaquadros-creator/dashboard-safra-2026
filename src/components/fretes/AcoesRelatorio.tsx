"use client";

import React from 'react';
import { Printer, FileDown, Table, FileText } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { Romaneio } from '../../data/types';

interface AcoesRelatorioProps {
  dados: Romaneio[];
  motorista: string;
  totalValor: number;
  fazendas: string[];
}

export default function AcoesRelatorio({ dados, motorista, totalValor, fazendas }: AcoesRelatorioProps) {
  const router = useRouter();
  const params = useParams();
  const safraId = params.safraId as string;

  const getTimestamp = () => {
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR').replace(/\//g, '-');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(/:/g, '-');
    return `${date}_${time}`;
  };

  const nomeArquivo = `relatorio_frete_${motorista || 'geral'}_${getTimestamp()}`;

  const handleExportExcel = () => {
    const dataToExport = dados.map(r => ({
      Data: r.data,
      NFe: r.nfe,
      Placa: r.placa,
      Armazem: r.armazem,
      Fazenda: r.fazenda,
      'Sacas Bruto': r.sacasBruto,
      'Preço Frete': r.precofrete,
      Subtotal: (Number(r.sacasBruto) || 0) * (Number(r.precofrete) || 0)
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fretes");
    XLSX.writeFile(wb, `${nomeArquivo}.xlsx`);
  };

  const handleGerarRecibo = () => {
    const valorFormatado = totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fazendasUnicas = Array.from(new Set(fazendas)).join(', ');
    router.push(`/${safraId}/recibos?valor=${valorFormatado}&motorista=${motorista}&fazendas=${fazendasUnicas}`);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-wrap items-center justify-center gap-4 print:hidden">
      <button 
        onClick={() => window.print()}
        className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl font-black uppercase text-[10px] transition-all"
      >
        <Printer size={16} /> Imprimir
      </button>

      <button 
        onClick={() => window.print()}
        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] transition-all shadow-md"
      >
        <FileDown size={16} /> Gerar PDF
      </button>

      <button 
        onClick={handleExportExcel}
        className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-[10px] transition-all shadow-md"
      >
        <Table size={16} /> Gerar Excel
      </button>

      <button 
        onClick={handleGerarRecibo}
        className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase text-[10px] transition-all shadow-md"
      >
        <FileText size={16} /> Gerar Recibo
      </button>
    </div>
  );
}