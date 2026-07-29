import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadNutLog, dbLoadProfile, dbLoadWater } from '@/lib/db'
import NutricaoClient from './NutricaoClient'

export default async function NutricaoPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const [nutLog, profile, waterLog] = await Promise.all([
    dbLoadNutLog(user.id),
    dbLoadProfile(user.id),
    dbLoadWater(user.id),
  ])

  return (
    <NutricaoClient
      nutLog={nutLog}
      profile={profile}
      waterLog={waterLog}
    />
  )
}
