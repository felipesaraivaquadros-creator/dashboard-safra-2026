"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const AuthContext = createContext<{ session: Session | null }>({ session: null });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Verifica sessão inicial
    const checkSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setLoading(false);

      if (!initialSession && pathname !== '/login') {
        router.push('/login');
      }
    };

    checkSession();

    // 2. Monitora mudanças de estado (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
      
      if (!currentSession && pathname !== '/login') {
        router.push('/login');
      } else if (currentSession && pathname === '/login') {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  // Enquanto verifica a sessão, mostra um carregando para evitar "pulos" de tela
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Verificando Acesso...</p>
      </div>
    );
  }

  // Se não estiver logado e não estiver na página de login, bloqueia a renderização do conteúdo
  if (!session && pathname !== '/login') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />
    );
  }

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);