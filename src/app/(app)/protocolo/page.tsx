import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadProtocolo, dbLoadCardapios, dbLoadProfile, dbLoadHistoricoFases } from '@/lib/db'
import ProtocoloClient from './ProtocoloClient'

export default async function ProtocoloPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const [protocolo, cardapios, profile, historico] = await Promise.all([
    dbLoadProtocolo(user.id),
    dbLoadCardapios(user.id),
    dbLoadProfile(user.id),
    dbLoadHistoricoFases(user.id),
  ])

  return (
    <ProtocoloClient
      protocolo={protocolo}
      cardapios={cardapios}
      profile={profile}
      historico={historico}
    />
  )
}
