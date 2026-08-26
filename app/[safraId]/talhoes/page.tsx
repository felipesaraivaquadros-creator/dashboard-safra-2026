"use client";

import { useParams } from 'next/navigation';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import SafraSelector from '../../../src/components/SafraSelector';
import NavigationMenu from '../../../src/components/NavigationMenu';
import TalhoesManager from '../../../src/components/talhoes/TalhoesManager';
import { getSafraConfig } from '../../../src/data/safraConfig';

export default function TalhoesPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);

  return (
    <main className="min-h-screen bg-slate-50 p-4 font-sans dark:bg-slate-900 md:p-8">
      <header className="mx-auto mb-8 flex max-w-[1400px] flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="flex w-full items-center justify-between gap-4 md:w-auto">
          <div className="flex min-w-0 items-center gap-4">
            <NavigationMenu />
            <h1 className="truncate text-xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white md:text-3xl">Talhões</h1>
          </div>
          <SafraSelector currentSafra={safraConfig} />
        </div>
        <div className="flex w-full justify-end border-t border-slate-100 pt-3 dark:border-slate-700 md:w-auto md:border-t-0 md:pt-0">
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-7">
        <TalhoesManager safraId={safraId} />
      </div>
    </main>
  );
}
