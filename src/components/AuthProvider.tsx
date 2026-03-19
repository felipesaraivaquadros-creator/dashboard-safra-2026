"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext<{ session: Session | null }>({ session: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // 1. Efeito para montar o componente e verificar sessão inicial
  useEffect(() => {
    setMounted(true);
    
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setLoading(false);
    };

    initAuth();

    // Listener único para mudanças de estado (não depende de pathname)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Efeito separado para controle de rotas (redirecionamento)
  useEffect(() => {
    if (loading || !mounted) return;

    if (!session && pathname !== '/login') {
      router.push('/login');
    } else if (session && pathname === '/login') {
      router.push('/');
    }
  }, [session, loading, pathname, router, mounted]);

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Verificando Acesso...</p>
      </div>
    );
  }

  // Se não estiver logado e não estiver na página de login, mostra tela vazia enquanto redireciona
  if (!session && pathname !== '/login') {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />;
  }

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);