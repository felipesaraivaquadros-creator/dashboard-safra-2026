"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { FileText, CheckCircle2, AlertCircle, TrendingUp, Droplets, Target, X, Info, ChevronDown, ChevronUp } from 'lucide-react';

import dadosOriginal from '../romaneios_soja_25_26_normalizado.json';

// --- CONFIGURAÇÕES DE IDENTIDADE VISUAL ---
const AREAS_FAZENDAS = { "São Luiz": 676, "Castanhal": 600, "Romancini": 435, "Estrelinha": 225 };

const CORES_FAZENDAS = {
  "São Luiz": "#16a34a",   
  "Castanhal": "#2563eb",  
  "Romancini": "#f59e0b",  
  "Estrelinha": "#7c3aed", 
  "Outros": "#94a3b8"
};

const CORES_ARMAZENS = {
  "Cargill": "#ea580c",    
  "Sipal": "#854d0e",      
  "Amaggi": "#059669",     
  "Fiagril": "#4338ca",    
  "Bunge": "#7e22ce",      
  "Outros": "#64748b"
};

const VOLUMES_CONTRATADOS = {
  "72208": { nome: "Venda 20 Mil Sacas", total: 20000 },
  "290925M339": { nome: "Troca Adubo Sipal", total: 29500 },
  "02soja25-26": { nome: "Arrendamento CT", total: 7200 },
  "PLCSRsoja25-26": { nome: "Plantadeira Cesar", total: 2000 },
  "01soja25-26": { nome: "Arrendamento SL", total: 4050 },
  "Comissoes": { nome: "Venda 800 Sacas Comissão", total: 800 }
};

