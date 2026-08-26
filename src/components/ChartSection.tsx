"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, PieChart, Pie, Legend } from 'recharts';
import { ChartData, TalhaoProdutividade } from '../data/types';

interface ChartSectionProps {
  chartFazendas: ChartData[];
  chartArmazens: ChartData[];
  chartTalhoes: TalhaoProdutividade[];
  fazendaFiltro: string | null;
  armazemFiltro: string | null;
  talhaoFiltro: string | null;
  handleFiltroFazenda: (name: string) => void;
  handleFiltroArmazem: (name: string) => void;
  handleFiltroTalhao: (talhao: TalhaoProdutividade) => void;
  getCorFazenda: (name: string) => string;
  getCorArmazem: (name: string) => string;
}

export default function ChartSection({
  chartFazendas,
  chartArmazens,
  chartTalhoes,
  fazendaFiltro,
  armazemFiltro,
  talhaoFiltro,
  handleFiltroFazenda,
  handleFiltroArmazem,
  handleFiltroTalhao,
  getCorFazenda,
  getCorArmazem,
}: ChartSectionProps) {

  const defaultColor = '#e2e8f0'; // slate-200
  const rankingHeight = Math.max(250, chartTalhoes.length * 48 + 68);

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
              <XAxis 
                dataKey="name" 
                fontSize={9} 
                axisLine={false} 
                tickLine={false} 
                interval={0}
                className="dark:text-slate-300 font-bold" 
              />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} className="dark:text-slate-300" />
              <Tooltip 
                cursor={{fill: 'transparent'}} 
                formatter={(value: number) => [`${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`, 'Sacas Líquidas']} 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-tooltip)', 
                  border: '1px solid var(--border-tooltip)', 
                  borderRadius: '8px',
                  color: 'var(--text-color)' 
                }} 
              />
              <Bar dataKey="sacas" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(data) => handleBarClick(data, true)}>
                {chartFazendas.map((entry, index) => {
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
                  color: 'var(--text-color)' 
                }} 
              />
              <Bar dataKey="sacas" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(data) => handleBarClick(data, false)}>
                {chartArmazens.map((entry, index) => {
                  const isSelected = !armazemFiltro || armazemFiltro === entry.name;
                  return <Cell key={`cell-armazem-${index}`} fill={isSelected ? getCorArmazem(entry.name) : defaultColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking de produtividade por talhão */}
      <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2 className="text-xs font-black text-slate-400 uppercase">Ranking de Produtividade por Talhão</h2>
          <span className="text-[10px] font-black uppercase text-slate-400">
            Sacas brutas / hectare{fazendaFiltro ? ` · ${fazendaFiltro}` : ''}
          </span>
        </div>
        {chartTalhoes.length > 0 ? (
          <div style={{ height: rankingHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartTalhoes} layout="vertical" margin={{ left: 16, right: 28 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
                <XAxis
                  type="number"
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} sc/ha`}
                  className="dark:text-slate-300"
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={170}
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  className="dark:text-slate-300"
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  formatter={(value: number, _name, item: any) => [
                    `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sc/ha`,
                    `Bruto: ${(item?.payload?.sacasBruto || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sc · ${item?.payload?.areaHa?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) || 0} ha`,
                  ]}
                  labelFormatter={(_label: string, payload: any[]) => {
                    const talhao = payload?.[0]?.payload as TalhaoProdutividade | undefined;
                    return talhao ? `${talhao.name} · ${talhao.fazenda}` : '';
                  }}
                  contentStyle={{
                    backgroundColor: 'var(--bg-tooltip)',
                    border: '1px solid var(--border-tooltip)',
                    borderRadius: '8px',
                    color: 'var(--text-color)'
                  }}
                />
                <Bar dataKey="produtividade" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(data) => handleFiltroTalhao(data)}>
                  {chartTalhoes.map((entry) => {
                    const isSelected = !talhaoFiltro || talhaoFiltro === entry.id;
                    return <Cell key={`cell-talhao-${entry.id}`} fill={isSelected ? getCorFazenda(entry.fazenda) : defaultColor} />;
                  })}
                  <LabelList
                    dataKey="produtividade"
                    position="right"
                    fill="currentColor"
                    className="fill-slate-500 dark:fill-slate-300"
                    fontSize={10}
                    formatter={(value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} sc/ha`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center border border-dashed border-slate-200 text-center text-sm font-medium text-slate-400 dark:border-slate-700">
            Cadastre a área dos talhões para exibir a produtividade por hectare.
          </div>
        )}
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
                  color: 'var(--text-color)' 
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
          fill: #e2e8f0 !important; 
        }
        .dark .recharts-tooltip-item {
          color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
}
