import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadMaterias, dbLoadTarefas } from '@/lib/db'
import TarefasClient from './TarefasClient'

export default async function TarefasPage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  const [materias, tarefasLivres] = await Promise.all([
    dbLoadMaterias(user.id),
    dbLoadTarefas(user.id),
  ])

  return <TarefasClient materias={materias} tarefasLivres={tarefasLivres} />
}
