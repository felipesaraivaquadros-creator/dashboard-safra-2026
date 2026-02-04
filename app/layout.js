import './globals.css'

export const metadata = {
  title: 'Dashboard de Safra 25/26',
  description: 'Acompanhamento de Romaneios de Soja',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  )
}