// Server Component — busca o usuário no servidor antes de renderizar.
// Isso garante que o email do usuário já chega pronto para a Sidebar,
// sem nenhum flash de "carregando..." no cliente.
//
// A montagem visual (Sidebar + topbar mobile + main) foi extraída para
// AppShell, um Client Component — é ele quem guarda o estado de
// aberto/fechado do menu no mobile. Esse layout continua 100% server-side.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/components/layout/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()

  // Camada extra de segurança — middleware já faz isso,
  // mas melhor redundante do que com brecha.
  if (!user) redirect('/auth')

  return (
    <AppShell userEmail={user.email ?? ''}>
      {children}
    </AppShell>
  )
}
