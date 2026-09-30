"use client";

import { ReactNode } from 'react';
import Link from 'next/link';
import NavigationMenu from './NavigationMenu';
import SafraSelector from './SafraSelector';
import { ThemeToggle } from './ThemeToggle';
import { getSafraConfig } from '../data/safraConfig';

export const fieldClass = 'min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:[color-scheme:dark]';
export const commandClass = 'inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-600';

export default function ManagementShell({ safraId, title, actions, children }: { safraId: string; title: string; actions?: ReactNode; children: ReactNode }) {
  return <main className="management-report min-h-screen bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
    <header className="border-b border-slate-200 dark:border-slate-700 print:hidden">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-5 md:px-8">
        <div className="flex items-center gap-3"><NavigationMenu /><h1 className="text-2xl font-bold">{title}</h1></div>
        <div className="flex flex-wrap items-center gap-3"><SafraSelector currentSafra={getSafraConfig(safraId)} /><ThemeToggle /></div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 pb-4 md:px-8">
        <nav className="flex gap-4 text-sm font-semibold text-green-700 dark:text-green-400"><Link href={`/${safraId}`}>Painel</Link><Link href={`/${safraId}/contratos`}>Contratos</Link><Link href={`/${safraId}/despesas`}>Despesas</Link><Link href={`/${safraId}/saldos`}>Saldos</Link></nav>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
    </header>
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-8">{children}</div>
  </main>;
}

export function MetricStrip({ items }: { items: Array<{ label: string; value: string | number }> }) {
  return <section className="grid grid-cols-2 gap-5 border-b border-slate-200 pb-6 dark:border-slate-700 lg:grid-cols-5">
    {items.map(item => <div key={item.label} className="min-w-0"><p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</p><p className="break-words text-xl font-bold text-green-800 dark:text-green-300">{item.value}</p></div>)}
  </section>;
}
