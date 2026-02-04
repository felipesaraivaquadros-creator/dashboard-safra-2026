"use client";

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Tractor, Scale, Droplets, AlertTriangle } from 'lucide-react';

// Importando o JSON da raiz (por isso o ../)
import dados from '../romaneios_soja_25_26_normalizado.json';

const KPICard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex items-start justify-between">
    <div>
      <p className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">{title}</p>
      <h3 className="text-3xl font-extrabold text-gray-900">{value}</h3>
      {subtext && <p className="text-xs mt-2 font-medium text-gray-400">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
  </div>
);

export default function Dashboard() {
  const kpis = useMemo(() => {
    if (!dados || dados.length === 0) return null;

    const totalSacas = dados.reduce((acc, curr) => acc + (curr.sacasLiquida || 0), 0);
    const cargas = dados.length;
    const mediaUmidade = (dados.reduce((acc, curr) => acc + (curr.umidade || 0), 0) / cargas).toFixed(1);
    const mediaImpureza = (dados.reduce((acc, curr) => acc + (curr.impureza || 0), 0) / cargas).toFixed(1);

    return {
      totalSacas: totalSacas.toLocaleString('pt-BR'),
      cargas,
      umidade: mediaUmidade,
      impureza: mediaImpureza
    };
  }, []);

  const dadosGrafico = useMemo(() => {
    const agrupado = {};
    dados.forEach(d => {
      const fazenda = d.fazenda || "Outros";
      agrupado[fazenda] = (agrupado[fazenda] || 0) + (d.sacasLiquida || 0);
    });
    return Object.keys(agrupado).map(f => ({ name: f, sacas: Math.round(agrupado[f]) }))
      .sort((a, b) => b.sacas - a.sacas);
  }, []);

  if (!kpis) return <div className="p-10 text-center">Aguardando dados do JSON...</div>;

  return (
    <main className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">SAFRA 25/26</h1>
          <p className="text-lg text-green-700 font-bold uppercase tracking-widest">Controle de Recebimento de Soja</p>
        </div>
        <div className="text-right text-sm text-gray-400 font-mono">
          Atualizado em: {new Date().toLocaleDateString()}
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard title="Total Sacas" value={kpis.totalSacas} subtext="Volume Líquido Total" icon={Scale} colorClass="bg-blue-600" />
        <KPICard title="Umidade Média" value={`${kpis.umidade}%`} subtext="Meta: 14%" icon={Droplets} colorClass={kpis.umidade > 14 ? "bg-red-500" : "bg-green-500"} />
        <KPICard title="Impureza" value={`${kpis.impureza}%`} subtext="Média de Desconto" icon={AlertTriangle} colorClass="bg-yellow-500" />
        <KPICard title="Total Cargas" value={kpis.cargas} subtext="Romaneios Emitidos" icon={Tractor} colorClass="bg-gray-800" />
      </div>

      {/* Gráfico */}
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-8 border-l-4 border-green-500 pl-4">Produção por Unidade / Fazenda (Sacas)</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico} margin={{ top: 20, right: 30, left: 40, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} stroke="#64748b" fontSize={12} fontWeight={600} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="sacas" radius={[6, 6, 0, 0]} barSize={50}>
                {dadosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#15803d' : '#22c55e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}