import {
  ContratoDesconto,
  ContratoBarter,
  ContratoCumprimento,
  ContratoFinanceiro,
  ContratoFinanceiroResumo,
  ContratoRecebivel,
  FinanceiroMensal,
  RecebimentosMensais,
  StatusFinanceiro,
  TipoDesconto,
  TIPOS_DESCONTO,
} from '../data/financeiroTypes';

export const normalizeContractNumber = (value: unknown) => String(value || '')
  .trim()
  .replace(/\.0$/, '')
  .toUpperCase();

export const roundMoney = (value: number) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const getMonthKey = (value: string | null | undefined) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : '';
};

export const formatMonthLabel = (month: string) => {
  if (!/^\d{4}-\d{2}$/.test(month)) return month;
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
    .format(new Date(year, monthNumber - 1, 1))
    .replace('.', '');
};

export const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const enrichReceivable = (
  receivable: any,
  today = getLocalDateKey(),
): ContratoRecebivel => {
  const payments = (receivable.contratos_baixas || [])
    .map((payment: any) => ({
      ...payment,
      valor_recebido: Number(payment.valor_recebido) || 0,
    }))
    .sort((a: any, b: any) => String(b.data_recebimento).localeCompare(String(a.data_recebimento)));
  const expected = Number(receivable.valor_previsto) || 0;
  const received = roundMoney(payments.reduce((total: number, payment: any) => total + payment.valor_recebido, 0));
  const balance = roundMoney(Math.max(expected - received, 0));
  const isPaid = balance <= 0.009 && expected > 0;
  const isOverdue = !isPaid && Boolean(receivable.data_vencimento) && receivable.data_vencimento < today;
  const status = isPaid ? 'pago' : isOverdue ? 'vencido' : received > 0 ? 'parcial' : 'em_aberto';

  return {
    ...receivable,
    numero_parcela: Number(receivable.numero_parcela) || 1,
    valor_previsto: expected,
    contratos_baixas: payments,
    totalRecebido: received,
    saldoAberto: balance,
    status,
  };
};

export const calculateDiscount = (
  discount: ContratoDesconto,
  grossValue: number,
  volume: number,
  fixedProportion = 1,
) => {
  const value = Number(discount.valor) || 0;
  if (discount.metodo === 'percentual') return roundMoney(grossValue * (value / 100));
  if (discount.metodo === 'por_saca') return roundMoney(volume * value);
  return roundMoney(value * Math.min(Math.max(fixedProportion, 0), 1));
};

export const calculateDiscountsTotal = (
  discounts: ContratoDesconto[],
  grossValue: number,
  volume: number,
  fixedProportion = 1,
) => roundMoney(discounts.reduce(
  (total, discount) => total + calculateDiscount(discount, grossValue, volume, fixedProportion),
  0,
));

export const getFinancialStatus = (
  finance: ContratoFinanceiro | null,
  netValue: number,
): { status: StatusFinanceiro; pendencias: string[] } => {
  if (!finance) return { status: 'nao_configurado', pendencias: ['Financeiro não configurado'] };

  const pendencias: string[] = [];
  if (finance.status_preco !== 'fixado' || !finance.preco_saca || finance.preco_saca <= 0) {
    pendencias.push('Preço de venda pendente');
  }
  if (!finance.tributos_revisados) pendencias.push('Tributos não revisados');
  if (!finance.competencia) pendencias.push('Competência financeira pendente');
  if (netValue < 0) pendencias.push('Descontos maiores que o valor bruto');

  if (netValue < 0) return { status: 'inconsistente', pendencias };
  if (finance.status_preco !== 'fixado' || !finance.preco_saca || finance.preco_saca <= 0) {
    return { status: 'preco_pendente', pendencias };
  }
  if (!finance.tributos_revisados) return { status: 'tributos_pendentes', pendencias };
  if (!finance.competencia) return { status: 'competencia_pendente', pendencias };
  return { status: 'completo', pendencias: [] };
};

interface BuildSummaryInput {
  contract: any;
  finance: ContratoFinanceiro | null;
  barter?: ContratoBarter | null;
  fulfillment?: ContratoCumprimento | null;
  deliveredVolume: number;
  receivables?: ContratoRecebivel[];
}

