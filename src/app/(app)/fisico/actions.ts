'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FisicoLog } from '@/lib/types'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

export async function actionSaveFisico(log: Omit<FisicoLog, 'user_id'>) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('fisico_log').upsert(
    { ...log, user_id: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) return { error: error.message }

  revalidatePath('/fisico')
  revalidatePath('/home')
}
