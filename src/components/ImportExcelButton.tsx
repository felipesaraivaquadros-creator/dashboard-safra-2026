"use client";

import React, { useRef, useState } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { showSuccess, showError, showLoading, dismissToast } from '../utils/toast';
import { syncRomaneiosToSupabase } from '../lib/supabaseSync';
import { useParams } from 'next/navigation';
import { Romaneio } from '../data/types';

const ABA_POR_SAFRA: Record<string, string> = {
  soja2526: 'ROMANEIOS_SOJA',
  milho26: 'ROMANEIOS_MILHO',
  milho25: 'ROMANEIO MILHO',
  soja2425: 'ROMANEIO SOJA',
};

const normalizeKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°ª]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();

const parseExcelDate = (value: any): string | null => {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
    }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.includes('T')) return trimmed.split('T')[0];

    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return trimmed || null;
  }

  return null;
};

const parseNumber = (value: any) => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const text = String(value).trim().replace(/\s/g, '');
  if (!text) return 0;

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  const normalized = hasComma
    ? text.replace(/\./g, '').replace(',', '.')
    : hasDot && /^\d{1,3}(\.\d{3})+$/.test(text)
      ? text.replace(/\./g, '')
      : text.replace(/,/g, '');

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const findWorksheet = (workbook: XLSX.WorkBook, desiredSheet?: string) => {
  const normalizedDesired = desiredSheet ? normalizeKey(desiredSheet) : '';
  const sheetName = workbook.SheetNames.find(name => normalizeKey(name) === normalizedDesired)
    || workbook.SheetNames[0];

  return {
    sheetName,
    worksheet: sheetName ? workbook.Sheets[sheetName] : undefined
  };
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
      const { sheetName, worksheet } = findWorksheet(workbook, abaAlvo);
      if (!worksheet) throw new Error("Nenhuma aba encontrada na planilha selecionada.");

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null, raw: true });
      if (jsonData.length === 0) throw new Error(`A aba "${sheetName}" parece estar vazia.`);

      const romaneiosFormatados: Romaneio[] = jsonData.map((linha: any) => {
        const normalizedColumns = Object.fromEntries(
          Object.keys(linha).map(key => [normalizeKey(key), key])
        );

        const getVal = (keys: string[]) => {
          const foundKey = keys
            .map(key => normalizedColumns[normalizeKey(key)])
            .find(Boolean);
          return foundKey ? linha[foundKey] : null;
        };

        const nContratoRaw = getVal(['ncontrato', 'Nº Contrato', 'Contrato Nº', 'Numero Contrato', 'Número Contrato']);
        const nContratoFinal = nContratoRaw !== null && nContratoRaw !== undefined
          ? String(nContratoRaw).trim().replace(/\.0$/, '')
          : 'S/C';

        const pesoBrutoKg = parseNumber(getVal(['Peso Bruto', 'PESO BRUTO', 'PesoBruto', 'Peso Bruto Kg', 'Peso Bruto KG']));
        const pesoLiquidoKg = parseNumber(getVal([
          'Peso Liquido',
          'Peso Líquido',
          'PESO LIQUIDO',
          'PesoLiquido',
          'Peso Liquido Kg',
          'Peso Líquido Kg',
          'Peso Liquid Kg',
          'PesoL',
          'Pesol',
        ]));
        const sacasBrutoInformada = parseNumber(getVal(['Sacas Bruto', 'SACAS BRUTO', 'SacasBruto', 'Sacas Brutas']));
        const sacasLiquidaInformada = parseNumber(getVal([
          'Sacas Liquida',
          'Sacas Líquida',
          'Sacas Liquido',
          'Sacas Líquido',
          'Sacas Liquidos',
          'Sacas Líquidos',
          'Sacas Liquidas',
          'Sacas Líquidas',
          'SacasLiquida',
          'SacasLiquido',
          'SacasLiquidas',
          'Sc Liquida',
          'Sc Líquida',
          'Sc Liquido',
          'Sc Líquido',
        ]));
        const sacasBruto = sacasBrutoInformada || (pesoBrutoKg > 0 ? Math.round((pesoBrutoKg / 60) * 100) / 100 : 0);
        const sacasLiquida = sacasLiquidaInformada || (pesoLiquidoKg > 0 ? Math.round((pesoLiquidoKg / 60) * 100) / 100 : 0);

        return {
          data: parseExcelDate(getVal(['Data', 'DATA'])),
          contrato: getVal(['Contrato', 'CONTRATO']) || 'S/C',
          ncontrato: nContratoFinal || 'S/C',
          emitente: getVal(['Emitente', 'EMITENTE']),
          tipoNF: getVal(['Tipo NF', 'TIPO NF']),
          nfe: parseNumber(getVal(['NFe', 'NFE', 'NF-e'])),
          numero: parseNumber(getVal(['Nº', 'N°', 'Numero', 'Número', 'NUMERO', 'Nº Romaneio', 'Número Romaneio', 'Romaneio'])),
          cidadeEntrega: getVal(['Cidade de Entrega', 'Cidade Entrega', 'CIDADE', 'Cidade']),
          armazem: getVal(['Armazem', 'Armazém', 'ARMAZEM', 'Arm']),
          safra: getVal(['Safra', 'SAFRA']),
          fazenda: getVal(['Fazenda', 'FAZENDA']),
          talhao: getVal(['Talhão', 'TALHAO', 'Talhao']),
          motorista: getVal(['Motorista', 'MOTORISTA']),
          placa: getVal(['Placa', 'PLACA']),
          pesoBrutoKg,
          pesoLiquidoKg,
          sacasBruto,
          sacasLiquida,
          umidade: parseNumber(getVal(['Umid', 'UMIDADE', 'Umidade'])),
          impureza: parseNumber(getVal(['Impu', 'IMPUREZA', 'Impureza'])),
          ardido: parseNumber(getVal(['Ardi', 'ARDIDO', 'Ardido'])),
          avariados: parseNumber(getVal(['Avari', 'AVARIADOS', 'Avariados'])),
          quebrados: parseNumber(getVal(['Quebr', 'QUEBRADOS', 'Quebrados'])),
          contaminantes: parseNumber(getVal(['Contaminantes', 'CONTAMINANTES'])),
          precofrete: parseNumber(getVal(['precofrete', 'PRECO FRETE', 'Preço Frete'])) || null,
        };
      }).filter(r => (r.sacasLiquida || 0) > 0 || (r.pesoLiquidoKg || 0) > 0);

      dismissToast(toastId);

      if (romaneiosFormatados.length === 0) {
        showError("Nenhum romaneio com volume liquido encontrado na aba.");
        return;
      }

      toastId = showLoading(`Sincronizando ${romaneiosFormatados.length} registros no banco...`);

      const total = await syncRomaneiosToSupabase(safraId, romaneiosFormatados);

      dismissToast(toastId);
      showSuccess(`${total} romaneios da safra ${safraId} atualizados com sucesso!`);

      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      dismissToast(toastId);
      showError(err.message || "Erro na importacao.");
      console.error("Erro Importacao:", err);
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
