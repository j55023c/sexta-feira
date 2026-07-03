import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadFisico, dbLoadProfile } from '@/lib/db'
import FisicoClient from './FisicoClient'

export default async function FisicoPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const [fisicoLog, profile] = await Promise.all([
    dbLoadFisico(user.id),
    dbLoadProfile(user.id),
  ])

  return (
    <FisicoClient
      fisicoLog={fisicoLog}
      profile={profile}
    />
  )
}
