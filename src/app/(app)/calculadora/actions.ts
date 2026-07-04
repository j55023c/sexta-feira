'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

// Aplica metas calculadas no perfil (Nutrição)
export async function actionAplicarMetas(metas: Partial<Profile>) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('profiles')
    .update({ ...metas, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/calculadora')
  revalidatePath('/nutricao')
  revalidatePath('/protocolo')
  revalidatePath('/home')
}

// Salva metas manuais no perfil
export async function actionSalvarMetasManuais(metas: {
  kcal_meta: number
  prot_meta: number
  carbo_meta: number
  gord_meta: number
}) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('profiles')
    .update({ ...metas, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/calculadora')
  revalidatePath('/nutricao')
  revalidatePath('/home')
}
