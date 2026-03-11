import './globals.css'
import React from 'react'
import ToastProvider from '../src/components/ToastProvider'
import { ThemeWrapper } from '../src/components/ThemeWrapper'
import { Metadata, Viewport } from 'next'
import LastUpdateBar from '../src/components/LastUpdateBar'
import { AuthProvider } from '../src/components/AuthProvider'

export const metadata: Metadata = {
  title: "Painel Safra",
  description: 'Acompanhamento de Romaneios e Saldos',
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
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
              {children}
            </main>
          </AuthProvider>
        </ThemeWrapper>
      </body>
    </html>
  )
}