import './globals.css'
import React from 'react'
import ToastProvider from '../src/components/ToastProvider'

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
    <html lang="pt-br">
      <body>
        <ToastProvider />
        {children}
      </body>
    </html>
  )
}