import {
  ContratoDesconto,
  ContratoFinanceiro,
  ContratoFinanceiroResumo,
  FinanceiroMensal,
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
  deliveredVolume: number;
}

export const buildFinancialSummary = ({ contract, finance, deliveredVolume }: BuildSummaryInput): ContratoFinanceiroResumo => {
  const contractedVolume = Number(contract.volume_total) || 0;
  const price = finance?.status_preco === 'fixado' ? Number(finance.preco_saca) || 0 : 0;
  const realizedVolume = finance?.aceita_excedente
    ? deliveredVolume
    : Math.min(deliveredVolume, contractedVolume);
  const grossContracted = roundMoney(contractedVolume * price);
  const grossRealized = roundMoney(realizedVolume * price);
  const discounts = finance?.contratos_descontos || [];
  const fixedProportion = contractedVolume > 0 ? realizedVolume / contractedVolume : 0;
  const contractedDiscounts = calculateDiscountsTotal(discounts, grossContracted, contractedVolume, 1);
  const realizedDiscounts = calculateDiscountsTotal(discounts, grossRealized, realizedVolume, fixedProportion);
  const netContracted = roundMoney(grossContracted - contractedDiscounts);
  const netRealized = roundMoney(grossRealized - realizedDiscounts);
  const { status, pendencias } = getFinancialStatus(finance, netContracted);

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
    volumeContratado: contractedVolume,
    volumeEntregue: roundMoney(deliveredVolume),
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
