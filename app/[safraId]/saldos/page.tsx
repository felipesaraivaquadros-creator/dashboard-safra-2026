"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Package, FileText, Scale, LayoutGrid, List, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import { useParams } from 'next/navigation';
import { getSafraConfig } from '../../../src/data/safraConfig';
import SafraSelector from '../../../src/components/SafraSelector';
import NavigationMenu from '../../../src/components/NavigationMenu';
import { supabase } from '../../../src/integrations/supabase/client';
import { showSuccess, showError } from '../../../src/utils/toast';

// Componentes de Aba
import SaldosTab from '../../../src/components/saldos/SaldosTab';
import ContratosTab from '../../../src/components/saldos/ContratosTab';
import DisponivelTab from '../../../src/components/saldos/DisponivelTab';
import SaldosPorArmazem from '../../../src/components/saldos/SaldosPorArmazem';
import ContratoForm from '../../../src/components/saldos/ContratoForm';

type TabType = 'saldos' | 'contratos' | 'disponivel';
type ScenarioType = 'geral' | 'armazem';

export default function SaldoPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);

  const [activeTab, setActiveTab] = useState<TabType>('saldos');
  const [scenario, setScenario] = useState<ScenarioType>('geral');
  const [showForm, setShowForm] = useState(false);
  const [editingContrato, setEditingContrato] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [dbContratos, setDbContratos] = useState<any[]>([]);
  const [dbRomaneios, setDbRomaneios] = useState<any[]>([]);

  // Busca dados do banco (Contratos e Romaneios)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Busca Contratos
      const { data: contratos, error: errC } = await supabase
        .from('contratos')
        .select('*, armazens(nome)')
        .eq('safra_id', safraId)
        .order('created_at', { ascending: false });
      
      if (errC) throw errC;
      setDbContratos(contratos || []);

      // Busca Romaneios (para calcular estoque físico)
      const { data: romaneios, error: errR } = await supabase
        .from('romaneios')
        .select('sacas_liquida, peso_liquido_kg, armazens(nome)')
        .eq('safra_id', safraId);

      if (errR) throw errR;
      setDbRomaneios(romaneios || []);

    } catch (error: any) {
      showError("Erro ao carregar dados: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [safraId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este contrato?")) return;
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (error) showError("Erro ao excluir: " + error.message);
    else {
      showSuccess("Contrato excluído!");
      fetchData();
    }
  };

  // Processamento dos dados da nuvem
  const processedData = useMemo(() => {
    // 1. Calcular Estoque por Armazém
    const saldosMap: Record<string, { sc: number, kg: number }> = {};
    dbRomaneios.forEach(r => {
      const nomeArmazem = r.armazens?.nome || "Outros";
      if (!saldosMap[nomeArmazem]) saldosMap[nomeArmazem] = { sc: 0, kg: 0 };
      saldosMap[nomeArmazem].sc += Number(r.sacas_liquida) || 0;
      saldosMap[nomeArmazem].kg += Number(r.peso_liquido_kg) || 0;
    });

    const listaSaldos = Object.entries(saldosMap).map(([nome, val]) => ({
      nome,
      total: parseFloat(val.sc.toFixed(2)),
      totalKg: Math.round(val.kg)
    })).sort((a, b) => b.total - a.total);

    const totalEstoque = listaSaldos.reduce((acc, item) => acc + item.total, 0);

    // 2. Formatar Contratos
    const listaContratos = dbContratos.map(c => ({
      id: c.numero,
      nome: c.nome,
      total: Number(c.volume_total),
      totalKg: Number(c.volume_total) * 60,
      db_id: c.id,
      armazem_nome: c.armazens?.nome
    })).sort((a, b) => b.total - a.total);

    const totalContratos = listaContratos.reduce((acc, item) => acc + item.total, 0);

    // 3. Saldos de Grupos (Lógica específica para Soja 25/26 se necessário)
    const ARMAZENS_FIXOS = ["COFCO NSH", "SIPAL MATUPÁ"];
    const estoqueSipal = listaSaldos
      .filter(s => ARMAZENS_FIXOS.includes(s.nome))
      .reduce((acc, s) => acc + s.total, 0);
    
    const contratosSipal = listaContratos
      .filter(c => ARMAZENS_FIXOS.includes(c.armazem_nome || ""))
      .reduce((acc, c) => acc + c.total, 0);

    return {
      listaSaldos,
      listaContratos,
      totalEstoque,
      totalContratos,
      saldoGeral: totalEstoque - totalContratos,
      saldoSipal: estoqueSipal - contratosSipal,
      saldoOutros: (totalEstoque - estoqueSipal) - (totalContratos - contratosSipal)
    };
  }, [dbRomaneios, dbContratos]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sincronizando Saldos...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100">
      <header className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <NavigationMenu />
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate">Gestão de Saldos</h1>
          </div>
          <SafraSelector currentSafra={safraConfig} />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
          <button 
            onClick={() => { setEditingContrato(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors shadow-md"
          >
            <Plus size={16} /> Novo Contrato
          </button>
          <Link 
            href={`/${safraId}`} 
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all shadow-sm"
          >
            Painel
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto">
        
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex gap-1">
            <button 
              onClick={() => setScenario('geral')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${scenario === 'geral' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={14} /> Saldos Gerais
            </button>
            <button 
              onClick={() => setScenario('armazem')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${scenario === 'armazem' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List size={14} /> Saldos por Armazém
            </button>
          </div>
        </div>

        {scenario === 'geral' ? (
          <>
            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-[20px] mb-8 shadow-inner max-w-2xl mx-auto">
              <button 
                onClick={() => setActiveTab('saldos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] md:text-xs font-black uppercase rounded-2xl transition-all ${activeTab === 'saldos' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Package size={16} /> Estoque
              </button>
              <button 
                onClick={() => setActiveTab('contratos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] md:text-xs font-black uppercase rounded-2xl transition-all ${activeTab === 'contratos' ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <FileText size={16} /> Contratos
              </button>
              <button 
                onClick={() => setActiveTab('disponivel')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] md:text-xs font-black uppercase rounded-2xl transition-all ${activeTab === 'disponivel' ? 'bg-white dark:bg-slate-700 text-green-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Scale size={16} /> Disponível
              </button>
            </div>

            <div className="min-h-[400px]">
              {activeTab === 'saldos' && (
                <SaldosTab 
                  lista={processedData.listaSaldos} 
                  totalSacas={processedData.totalEstoque} 
                  totalKg={processedData.totalEstoque * 60} 
                />
              )}
              
              {activeTab === 'contratos' && (
                <div className="space-y-6">
                  <ContratosTab 
                    lista={processedData.listaContratos} 
                    totalSacas={processedData.totalContratos} 
                    totalKg={processedData.totalContratos * 60} 
                  />
                  
                  {dbContratos.length > 0 && (
                    <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Gerenciar Contratos</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dbContratos.map(c => (
                          <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div>
                              <p className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">{c.nome}</p>
                              <p className="text-[9px] font-bold text-slate-400">{c.volume_total.toLocaleString('pt-BR')} sc {c.armazens ? `| ${c.armazens.nome}` : ''}</p>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => { setEditingContrato(c); setShowForm(true); }}
                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(c.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'disponivel' && (
                <DisponivelTab 
                  saldoGeral={processedData.saldoGeral}
                  saldoSipal={processedData.saldoSipal}
                  saldoOutros={processedData.saldoOutros}
                  totalEstoque={processedData.totalEstoque}
                  totalContratos={processedData.totalContratos}
                />
              )}
            </div>
          </>
        ) : (
          <SaldosPorArmazem listaSaldos={processedData.listaSaldos} />
        )}
      </div>

      {showForm && (
        <ContratoForm 
          safraId={safraId} 
          onClose={() => { setShowForm(false); setEditingContrato(null); }} 
          onSuccess={fetchData}
          editData={editingContrato}
        />
      )}
    </main>
  );
}