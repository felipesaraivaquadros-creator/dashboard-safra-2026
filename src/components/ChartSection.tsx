"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { ChartData } from '../data/types';

interface ChartSectionProps {
  chartFazendas: ChartData[];
  chartArmazens: ChartData[];
  fazendaFiltro: string | null;
  armazemFiltro: string | null;
  handleFiltroFazenda: (name: string) => void;
  handleFiltroArmazem: (name: string) => void;
  getCorFazenda: (name: string) => string;
  getCorArmazem: (name: string) => string;
}

export default function ChartSection({
  chartFazendas,
  chartArmazens,
  fazendaFiltro,
  armazemFiltro,
  handleFiltroFazenda,
  handleFiltroArmazem,
  getCorFazenda,
  getCorArmazem,
}: ChartSectionProps) {

  const defaultColor = '#e2e8f0'; // slate-200

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Gráfico de Fazendas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex justify-between">Fazendas <span>(Filtro Ativo)</span></h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartFazendas} onClick={(s) => s && s.activeLabel && handleFiltroFazenda(s.activeLabel)}>
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`} />
              <Bar dataKey="sacas" radius={[4, 4, 0, 0]} cursor="pointer">
                {chartFazendas.map((entry, index) => {
                  const isSelected = !fazendaFiltro || fazendaFiltro === entry.name;
                  return <Cell key={index} fill={isSelected ? getCorFazenda(entry.name) : defaultColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Armazéns */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex justify-between">Armazéns <span>(Filtro Ativo)</span></h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartArmazens} layout="vertical" onClick={(s) => s && s.activeLabel && handleFiltroArmazem(s.activeLabel)}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`} />
              <Bar dataKey="sacas" radius={[0, 4, 4, 0]} cursor="pointer">
                {chartArmazens.map((entry, index) => {
                  const isSelected = !armazemFiltro || armazemFiltro === entry.name;
                  return <Cell key={index} fill={isSelected ? getCorArmazem(entry.name) : defaultColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Pizza (Participação Global) */}
      <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xs font-black text-slate-400 uppercase mb-4 text-center">Participação Global por Fazenda</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={chartFazendas} 
                dataKey="sacas" 
                nameKey="name"
                innerRadius={60} 
                outerRadius={80} 
                onClick={(e) => handleFiltroFazenda(e.name)} 
                cursor="pointer"
              >
                {chartFazendas.map((entry, i) => <Cell key={i} fill={getCorFazenda(entry.name)} />)}
              </Pie>
              <Tooltip formatter={(value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}