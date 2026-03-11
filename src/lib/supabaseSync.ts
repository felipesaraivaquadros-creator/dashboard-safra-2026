import { supabase } from '../integrations/supabase/client';
import { Romaneio } from '../data/types';

export async function syncRomaneiosToSupabase(safraId: string, dados: Romaneio[]) {
  console.log(`[Sync] Iniciando sincronização da safra ${safraId}...`);

  try {
    // 1. Garantir que Fazendas e Armazéns existem (Upsert)
    const fazendasUnicas = Array.from(new Set(dados.map(d => d.fazenda).filter(Boolean)));
    const armazensUnicos = Array.from(new Set(dados.map(d => d.armazem).filter(Boolean)));

    if (fazendasUnicas.length > 0) {
      console.log("[Sync] Atualizando fazendas...");
      const { error: fErr } = await supabase.from('fazendas').upsert(
        fazendasUnicas.map(nome => ({ nome })), 
        { onConflict: 'nome' }
      );
      if (fErr) throw new Error(`Erro ao salvar fazendas: ${fErr.message}`);
    }
    
    if (armazensUnicos.length > 0) {
      console.log("[Sync] Atualizando armazéns...");
      const { error: aErr } = await supabase.from('armazens').upsert(
        armazensUnicos.map(nome => ({ nome })), 
        { onConflict: 'nome' }
      );
      if (aErr) throw new Error(`Erro ao salvar armazéns: ${aErr.message}`);
    }

    // 2. Buscar mapeamentos atualizados para vincular os IDs
    const { data: fazendas } = await supabase.from('fazendas').select('id, nome');
    const { data: armazens } = await supabase.from('armazens').select('id, nome');
    const { data: contratos } = await supabase.from('contratos').select('id, numero').eq('safra_id', safraId);

    const fazendaMap = Object.fromEntries(fazendas?.map(f => [f.nome, f.id]) || []);
    const armazemMap = Object.fromEntries(armazens?.map(a => [a.nome, a.id]) || []);
    const contratoMap = Object.fromEntries(contratos?.map(c => [String(c.numero), c.id]) || []);

    // 3. Preparar dados para inserção
    const payload = dados.map(d => {
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
        peso_liquido_kg: d.pesoLiquidoKg,
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
        contrato_id: contratoMap[nContrato] || null
      };
    });

    // 4. Limpar registros antigos desta safra e inserir os novos
    console.log("[Sync] Removendo romaneios antigos...");
    const { error: delErr } = await supabase.from('romaneios').delete().eq('safra_id', safraId);
    if (delErr) throw new Error(`Erro ao limpar dados antigos: ${delErr.message}`);
    
    console.log(`[Sync] Inserindo ${payload.length} novos registros...`);
    
    // Inserção em lotes para evitar sobrecarga
    const chunkSize = 50;
    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize);
      const { error: insErr } = await supabase.from('romaneios').insert(chunk);
      if (insErr) throw new Error(`Erro ao inserir lote ${i/chunkSize + 1}: ${insErr.message}`);
    }

    return payload.length;
  } catch (error: any) {
    console.error("[Sync Error]", error);
    throw error;
  }
}