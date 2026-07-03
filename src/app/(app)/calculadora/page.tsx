import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadProfile } from '@/lib/db'
import CalculadoraClient from './CalculadoraClient'

export default async function CalculadoraPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const profile = await dbLoadProfile(user.id)

  return (
    <CalculadoraClient
      profile={profile}
      userEmail={user.email ?? ''}
    />
  )
}
