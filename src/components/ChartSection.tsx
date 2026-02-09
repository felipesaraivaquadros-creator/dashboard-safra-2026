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

  // Função auxiliar para lidar com o clique na barra e alternar o filtro
  const handleBarClick = (data: ChartData, isFazenda: boolean) => {
    const name = data.name;
    if (isFazenda) {
      if (fazendaFiltro === name) {
        handleFiltroFazenda(null);
      } else {
        handleFiltroFazenda(name);
      }
    } else {
      if (armazemFiltro === name) {
        handleFiltroArmazem(null);
      } else {
        handleFiltroArmazem(name);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Gráfico de Fazendas */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex justify-between">Fazendas <span>(Filtro Ativo: {fazendaFiltro || 'Nenhum'})</span></h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartFazendas}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} className="dark:text-slate-300" />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} className="dark:text-slate-300" />
              <Tooltip 
                cursor={{fill: 'transparent'}} 
                formatter={(value: number) => [`${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`, 'Sacas Líquidas']} 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-tooltip)', 
                  border: '1px solid var(--border-tooltip)', 
                  borderRadius: '8px',
                  color: 'var(--text-color)' // Adiciona a variável de cor do texto
                }} 
              />
              <Bar dataKey="sacas" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(data) => handleBarClick(data, true)}>
                {chartFazendas.map((entry, index) => {
                  // Se não houver filtro, ou se esta for a fazenda selecionada, usa a cor da fazenda.
                  // Caso contrário, usa a cor cinza (defaultColor).
                  const isSelected = !fazendaFiltro || fazendaFiltro === entry.name;
                  return <Cell key={`cell-fazenda-${index}`} fill={isSelected ? getCorFazenda(entry.name) : defaultColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Armazéns */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex justify-between">Armazéns <span>(Filtro Ativo: {armazemFiltro || 'Nenhum'})</span></h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartArmazens} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} className="dark:text-slate-300" />
              <Tooltip 
                cursor={{fill: 'transparent'}} 
                formatter={(value: number) => [`${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`, 'Sacas Líquidas']} 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-tooltip)', 
                  border: '1px solid var(--border-tooltip)', 
                  borderRadius: '8px',
                  color: 'var(--text-color)' // Adiciona a variável de cor do texto
                }} 
              />
              <Bar dataKey="sacas" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(data) => handleBarClick(data, false)}>
                {chartArmazens.map((entry, index) => {
                  // Se não houver filtro, ou se este for o armazém selecionado, usa a cor do armazém.
                  // Caso contrário, usa a cor cinza (defaultColor).
                  const isSelected = !armazemFiltro || armazemFiltro === entry.name;
                  return <Cell key={`cell-armazem-${index}`} fill={isSelected ? getCorArmazem(entry.name) : defaultColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico de Pizza (Participação Global) */}
      <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
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
                onClick={(e) => handleBarClick(e, true)} 
                cursor="pointer"
              >
                {chartFazendas.map((entry, i) => {
                  
                  return <Cell key={`cell-pie-${i}`} fill={getCorFazenda(entry.name)} />
                })}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`, 'Sacas Líquidas']} 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-tooltip)', 
                  border: '1px solid var(--border-tooltip)', 
                  borderRadius: '8px',
                  color: 'var(--text-color)' // Adiciona a variável de cor do texto
                }} 
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--text-color)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <style jsx global>{`
        .dark .recharts-wrapper {
          --bg-tooltip: #1e293b; /* slate-800 */
          --border-tooltip: #475569; /* slate-600 */
          --text-color: #f1f5f9; /* slate-100 */
        }
        .recharts-wrapper {
          --bg-tooltip: #fff;
          --border-tooltip: #e2e8f0;
          --text-color: #0f172a; /* slate-900 */
        }
        .dark .recharts-text {
          fill: #e2e8f0 !important; /* Garante que o texto do gráfico seja claro no modo escuro */
        }
        /* Garante que o texto dentro do tooltip também seja claro no modo escuro */
        .dark .recharts-tooltip-item {
          color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}