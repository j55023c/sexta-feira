import { createClient as createBrowser } from '@/lib/supabase/client'
import { createClient as createServer } from '@/lib/supabase/server'
import type { EntradaNut, FisicoLog, HistoricoFase } from '@/lib/types'
import { getLocalDateString } from '@/lib/utils/date'

const today = getLocalDateString

// ── NUT LOG ───────────────────────────────────────────────────────────────────

export async function dbSaveNutLog(userId: string, date: string, entries: EntradaNut[]) {
  const sb = createBrowser()
  const { error } = await sb.from('nut_log').upsert(
    { user_id: userId, date, entries, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) throw new Error(`dbSaveNutLog: ${error.message}`)
}

export async function dbLoadNutLog(userId: string): Promise<Record<string, EntradaNut[]>> {
  const sb = await createServer()
  const { data, error } = await sb.from('nut_log').select('date, entries').eq('user_id', userId)
  if (error || !data) return {}
  return Object.fromEntries(data.map(r => [r.date, r.entries ?? []]))
}

// ── WATER LOG ─────────────────────────────────────────────────────────────────

export async function dbSaveWater(userId: string, ml: number, date?: string) {
  const sb = createBrowser()
  const { error } = await sb.from('water_log').upsert(
    { user_id: userId, date: date ?? today(), ml, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) throw new Error(`dbSaveWater: ${error.message}`)
}

export async function dbLoadWater(userId: string): Promise<Record<string, number>> {
  const sb = await createServer()
  const { data, error } = await sb.from('water_log').select('date, ml').eq('user_id', userId)
  if (error || !data) return {}
  return Object.fromEntries(data.map(r => [r.date, r.ml ?? 0]))
}

// ── FÍSICO LOG ────────────────────────────────────────────────────────────────

export async function dbSaveFisico(userId: string, log: Omit<FisicoLog, 'user_id'>) {
  const sb = createBrowser()
  const { error } = await sb.from('fisico_log').upsert(
    { ...log, user_id: userId, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) throw new Error(`dbSaveFisico: ${error.message}`)
}

export async function dbLoadFisico(userId: string): Promise<Record<string, FisicoLog>> {
  const sb = await createServer()
  const { data, error } = await sb.from('fisico_log').select('*').eq('user_id', userId)
  if (error || !data) return {}
  return Object.fromEntries(
    data.map(r => [r.date, {
      date: r.date, peso: r.peso, altura: r.altura,
      slept: r.slept, woke: r.woke, musculos: r.musculos,
      axial: r.axial, sensacao: r.sensacao, dor: r.dor,
      cresceu: r.cresceu, obs: r.obs, checks: r.checks ?? [],
    } as FisicoLog])
  )
}

// ── HISTÓRICO DE FASES ────────────────────────────────────────────────────────

export async function dbSaveHistoricoFase(userId: string, h: HistoricoFase) {
  const sb = createBrowser()
  const { error } = await sb.from('historico_fases').insert({
    user_id: userId, fase: h.fase, nome: h.nome,
    data_inicio: h.dataInicio, data_fim: h.dataFim,
    kcal_meta: h.kcalMeta, prot_meta: h.protMeta,
  })
  if (error) throw new Error(`dbSaveHistoricoFase: ${error.message}`)
}

export async function dbLoadHistoricoFases(userId: string): Promise<HistoricoFase[]> {
  const sb = await createServer()
  const { data, error } = await sb
    .from('historico_fases').select('*').eq('user_id', userId).order('created_at')
  if (error || !data) return []
  return data.map(h => ({
    fase: h.fase, nome: h.nome,
    dataInicio: h.data_inicio, dataFim: h.data_fim,
    kcalMeta: h.kcal_meta, protMeta: h.prot_meta,
  }))
}
