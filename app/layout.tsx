import './globals.css'
import React, { Suspense } from 'react'
import ToastProvider from '../src/components/ToastProvider'
import { ThemeWrapper } from '../src/components/ThemeWrapper'
import { Metadata, Viewport } from 'next'
import LastUpdateBar from '../src/components/LastUpdateBar'
import { AuthProvider } from '../src/components/AuthProvider'
import { Loader2 } from 'lucide-react'

export const metadata: Metadata = {
  title: "Painel Safra",
  description: 'Acompanhamento de Romaneios e Saldos',
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900">
        <ThemeWrapper attribute="class" defaultTheme="light">
          <AuthProvider>
            <LastUpdateBar />
            <ToastProvider />
            <main className="flex-1">
              <Suspense fallback={<LoadingFallback />}>
                {children}
              </Suspense>
            </main>
          </AuthProvider>
        </ThemeWrapper>
      </body>
    </html>
  )
}