export const buildFinancialSummary = ({
  contract,
  finance,
  barter = null,
  fulfillment = null,
  deliveredVolume,
  receivables = [],
}: BuildSummaryInput): ContratoFinanceiroResumo => {
  const contractedVolume = Number(contract.volume_total) || 0;
  const deliveredByWaybills = Math.max(Number(deliveredVolume) || 0, 0);
  const fulfilledByAllocation = fulfillment?.ativo === true;
  const allocationVolume = fulfilledByAllocation ? contractedVolume : 0;
  const effectiveDeliveredVolume = Math.max(deliveredByWaybills, allocationVolume);
  const price = finance?.status_preco === 'fixado' ? Number(finance.preco_saca) || 0 : 0;
  const realizedVolume = finance?.aceita_excedente
    ? effectiveDeliveredVolume
    : Math.min(effectiveDeliveredVolume, contractedVolume);
  const grossContracted = roundMoney(contractedVolume * price);
  const grossRealized = roundMoney(realizedVolume * price);
  const discounts = finance?.contratos_descontos || [];
  const fixedProportion = contractedVolume > 0 ? realizedVolume / contractedVolume : 0;
  const contractedDiscounts = calculateDiscountsTotal(discounts, grossContracted, contractedVolume, 1);
  const realizedDiscounts = calculateDiscountsTotal(discounts, grossRealized, realizedVolume, fixedProportion);
  const netContracted = roundMoney(grossContracted - contractedDiscounts);
  const netRealized = roundMoney(grossRealized - realizedDiscounts);
  const configurationStatus = getFinancialStatus(finance, netContracted);
  const normalizedReceivables = receivables.map((receivable) => enrichReceivable(receivable));
  const scheduledReceipts = roundMoney(normalizedReceivables.reduce((total, item) => total + item.valor_previsto, 0));
  const received = roundMoney(normalizedReceivables.reduce((total, item) => total + item.totalRecebido, 0));
  const openBalance = roundMoney(normalizedReceivables.reduce((total, item) => total + item.saldoAberto, 0));
  const overdue = roundMoney(normalizedReceivables
    .filter((item) => item.status === 'vencido')
    .reduce((total, item) => total + item.saldoAberto, 0));
  const hasOverdueReceivable = normalizedReceivables.some((item) => item.status === 'vencido');
  const hasFullySettledContract = netContracted > 0
    && scheduledReceipts >= netContracted - 0.009
    && openBalance <= 0.009
    && normalizedReceivables.length > 0
    && normalizedReceivables.every((item) => item.status === 'pago');
  const status: StatusFinanceiro = hasFullySettledContract
    ? 'baixado'
    : hasOverdueReceivable
      ? 'vencido'
      : configurationStatus.status;
  const pendencias = configurationStatus.pendencias;
  const barterBalance = roundMoney(Math.max(contractedVolume - effectiveDeliveredVolume, 0));
  const barterPercent = contractedVolume > 0
    ? Math.min(Math.max((effectiveDeliveredVolume / contractedVolume) * 100, 0), 100)
    : 0;
  const barterDeliveryStatus = fulfilledByAllocation ? 'cumprido' : 'a_cumprir';
  const barterInputValue = roundMoney(Number(barter?.valor_insumos) || 0);
  const barterDeliveredValue = roundMoney(barterInputValue * Math.min(contractedVolume > 0 ? effectiveDeliveredVolume / contractedVolume : 0, 1));
  const barterImplicitPrice = roundMoney(contractedVolume > 0 ? barterInputValue / contractedVolume : 0);
  const barterMarketValue = roundMoney(contractedVolume * (Number(barter?.preco_mercado_saca) || 0));
  const barterItemsTotal = roundMoney((barter?.contratos_barter_itens || []).reduce(
    (total, item) => total + (Number(item.valor_total) || 0),
    0,
  ));

  const discountsByType = Object.fromEntries(TIPOS_DESCONTO.map((type) => [type, 0])) as Record<TipoDesconto, number>;
  discounts.forEach((discount) => {
    discountsByType[discount.tipo] = roundMoney(
      discountsByType[discount.tipo] + calculateDiscount(discount, grossContracted, contractedVolume, 1),
    );
  });

  return {
    contratoId: contract.id,
    safraId: contract.safra_id,
    nome: contract.nome,
    numero: String(contract.numero || ''),
    armazem: contract.armazens?.nome || null,
    armazemId: contract.armazem_id || null,
    grupo: contract.grupo || null,
    tipoContrato: contract.tipo_contrato || 'nao_classificado',
    formaLiquidacao: contract.forma_liquidacao || 'nao_definida',
    tipoOutroDescricao: contract.tipo_outro_descricao || null,
    volumeContratado: contractedVolume,
    volumeEntregue: roundMoney(effectiveDeliveredVolume),
    volumeEntregueRomaneios: roundMoney(deliveredByWaybills),
    volumeCumpridoAlocacao: roundMoney(allocationVolume),
    cumpridoPorAlocacao: fulfilledByAllocation,
    cumprimento: fulfillment,
    volumeFinanceiroRealizado: roundMoney(realizedVolume),
    precoSaca: finance?.preco_saca ?? null,
    competencia: finance?.competencia || null,
    status,
    pendencias,
    financeiro: finance,
    brutoContratado: grossContracted,
    brutoRealizado: grossRealized,
    descontosContratados: contractedDiscounts,
    descontosRealizados: realizedDiscounts,
    liquidoContratado: netContracted,
    liquidoRealizado: netRealized,
    descontosPorTipo: discountsByType,
    recebiveis: normalizedReceivables,
    recebimentosProgramados: scheduledReceipts,
    recebimentosRecebidos: received,
    recebimentosEmAberto: openBalance,
    recebimentosVencidos: overdue,
    recebimentosAProgramar: roundMoney(Math.max(netContracted - scheduledReceipts, 0)),
    recebimentosExcedentes: roundMoney(Math.max(scheduledReceipts - netContracted, 0)),
    barter,
    barterSaldoSacas: barterBalance,
    barterPercentualEntregue: roundMoney(barterPercent),
    barterStatusEntrega: barterDeliveryStatus,
    barterValorInsumos: barterInputValue,
    barterValorEntregue: barterDeliveredValue,
    barterPrecoImplicitoSaca: barterImplicitPrice,
    barterValorMercado: barterMarketValue,
    barterVariacaoMercado: roundMoney(barterMarketValue - barterInputValue),
    barterTotalItens: barterItemsTotal,
    barterDivergenciaItens: roundMoney(barterItemsTotal - barterInputValue),
  };
};

