import { supabase } from '../integrations/supabase/client';
import { Romaneio } from '../data/types';

export async function syncRomaneiosToSupabase(safraId: string, dados: Romaneio[]) {
  console.log(`[Sync] Iniciando sincronização da safra ${safraId}...`);

  // 1. Buscar mapeamentos do banco
  const { data: fazendas, error: fError } = await supabase.from('fazendas').select('id, nome');
  const { data: armazens, error: aError } = await supabase.from('armazens').select('id, nome');
  const { data: contratos, error: cError } = await supabase.from('contratos').select('id, numero').eq('safra_id', safraId);

  if (fError || aError || cError) {
    console.error("[Sync] Erro ao buscar metadados:", { fError, aError, cError });
    throw new Error("Não foi possível carregar as tabelas de apoio. Verifique se as tabelas 'fazendas' e 'armazens' existem.");
  }

  const fazendaMap = Object.fromEntries(fazendas?.map(f => [f.nome, f.id]) || []);
  const armazemMap = Object.fromEntries(armazens?.map(a => [a.nome, a.id]) || []);
  const contratoMap = Object.fromEntries(contratos?.map(c => [c.numero, c.id]) || []);

  // 2. Preparar dados
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

  // 3. Limpar e Inserir
  console.log(`[Sync] Removendo dados antigos da safra ${safraId}...`);
  const { error: delError } = await supabase.from('romaneios').delete().eq('safra_id', safraId);
  if (delError) throw delError;
  
  console.log(`[Sync] Inserindo ${payload.length} novos registros...`);
  const chunkSize = 100;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error: insError } = await supabase.from('romaneios').insert(chunk);
    if (insError) throw insError;
  }

  return payload.length;
}