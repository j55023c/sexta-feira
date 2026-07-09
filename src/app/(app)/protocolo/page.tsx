import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadProtocolo, dbLoadProfile } from '@/lib/db'
import ProtocoloClient from './ProtocoloClient'

export default async function ProtocoloPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const [protocolo, profile] = await Promise.all([
    dbLoadProtocolo(user.id),
    dbLoadProfile(user.id),
  ])

  return (
    <ProtocoloClient
      protocolo={protocolo}
      profile={profile}
    />
  )
}
