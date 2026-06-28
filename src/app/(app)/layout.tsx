// Server Component — busca o usuário no servidor antes de renderizar.
// Isso garante que o email do usuário já chega pronto para a Sidebar,
// sem nenhum flash de "carregando..." no cliente.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()

  // Camada extra de segurança — middleware já faz isso,
  // mas melhor redundante do que com brecha.
  if (!user) redirect('/auth')

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar userEmail={user.email ?? ''} />

      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: '24px 26px' }}
      >
        {children}
      </main>
    </div>
  )
}