export default function Dashboard() {
  const [fazendaFiltro, setFazendaFiltro] = useState(null);
  const [armazemFiltro, setArmazemFiltro] = useState(null);
  const [contratoExpandido, setContratoExpandido] = useState(null);
  const [abaContratos, setAbaContratos] = useState('pendentes');
  const [showModalProd, setShowModalProd] = useState(false);

  // Auxiliares de Cor
  const getCorFazenda = (nome) => CORES_FAZENDAS[nome] || CORES_FAZENDAS["Outros"];
  const getCorArmazem = (nome) => CORES_ARMAZENS[nome] || CORES_ARMAZENS["Outros"];

  // 1. FILTRAGEM (Toggle)
  const handleFiltroFazenda = (nome) => setFazendaFiltro(fazendaFiltro === nome ? null : nome);
  const handleFiltroArmazem = (nome) => setArmazemFiltro(armazemFiltro === nome ? null : nome);

  const dadosFiltrados = useMemo(() => {
    return dadosOriginal.filter(d => {
      const matchFazenda = !fazendaFiltro || d.fazenda === fazendaFiltro;
      const matchArmazem = !armazemFiltro || d.armazem === armazemFiltro;
      return matchFazenda && matchArmazem;
    });
  }, [fazendaFiltro, armazemFiltro]);

  // 2. KPIS (Com sua correção manual para sacasBruto)
  const stats = useMemo(() => {
    const liq = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasLiquida) || 0), 0);
    const bruta = dadosFiltrados.reduce((acc, d) => acc + (Number(d.sacasBruto) || 0), 0);
    const area = fazendaFiltro ? AREAS_FAZENDAS[fazendaFiltro] : 0;
    
    const somaUmid = dadosFiltrados.reduce((acc, d) => acc + (Number(d.umidade) || 0), 0);
    const umidMed = dadosFiltrados.length > 0 ? (somaUmid / dadosFiltrados.length).toFixed(1) : 0;

    return {
      totalLiq: liq,
      totalBruta: bruta,
      areaHa: area,
      prodLiq: area > 0 ? (liq / area).toFixed(1) : 0,
      prodBruta: area > 0 ? (bruta / area).toFixed(1) : 0,
      umidade: umidMed
    };
  }, [dadosFiltrados, fazendaFiltro]);

  // 3. CONTRATOS
  const contratosProcessados = useMemo(() => {
    const entregasMap = {};
    dadosOriginal.forEach(d => {
      const id = String(d.ncontrato || "").trim();
      if (id && id !== "S/C") entregasMap[id] = (entregasMap[id] || 0) + (Number(d.sacasLiquida) || 0);
    });
    const todos = Object.keys(VOLUMES_CONTRATADOS).map(id => {
      const c = VOLUMES_CONTRATADOS[id];
      const cumprido = entregasMap[id] || 0;
      const aCumprir = Math.max(c.total - cumprido, 0);
      const perc = c.total > 0 ? (cumprido / c.total) * 100 : (cumprido > 0 ? 100 : 0);
      return { id, nome: c.nome, contratado: c.total, cumprido, aCumprir, porcentagem: Math.min(perc, 100).toFixed(1), isConcluido: perc >= 100 };
    });
    return {
      pendentes: todos.filter(x => !x.isConcluido).sort((a,b) => b.cumprido - a.cumprido),
      cumpridos: todos.filter(x => x.isConcluido).sort((a,b) => b.cumprido - a.cumprido)
    };
  }, []);

  // Gráficos
  const chartFazendas = useMemo(() => {
    const g = {};
    dadosFiltrados.forEach(d => { if(d.fazenda) g[d.fazenda] = (g[d.fazenda] || 0) + (Number(d.sacasLiquida) || 0); });
    return Object.keys(g).map(name => ({ name, sacas: g[name] })).sort((a,b) => b.sacas - a.sacas);
  }, [dadosFiltrados]);

  const chartArmazens = useMemo(() => {
    const g = {};
    dadosFiltrados.forEach(d => { if(d.armazem) g[d.armazem] = (g[d.armazem] || 0) + (Number(d.sacasLiquida) || 0); });
    return Object.keys(g).map(name => ({ name, sacas: g[name] })).sort((a,b) => b.sacas - a.sacas);
  }, [dadosFiltrados]);

  return (
    <main className="min-h-screen p-4 bg-slate-100 font-sans text-slate-900 relative">
      <header className="max-w-[1400px] mx-auto mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Logística Safra 25/26</h1>
          <div className="flex gap-2 mt-1">
            {fazendaFiltro && <span style={{backgroundColor: getCorFazenda(fazendaFiltro)}} className="text-[10px] text-white px-2 py-0.5 rounded font-bold uppercase">{fazendaFiltro}</span>}
            {armazemFiltro && <span style={{backgroundColor: getCorArmazem(armazemFiltro)}} className="text-[10px] text-white px-2 py-0.5 rounded font-bold uppercase">{armazemFiltro}</span>}
          </div>
        </div>
        <button onClick={() => {setFazendaFiltro(null); setArmazemFiltro(null);}} className="text-xs font-black text-slate-300 hover:text-red-500 uppercase transition-colors">Limpar Global</button>
      </header>

      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg text-green-600"><TrendingUp size={24}/></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Entregue</p><h3 className="text-xl font-black">{stats.totalLiq.toLocaleString('pt-BR')} sc</h3></div>
            </div>

            <div onClick={() => setShowModalProd(true)} className="bg-white p-5 rounded-xl border-2 border-transparent hover:border-purple-400 transition-all cursor-pointer shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors"><Target size={24}/></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produtividade</p><h3 className="text-xl font-black text-purple-600">{fazendaFiltro ? `${stats.prodLiq} sc/ha` : "Selecione Fazenda"}</h3></div>
              </div>
              <Info size={16} className="text-slate-300" />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600"><Droplets size={24}/></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Umidade Média</p><h3 className="text-xl font-black">{stats.umidade}%</h3></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h2 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex justify-between">Fazendas <span>(Filtro Ativo)</span></h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartFazendas} onClick={(s) => s && handleFiltroFazenda(s.activeLabel)}>
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="sacas" radius={[4, 4, 0, 0]} cursor="pointer">
                      {chartFazendas.map((entry, index) => {
                        const isSelected = !fazendaFiltro || fazendaFiltro === entry.name;
                        return <Cell key={index} fill={isSelected ? getCorFazenda(entry.name) : '#e2e8f0'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <h2 className="text-[10px] font-black text-slate-400 uppercase mb-6 flex justify-between">Armazéns <span>(Filtro Ativo)</span></h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartArmazens} layout="vertical" onClick={(s) => s && handleFiltroArmazem(s.activeLabel)}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={10} width={80} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="sacas" radius={[0, 4, 4, 0]} cursor="pointer">
                      {chartArmazens.map((entry, index) => {
                        const isSelected = !armazemFiltro || armazemFiltro === entry.name;
                        return <Cell key={index} fill={isSelected ? getCorArmazem(entry.name) : '#e2e8f0'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200">
            <h2 className="text-xs font-black text-slate-400 uppercase mb-4 text-center">Participação Global</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartFazendas} dataKey="sacas" innerRadius={60} outerRadius={80} onClick={(e) => handleFiltroFazenda(e.name)} cursor="pointer">
                    {chartFazendas.map((entry, i) => <Cell key={i} fill={getCorFazenda(entry.name)} />)}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* CONTRATOS COM ACORDEON REATIVADO */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[850px] overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="text-sm font-black text-slate-700 uppercase flex items-center gap-2 mb-4"><FileText size={18} /> Contratos</h2>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setAbaContratos('pendentes')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${abaContratos === 'pendentes' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Não Cumpridos</button>
              <button onClick={() => setAbaContratos('cumpridos')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-md transition-all ${abaContratos === 'cumpridos' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Cumpridos</button>
            </div>
          </div>
          <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-slate-50/20">
            {contratosProcessados[abaContratos].map((c) => {
              const isEx = contratoExpandido === c.id;
              return (
                <div key={c.id} onClick={() => setContratoExpandido(isEx ? null : c.id)} className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${isEx ? 'border-purple-500 bg-purple-50 shadow-sm' : 'border-white bg-white hover:border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1"><p className={`text-xs font-black uppercase tracking-tight ${isEx ? 'text-purple-700' : 'text-slate-700'}`}>{c.nome}</p><span className="text-[9px] font-bold text-slate-300">ID: {c.id}</span></div>
                    {isEx ? <ChevronUp size={16} className="text-purple-400" /> : <ChevronDown size={16} className="text-slate-300" />}
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div className={`h-full transition-all duration-1000 ${c.isConcluido ? 'bg-green-500' : 'bg-purple-600'}`} style={{ width: `${c.porcentagem}%` }} />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] font-black text-slate-400 uppercase"><span>{c.porcentagem}%</span><span>{c.cumprido.toLocaleString('pt-BR')} sc</span></div>
                  {isEx && (
                    <div className="mt-4 pt-4 border-t border-purple-200 grid grid-cols-1 gap-1.5 animate-in slide-in-from-top-1">
                      <div className="flex justify-between items-center bg-white/50 p-2 rounded"><span className="text-[9px] font-bold text-slate-400 uppercase">Total Contrato</span><span className="text-xs font-black text-slate-700">{c.contratado.toLocaleString('pt-BR')} sc</span></div>
                      <div className="flex justify-between items-center bg-orange-50 p-2 rounded"><span className="text-[9px] font-bold text-orange-600 uppercase">Saldo Restante</span><span className="text-xs font-black text-orange-700">{c.aCumprir.toLocaleString('pt-BR')} sc</span></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL PRODUTIVIDADE COM NOME DA FAZENDA NO TOPO */}
      {showModalProd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all" onClick={() => setShowModalProd(false)}>
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-purple-600 p-6 text-white flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase bg-purple-500 w-fit px-2 py-0.5 rounded-full mb-1">Fazenda</span>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">{fazendaFiltro || "Geral"}</h2>
              </div>
              <button onClick={() => setShowModalProd(false)} className="bg-purple-500 hover:bg-purple-400 p-2 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              {fazendaFiltro ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Área Total</p>
                      <h4 className="text-xl font-black">{stats.areaHa} ha</h4>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl text-center border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Romaneios</p>
                      <h4 className="text-xl font-black">{dadosFiltrados.length} un</h4>
                    </div>
                  </div>
                  <div className="p-5 bg-orange-50 rounded-2xl border border-orange-100 flex justify-between items-center">
                    <div><p className="text-[10px] font-black text-orange-400 uppercase">Sacas Bruto</p><h4 className="text-lg font-black text-orange-700">{stats.totalBruta.toLocaleString('pt-BR')} sc</h4></div>
                    <div className="text-right"><p className="text-[10px] font-black text-orange-400 uppercase">Rendimento Bruto</p><h4 className="text-xl font-black text-orange-700">{stats.prodBruta} <span className="text-xs">sc/ha</span></h4></div>
                  </div>
                  <div className="p-5 bg-green-50 rounded-2xl border border-green-100 flex justify-between items-center">
                    <div><p className="text-[10px] font-black text-green-400 uppercase">Sacas Líquida</p><h4 className="text-lg font-black text-green-700">{stats.totalLiq.toLocaleString('pt-BR')} sc</h4></div>
                    <div className="text-right"><p className="text-[10px] font-black text-green-400 uppercase">Rendimento Líquido</p><h4 className="text-xl font-black text-green-700">{stats.prodLiq} <span className="text-xs">sc/ha</span></h4></div>
                  </div>
                </>
              ) : (
                <div className="py-10 text-center text-slate-400 text-xs font-bold uppercase italic">Selecione uma fazenda no gráfico para detalhar a produtividade.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}