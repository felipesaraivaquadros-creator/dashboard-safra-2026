import './globals.css'
import React from 'react'
import ToastProvider from '../src/components/ToastProvider'
import { ThemeWrapper } from '../src/components/ThemeWrapper'
import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Painel Soja - Safra 25/26',
  description: 'Acompanhamento de Romaneios de Soja',
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Painel Soja',
  },
}

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