"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import SafraSelector from '../../../src/components/SafraSelector';
import NavigationMenu from '../../../src/components/NavigationMenu';
import { getSafraConfig } from '../../../src/data/safraConfig';
import MSgestorImport from '../../../src/components/msgestor/MSgestorImport';

export default function ImportarPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans">
      <header className="max-w-[1400px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <NavigationMenu />
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate">
              Importar do MS Gestor
            </h1>
          </div>
          <SafraSelector currentSafra={safraConfig} />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto">
        <MSgestorImport />
      </div>
    </main>
  );
}
