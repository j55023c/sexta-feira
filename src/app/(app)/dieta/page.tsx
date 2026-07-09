import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadProfile } from '@/lib/db'
import DietaClient from './DietaClient'

export default async function DietaPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const profile = await dbLoadProfile(user.id)

  return <DietaClient hiddenCards={profile?.hidden_cards ?? {}} />
}
