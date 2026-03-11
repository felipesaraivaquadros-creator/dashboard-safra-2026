"use client";

import React, { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../src/integrations/supabase/client';
import { showError } from '../../src/utils/toast';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const ALLOWED_EMAIL = "fazendaromancini@gmail.com";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-[40px] shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white">
            Acesso Restrito
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase mt-2">Painel Safra Romancini</p>
        </div>

        <Auth
          supabaseClient={supabase}
          providers={[]}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#7c3aed',
                  brandAccent: '#6d28d9',
                },
              },
            },
            className: {
              container: 'auth-container',
              button: 'auth-button',
              input: 'auth-input',
            }
          }}
          localization={{
            variables: {
              sign_in: {
                email_label: 'E-mail',
                password_label: 'Senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                link_text: 'Já tem uma conta? Entre',
              },
              sign_up: {
                email_label: 'E-mail',
                password_label: 'Crie uma senha',
                button_label: 'Cadastrar Usuário Único',
                link_text: 'Não tem conta? Cadastre-se',
              },
              forgotten_password: {
                email_label: 'E-mail',
                button_label: 'Enviar instruções',
                link_text: 'Esqueceu a senha?',
              },
            },
          }}
          theme="light"
        />
        
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800">
          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 text-center uppercase">
            Apenas o e-mail <strong>{ALLOWED_EMAIL}</strong> tem permissão de acesso.
          </p>
        </div>
      </div>

      <style jsx global>{`
        .auth-input {
          border-radius: 12px !important;
          font-size: 14px !important;
        }
        .auth-button {
          border-radius: 12px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }
      `}</style>
    </div>
  );
}