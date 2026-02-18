"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Printer, FileText, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import NavigationMenu from '../../../src/components/NavigationMenu';
import { getSafraConfig } from '../../../src/data/safraConfig';

export default function RecibosPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);

  // Dados vindos da URL (opcional)
  const valorUrl = searchParams.get('valor') || "";
  const motoristaUrl = searchParams.get('motorista') || "";
  const fazendasUrl = searchParams.get('fazendas') || "";

  const dataAtual = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const templateInicial = `RECIBO DE PAGAMENTO

Recebi de ILDO ROMANCINI - CPF 247.471.140-68, a importância de R$ ${valorUrl} (__________________________________________________________________), referente à SERVIÇOS DE FRETE DE PRODUÇÃO DE ${safraConfig.tipo.toUpperCase()} SAFRA ${safraConfig.nome.toUpperCase()} ${fazendasUrl ? `DAS FAZENDAS ${fazendasUrl.toUpperCase()}` : ''}.

Para maior clareza, firmo o presente recibo, que comprova o recebimento integral do valor mencionado, concedendo quitação plena, geral e irrevogável pela quantia recebida.

LUCAS DO RIO VERDE, ${dataAtual}

__________________________________________
${motoristaUrl || 'NOME DO MOTORISTA'}
CPF: 
Fone: `;

  const [textoRecibo, setTextoRecibo] = useState(templateInicial);

  const handlePrint = () => {
    window.print();
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 print:bg-white print:p-0">
      <header className="max-w-[900px] mx-auto mb-8 flex flex-col md:row justify-between items-start md:items-center gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <NavigationMenu />
          <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Gerador de Recibo</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/${safraId}/fretes`} className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all shadow-sm">
            <ArrowLeft size={16} /> Voltar
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-[900px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Editor */}
        <div className="lg:col-span-7 space-y-4 print:hidden">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h2 className="text-xs font-black uppercase text-slate-400 mb-4 flex items-center gap-2">
              <FileText size={14} /> Editar Conteúdo
            </h2>
            <textarea
              value={textoRecibo}
              onChange={(e) => setTextoRecibo(e.target.value)}
              className="w-full h-[500px] p-4 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-purple-500 transition-all resize-none custom-scrollbar"
              placeholder="Digite o conteúdo do recibo aqui..."
            />
            <p className="text-[10px] text-slate-400 mt-4 italic">* O texto acima é editável. As alterações refletem no modelo ao lado.</p>
          </div>
        </div>

        {/* Preview / Print Area */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm print:hidden">
            <button 
              onClick={handlePrint}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-xs py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Printer size={18} /> Imprimir / Gerar PDF
            </button>
          </div>

          {/* Folha do Recibo */}
          <div className="bg-white text-black p-12 shadow-2xl border border-slate-200 min-h-[600px] relative print:shadow-none print:border-none print:p-8 print:min-h-0">
            <div className="absolute top-0 left-0 w-full h-2 bg-purple-600 print:hidden" />
            
            <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-justify">
              {textoRecibo}
            </div>

            <div className="mt-20 pt-8 border-t border-slate-100 text-[10px] text-slate-400 uppercase font-bold print:hidden">
              Visualização do Documento
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 2cm; size: portrait; }
          body { background: white !important; }
          main { padding: 0 !important; }
          .print\\:hidden { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </main>
  );
}