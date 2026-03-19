"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { HandCoins, Fuel, Plus, Edit2, Trash2, Loader2, ArrowLeft, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../../src/integrations/supabase/client';
import { ThemeToggle } from '../../../src/components/ThemeToggle';
import SafraSelector from '../../../src/components/SafraSelector';
import NavigationMenu from '../../../src/components/NavigationMenu';
import { getSafraConfig } from '../../../src/data/safraConfig';
import { showSuccess, showError } from '../../../src/utils/toast';

import AdiantamentoForm from '../../../src/components/descontos/AdiantamentoForm';
import AbastecimentoForm from '../../../src/components/descontos/AbastecimentoForm';

type TabType = 'adiantamentos' | 'abastecimentos';
type SortOrder = 'asc' | 'desc';
type SortKey = 'data' | 'motorista' | 'valor' | 'total' | 'litros' | 'preco';

export default function DescontosPage() {
  const params = useParams();
  const safraId = params.safraId as string;
  const safraConfig = getSafraConfig(safraId);

  const [activeTab, setActiveTab] = useState<TabType>('adiantamentos');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [motoristas, setMotoristas] = useState<string[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Estado de ordenação
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, order: SortOrder }>({ 
    key: 'data', 
    order: 'desc' 
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase
        .from(activeTab)
        .select('*')
        .eq('safra_id', safraId);
      
      if (error) throw error;
      setData(res || []);

      // Busca motoristas únicos dos romaneios para o autocomplete
      const { data: roms } = await supabase
        .from('romaneios')
        .select('motorista')
        .eq('safra_id', safraId);
      
      if (roms) {
        const unique = Array.from(new Set(roms.map(r => r.motorista).filter(Boolean))).sort();
        setMotoristas(unique as string[]);
      }
    } catch (err: any) {
      showError("Erro ao carregar: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [safraId, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este registro?")) return;
    const { error } = await supabase.from(activeTab).delete().eq('id', id);
    if (error) showError("Erro ao excluir");
    else {
      showSuccess("Registro removido!");
      fetchData();
    }
  };

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      order: prev.key === key && prev.order === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = useMemo(() => {
    const filtered = data.filter(item => 
      item.motorista?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return [...filtered].sort((a, b) => {
      const { key, order } = sortConfig;
      
      // Tratamento especial para chaves que podem não existir em ambos os tipos
      let valA = a[key];
      let valB = b[key];

      // Fallback para valor/total dependendo da aba
      if (key === 'valor' && activeTab === 'abastecimentos') valA = a.total;
      if (key === 'valor' && activeTab === 'abastecimentos') valB = b.total;

      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      if (typeof valA === 'string') {
        const comparison = valA.localeCompare(valB);
        return order === 'asc' ? comparison : -comparison;
      }

      return order === 'asc' ? valA - valB : valB - valA;
    });
  }, [data, searchTerm, sortConfig, activeTab]);

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="opacity-20 group-hover:opacity-50 transition-opacity" />;
    return sortConfig.order === 'asc' ? <ArrowUp size={12} className="text-purple-500" /> : <ArrowDown size={12} className="text-purple-500" />;
  };

  const HeaderCell = ({ label, sortKey, align = 'left' }: { label: string, sortKey: SortKey, align?: 'left' | 'right' | 'center' }) => (
    <th 
      onClick={() => handleSort(sortKey)}
      className={`px-6 py-4 cursor-pointer group hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}
    >
      <div className={`flex items-center gap-1.5 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}>
        <span className={sortConfig.key === sortKey ? 'text-slate-900 dark:text-white' : ''}>{label}</span>
        <SortIcon column={sortKey} />
      </div>
    </th>
  );

  // Função para formatar data sem erro de fuso horário
  const formatarDataExibicao = (dataStr: string) => {
    if (!dataStr) return "-";
    // Se a data vier no formato AAAA-MM-DD, apenas inverte para DD/MM/AAAA
    const partes = dataStr.split('T')[0].split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataStr;
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-50 dark:bg-slate-900 font-sans">
      <header className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <NavigationMenu />
            <h1 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter truncate">Gestão de Descontos</h1>
          </div>
          <SafraSelector currentSafra={safraConfig} />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700">
          <button 
            onClick={() => { setEditItem(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg"
          >
            <Plus size={18} /> Novo Registro
          </button>
          <Link href={`/${safraId}`} className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all shadow-sm">
            Painel
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* Tabs e Busca */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex bg-slate-200/50 dark:bg-slate-800 p-1 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => { setActiveTab('adiantamentos'); setSortConfig({ key: 'data', order: 'desc' }); }}
              className={`flex-1 md:w-48 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'adiantamentos' ? 'bg-white dark:bg-slate-700 text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <HandCoins size={16} /> Adiantamentos
            </button>
            <button 
              onClick={() => { setActiveTab('abastecimentos'); setSortConfig({ key: 'data', order: 'desc' }); }}
              className={`flex-1 md:w-48 flex items-center justify-center gap-2 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${activeTab === 'abastecimentos' ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Fuel size={16} /> Abastecimentos
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="BUSCAR MOTORISTA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl pl-11 pr-4 py-2.5 text-[10px] font-black focus:ring-2 focus:ring-purple-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-purple-600 mb-4" size={32} />
              <p className="text-[10px] font-black uppercase text-slate-400">Sincronizando com a nuvem...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b dark:border-slate-700">
                    <HeaderCell label="Data" sortKey="data" />
                    <HeaderCell label="Motorista" sortKey="motorista" />
                    {activeTab === 'abastecimentos' && (
                      <>
                        <HeaderCell label="Litros" sortKey="litros" align="right" />
                        <HeaderCell label="Preço Unit." sortKey="preco" align="right" />
                      </>
                    )}
                    <HeaderCell label="Valor Total" sortKey={activeTab === 'adiantamentos' ? 'valor' : 'total'} align="right" />
                    <th className="px-6 py-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-bold">
                  {sortedData.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/30 dark:hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {formatarDataExibicao(item.data)}
                      </td>
                      <td className="px-6 py-4 uppercase text-slate-700 dark:text-slate-200">{item.motorista}</td>
                      {activeTab === 'abastecimentos' && (
                        <>
                          <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">{Number(item.litros).toLocaleString('pt-BR')} L</td>
                          <td className="px-6 py-4 text-right text-slate-400">R$ {Number(item.preco).toFixed(2)}</td>
                        </>
                      )}
                      <td className={`px-6 py-4 text-right font-black ${activeTab === 'adiantamentos' ? 'text-orange-600' : 'text-red-600'}`}>
                        R$ {Number(item.valor || item.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button 
                            onClick={() => { setEditItem(item); setShowForm(true); }}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sortedData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic uppercase text-[10px]">
                        Nenhum registro encontrado para esta safra.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && activeTab === 'adiantamentos' && (
        <AdiantamentoForm 
          safraId={safraId} 
          onClose={() => { setShowForm(false); setEditItem(null); }} 
          onSuccess={fetchData}
          editData={editItem}
          motoristas={motoristas}
        />
      )}

      {showForm && activeTab === 'abastecimentos' && (
        <AbastecimentoForm 
          safraId={safraId} 
          onClose={() => { setShowForm(false); setEditItem(null); }} 
          onSuccess={fetchData}
          editData={editItem}
          motoristas={motoristas}
        />
      )}
    </main>
  );
}