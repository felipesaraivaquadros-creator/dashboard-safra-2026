"use client";

import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RecebimentosMensais } from '../../data/financeiroTypes';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const compactCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
  notation: 'compact',
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 1,
}).format(value);

function ReceiptsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-600 dark:bg-slate-800">
      <p className="mb-2 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey} className="text-[10px] font-bold" style={{ color: item.color }}>
          {item.name}: {currency(Number(item.value) || 0)}
        </p>
      ))}
    </div>
  );
}

export default function RecebimentosChart({ data }: { data: RecebimentosMensais[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center border border-dashed border-slate-200 text-center text-xs font-bold text-slate-400 dark:border-slate-700">
        O fluxo mensal aparecerá após a programação das parcelas.
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dde7df" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} fontSize={10} className="dark:text-slate-300" />
          <YAxis axisLine={false} tickLine={false} fontSize={9} tickFormatter={compactCurrency} className="dark:text-slate-300" />
          <Tooltip cursor={{ fill: 'rgba(221, 231, 223, 0.25)' }} content={<ReceiptsTooltip />} />
          <Bar dataKey="previsto" name="Previsto" fill="#14532d" radius={[3, 3, 0, 0]} />
          <Bar dataKey="recebido" name="Recebido" fill="#22c55e" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
