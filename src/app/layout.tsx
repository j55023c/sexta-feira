import type { Metadata, Viewport } from 'next'
import { Syne, DM_Mono } from 'next/font/google'
import './globals.css'

// Next.js carrega as fontes localmente — sem request para o Google a cada visita
const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sexta-feira',
  description: 'Sistema pessoal de organização — tarefas, protocolo de treino e dieta.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sexta-feira',
  },
}

export const viewport: Viewport = {
  themeColor: '#191714',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${syne.variable} ${dmMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
