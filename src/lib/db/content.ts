import { createClient as createBrowser } from '@/lib/supabase/client'
import { createClient as createServer } from '@/lib/supabase/server'
import type { Cardapio, Nota, Materia, TarefaLivre } from '@/lib/types'

// ── CARDÁPIOS ─────────────────────────────────────────────────────────────────

export async function dbSaveCardapio(userId: string, cardapio: Cardapio) {
  const sb = createBrowser()
  const { error } = await sb.from('cardapios').upsert(
    { ...cardapio, user_id: userId, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (error) throw new Error(`dbSaveCardapio: ${error.message}`)
}

export async function dbDeleteCardapio(userId: string, id: string) {
  const sb = createBrowser()
  const { error } = await sb.from('cardapios').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(`dbDeleteCardapio: ${error.message}`)
}

export async function dbLoadCardapios(userId: string): Promise<Cardapio[]> {
  const sb = await createServer()
  const { data, error } = await sb
    .from('cardapios').select('*').eq('user_id', userId).order('updated_at')
  if (error || !data) return []
  return data as Cardapio[]
}

// ── NOTAS ─────────────────────────────────────────────────────────────────────

export async function dbSaveNota(userId: string, nota: Omit<Nota, 'user_id'>) {
  const sb = createBrowser()
  const { error } = await sb.from('notas').upsert(
    { ...nota, user_id: userId, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (error) throw new Error(`dbSaveNota: ${error.message}`)
}

export async function dbDeleteNota(userId: string, id: number) {
  const sb = createBrowser()
  const { error } = await sb.from('notas').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(`dbDeleteNota: ${error.message}`)
}

export async function dbLoadNotas(userId: string): Promise<Nota[]> {
  const sb = await createServer()
  const { data, error } = await sb
    .from('notas').select('*').eq('user_id', userId).order('updated_at', { ascending: false })
  if (error || !data) return []
  return data as Nota[]
}

// ── MATÉRIAS ──────────────────────────────────────────────────────────────────

export async function dbSaveMateria(userId: string, materia: Omit<Materia, 'user_id'>) {
  const sb = createBrowser()
  const { error } = await sb.from('materias').upsert(
    { ...materia, user_id: userId, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (error) throw new Error(`dbSaveMateria: ${error.message}`)
}

export async function dbDeleteMateria(userId: string, id: number) {
  const sb = createBrowser()
  const { error } = await sb.from('materias').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(`dbDeleteMateria: ${error.message}`)
}

export async function dbLoadMaterias(userId: string): Promise<Materia[]> {
  const sb = await createServer()
  const { data, error } = await sb
    .from('materias').select('*').eq('user_id', userId).order('updated_at')
  if (error || !data) return []
  return data as Materia[]
}

// ── TAREFAS LIVRES ────────────────────────────────────────────────────────────

export async function dbSaveTarefa(userId: string, tarefa: Omit<TarefaLivre, 'user_id'>) {
  const sb = createBrowser()
  const { error } = await sb.from('tarefas_livres').upsert(
    { ...tarefa, user_id: userId, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (error) throw new Error(`dbSaveTarefa: ${error.message}`)
}

export async function dbDeleteTarefa(userId: string, id: number) {
  const sb = createBrowser()
  const { error } = await sb.from('tarefas_livres').delete().eq('id', id).eq('user_id', userId)
  if (error) throw new Error(`dbDeleteTarefa: ${error.message}`)
}

export async function dbLoadTarefas(userId: string): Promise<TarefaLivre[]> {
  const sb = await createServer()
  const { data, error } = await sb
    .from('tarefas_livres').select('*').eq('user_id', userId).order('updated_at')
  if (error || !data) return []
  return data as TarefaLivre[]
}
