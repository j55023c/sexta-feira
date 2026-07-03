'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

export async function actionSalvarPerfil(dados: Partial<Profile>) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('profiles')
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/configuracoes')
  revalidatePath('/home')
}

export async function actionSalvarTema(theme: string) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('profiles')
    .update({ theme, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/configuracoes')
}

export async function actionLogout() {
  const { sb } = await getUser()
  await sb.auth.signOut()
  redirect('/auth')
}
