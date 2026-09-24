"use client";

import React from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed, CircleDollarSign, CalendarClock } from 'lucide-react';
import { StatusFinanceiro } from '../../data/financeiroTypes';

const statusConfig: Record<StatusFinanceiro, { label: string; className: string; icon: React.ElementType }> = {
  nao_configurado: { label: 'Não configurado', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', icon: CircleDashed },
  preco_pendente: { label: 'Preço pendente', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: CircleDollarSign },
  tributos_pendentes: { label: 'Tributos pendentes', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: AlertTriangle },
  competencia_pendente: { label: 'Competência pendente', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: CalendarClock },
  inconsistente: { label: 'Inconsistente', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: AlertTriangle },
  completo: { label: 'Completo', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
};

export default function FinanceiroStatusBadge({ status, compact = false }: { status: StatusFinanceiro; compact?: boolean }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-black uppercase ${compact ? 'px-2 py-1 text-[8px]' : 'px-2.5 py-1.5 text-[9px]'} ${config.className}`}>
      <Icon size={compact ? 11 : 13} /> {config.label}
    </span>
  );
}
