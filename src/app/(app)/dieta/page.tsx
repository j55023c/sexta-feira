import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadCardapios, dbLoadProtocolo, dbLoadProfile } from '@/lib/db'
import DietaClient from './DietaClient'

export default async function DietaPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const [cardapios, protocolo, profile] = await Promise.all([
    dbLoadCardapios(user.id),
    dbLoadProtocolo(user.id),
    dbLoadProfile(user.id),
  ])

  return (
    <DietaClient
      cardapios={cardapios}
      protocolo={protocolo}
      profile={profile}
    />
  )
}
