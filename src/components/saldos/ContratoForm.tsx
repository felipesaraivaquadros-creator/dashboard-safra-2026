"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Layers,
  Loader2,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { ContratoDesconto, MetodoDesconto, StatusPreco, TipoDesconto, TIPOS_DESCONTO } from '../../data/financeiroTypes';
import { calculateDiscountsTotal, roundMoney } from '../../lib/financeiroCalculations';
import { supabase } from '../../integrations/supabase/client';
import { showError, showSuccess } from '../../utils/toast';

interface ContratoFormProps {
  safraId: string;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}

interface FinanceDraft {
  status_preco: StatusPreco;
  preco_saca: number | null;
  data_contrato: string;
  competencia: string;
  tributos_revisados: boolean;
  aceita_excedente: boolean;
  observacoes: string;
}

const createDiscount = (): ContratoDesconto => ({
  tipo: 'SENAR',
  metodo: 'percentual',
  valor: 0,
  descricao: '',
});

const methodLabels: Record<MetodoDesconto, string> = {
  percentual: '% sobre bruto',
  por_saca: 'R$ por saca',
  valor_fixo: 'Valor fixo',
};

export default function ContratoForm({ safraId, onClose, onSuccess, editData }: ContratoFormProps) {
  const [loading, setLoading] = useState(false);
  const [loadingFinance, setLoadingFinance] = useState(true);
  const [financeAvailable, setFinanceAvailable] = useState(true);
  const [financeEnabled, setFinanceEnabled] = useState(false);
  const [financeExpanded, setFinanceExpanded] = useState(false);
  const [financeId, setFinanceId] = useState<string | null>(null);
  const [armazens, setArmazens] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<ContratoDesconto[]>([]);
  const [finance, setFinance] = useState<FinanceDraft>({
    status_preco: 'a_fixar',
    preco_saca: null,
    data_contrato: '',
    competencia: '',
    tributos_revisados: false,
    aceita_excedente: false,
    observacoes: '',
  });

  const [formData, setFormData] = useState({
    nome: editData?.nome || '',
    numero: editData?.numero || '',
    volume_total: editData?.volume_total || 0,
    armazem_id: editData?.armazem_id || '',
    grupo: editData?.grupo || '',
  });

  useEffect(() => {
    const fetchRelevantArmazens = async () => {
      try {
        const { data: romaneiosData } = await supabase
          .from('romaneios')
          .select('armazem_id')
          .eq('safra_id', safraId)
          .not('armazem_id', 'is', null);
        const idsRelevantes = Array.from(new Set(romaneiosData?.map((row) => row.armazem_id) || []));
        let query = supabase.from('armazens').select('*').order('nome');
        if (idsRelevantes.length > 0) query = query.in('id', idsRelevantes);
        const { data } = await query;
        if (data) setArmazens(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchRelevantArmazens();
  }, [safraId]);

  useEffect(() => {
    let mounted = true;

    const loadFinance = async () => {
      setLoadingFinance(true);
      const query = editData?.id
        ? supabase
          .from('contratos_financeiros')
          .select('*, contratos_descontos(*)')
          .eq('contrato_id', editData.id)
          .maybeSingle()
        : supabase.from('contratos_financeiros').select('id').limit(1);
      const { data, error } = await query;
      if (!mounted) return;

      if (error) {
        setFinanceAvailable(false);
        setLoadingFinance(false);
        return;
      }

      setFinanceAvailable(true);
      if (editData?.id && data && 'contrato_id' in data) {
        const loaded: any = data;
        setFinanceId(loaded.id);
        setFinanceEnabled(true);
        setFinanceExpanded(true);
        setFinance({
          status_preco: loaded.status_preco || 'a_fixar',
          preco_saca: loaded.preco_saca === null ? null : Number(loaded.preco_saca),
          data_contrato: loaded.data_contrato || '',
          competencia: loaded.competencia ? String(loaded.competencia).slice(0, 7) : '',
          tributos_revisados: Boolean(loaded.tributos_revisados),
          aceita_excedente: Boolean(loaded.aceita_excedente),
          observacoes: loaded.observacoes || '',
        });
        setDiscounts((loaded.contratos_descontos || []).map((discount: any) => ({
          ...discount,
          valor: Number(discount.valor) || 0,
        })));
      }
      setLoadingFinance(false);
    };

    loadFinance();
    return () => { mounted = false; };
  }, [editData?.id]);

  const preview = useMemo(() => {
    const price = finance.status_preco === 'fixado' ? Number(finance.preco_saca) || 0 : 0;
    const gross = roundMoney((Number(formData.volume_total) || 0) * price);
    const discountTotal = calculateDiscountsTotal(discounts, gross, Number(formData.volume_total) || 0);
    return { gross, discounts: discountTotal, net: roundMoney(gross - discountTotal) };
  }, [finance.status_preco, finance.preco_saca, formData.volume_total, discounts]);

  const updateDiscount = (index: number, patch: Partial<ContratoDesconto>) => {
    setDiscounts((current) => current.map((discount, itemIndex) => (
      itemIndex === index ? { ...discount, ...patch } : discount
    )));
  };

  const saveFinance = async (contractId: string) => {
    const price = finance.status_preco === 'fixado' ? Number(finance.preco_saca) : null;
    if (finance.status_preco === 'fixado' && (!price || price <= 0)) {
      throw new Error('Informe um preço por saca maior que zero ou marque o preço como a fixar.');
    }

    const discountsToSave = discounts
      .filter((discount) => Number(discount.valor) > 0)
      .map((discount) => ({
        tipo: discount.tipo,
        descricao: discount.tipo === 'OUTRO' ? String(discount.descricao || '').trim() || null : null,
        metodo: discount.metodo,
        valor: Number(discount.valor),
      }));

    const { data: savedFinanceId, error: financeError } = await supabase.rpc('salvar_contrato_financeiro', {
      p_contrato_id: contractId,
      p_status_preco: finance.status_preco,
      p_preco_saca: price,
      p_data_contrato: finance.data_contrato || null,
      p_competencia: finance.competencia ? `${finance.competencia}-01` : null,
      p_tributos_revisados: finance.tributos_revisados,
      p_aceita_excedente: finance.aceita_excedente,
      p_observacoes: finance.observacoes.trim() || null,
      p_descontos: discountsToSave,
    });
    if (financeError) throw financeError;
    if (savedFinanceId) setFinanceId(String(savedFinanceId));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        safra_id: safraId,
        grupo: formData.grupo || armazens.find((item) => item.id === formData.armazem_id)?.grupo || null,
      };

      let contractId = editData?.id as string | undefined;
      if (contractId) {
        const { error } = await supabase.from('contratos').update(payload).eq('id', contractId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('contratos').insert([payload]).select('id').single();
        if (error) throw error;
        contractId = data.id;
      }

      let financeSaved = false;
      if (financeEnabled && financeAvailable && contractId) {
        try {
          await saveFinance(contractId);
          financeSaved = true;
        } catch (financeError: any) {
          showError(`Contrato salvo, mas o financeiro precisa ser revisado: ${financeError.message}`);
          onSuccess();
          onClose();
          return;
        }
      }

      showSuccess(editData
        ? `Contrato atualizado${financeSaved ? ' com financeiro' : ''}!`
        : `Contrato cadastrado${financeSaved ? ' com financeiro' : ''}!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      showError(`Erro ao salvar contrato: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const enableFinance = () => {
    setFinanceEnabled(true);
    setFinanceExpanded(true);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-800">
        <div className="flex shrink-0 items-center justify-between bg-purple-600 p-5 text-white md:p-6">
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">
              {editData ? 'Editar Contrato' : 'Novo Contrato'}
            </h2>
            <p className="mt-1 text-[10px] font-bold uppercase text-white/70">Safra {safraId}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-white/20" title="Fechar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 md:p-6">
          <div className="space-y-5">
            <section className="space-y-4">
              <div className="space-y-1.5">
                <label className="ml-1 text-[10px] font-black uppercase text-slate-400">Nome do Contrato</label>
                <input required type="text" value={formData.nome} onChange={(event) => setFormData({ ...formData, nome: event.target.value })} className="w-full rounded-lg border-0 bg-slate-50 px-4 py-3 text-sm font-bold transition-all focus:ring-2 focus:ring-purple-500 dark:bg-slate-900" placeholder="Ex: Venda Sipal 20 Mil Sacas" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="ml-1 block text-[10px] font-black uppercase text-slate-400">Nº Contrato / ID</span>
                  <input type="text" value={formData.numero} onChange={(event) => setFormData({ ...formData, numero: event.target.value })} className="w-full rounded-lg border-0 bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 dark:bg-slate-900" placeholder="Ex: 72208" />
                </label>
                <label className="space-y-1.5">
                  <span className="ml-1 block text-[10px] font-black uppercase text-slate-400">Volume (Sacas)</span>
                  <input required min="0" step="0.01" type="number" value={formData.volume_total} onChange={(event) => setFormData({ ...formData, volume_total: Number(event.target.value) })} className="w-full rounded-lg border-0 bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 dark:bg-slate-900" />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="ml-1 flex items-center gap-1 text-[10px] font-black uppercase text-slate-400"><Layers size={10} /> Grupo de Abatimento</span>
                  <input type="text" value={formData.grupo} onChange={(event) => setFormData({ ...formData, grupo: event.target.value.toUpperCase() })} className="w-full rounded-lg border-0 bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 dark:bg-slate-900" placeholder="Opcional" />
                </label>
                <label className="space-y-1.5">
                  <span className="ml-1 block text-[10px] font-black uppercase text-slate-400">Armazém Específico</span>
                  <select value={formData.armazem_id} onChange={(event) => setFormData({ ...formData, armazem_id: event.target.value })} className="w-full rounded-lg border-0 bg-slate-50 px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-purple-500 dark:bg-slate-900">
                    <option value="">Nenhum (Geral)</option>
                    {armazens.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-5 dark:border-slate-700">
              {loadingFinance ? (
                <div className="flex items-center gap-2 py-3 text-xs font-bold text-slate-400"><Loader2 size={16} className="animate-spin" /> Verificando módulo financeiro...</div>
              ) : !financeAvailable ? (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                  <p className="text-xs font-bold">Execute `docs/supabase_contratos_financeiros.sql` no Supabase para habilitar os dados financeiros. O contrato ainda pode ser salvo normalmente.</p>
                </div>
              ) : !financeEnabled ? (
                <button type="button" onClick={enableFinance} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-purple-300 px-4 py-4 text-xs font-black uppercase text-purple-600 transition-colors hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900/20">
                  <CircleDollarSign size={18} /> Adicionar informações financeiras
                </button>
              ) : (
                <div className="space-y-5">
                  <button type="button" onClick={() => setFinanceExpanded((current) => !current)} className="flex w-full items-center justify-between text-left">
                    <span className="flex items-center gap-2 text-sm font-black uppercase text-slate-700 dark:text-slate-200"><CircleDollarSign size={18} className="text-purple-600" /> Informações financeiras <span className="text-[9px] text-slate-400">Opcional</span></span>
                    {financeExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  {financeExpanded && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <label className="space-y-1.5">
                          <span className="block text-[9px] font-black uppercase text-slate-400">Situação do preço</span>
                          <select value={finance.status_preco} onChange={(event) => setFinance({ ...finance, status_preco: event.target.value as StatusPreco, preco_saca: event.target.value === 'a_fixar' ? null : finance.preco_saca })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
                            <option value="a_fixar">A fixar</option>
                            <option value="fixado">Fixado</option>
                          </select>
                        </label>
                        <label className="space-y-1.5">
                          <span className="block text-[9px] font-black uppercase text-slate-400">Preço por saca</span>
                          <input type="number" min="0" step="0.0001" disabled={finance.status_preco === 'a_fixar'} value={finance.preco_saca ?? ''} onChange={(event) => setFinance({ ...finance, preco_saca: event.target.value === '' ? null : Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900" placeholder="R$ 0,00" />
                        </label>
                        <label className="space-y-1.5">
                          <span className="block text-[9px] font-black uppercase text-slate-400">Data do contrato</span>
                          <input type="date" value={finance.data_contrato} onChange={(event) => setFinance({ ...finance, data_contrato: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
                        </label>
                        <label className="space-y-1.5">
                          <span className="block text-[9px] font-black uppercase text-slate-400">Competência</span>
                          <input type="month" value={finance.competencia} onChange={(event) => setFinance({ ...finance, competencia: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
                        </label>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Tributos e descontos</h3>
                            <p className="text-[9px] font-bold text-slate-400">Aceita percentual, valor por saca ou valor fixo.</p>
                          </div>
                          <button type="button" onClick={() => setDiscounts((current) => [...current, createDiscount()])} className="inline-flex items-center gap-1 rounded-lg bg-purple-100 px-3 py-2 text-[10px] font-black uppercase text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300">
                            <Plus size={14} /> Adicionar
                          </button>
                        </div>

                        {discounts.map((discount, index) => (
                          <div key={discount.id || index} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[130px_minmax(0,1fr)_130px_auto]">
                            <select value={discount.tipo} onChange={(event) => updateDiscount(index, { tipo: event.target.value as TipoDesconto })} className="rounded-md border-0 bg-white px-2.5 py-2 text-xs font-black dark:bg-slate-800">
                              {TIPOS_DESCONTO.map((type) => <option key={type} value={type}>{type}</option>)}
                            </select>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <select value={discount.metodo} onChange={(event) => updateDiscount(index, { metodo: event.target.value as MetodoDesconto })} className="rounded-md border-0 bg-white px-2.5 py-2 text-xs font-bold dark:bg-slate-800">
                                {Object.entries(methodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                              </select>
                              {discount.tipo === 'OUTRO' && <input value={discount.descricao || ''} onChange={(event) => updateDiscount(index, { descricao: event.target.value })} className="rounded-md border-0 bg-white px-2.5 py-2 text-xs font-bold dark:bg-slate-800" placeholder="Descrição" />}
                            </div>
                            <input type="number" min="0" step="0.000001" value={discount.valor} onChange={(event) => updateDiscount(index, { valor: Number(event.target.value) })} className="rounded-md border-0 bg-white px-2.5 py-2 text-right text-xs font-black dark:bg-slate-800" />
                            <button type="button" onClick={() => setDiscounts((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Remover desconto"><Trash2 size={16} /></button>
                          </div>
                        ))}
                        {discounts.length === 0 && <p className="py-3 text-center text-[10px] font-bold uppercase text-slate-400">Nenhum desconto lançado</p>}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-900"><p className="text-[9px] font-black uppercase text-slate-400">Bruto previsto</p><p className="mt-1 text-base font-black text-slate-800 dark:text-white">{preview.gross.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                        <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20"><p className="text-[9px] font-black uppercase text-amber-700 dark:text-amber-300">Descontos</p><p className="mt-1 text-base font-black text-amber-800 dark:text-amber-200">{preview.discounts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20"><p className="text-[9px] font-black uppercase text-green-700 dark:text-green-300">Líquido previsto</p><p className="mt-1 text-base font-black text-green-800 dark:text-green-200">{preview.net.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                          <input type="checkbox" checked={finance.tributos_revisados} onChange={(event) => setFinance({ ...finance, tributos_revisados: event.target.checked })} className="mt-0.5 h-4 w-4 accent-green-600" />
                          <span><strong className="block text-xs uppercase text-slate-700 dark:text-slate-200">Tributos revisados</strong><span className="text-[9px] text-slate-400">Marque mesmo quando o contrato não possuir descontos.</span></span>
                        </label>
                        <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                          <input type="checkbox" checked={finance.aceita_excedente} onChange={(event) => setFinance({ ...finance, aceita_excedente: event.target.checked })} className="mt-0.5 h-4 w-4 accent-green-600" />
                          <span><strong className="block text-xs uppercase text-slate-700 dark:text-slate-200">Aceitar volume excedente</strong><span className="text-[9px] text-slate-400">Inclui entregas acima do volume contratado no realizado.</span></span>
                        </label>
                      </div>

                      <label className="space-y-1.5">
                        <span className="block text-[9px] font-black uppercase text-slate-400">Observações financeiras</span>
                        <textarea rows={2} value={finance.observacoes} onChange={(event) => setFinance({ ...finance, observacoes: event.target.value })} className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-900" />
                      </label>

                      {financeId && <p className="flex items-center gap-1 text-[9px] font-bold uppercase text-green-600"><CheckCircle2 size={13} /> Configuração financeira vinculada ao contrato</p>}
                    </div>
                  )}
                </div>
              )}
            </section>

            <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
              <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 py-4 text-xs font-black uppercase text-white shadow-md transition-colors hover:bg-purple-700 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {editData ? 'Salvar Alterações' : 'Cadastrar Contrato'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
