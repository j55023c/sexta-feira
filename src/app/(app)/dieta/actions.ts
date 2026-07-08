'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

export async function actionToggleHiddenCard(tab: string, cardId: string, hide: boolean) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await sb.from('profiles').select('hidden_cards').eq('user_id', user.id).single()
  const current = (profile?.hidden_cards ?? {}) as Record<string, string[]>
  const list = current[tab] ?? []
  const updated = hide
    ? Array.from(new Set([...list, cardId]))
    : list.filter(id => id !== cardId)

  const { error } = await sb.from('profiles').update({
    hidden_cards: { ...current, [tab]: updated },
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dieta')
}

export async function actionShowAllHidden(tab: string) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await sb.from('profiles').select('hidden_cards').eq('user_id', user.id).single()
  const current = (profile?.hidden_cards ?? {}) as Record<string, string[]>

  const { error } = await sb.from('profiles').update({
    hidden_cards: { ...current, [tab]: [] },
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dieta')
}
