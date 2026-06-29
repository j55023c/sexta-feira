import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadNotas } from '@/lib/db'
import NotasClient from './NotasClient'

export default async function NotasPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const notas = await dbLoadNotas(user.id)
  return <NotasClient notas={notas} />
}
