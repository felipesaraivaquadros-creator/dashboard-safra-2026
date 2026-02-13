import './globals.css'
import React from 'react'
import ToastProvider from '../src/components/ToastProvider'
import { ThemeWrapper } from '../src/components/ThemeWrapper'
import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: "Painel Safra",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/icon-192.png",
    apple: "/icon-512.png",
  },
  description: 'Acompanhamento de Romaneios e Saldos de Soja e Milho',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Painel Safra',
  },
};

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        <ThemeWrapper attribute="class" defaultTheme="light">
          <ToastProvider />
          {children}
        </ThemeWrapper>
      </body>
    </html>
  )
}