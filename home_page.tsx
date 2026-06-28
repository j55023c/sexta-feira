import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { dbLoadProfile, dbLoadProtocolo, dbLoadMaterias, dbLoadTarefas, dbLoadFisico } from '@/lib/db'
import HomeClient from './HomeClient'

// Server Component — busca todos os dados necessários para o Home no servidor.
export default async function HomePage() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/auth')

  // Busca em paralelo — não espera uma terminar para começar a outra
  const [profile, protocolo, materias, tarefasLivres, fisicoLog] = await Promise.all([
    dbLoadProfile(user.id),
    dbLoadProtocolo(user.id),
    dbLoadMaterias(user.id),
    dbLoadTarefas(user.id),
    dbLoadFisico(user.id),
  ])

  return (
    <HomeClient
      profile={profile}
      protocolo={protocolo}
      materias={materias}
      tarefasLivres={tarefasLivres}
      fisicoLog={fisicoLog}
    />
  )
}
