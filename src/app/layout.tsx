import type { Metadata, Viewport } from 'next'
import { Syne, DM_Mono } from 'next/font/google'
import { createClient } from '@/lib/supabase/server'
import { dbLoadProfile } from '@/lib/db'
import './globals.css'

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Lê o tema salvo no perfil ANTES de renderizar — resolve o bug
  // de o data-theme só aparecer depois de mexer em Configurações.
  let tema: string | undefined
  try {
    const sb = await createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (user) {
      const profile = await dbLoadProfile(user.id)
      if (profile?.tema && profile.tema !== 'default') tema = profile.tema
    }
  } catch {
    // Sem sessão (ex: tela de /auth) — segue com tema default
  }

  return (
    <html lang="pt-BR" data-theme={tema}>
      <body className={`${syne.variable} ${dmMono.variable} font-sans`}>
        {children}
      </body>
    </html>
  )
}
