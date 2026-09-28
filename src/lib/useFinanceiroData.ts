"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContratoBarter, ContratoCumprimento, ContratoFinanceiro, ContratoFinanceiroResumo, ContratoRecebivel, TipoDesconto, TIPOS_DESCONTO } from '../data/financeiroTypes';
import { supabase } from '../integrations/supabase/client';
import { buildFinancialSummary, buildMonthlyFinancials, buildMonthlyReceipts, roundMoney } from './financeiroCalculations';

export const useFinanceiroData = (safraId: string) => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [finances, setFinances] = useState<ContratoFinanceiro[]>([]);
  const [barters, setBarters] = useState<ContratoBarter[]>([]);
  const [fulfillments, setFulfillments] = useState<ContratoCumprimento[]>([]);
  const [receivables, setReceivables] = useState<ContratoRecebivel[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [receiptsReady, setReceiptsReady] = useState(true);
  const [classificationReady, setClassificationReady] = useState(true);
  const [barterReady, setBarterReady] = useState(true);
  const [fulfillmentReady, setFulfillmentReady] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  const refresh = useCallback(() => setRefreshTick((current) => current + 1), []);

  useEffect(() => {
    if (!safraId) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const [contractsResult, deliveriesResult] = await Promise.all([
        supabase
          .from('contratos')
          .select('id, safra_id, nome, numero, volume_total, armazem_id, grupo, created_at, armazens(nome)')
          .eq('safra_id', safraId)
          .order('created_at', { ascending: false }),
        supabase
          .from('romaneios')
          .select('contrato_id, data, sacas_liquida')
          .eq('safra_id', safraId)
          .not('contrato_id', 'is', null),
      ]);

      if (!mounted) return;
      const loadedContracts = contractsResult.data || [];
      const loadedDeliveries = deliveriesResult.data || [];
      setDeliveries(loadedDeliveries);

      const contractIds = loadedContracts.map((contract) => contract.id);
      const classificationQuery = contractIds.length > 0
        ? supabase
          .from('contratos')
          .select('id, tipo_contrato, forma_liquidacao, tipo_outro_descricao')
          .in('id', contractIds)
        : supabase.from('contratos').select('id, tipo_contrato, forma_liquidacao, tipo_outro_descricao').limit(1);

      const barterQuery = contractIds.length > 0
        ? supabase
          .from('contratos_barter')
          .select('*, contratos_barter_itens(*)')
          .in('contrato_id', contractIds)
        : supabase.from('contratos_barter').select('*, contratos_barter_itens(*)').limit(1);

      const financeQuery = loadedContracts.length > 0
        ? supabase
          .from('contratos_financeiros')
          .select('*, contratos_descontos(*)')
          .in('contrato_id', loadedContracts.map((contract) => contract.id))
        : supabase.from('contratos_financeiros').select('*, contratos_descontos(*)').limit(1);

      const fulfillmentQuery = contractIds.length > 0
        ? supabase
          .from('contratos_cumprimentos')
          .select('*')
          .in('contrato_id', contractIds)
        : supabase.from('contratos_cumprimentos').select('*').limit(1);

      const [financeResult, classificationResult, barterResult, fulfillmentResult] = await Promise.all([
        financeQuery,
        classificationQuery,
        barterQuery,
        fulfillmentQuery,
      ]);
      if (!mounted) return;

      if (classificationResult.error) {
        setClassificationReady(false);
        setContracts(loadedContracts);
      } else {
        const classificationById = new Map((classificationResult.data || []).map((item: any) => [item.id, item]));
        setClassificationReady(true);
        setContracts(loadedContracts.map((contract) => ({
          ...contract,
          ...(classificationById.get(contract.id) || {}),
        })));
      }

      if (barterResult.error) {
        setBarterReady(false);
        setBarters([]);
      } else {
        setBarterReady(true);
        setBarters((barterResult.data || []).map((barter: any) => ({
          ...barter,
          valor_insumos: Number(barter.valor_insumos) || 0,
          preco_referencia_saca: barter.preco_referencia_saca === null ? null : Number(barter.preco_referencia_saca),
          preco_mercado_saca: barter.preco_mercado_saca === null ? null : Number(barter.preco_mercado_saca),
          contratos_barter_itens: (barter.contratos_barter_itens || []).map((item: any) => ({
            ...item,
            quantidade: item.quantidade === null ? null : Number(item.quantidade),
            valor_unitario: item.valor_unitario === null ? null : Number(item.valor_unitario),
            valor_total: Number(item.valor_total) || 0,
          })),
        })));
      }

      if (fulfillmentResult.error) {
        setFulfillmentReady(false);
        setFulfillments([]);
      } else {
        setFulfillmentReady(true);
        setFulfillments((fulfillmentResult.data || []).map((fulfillment: any) => ({
          ...fulfillment,
          volume_sacas: Number(fulfillment.volume_sacas) || 0,
        })) as ContratoCumprimento[]);
      }

      if (financeResult.error) {
        setSchemaReady(false);
        setReceiptsReady(false);
        setFinances([]);
        setReceivables([]);
      } else {
        const loadedFinances = (financeResult.data || []).map((finance: any) => ({
          ...finance,
          preco_saca: finance.preco_saca === null ? null : Number(finance.preco_saca),
          contratos_descontos: (finance.contratos_descontos || []).map((discount: any) => ({
            ...discount,
            valor: Number(discount.valor) || 0,
          })),
        }));
        setSchemaReady(true);
        setFinances(loadedFinances);

        const financeIds = loadedFinances.map((finance: any) => finance.id).filter(Boolean);
        const receiptsQuery = financeIds.length > 0
          ? supabase
            .from('contratos_recebiveis')
            .select('*, contratos_baixas(*)')
            .in('contrato_financeiro_id', financeIds)
            .order('data_vencimento', { ascending: true })
          : supabase.from('contratos_recebiveis').select('*, contratos_baixas(*)').limit(1);
        const receiptsResult = await receiptsQuery;
        if (!mounted) return;
        if (receiptsResult.error) {
          setReceiptsReady(false);
          setReceivables([]);
        } else {
          setReceiptsReady(true);
          setReceivables((receiptsResult.data || []) as ContratoRecebivel[]);
        }
      }
      setLoading(false);
    };

    load();
    return () => { mounted = false; };
  }, [safraId, refreshTick]);

  const summaries = useMemo<ContratoFinanceiroResumo[]>(() => {
    const financeByContract = new Map(finances.map((finance) => [finance.contrato_id, finance]));
    const barterByContract = new Map(barters.map((barter) => [barter.contrato_id, barter]));
    const fulfillmentByContract = new Map(fulfillments.map((fulfillment) => [fulfillment.contrato_id, fulfillment]));
    const receivablesByFinance = new Map<string, ContratoRecebivel[]>();
    receivables.forEach((receivable) => {
      const current = receivablesByFinance.get(receivable.contrato_financeiro_id) || [];
      current.push(receivable);
      receivablesByFinance.set(receivable.contrato_financeiro_id, current);
    });
    const deliveredByContract = new Map<string, number>();
    deliveries.forEach((delivery) => {
      if (!delivery.contrato_id) return;
      deliveredByContract.set(
        delivery.contrato_id,
        (deliveredByContract.get(delivery.contrato_id) || 0) + (Number(delivery.sacas_liquida) || 0),
      );
    });

    return contracts.map((contract) => {
      const finance = financeByContract.get(contract.id) || null;
      return buildFinancialSummary({
        contract,
        finance,
        barter: barterByContract.get(contract.id) || null,
        fulfillment: fulfillmentByContract.get(contract.id) || null,
        deliveredVolume: deliveredByContract.get(contract.id) || 0,
        receivables: finance?.id ? receivablesByFinance.get(finance.id) || [] : [],
      });
    });
  }, [contracts, finances, barters, fulfillments, deliveries, receivables]);

  const monthly = useMemo(() => buildMonthlyFinancials(
    summaries.filter((item) => item.tipoContrato !== 'barter'),
    deliveries,
  ), [summaries, deliveries]);
  const receiptsMonthly = useMemo(() => buildMonthlyReceipts(
    summaries.filter((item) => item.tipoContrato !== 'barter'),
  ), [summaries]);

  const totals = useMemo(() => {
    const financialSummaries = summaries.filter((item) => item.tipoContrato !== 'barter');
    const discountsByType = Object.fromEntries(TIPOS_DESCONTO.map((type) => [type, 0])) as Record<TipoDesconto, number>;
    financialSummaries.forEach((summary) => {
      TIPOS_DESCONTO.forEach((type) => {
        discountsByType[type] = roundMoney(discountsByType[type] + summary.descontosPorTipo[type]);
      });
    });

    return {
      brutoContratado: roundMoney(financialSummaries.reduce((total, item) => total + item.brutoContratado, 0)),
      brutoRealizado: roundMoney(financialSummaries.reduce((total, item) => total + item.brutoRealizado, 0)),
      descontosContratados: roundMoney(financialSummaries.reduce((total, item) => total + item.descontosContratados, 0)),
      descontosRealizados: roundMoney(financialSummaries.reduce((total, item) => total + item.descontosRealizados, 0)),
      liquidoContratado: roundMoney(financialSummaries.reduce((total, item) => total + item.liquidoContratado, 0)),
      liquidoRealizado: roundMoney(financialSummaries.reduce((total, item) => total + item.liquidoRealizado, 0)),
      incompletos: financialSummaries.filter((item) => item.status !== 'completo').length,
      descontosPorTipo: discountsByType,
      recebimentosProgramados: roundMoney(financialSummaries.reduce((total, item) => total + item.recebimentosProgramados, 0)),
      recebimentosRecebidos: roundMoney(financialSummaries.reduce((total, item) => total + item.recebimentosRecebidos, 0)),
      recebimentosEmAberto: roundMoney(financialSummaries.reduce((total, item) => total + item.recebimentosEmAberto, 0)),
      recebimentosVencidos: roundMoney(financialSummaries.reduce((total, item) => total + item.recebimentosVencidos, 0)),
      recebimentosAProgramar: roundMoney(financialSummaries.reduce((total, item) => total + item.recebimentosAProgramar, 0)),
      recebimentosExcedentes: roundMoney(financialSummaries.reduce((total, item) => total + item.recebimentosExcedentes, 0)),
      contratosVenda: summaries.filter((item) => item.tipoContrato === 'venda').length,
      contratosBarter: summaries.filter((item) => item.tipoContrato === 'barter').length,
      contratosMistos: summaries.filter((item) => item.tipoContrato === 'misto').length,
      contratosNaoClassificados: summaries.filter((item) => item.tipoContrato === 'nao_classificado').length,
      barterVolumeContratado: roundMoney(summaries
        .filter((item) => item.tipoContrato === 'barter' || item.tipoContrato === 'misto')
        .reduce((total, item) => total + item.volumeContratado, 0)),
      barterVolumeEntregue: roundMoney(summaries
        .filter((item) => item.tipoContrato === 'barter' || item.tipoContrato === 'misto')
        .reduce((total, item) => total + item.volumeEntregue, 0)),
      barterSaldoSacas: roundMoney(summaries
        .filter((item) => item.tipoContrato === 'barter' || item.tipoContrato === 'misto')
        .reduce((total, item) => total + item.barterSaldoSacas, 0)),
      barterValorInsumos: roundMoney(summaries.reduce((total, item) => total + item.barterValorInsumos, 0)),
      barterValorEntregue: roundMoney(summaries.reduce((total, item) => total + item.barterValorEntregue, 0)),
      barterValorMercado: roundMoney(summaries.reduce((total, item) => total + item.barterValorMercado, 0)),
      barterVariacaoMercado: roundMoney(summaries.reduce((total, item) => total + item.barterVariacaoMercado, 0)),
      barterPendentes: summaries.filter((item) => (
        (item.tipoContrato === 'barter' || item.tipoContrato === 'misto')
        && (!item.barter || item.barter.status_conciliacao !== 'conciliado')
      )).length,
    };
  }, [summaries]);

  return {
    loading,
    schemaReady,
    receiptsReady,
    classificationReady,
    barterReady,
    fulfillmentReady,
    contracts,
    barters,
    fulfillments,
    deliveries,
    summaries,
    monthly,
    receiptsMonthly,
    totals,
    refresh,
  };
};
