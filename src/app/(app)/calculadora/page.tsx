import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadProfile, dbLoadFisico } from '@/lib/db'
import CalculadoraClient from './CalculadoraClient'

export default async function CalculadoraPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const [profile, fisicoLog] = await Promise.all([
    dbLoadProfile(user.id),
    dbLoadFisico(user.id),
  ])

  return (
    <CalculadoraClient
      profile={profile}
      fisicoLog={fisicoLog}
    />
  )
}
