'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { EntradaNut, MealKey } from '@/lib/types'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

// ── Salvar log completo do dia ────────────────────────────────────────────────
export async function actionSaveNutLog(date: string, entries: EntradaNut[]) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('nut_log').upsert(
    { user_id: user.id, date, entries, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) return { error: error.message }

  revalidatePath('/nutricao')
  revalidatePath('/home')
}

// ── Adicionar entrada ao log do dia ──────────────────────────────────────────
export async function actionAddEntrada(date: string, entrada: EntradaNut, currentEntries: EntradaNut[]) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const entries = [...currentEntries, entrada]

  const { error } = await sb.from('nut_log').upsert(
    { user_id: user.id, date, entries, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) return { error: error.message }

  revalidatePath('/nutricao')
  revalidatePath('/home')
}

// ── Remover entrada do log do dia ─────────────────────────────────────────────
export async function actionRemoveEntrada(date: string, index: number, currentEntries: EntradaNut[]) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const entries = currentEntries.filter((_, i) => i !== index)

  const { error } = await sb.from('nut_log').upsert(
    { user_id: user.id, date, entries, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) return { error: error.message }

  revalidatePath('/nutricao')
  revalidatePath('/home')
}

// ── ÁGUA ──────────────────────────────────────────────────────────────────────
export async function actionAddWater(date: string, ml: number, currentMl: number) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const newMl = currentMl + ml

  const { error } = await sb.from('water_log').upsert(
    { user_id: user.id, date, ml: newMl, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) return { error: error.message }

  revalidatePath('/nutricao')
  revalidatePath('/home')
  return { ml: newMl }
}

export async function actionRemoveWater(date: string, currentMl: number) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const newMl = Math.max(0, currentMl - 200)

  const { error } = await sb.from('water_log').upsert(
    { user_id: user.id, date, ml: newMl, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) return { error: error.message }

  revalidatePath('/nutricao')
  revalidatePath('/home')
  return { ml: newMl }
}
