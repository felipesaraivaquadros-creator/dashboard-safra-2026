"use client";

import React, { useMemo } from 'react';
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react';
import {
  ContratoBarterItem,
  ModalidadeCpr,
  ResponsavelFrete,
  StatusConciliacaoBarter,
} from '../../data/financeiroTypes';
import { roundMoney } from '../../lib/financeiroCalculations';

export interface BarterDraft {
  fornecedor: string;
  recebedor_graos: string;
  valor_insumos: number | null;
  data_inicio_entrega: string;
  data_fim_entrega: string;
  local_entrega: string;
  responsavel_frete: ResponsavelFrete;
  qualidade_exigida: string;
  numero_cpr: string;
  modalidade_cpr: ModalidadeCpr;
  registro_cpr: string;
  preco_referencia_saca: number | null;
  preco_mercado_saca: number | null;
  data_preco_mercado: string;
  status_conciliacao: StatusConciliacaoBarter;
  observacoes: string;
}

interface BarterFormSectionProps {
  draft: BarterDraft;
  items: ContratoBarterItem[];
  volumeSacas: number;
  onChange: (draft: BarterDraft) => void;
  onItemsChange: (items: ContratoBarterItem[]) => void;
}

const createItem = (): ContratoBarterItem => ({
  categoria: 'Insumo',
  descricao: '',
  quantidade: null,
  unidade: '',
  valor_unitario: null,
  valor_total: 0,
});

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function BarterFormSection({ draft, items, volumeSacas, onChange, onItemsChange }: BarterFormSectionProps) {
  const preview = useMemo(() => {
    const inputValue = Number(draft.valor_insumos) || 0;
    const itemTotal = roundMoney(items.reduce((total, item) => total + (Number(item.valor_total) || 0), 0));
    const implicitPrice = volumeSacas > 0 ? roundMoney(inputValue / volumeSacas) : 0;
    const marketValue = roundMoney(volumeSacas * (Number(draft.preco_mercado_saca) || 0));
    return { inputValue, itemTotal, implicitPrice, marketValue, variation: roundMoney(marketValue - inputValue) };
  }, [draft.valor_insumos, draft.preco_mercado_saca, items, volumeSacas]);

  const updateItem = (index: number, patch: Partial<ContratoBarterItem>) => {
    onItemsChange(items.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, ...patch };
      if ('quantidade' in patch || 'valor_unitario' in patch) {
        const quantity = Number(next.quantidade) || 0;
        const unitValue = Number(next.valor_unitario) || 0;
        next.valor_total = roundMoney(quantity * unitValue);
      }
      return next;
    }));
  };

  return (
    <section className="space-y-5 border-t border-slate-200 pt-5 dark:border-slate-700">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-black uppercase text-slate-700 dark:text-slate-200">
          <ArrowLeftRight size={18} className="text-green-600" /> Dados da troca / barter
        </h3>
        <p className="mt-1 text-[9px] font-bold uppercase text-slate-400">A obrigação em grãos usa o volume do contrato e as entregas dos romaneios vinculados.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Fornecedor dos insumos</span>
          <input value={draft.fornecedor} onChange={(event) => onChange({ ...draft, fornecedor: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" placeholder="Empresa ou cooperativa" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Recebedor dos grãos</span>
          <input value={draft.recebedor_graos} onChange={(event) => onChange({ ...draft, recebedor_graos: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" placeholder="Destino ou credor" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Valor dos insumos</span>
          <input type="number" min="0" step="0.01" value={draft.valor_insumos ?? ''} onChange={(event) => onChange({ ...draft, valor_insumos: event.target.value === '' ? null : Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black dark:border-slate-700 dark:bg-slate-900" placeholder="R$ 0,00" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Conciliação</span>
          <select value={draft.status_conciliacao} onChange={(event) => onChange({ ...draft, status_conciliacao: event.target.value as StatusConciliacaoBarter })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
            <option value="pendente">Pendente</option>
            <option value="divergente">Divergente</option>
            <option value="conciliado">Conciliado</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Início da entrega</span>
          <input type="date" value={draft.data_inicio_entrega} onChange={(event) => onChange({ ...draft, data_inicio_entrega: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Fim da entrega</span>
          <input type="date" value={draft.data_fim_entrega} onChange={(event) => onChange({ ...draft, data_fim_entrega: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="space-y-1.5 lg:col-span-2">
          <span className="block text-[9px] font-black uppercase text-slate-400">Local de entrega</span>
          <input value={draft.local_entrega} onChange={(event) => onChange({ ...draft, local_entrega: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Responsável pelo frete</span>
          <select value={draft.responsavel_frete} onChange={(event) => onChange({ ...draft, responsavel_frete: event.target.value as ResponsavelFrete })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
            <option value="produtor">Produtor</option><option value="comprador">Comprador</option><option value="compartilhado">Compartilhado</option><option value="outro">Outro</option>
          </select>
        </label>
        <label className="space-y-1.5 lg:col-span-3">
          <span className="block text-[9px] font-black uppercase text-slate-400">Qualidade exigida</span>
          <input value={draft.qualidade_exigida} onChange={(event) => onChange({ ...draft, qualidade_exigida: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" placeholder="Umidade, impureza e demais condições" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Número da CPR</span>
          <input value={draft.numero_cpr} onChange={(event) => onChange({ ...draft, numero_cpr: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Modalidade da CPR</span>
          <select value={draft.modalidade_cpr} onChange={(event) => onChange({ ...draft, modalidade_cpr: event.target.value as ModalidadeCpr })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900">
            <option value="nao_aplicavel">Não se aplica</option><option value="fisica">Física</option><option value="financeira">Financeira</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Registro da CPR</span>
          <input value={draft.registro_cpr} onChange={(event) => onChange({ ...draft, registro_cpr: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Preço de referência / sc</span>
          <input type="number" min="0" step="0.01" value={draft.preco_referencia_saca ?? ''} onChange={(event) => onChange({ ...draft, preco_referencia_saca: event.target.value === '' ? null : Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Preço de mercado / sc</span>
          <input type="number" min="0" step="0.01" value={draft.preco_mercado_saca ?? ''} onChange={(event) => onChange({ ...draft, preco_mercado_saca: event.target.value === '' ? null : Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[9px] font-black uppercase text-slate-400">Data da cotação</span>
          <input type="date" value={draft.data_preco_mercado} onChange={(event) => onChange({ ...draft, data_preco_mercado: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div><h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Composição dos insumos</h4><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">Opcional, para conferência do valor total da troca.</p></div>
          <button type="button" onClick={() => onItemsChange([...items, createItem()])} className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-3 py-2 text-[10px] font-black uppercase text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"><Plus size={14} /> Item</button>
        </div>
        {items.map((item, index) => (
          <div key={item.id || index} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[110px_minmax(160px,1fr)_90px_80px_110px_110px_auto]">
            <input value={item.categoria} onChange={(event) => updateItem(index, { categoria: event.target.value })} className="rounded-md border-0 bg-white px-2.5 py-2 text-xs font-bold dark:bg-slate-800" placeholder="Categoria" />
            <input value={item.descricao} onChange={(event) => updateItem(index, { descricao: event.target.value })} className="rounded-md border-0 bg-white px-2.5 py-2 text-xs font-bold dark:bg-slate-800" placeholder="Descrição do item" />
            <input type="number" min="0" step="0.0001" value={item.quantidade ?? ''} onChange={(event) => updateItem(index, { quantidade: event.target.value === '' ? null : Number(event.target.value) })} className="rounded-md border-0 bg-white px-2.5 py-2 text-right text-xs font-bold dark:bg-slate-800" placeholder="Qtd." />
            <input value={item.unidade} onChange={(event) => updateItem(index, { unidade: event.target.value })} className="rounded-md border-0 bg-white px-2.5 py-2 text-xs font-bold dark:bg-slate-800" placeholder="Un." />
            <input type="number" min="0" step="0.01" value={item.valor_unitario ?? ''} onChange={(event) => updateItem(index, { valor_unitario: event.target.value === '' ? null : Number(event.target.value) })} className="rounded-md border-0 bg-white px-2.5 py-2 text-right text-xs font-bold dark:bg-slate-800" placeholder="R$/un." />
            <input type="number" min="0" step="0.01" value={item.valor_total} onChange={(event) => updateItem(index, { valor_total: Number(event.target.value) })} className="rounded-md border-0 bg-white px-2.5 py-2 text-right text-xs font-black dark:bg-slate-800" placeholder="Total" />
            <button type="button" onClick={() => onItemsChange(items.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Remover item"><Trash2 size={16} /></button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Valor dos insumos', currency(preview.inputValue)],
          ['Itens detalhados', currency(preview.itemTotal)],
          ['Preço implícito/sc', currency(preview.implicitPrice)],
          ['Valor de mercado', currency(preview.marketValue)],
          ['Variação de mercado', currency(preview.variation)],
        ].map(([label, value]) => <div key={label} className="border-l-4 border-green-500 pl-3"><p className="text-[8px] font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-xs font-black text-slate-700 dark:text-slate-200">{value}</p></div>)}
      </div>

      <label className="space-y-1.5">
        <span className="block text-[9px] font-black uppercase text-slate-400">Observações da troca</span>
        <textarea rows={2} value={draft.observacoes} onChange={(event) => onChange({ ...draft, observacoes: event.target.value })} className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-900" />
      </label>
    </section>
  );
}
