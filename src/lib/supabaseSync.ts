import { supabase } from '../integrations/supabase/client';
import { Romaneio } from '../data/types';

export async function syncRomaneiosToSupabase(safraId: string, dados: Romaneio[]) {
  console.log(`[Sync] Iniciando sincronização da safra ${safraId}...`);

  // 1. Garantir que Fazendas e Armazéns existem (Upsert)
  const fazendasUnicas = Array.from(new Set(dados.map(d => d.fazenda).filter(Boolean)));
  const armazensUnicos = Array.from(new Set(dados.map(d => d.armazem).filter(Boolean)));

  if (fazendasUnicas.length > 0) {
    await supabase.from('fazendas').upsert(fazendasUnicas.map(nome => ({ nome })), { onConflict: 'nome' });
  }
  if (armazensUnicos.length > 0) {
    await supabase.from('armazens').upsert(armazensUnicos.map(nome => ({ nome })), { onConflict: 'nome' });
  }

  // 2. Buscar mapeamentos atualizados
  const { data: fazendas } = await supabase.from('fazendas').select('id, nome');
  const { data: armazens } = await supabase.from('armazens').select('id, nome');
  const { data: contratos } = await supabase.from('contratos').select('id, numero').eq('safra_id', safraId);

  const fazendaMap = Object.fromEntries(fazendas?.map(f => [f.nome, f.id]) || []);
  const armazemMap = Object.fromEntries(armazens?.map(a => [a.nome, a.id]) || []);
  const contratoMap = Object.fromEntries(contratos?.map(c => [c.numero, c.id]) || []);

  // 3. Preparar dados
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

  // 4. Limpar e Inserir em lotes
  await supabase.from('romaneios').delete().eq('safra_id', safraId);
  
  const chunkSize = 50;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await supabase.from('romaneios').insert(chunk);
    if (error) throw error;
  }

  return payload.length;
}