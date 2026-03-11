"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { calculateSaldoDashboard } from '../../../src/lib/saldoProcessing';
import { Package, FileText, Scale, LayoutGrid, List, Plus, Edit2, Trash2 } from 'lucide-react';
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
  const [dbContratos, setDbContratos] = useState<any[]>([]);

  // Busca contratos do banco
  const fetchContratos = useCallback(async () => {
    const { data, error } = await supabase
      .from('contratos')
      .select('*, armazens(nome)')
      .eq('safra_id', safraId)
      .order('created_at', { ascending: false });
    
    if (error) {
      showError("Erro ao carregar contratos: " + error.message);
    } else {
      setDbContratos(data || []);
    }
  }, [safraId]);

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este contrato?")) return;
    
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (error) {
      showError("Erro ao excluir: " + error.message);
    } else {
      showSuccess("Contrato excluído!");
      fetchContratos();
    }
  };

  // Dados processados (Mistura estáticos com banco se necessário, ou apenas banco)
  const data = useMemo(() => {
    const baseData = calculateSaldoDashboard(safraId);
    
    // Se houver contratos no banco, eles substituem ou complementam os estáticos
    // Para uma transição profissional, vamos usar os do banco se existirem
    if (dbContratos.length > 0) {
      const contratosFormatados = dbContratos.map(c => ({
        id: c.numero,
        nome: c.nome,
        total: Number(c.volume_total),
        totalKg: Number(c.volume_total) * 60,
        db_id: c.id,
        armazem_id: c.armazem_id,
        armazem_nome: c.armazens?.nome
      }));

      const totalContratos = contratosFormatados.reduce((acc, item) => acc + item.total, 0);
      
      return {
        ...baseData,
        listaContratos: contratosFormatados,
        totalContratos,
        saldoGeral: baseData.totalEstoque - totalContratos
      };
    }

    return baseData;
  }, [safraId, dbContratos]);

  const isSoja2526 = safraId === 'soja2526';

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
            href={`/${safraId}/fretes`} 
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
          >
            Fretes
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto">
        
        {isSoja2526 && (
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
        )}

        {scenario === 'geral' ? (
          <>
            <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1.5 rounded-[20px] mb-8 shadow-inner max-w-2xl mx-auto">
              <button 
                onClick={() => setActiveTab('saldos')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] md:text-xs font-black uppercase rounded-2xl transition-all ${activeTab === 'saldos' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Package size={16} /> Saldos
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
                  lista={data.listaSaldos} 
                  totalSacas={data.totalEstoque} 
                  totalKg={data.totalEstoque * 60} 
                />
              )}
              
              {activeTab === 'contratos' && (
                <div className="space-y-6">
                  <ContratosTab 
                    lista={data.listaContratos} 
                    totalSacas={data.totalContratos} 
                    totalKg={data.totalContratos * 60} 
                  />
                  
                  {/* Lista de Ações para Contratos do Banco */}
                  {dbContratos.length > 0 && (
                    <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Gerenciar Contratos (Banco)</h3>
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
                  saldoGeral={data.saldoGeral}
                  saldoSipal={data.saldoContratosFixos}
                  saldoOutros={data.saldoOutros}
                  totalEstoque={data.totalEstoque}
                  totalContratos={data.totalContratos}
                />
              )}
            </div>
          </>
        ) : (
          <SaldosPorArmazem listaSaldos={data.listaSaldos} />
        )}
      </div>

      {showForm && (
        <ContratoForm 
          safraId={safraId} 
          onClose={() => { setShowForm(false); setEditingContrato(null); }} 
          onSuccess={fetchContratos}
          editData={editingContrato}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; }
      `}</style>
    </main>
  );
}