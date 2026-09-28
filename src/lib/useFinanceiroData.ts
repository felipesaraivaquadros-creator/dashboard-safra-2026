"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContratoFinanceiro, ContratoFinanceiroResumo, ContratoRecebivel, TipoDesconto, TIPOS_DESCONTO } from '../data/financeiroTypes';
import { supabase } from '../integrations/supabase/client';
import { buildFinancialSummary, buildMonthlyFinancials, buildMonthlyReceipts, roundMoney } from './financeiroCalculations';

export const useFinanceiroData = (safraId: string) => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [finances, setFinances] = useState<ContratoFinanceiro[]>([]);
  const [receivables, setReceivables] = useState<ContratoRecebivel[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schemaReady, setSchemaReady] = useState(true);
  const [receiptsReady, setReceiptsReady] = useState(true);
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
      setContracts(loadedContracts);
      setDeliveries(loadedDeliveries);

      const financeQuery = loadedContracts.length > 0
        ? supabase
          .from('contratos_financeiros')
          .select('*, contratos_descontos(*)')
          .in('contrato_id', loadedContracts.map((contract) => contract.id))
        : supabase.from('contratos_financeiros').select('*, contratos_descontos(*)').limit(1);

      const financeResult = await financeQuery;
      if (!mounted) return;

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
        deliveredVolume: deliveredByContract.get(contract.id) || 0,
        receivables: finance?.id ? receivablesByFinance.get(finance.id) || [] : [],
      });
    });
  }, [contracts, finances, deliveries, receivables]);

  const monthly = useMemo(() => buildMonthlyFinancials(summaries, deliveries), [summaries, deliveries]);
  const receiptsMonthly = useMemo(() => buildMonthlyReceipts(summaries), [summaries]);

  const totals = useMemo(() => {
    const discountsByType = Object.fromEntries(TIPOS_DESCONTO.map((type) => [type, 0])) as Record<TipoDesconto, number>;
    summaries.forEach((summary) => {
      TIPOS_DESCONTO.forEach((type) => {
        discountsByType[type] = roundMoney(discountsByType[type] + summary.descontosPorTipo[type]);
      });
    });

    return {
      brutoContratado: roundMoney(summaries.reduce((total, item) => total + item.brutoContratado, 0)),
      brutoRealizado: roundMoney(summaries.reduce((total, item) => total + item.brutoRealizado, 0)),
      descontosContratados: roundMoney(summaries.reduce((total, item) => total + item.descontosContratados, 0)),
      descontosRealizados: roundMoney(summaries.reduce((total, item) => total + item.descontosRealizados, 0)),
      liquidoContratado: roundMoney(summaries.reduce((total, item) => total + item.liquidoContratado, 0)),
      liquidoRealizado: roundMoney(summaries.reduce((total, item) => total + item.liquidoRealizado, 0)),
      incompletos: summaries.filter((item) => item.status !== 'completo').length,
      descontosPorTipo: discountsByType,
      recebimentosProgramados: roundMoney(summaries.reduce((total, item) => total + item.recebimentosProgramados, 0)),
      recebimentosRecebidos: roundMoney(summaries.reduce((total, item) => total + item.recebimentosRecebidos, 0)),
      recebimentosEmAberto: roundMoney(summaries.reduce((total, item) => total + item.recebimentosEmAberto, 0)),
      recebimentosVencidos: roundMoney(summaries.reduce((total, item) => total + item.recebimentosVencidos, 0)),
      recebimentosAProgramar: roundMoney(summaries.reduce((total, item) => total + item.recebimentosAProgramar, 0)),
      recebimentosExcedentes: roundMoney(summaries.reduce((total, item) => total + item.recebimentosExcedentes, 0)),
    };
  }, [summaries]);

  return {
    loading,
    schemaReady,
    receiptsReady,
    contracts,
    deliveries,
    summaries,
    monthly,
    receiptsMonthly,
    totals,
    refresh,
  };
};
