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
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex justify-between">Fazendas <span>(Filtro Ativo: {fazendaFiltro || 'Nenhum'})</span></h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartFazendas}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} />
              <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [`${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`, 'Sacas Líquidas']} />
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
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex justify-between">Armazéns <span>(Filtro Ativo: {armazemFiltro || 'Nenhum'})</span></h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartArmazens} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} />
              <Tooltip cursor={{fill: 'transparent'}} formatter={(value: number) => [`${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`, 'Sacas Líquidas']} />
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
                onClick={(e) => handleBarClick(e, true)} 
                cursor="pointer"
              >
                {chartFazendas.map((entry, i) => {
                  // A lógica de cor para o PieChart deve ser a mesma, mas o PieChart só mostra dados > 0.
                  // Se o filtro de fazenda estiver ativo, o PieChart deve mostrar apenas a fazenda selecionada.
                  // Como o PieChart usa chartFazendas, e chartFazendas agora contém todos os volumes (filtrados por armazém),
                  // se o fazendaFiltro estiver ativo, o PieChart deve ser filtrado para mostrar apenas a fazenda selecionada.
                  
                  // Para o PieChart, vamos usar a lógica original: se o filtro de fazenda está ativo, 
                  // ele só deve mostrar a fatia selecionada (se o volume for > 0).
                  // Se o fazendaFiltro está ativo, o chartFazendas contém o volume total da fazenda selecionada (filtrado por armazém).
                  // Se o fazendaFiltro NÃO está ativo, ele mostra todas as fatias.
                  
                  // Para manter a consistência visual, vamos usar a cor da fazenda, mas o PieChart não suporta "barras cinzas" para itens não selecionados.
                  // Ele só renderiza fatias com volume > 0.
                  
                  return <Cell key={`cell-pie-${i}`} fill={getCorFazenda(entry.name)} />
                })}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} sc`, 'Sacas Líquidas']} />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}