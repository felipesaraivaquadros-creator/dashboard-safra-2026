import './globals.css'
import React from 'react'
import ToastProvider from '../src/components/ToastProvider'
import { ThemeWrapper } from '../src/components/ThemeWrapper'

export const metadata = {
  title: 'Painel Soja - Safra 25/26',
  description: 'Acompanhamento de Romaneios de Soja',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body>
        <ThemeWrapper attribute="class" defaultTheme="light">
          <ToastProvider />
          {children}
        </ThemeWrapper>
      </body>
    </html>
  )
}