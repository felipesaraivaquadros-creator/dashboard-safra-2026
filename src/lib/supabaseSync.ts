import { supabase } from '../integrations/supabase/client';
import { Romaneio } from '../data/types';
import { getSafraConfig } from '../data/safraConfig';

const normalizeText = (value: any) => String(value || '').trim();
const normalizeMapKey = (value: any) => normalizeText(value).replace(/\.0$/, '').toUpperCase();

export async function syncRomaneiosToSupabase(safraId: string, dados: Romaneio[]) {
  console.log(`[Sync] Iniciando sincronização da safra ${safraId}...`);
  const config = getSafraConfig(safraId);

  try {
    // 1. Limpeza e Normalização de nomes para evitar duplicidade por espaços ou case
    const fazendasUnicas = Array.from(new Set(dados.map(d => d.fazenda?.trim()).filter(Boolean)));
    const armazensUnicos = Array.from(new Set(dados.map(d => d.armazem?.trim()).filter(Boolean)));

    // 2. Garantir que Fazendas e Armazéns existem (Upsert)
    if (fazendasUnicas.length > 0) {
      const { error } = await supabase
        .from('fazendas')
        .upsert(fazendasUnicas.map(nome => ({ nome })), { onConflict: 'nome' });
      if (error) throw error;
    }
    
    if (armazensUnicos.length > 0) {
      const { error } = await supabase
        .from('armazens')
        .upsert(armazensUnicos.map(nome => ({ nome })), { onConflict: 'nome' });
      if (error) throw error;
    }

    // 3. Sincronizar Contratos da Configuração local para o Banco
    const contratosConfig = Object.entries(config.VOLUMES_CONTRATADOS).map(([numero, info]) => ({
      safra_id: safraId,
      numero: String(numero).trim(),
      nome: info.nome,
      volume_total: info.total
    }));

    const contratosImportados = dados
      .map(d => {
        const numero = normalizeMapKey(d.ncontrato || d.contrato);
        if (!numero || numero === 'S/C') return null;
        return {
          safra_id: safraId,
          numero,
          nome: normalizeText(d.contrato) || numero,
          volume_total: 0
        };
      })
      .filter(Boolean) as { safra_id: string; numero: string; nome: string; volume_total: number }[];

    const contratosUnicos = Array.from(new Map(
      [...contratosConfig, ...contratosImportados].map(contrato => [normalizeMapKey(contrato.numero), contrato])
    ).values());

    if (contratosUnicos.length > 0) {
      const { error } = await supabase
        .from('contratos')
        .upsert(contratosUnicos, { onConflict: 'safra_id,numero' });
      if (error) throw error;
    }

    // 4. Buscar os IDs do banco para fazer o de-para (mapeamento)
    const [
      { data: fazendasDB, error: fazendasError },
      { data: armazensDB, error: armazensError },
      { data: contratosDB, error: contratosError }
    ] = await Promise.all([
      supabase.from('fazendas').select('id, nome'),
      supabase.from('armazens').select('id, nome'),
      supabase.from('contratos').select('id, numero').eq('safra_id', safraId)
    ]);

    if (fazendasError) throw fazendasError;
    if (armazensError) throw armazensError;
    if (contratosError) throw contratosError;

    const fazendaMap = Object.fromEntries(fazendasDB?.map(f => [normalizeMapKey(f.nome), f.id]) || []);
    const armazemMap = Object.fromEntries(armazensDB?.map(a => [normalizeMapKey(a.nome), a.id]) || []);
    const contratoMap = Object.fromEntries(contratosDB?.map(c => [normalizeMapKey(c.numero), c.id]) || []);

    // 5. Preparar os Romaneios para inserção
    const payloadRomaneios = dados.map(d => {
      const nContrato = normalizeMapKey(d.ncontrato || d.contrato);
      const fazendaNome = normalizeText(d.fazenda);
      const armazemNome = normalizeText(d.armazem);

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
        cidade_entrega: d.cidadeEntrega, // Campo adicionado
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
        fazenda_id: fazendaMap[normalizeMapKey(fazendaNome)] || null,
        armazem_id: armazemMap[normalizeMapKey(armazemNome)] || null,
        armazem_nome: armazemNome,
        contrato_id: contratoMap[nContrato] || null
      };
    });

    // 6. Substituição Atômica: Deleta os antigos daquela safra e insere os novos
    const { error: deleteError } = await supabase.from('romaneios').delete().eq('safra_id', safraId);
    if (deleteError) throw deleteError;
    
    const chunkSize = 100;
    for (let i = 0; i < payloadRomaneios.length; i += chunkSize) {
      const { error } = await supabase.from('romaneios').insert(payloadRomaneios.slice(i, i + chunkSize));
      if (error) throw error;
    }

    // 7. Recalcular Tabela de Saldos Físicos
    const saldosAgrupados: Record<string, { sacas: number, kg: number, nome: string }> = {};
    dados.forEach(d => {
      const aNome = d.armazem?.trim() || "Outros";
      const aId = armazemMap[normalizeMapKey(aNome)];
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
      const { error } = await supabase.from('saldos').upsert(s, { onConflict: 'safra_id,armazem_id' });
      if (error) throw error;
    }

    return payloadRomaneios.length;
  } catch (error: any) {
    console.error("[Sync Error]", error);
    throw error;
  }
}
