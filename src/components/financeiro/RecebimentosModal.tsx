"use client";

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Edit2,
  Loader2,
  Plus,
  ReceiptText,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { ContratoBaixa, ContratoFinanceiroResumo, ContratoRecebivel, StatusRecebivel } from '../../data/financeiroTypes';
import { getLocalDateKey, roundMoney } from '../../lib/financeiroCalculations';
import { supabase } from '../../integrations/supabase/client';
import { showError, showSuccess } from '../../utils/toast';

const currency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (value: string) => value ? value.slice(0, 10).split('-').reverse().join('/') : '—';

const statusConfig: Record<StatusRecebivel, { label: string; className: string; icon: React.ElementType }> = {
  em_aberto: { label: 'Em aberto', className: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', icon: Clock3 },
  parcial: { label: 'Parcial', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300', icon: CircleDollarSign },
  pago: { label: 'Pago', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle2 },
  vencido: { label: 'Vencido', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: AlertTriangle },
};

interface ReceivableDraft {
  numero_parcela: string;
  descricao: string;
  data_vencimento: string;
  valor_previsto: string;
  observacoes: string;
}

interface PaymentDraft {
  data_recebimento: string;
  valor_recebido: string;
  forma_recebimento: string;
  referencia: string;
  observacoes: string;
}

interface RecebimentosModalProps {
  summary: ContratoFinanceiroResumo;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecebimentosModal({ summary, onClose, onSuccess }: RecebimentosModalProps) {
  const [saving, setSaving] = useState(false);
  const [showReceivableForm, setShowReceivableForm] = useState(false);
  const [editingReceivableId, setEditingReceivableId] = useState<string | null>(null);
  const [activePaymentReceivableId, setActivePaymentReceivableId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const nextInstallment = useMemo(
    () => Math.max(0, ...summary.recebiveis.map((item) => item.numero_parcela)) + 1,
    [summary.recebiveis],
  );
  const [receivableDraft, setReceivableDraft] = useState<ReceivableDraft>({
    numero_parcela: String(nextInstallment),
    descricao: '',
    data_vencimento: getLocalDateKey(),
    valor_previsto: summary.recebimentosAProgramar > 0 ? String(summary.recebimentosAProgramar) : '',
    observacoes: '',
  });
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft>({
    data_recebimento: getLocalDateKey(),
    valor_recebido: '',
    forma_recebimento: '',
    referencia: '',
    observacoes: '',
  });

  const resetReceivableForm = () => {
    setEditingReceivableId(null);
    setShowReceivableForm(false);
    setReceivableDraft({
      numero_parcela: String(nextInstallment),
      descricao: '',
      data_vencimento: getLocalDateKey(),
      valor_previsto: '',
      observacoes: '',
    });
  };

  const openReceivableForm = (receivable?: ContratoRecebivel) => {
    setActivePaymentReceivableId(null);
    setEditingPaymentId(null);
    setEditingReceivableId(receivable?.id || null);
    setReceivableDraft(receivable ? {
      numero_parcela: String(receivable.numero_parcela),
      descricao: receivable.descricao || '',
      data_vencimento: receivable.data_vencimento,
      valor_previsto: String(receivable.valor_previsto),
      observacoes: receivable.observacoes || '',
    } : {
      numero_parcela: String(nextInstallment),
      descricao: '',
      data_vencimento: getLocalDateKey(),
      valor_previsto: summary.recebimentosAProgramar > 0 ? String(summary.recebimentosAProgramar) : '',
      observacoes: '',
    });
    setShowReceivableForm(true);
  };

  const saveReceivable = async (event: React.FormEvent) => {
    event.preventDefault();
    const financeId = summary.financeiro?.id;
    const installment = Number(receivableDraft.numero_parcela);
    const value = Number(receivableDraft.valor_previsto);
    const current = summary.recebiveis.find((item) => item.id === editingReceivableId);
    if (!financeId) return showError('Configure o financeiro do contrato antes de programar recebimentos.');
    if (!Number.isInteger(installment) || installment <= 0) return showError('Informe um número de parcela válido.');
    if (!receivableDraft.data_vencimento) return showError('Informe a data de vencimento.');
    if (!value || value <= 0) return showError('Informe um valor previsto maior que zero.');
    if (current && value + 0.009 < current.totalRecebido) return showError('O valor previsto não pode ser menor que o total já recebido.');

    setSaving(true);
    const payload = {
      contrato_financeiro_id: financeId,
      numero_parcela: installment,
      descricao: receivableDraft.descricao.trim() || null,
      data_vencimento: receivableDraft.data_vencimento,
      valor_previsto: roundMoney(value),
      observacoes: receivableDraft.observacoes.trim() || null,
    };
    const result = editingReceivableId
      ? await supabase.from('contratos_recebiveis').update(payload).eq('id', editingReceivableId)
      : await supabase.from('contratos_recebiveis').insert([payload]);
    setSaving(false);
    if (result.error) return showError(`Erro ao salvar parcela: ${result.error.message}`);
    showSuccess(editingReceivableId ? 'Parcela atualizada!' : 'Parcela programada!');
    resetReceivableForm();
    onSuccess();
  };

  const deleteReceivable = async (receivable: ContratoRecebivel) => {
    if (!receivable.id || !confirm(`Excluir a parcela ${receivable.numero_parcela} e todas as baixas vinculadas?`)) return;
    const { error } = await supabase.from('contratos_recebiveis').delete().eq('id', receivable.id);
    if (error) return showError(`Erro ao excluir parcela: ${error.message}`);
    showSuccess('Parcela excluída!');
    onSuccess();
  };

  const openPaymentForm = (receivable: ContratoRecebivel, payment?: ContratoBaixa) => {
    setShowReceivableForm(false);
    setEditingReceivableId(null);
    setActivePaymentReceivableId(receivable.id || null);
    setEditingPaymentId(payment?.id || null);
    setPaymentDraft(payment ? {
      data_recebimento: payment.data_recebimento,
      valor_recebido: String(payment.valor_recebido),
      forma_recebimento: payment.forma_recebimento || '',
      referencia: payment.referencia || '',
      observacoes: payment.observacoes || '',
    } : {
      data_recebimento: getLocalDateKey(),
      valor_recebido: receivable.saldoAberto > 0 ? String(receivable.saldoAberto) : '',
      forma_recebimento: '',
      referencia: '',
      observacoes: '',
    });
  };

  const closePaymentForm = () => {
    setActivePaymentReceivableId(null);
    setEditingPaymentId(null);
  };

  const savePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const receivable = summary.recebiveis.find((item) => item.id === activePaymentReceivableId);
    const currentPayment = receivable?.contratos_baixas.find((item) => item.id === editingPaymentId);
    const value = Number(paymentDraft.valor_recebido);
    if (!receivable?.id) return showError('Parcela não encontrada.');
    if (!paymentDraft.data_recebimento) return showError('Informe a data do recebimento.');
    if (!value || value <= 0) return showError('Informe um valor recebido maior que zero.');
    const available = roundMoney(receivable.saldoAberto + (currentPayment?.valor_recebido || 0));
    if (value > available + 0.009) return showError(`O valor ultrapassa o saldo disponível de ${currency(available)}.`);

    setSaving(true);
    const payload = {
      recebivel_id: receivable.id,
      data_recebimento: paymentDraft.data_recebimento,
      valor_recebido: roundMoney(value),
      forma_recebimento: paymentDraft.forma_recebimento.trim() || null,
      referencia: paymentDraft.referencia.trim() || null,
      observacoes: paymentDraft.observacoes.trim() || null,
    };
    const result = editingPaymentId
      ? await supabase.from('contratos_baixas').update(payload).eq('id', editingPaymentId)
      : await supabase.from('contratos_baixas').insert([payload]);
    setSaving(false);
    if (result.error) return showError(`Erro ao gravar baixa: ${result.error.message}`);
    showSuccess(editingPaymentId ? 'Baixa atualizada!' : 'Baixa registrada!');
    closePaymentForm();
    onSuccess();
  };

  const deletePayment = async (payment: ContratoBaixa) => {
    if (!payment.id || !confirm(`Excluir a baixa de ${currency(payment.valor_recebido)}?`)) return;
    const { error } = await supabase.from('contratos_baixas').delete().eq('id', payment.id);
    if (error) return showError(`Erro ao excluir baixa: ${error.message}`);
    showSuccess('Baixa excluída!');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm md:p-6">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-slate-50 shadow-2xl dark:bg-slate-900">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800 md:p-6">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase text-green-600">Recebimentos e baixas</p>
            <h2 className="mt-1 truncate text-lg font-black uppercase text-slate-800 dark:text-white md:text-2xl">{summary.nome}</h2>
            <p className="mt-1 text-[10px] font-bold text-slate-400">Contrato {summary.numero || 'S/N'}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" title="Fechar"><X size={20} /></button>
        </header>

        <div className="overflow-y-auto p-4 md:p-6">
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              { label: 'Líquido previsto', value: summary.liquidoContratado, color: 'text-slate-800 dark:text-white' },
              { label: 'Programado', value: summary.recebimentosProgramados, color: 'text-purple-700 dark:text-purple-300' },
              { label: 'Recebido', value: summary.recebimentosRecebidos, color: 'text-green-700 dark:text-green-300' },
              { label: 'Em aberto', value: summary.recebimentosEmAberto, color: 'text-amber-700 dark:text-amber-300' },
              { label: 'A programar', value: summary.recebimentosAProgramar, color: 'text-slate-600 dark:text-slate-300' },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-[8px] font-black uppercase text-slate-400">{item.label}</p>
                <p className={`mt-1 text-sm font-black ${item.color}`}>{currency(item.value)}</p>
              </div>
            ))}
          </section>

          {summary.recebimentosExcedentes > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              <AlertTriangle size={16} /><p className="text-[10px] font-black uppercase">Programação excede o líquido previsto em {currency(summary.recebimentosExcedentes)}</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <div><h3 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Parcelas programadas</h3><p className="mt-1 text-[9px] font-bold uppercase text-slate-400">{summary.recebiveis.length} parcela(s)</p></div>
            <button type="button" onClick={() => openReceivableForm()} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2.5 text-[10px] font-black uppercase text-white hover:bg-purple-700"><Plus size={15} /> Parcela</button>
          </div>

          {showReceivableForm && (
            <form onSubmit={saveReceivable} className="mt-4 rounded-lg border border-purple-200 bg-white p-4 dark:border-purple-800 dark:bg-slate-800">
              <div className="mb-4 flex items-center justify-between"><h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">{editingReceivableId ? 'Editar parcela' : 'Nova parcela'}</h4><button type="button" onClick={resetReceivableForm} className="p-1 text-slate-400" title="Cancelar"><X size={17} /></button></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="space-y-1"><span className="text-[9px] font-black uppercase text-slate-400">Parcela</span><input required min="1" step="1" type="number" value={receivableDraft.numero_parcela} onChange={(event) => setReceivableDraft({ ...receivableDraft, numero_parcela: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" /></label>
                <label className="space-y-1"><span className="text-[9px] font-black uppercase text-slate-400">Vencimento</span><input required type="date" value={receivableDraft.data_vencimento} onChange={(event) => setReceivableDraft({ ...receivableDraft, data_vencimento: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" /></label>
                <label className="space-y-1"><span className="text-[9px] font-black uppercase text-slate-400">Valor previsto</span><input required min="0.01" step="0.01" type="number" value={receivableDraft.valor_previsto} onChange={(event) => setReceivableDraft({ ...receivableDraft, valor_previsto: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" /></label>
                <label className="space-y-1"><span className="text-[9px] font-black uppercase text-slate-400">Descrição</span><input value={receivableDraft.descricao} onChange={(event) => setReceivableDraft({ ...receivableDraft, descricao: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" placeholder="Opcional" /></label>
              </div>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 space-y-1"><span className="text-[9px] font-black uppercase text-slate-400">Observações</span><input value={receivableDraft.observacoes} onChange={(event) => setReceivableDraft({ ...receivableDraft, observacoes: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" /></label><button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-[10px] font-black uppercase text-white disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar parcela</button></div>
            </form>
          )}

          <div className="mt-4 space-y-3">
            {summary.recebiveis.map((receivable) => {
              const status = statusConfig[receivable.status];
              const StatusIcon = status.icon;
              const paymentFormOpen = activePaymentReceivableId === receivable.id;
              return (
                <article key={receivable.id} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">Parcela {receivable.numero_parcela}{receivable.descricao ? ` · ${receivable.descricao}` : ''}</h4><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black uppercase ${status.className}`}><StatusIcon size={11} /> {status.label}</span></div><p className="mt-1 flex items-center gap-1 text-[9px] font-bold text-slate-400"><CalendarClock size={12} /> Vencimento {formatDate(receivable.data_vencimento)}</p></div>
                    <div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => openPaymentForm(receivable)} disabled={receivable.saldoAberto <= 0} className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-2 text-[9px] font-black uppercase text-green-700 hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-green-900/30 dark:text-green-300" title="Registrar baixa"><ReceiptText size={14} /> Baixa</button><button type="button" onClick={() => openReceivableForm(receivable)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar parcela"><Edit2 size={14} /></button><button type="button" onClick={() => deleteReceivable(receivable)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Excluir parcela"><Trash2 size={14} /></button></div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 text-right dark:border-slate-700"><div><p className="text-[8px] font-black uppercase text-slate-400">Previsto</p><p className="mt-1 text-xs font-black">{currency(receivable.valor_previsto)}</p></div><div><p className="text-[8px] font-black uppercase text-green-600">Recebido</p><p className="mt-1 text-xs font-black text-green-700 dark:text-green-300">{currency(receivable.totalRecebido)}</p></div><div><p className="text-[8px] font-black uppercase text-amber-600">Saldo</p><p className="mt-1 text-xs font-black text-amber-700 dark:text-amber-300">{currency(receivable.saldoAberto)}</p></div></div>

                  {paymentFormOpen && (
                    <form onSubmit={savePayment} className="mt-4 border-b border-slate-100 pb-4 dark:border-slate-700">
                      <div className="mb-3 flex items-center justify-between"><h5 className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">{editingPaymentId ? 'Editar baixa' : 'Registrar baixa'}</h5><button type="button" onClick={closePaymentForm} className="p-1 text-slate-400" title="Cancelar"><X size={16} /></button></div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"><label className="space-y-1"><span className="text-[8px] font-black uppercase text-slate-400">Data</span><input required type="date" value={paymentDraft.data_recebimento} onChange={(event) => setPaymentDraft({ ...paymentDraft, data_recebimento: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" /></label><label className="space-y-1"><span className="text-[8px] font-black uppercase text-slate-400">Valor recebido</span><input required min="0.01" step="0.01" type="number" value={paymentDraft.valor_recebido} onChange={(event) => setPaymentDraft({ ...paymentDraft, valor_recebido: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" /></label><label className="space-y-1"><span className="text-[8px] font-black uppercase text-slate-400">Forma</span><input value={paymentDraft.forma_recebimento} onChange={(event) => setPaymentDraft({ ...paymentDraft, forma_recebimento: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" placeholder="PIX, TED..." /></label><label className="space-y-1"><span className="text-[8px] font-black uppercase text-slate-400">Referência</span><input value={paymentDraft.referencia} onChange={(event) => setPaymentDraft({ ...paymentDraft, referencia: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" placeholder="Comprovante" /></label></div>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 space-y-1"><span className="text-[8px] font-black uppercase text-slate-400">Observações</span><input value={paymentDraft.observacoes} onChange={(event) => setPaymentDraft({ ...paymentDraft, observacoes: event.target.value })} className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold dark:border-slate-700 dark:bg-slate-900" /></label><button disabled={saving} type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-[10px] font-black uppercase text-white hover:bg-green-700 disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Confirmar baixa</button></div>
                    </form>
                  )}

                  {receivable.contratos_baixas.length > 0 && (
                    <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-700">
                      {receivable.contratos_baixas.map((payment) => (
                        <div key={payment.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black text-green-700 dark:text-green-300">{currency(payment.valor_recebido)} <span className="font-bold text-slate-400">em {formatDate(payment.data_recebimento)}</span></p><p className="mt-0.5 text-[8px] font-bold uppercase text-slate-400">{[payment.forma_recebimento, payment.referencia].filter(Boolean).join(' · ') || 'Baixa registrada'}</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => openPaymentForm(receivable, payment)} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Editar baixa"><Edit2 size={13} /></button><button type="button" onClick={() => deletePayment(payment)} className="inline-flex h-7 w-7 items-center justify-center rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Excluir baixa"><Trash2 size={13} /></button></div></div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
            {summary.recebiveis.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center text-xs font-bold uppercase text-slate-400 dark:border-slate-700">Nenhuma parcela programada</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
