// ─── DB: PROFILE + PROTOCOLO ─────────────────────────────────────────────────
// Migração direta das funções dbSaveProfile/dbLoadProfile/dbSaveProtocolo/dbLoadProtocolo
// do HTML original, agora tipadas e sem acesso ao DOM.

import { createClient } from '@/lib/supabase/client'
import type { Profile, Protocolo } from '@/lib/types'

// ── PROFILE ──────────────────────────────────────────────────────────────────

export async function dbSaveProfile(userId: string, profile: Omit<Profile, 'user_id'>) {
  const sb = createClient()
  const { error } = await sb.from('profiles').upsert(
    { user_id: userId, ...profile, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(`dbSaveProfile: ${error.message}`)
}

export async function dbLoadProfile(userId: string): Promise<Profile | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as Profile
}

// ── PROTOCOLO ─────────────────────────────────────────────────────────────────

export async function dbSaveProtocolo(userId: string, protocolo: Omit<Protocolo, 'user_id'>) {
  const sb = createClient()
  const { error } = await sb.from('protocolo').upsert(
    { user_id: userId, ...protocolo, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) throw new Error(`dbSaveProtocolo: ${error.message}`)
}

export async function dbLoadProtocolo(userId: string): Promise<Protocolo | null> {
  const sb = createClient()
  const { data, error } = await sb
    .from('protocolo')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return {
    nome: data.nome,
    desc_texto: data.desc_texto,
    cardio: data.cardio,
    fase: data.fase,
    data_inicio: data.data_inicio,
    cardapio_ativo_id: data.cardapio_ativo_id,
    dias: data.dias,
  }
}
