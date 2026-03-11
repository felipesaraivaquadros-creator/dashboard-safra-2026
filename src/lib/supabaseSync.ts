import { supabase } from '../integrations/supabase/client';
import { Romaneio } from '../data/types';
import { getSafraConfig } from '../data/safraConfig';

export async function syncRomaneiosToSupabase(safraId: string, dados: Romaneio[]) {
  console.log(`[Sync] Iniciando sincronização da safra ${safraId}...`);
  const config = getSafraConfig(safraId);

  try {
    // 1. Garantir que Fazendas e Armazéns existem (Upsert)
    const fazendasUnicas = Array.from(new Set(dados.map(d => d.fazenda).filter(Boolean)));
    const armazensUnicos = Array.from(new Set(dados.map(d => d.armazem).filter(Boolean)));

    if (fazendasUnicas.length > 0) {
      await supabase
        .from('fazendas')
        .upsert(fazendasUnicas.map(nome => ({ nome })), { onConflict: 'nome' });
    }
    
    if (armazensUnicos.length > 0) {
      await supabase
        .from('armazens')
        .upsert(armazensUnicos.map(nome => ({ nome })), { onConflict: 'nome' });
    }

    // 2. Sincronizar Contratos da Configuração (Novo)
    // Isso garante que contratos como "Arrendamento CT" subam para o banco
    const contratosConfig = Object.entries(config.VOLUMES_CONTRATADOS).map(([numero, info]) => ({
      safra_id: safraId,
      numero: numero,
      nome: info.nome,
      volume_total: info.total
    }));

    if (contratosConfig.length > 0) {
      await supabase
        .from('contratos')
        .upsert(contratosConfig, { onConflict: 'safra_id, numero' });
    }

    // 3. Buscar os IDs gerados para mapeamento
    const { data: fazendasDB } = await supabase.from('fazendas').select('id, nome');
    const { data: armazensDB } = await supabase.from('armazens').select('id, nome');
    const { data: contratosDB } = await supabase.from('contratos').select('id, numero').eq('safra_id', safraId);

    const fazendaMap = Object.fromEntries(fazendasDB?.map(f => [f.nome, f.id]) || []);
    const armazemMap = Object.fromEntries(armazensDB?.map(a => [a.nome, a.id]) || []);
    const contratoMap = Object.fromEntries(contratosDB?.map(c => [String(c.numero), c.id]) || []);

    // 4. Preparar os Romaneios
    const payloadRomaneios = dados.map(d => {
      const nContrato = String(d.ncontrato || '').trim().replace(/\.0$/, '').toUpperCase();
      return {
        safra_id: safraId,
        data: d.data,
        nfe: d.nfe,
        numero_romaneio: d.numero,
        emitente: d.emitente,
        tipo_nf: d.tipoNF,
        talhao: d.talhao,
        motorista: d.motorista,
        placa: d.placa,
        peso_bruto_kg: d.pesoBrutoKg,
        peso_liquid_kg: d.pesoLiquidoKg,
        sacas_bruto: d.sacasBruto,
        sacas_liquida: d.sacasLiquida,
        umidade: d.umidade || 0,
        impureza: d.impureza || 0,
        ardido: d.ardido || 0,
        avariados: d.avariados || 0,
        quebrados: d.quebrados || 0,
        contaminantes: d.contaminantes || 0,
        preco_frete: d.precofrete,
        fazenda_id: fazendaMap[d.fazenda || ''] || null,
        armazem_id: armazemMap[d.armazem || ''] || null,
        armazem_nome: d.armazem,
        contrato_id: contratoMap[nContrato] || null
      };
    });

    // 5. Limpar e Inserir Romaneios
    await supabase.from('romaneios').delete().eq('safra_id', safraId);
    const chunkSize = 100;
    for (let i = 0; i < payloadRomaneios.length; i += chunkSize) {
      await supabase.from('romaneios').insert(payloadRomaneios.slice(i, i + chunkSize));
    }

    // 6. Calcular e Atualizar Tabela de Saldos
    const saldosAgrupados: Record<string, { sacas: number, kg: number, nome: string }> = {};
    dados.forEach(d => {
      const aNome = d.armazem || "Outros";
      const aId = armazemMap[aNome];
      if (aId) {
        if (!saldosAgrupados[aId]) saldosAgrupados[aId] = { sacas: 0, kg: 0, nome: aNome };
        saldosAgrupados[aId].sacas += Number(d.sacasLiquida) || 0;
        saldosAgrupados[aId].kg += Number(d.pesoLiquidoKg) || 0;
      }
    });

    const payloadSaldos = Object.entries(saldosAgrupados).map(([id, val]) => ({
      safra_id: safraId,
      armazem_id: id,
      armazem_nome: val.nome,
      total_sacas: parseFloat(val.sacas.toFixed(2)),
      total_kg: Math.round(val.kg)
    }));

    for (const s of payloadSaldos) {
      await supabase.from('saldos').upsert(s, { onConflict: 'safra_id, armazem_id' });
    }

    return payloadRomaneios.length;
  } catch (error: any) {
    console.error("[Sync Error]", error);
    throw error;
  }
}