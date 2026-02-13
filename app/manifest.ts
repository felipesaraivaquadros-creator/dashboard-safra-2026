import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Painel Soja - Safra 25/26',
    short_name: 'Painel Soja',
    description: 'Acompanhamento de Romaneios e Saldos de Soja e Milho',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}