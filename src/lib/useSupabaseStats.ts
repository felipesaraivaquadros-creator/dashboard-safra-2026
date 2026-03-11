"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export function useSupabaseStats(safraId: string) {
  const [dbStats, setDbStats] = useState<{ count: number, totalSacas: number, totalKg: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDbStats = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('romaneios')
        .select('sacas_liquida, peso_liquido_kg')
        .eq('safra_id', safraId);

      if (error) throw error;

      if (data) {
        const stats = data.reduce((acc, curr) => ({
          count: acc.count + 1,
          totalSacas: acc.totalSacas + (Number(curr.sacas_liquida) || 0),
          totalKg: acc.totalKg + (Number(curr.peso_liquido_kg) || 0)
        }), { count: 0, totalSacas: 0, totalKg: 0 });
        
        setDbStats(stats);
      }
    } catch (err) {
      console.error("Erro ao buscar stats do banco:", err);
    } finally {
      setLoading(false);
    }
  }, [safraId]);

  useEffect(() => {
    fetchDbStats();
  }, [fetchDbStats]);

  return { dbStats, loading, refresh: fetchDbStats };
}