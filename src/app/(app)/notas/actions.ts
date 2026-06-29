'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TagNota } from '@/lib/types'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

export async function actionSaveNota(nota: {
  id: number; title: string; body: string; tag: TagNota; date: string
}) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('notas').upsert(
    { ...nota, user_id: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (error) return { error: error.message }
  revalidatePath('/notas')
}

export async function actionDeleteNota(id: number) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('notas').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/notas')
}
