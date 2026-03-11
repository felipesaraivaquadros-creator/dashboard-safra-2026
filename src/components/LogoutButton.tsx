"use client";

import React from 'react';
import { LogOut } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { showSuccess } from '../utils/toast';

interface LogoutButtonProps {
  variant?: 'menu' | 'header';
}

export default function LogoutButton({ variant = 'header' }: LogoutButtonProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    showSuccess("Sessão encerrada com sucesso.");
  };

  if (variant === 'menu') {
    return (
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 group"
      >
        <div className="flex items-center gap-3">
          <LogOut size={18} className="text-red-500" />
          <span className="text-xs font-black uppercase tracking-tight">Sair da Conta</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-200 text-slate-700 hover:bg-red-100 hover:text-red-600 dark:bg-slate-700 dark:text-white dark:hover:bg-red-900/40 transition-colors shadow-md"
      title="Sair do sistema"
    >
      <LogOut size={20} />
    </button>
  );
}