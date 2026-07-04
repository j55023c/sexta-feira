import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadProfile } from '@/lib/db'
import ConfiguracoesClient from './ConfiguracoesClient'

export default async function ConfiguracoesPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const profile = await dbLoadProfile(user.id)

  return (
    <ConfiguracoesClient
      profile={profile}
      userEmail={user.email ?? ''}
    />
  )
}