export const buildMonthlyFinancials = (
  summaries: ContratoFinanceiroResumo[],
  deliveries: Array<{ contrato_id: string | null; data: string | null; sacas_liquida: number | null }>,
) => {
  const summaryByContract = new Map(summaries.map((summary) => [summary.contratoId, summary]));
  const volumeByContractAndMonth = new Map<string, number>();

  deliveries.forEach((delivery) => {
    const month = getMonthKey(delivery.data);
    if (!delivery.contrato_id || !month) return;
    const key = `${delivery.contrato_id}::${month}`;
    volumeByContractAndMonth.set(key, (volumeByContractAndMonth.get(key) || 0) + (Number(delivery.sacas_liquida) || 0));
  });

  const totals = new Map<string, FinanceiroMensal>();
  volumeByContractAndMonth.forEach((deliveredVolume, key) => {
    const [contractId, month] = key.split('::');
    const summary = summaryByContract.get(contractId);
    if (!summary?.financeiro || !summary.precoSaca) return;

    const remainingBeforeMonth = Array.from(volumeByContractAndMonth.entries())
      .filter(([otherKey]) => otherKey.startsWith(`${contractId}::`) && otherKey.split('::')[1] < month)
      .reduce((total, [, volume]) => total + volume, 0);
    const availableVolume = summary.financeiro.aceita_excedente
      ? deliveredVolume
      : Math.max(Math.min(deliveredVolume, summary.volumeContratado - remainingBeforeMonth), 0);
    const gross = roundMoney(availableVolume * summary.precoSaca);
    const fixedProportion = summary.volumeContratado > 0 ? availableVolume / summary.volumeContratado : 0;
    const discounts = calculateDiscountsTotal(
      summary.financeiro.contratos_descontos,
      gross,
      availableVolume,
      fixedProportion,
    );
    const current = totals.get(month) || { mes: month, label: formatMonthLabel(month), bruto: 0, descontos: 0, liquido: 0 };
    current.bruto = roundMoney(current.bruto + gross);
    current.descontos = roundMoney(current.descontos + discounts);
    current.liquido = roundMoney(current.liquido + gross - discounts);
    totals.set(month, current);
  });

  return Array.from(totals.values()).sort((a, b) => a.mes.localeCompare(b.mes));
};

export const buildMonthlyReceipts = (summaries: ContratoFinanceiroResumo[]) => {
  const totals = new Map<string, RecebimentosMensais>();
  const ensureMonth = (month: string) => {
    if (!totals.has(month)) {
      totals.set(month, { mes: month, label: formatMonthLabel(month), previsto: 0, recebido: 0 });
    }
    return totals.get(month)!;
  };

  summaries.forEach((summary) => summary.recebiveis.forEach((receivable) => {
    const dueMonth = getMonthKey(receivable.data_vencimento);
    if (dueMonth) {
      const current = ensureMonth(dueMonth);
      current.previsto = roundMoney(current.previsto + receivable.valor_previsto);
    }
    receivable.contratos_baixas.forEach((payment) => {
      const paymentMonth = getMonthKey(payment.data_recebimento);
      if (!paymentMonth) return;
      const current = ensureMonth(paymentMonth);
      current.recebido = roundMoney(current.recebido + payment.valor_recebido);
    });
  }));

  return Array.from(totals.values()).sort((a, b) => a.mes.localeCompare(b.mes));
};
