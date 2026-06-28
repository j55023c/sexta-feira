'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { dbSaveMateria, dbDeleteMateria, dbSaveTarefa, dbDeleteTarefa } from '@/lib/db'
import type { TagTarefa } from '@/lib/types'

// ── MATÉRIAS ──────────────────────────────────────────────────────────────────

export async function actionAddMateria(formData: FormData) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const tasksRaw = (formData.get('tasks') as string ?? '').trim()
  const materia = {
    id: Date.now(),
    nome: formData.get('nome') as string,
    tag: formData.get('tag') as TagTarefa,
    prazo: formData.get('prazo') as string ?? '',
    tasks: tasksRaw
      ? tasksRaw.split('\n').filter(Boolean).map(s => ({
          id: Date.now() + Math.random(),
          nome: s.trim(),
          done: false,
          prazo: '',
        }))
      : [],
  }

  try {
    await dbSaveMateria(user.id, materia)
    revalidatePath('/tarefas')
    revalidatePath('/home')
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

export async function actionDeleteMateria(materiaId: number) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  try {
    await dbDeleteMateria(user.id, materiaId)
    revalidatePath('/tarefas')
    revalidatePath('/home')
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao deletar' }
  }
}

export async function actionToggleTask(materiaId: number, tasks: { id: number; nome: string; done: boolean; prazo: string }[]) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Busca matéria atual e atualiza só as tasks
  const { data } = await sb.from('materias').select('*').eq('id', materiaId).eq('user_id', user.id).single()
  if (!data) return { error: 'Matéria não encontrada' }

  try {
    await dbSaveMateria(user.id, { ...data, tasks })
    revalidatePath('/tarefas')
    revalidatePath('/home')
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

export async function actionAddTaskInline(materiaId: number, nomeTarefa: string, currentTasks: { id: number; nome: string; done: boolean; prazo: string }[]) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data } = await sb.from('materias').select('*').eq('id', materiaId).eq('user_id', user.id).single()
  if (!data) return { error: 'Matéria não encontrada' }

  const novasTasks = [...currentTasks, { id: Date.now(), nome: nomeTarefa, done: false, prazo: '' }]

  try {
    await dbSaveMateria(user.id, { ...data, tasks: novasTasks })
    revalidatePath('/tarefas')
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

export async function actionDeleteTask(materiaId: number, tasks: { id: number; nome: string; done: boolean; prazo: string }[]) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data } = await sb.from('materias').select('*').eq('id', materiaId).eq('user_id', user.id).single()
  if (!data) return { error: 'Matéria não encontrada' }

  try {
    await dbSaveMateria(user.id, { ...data, tasks })
    revalidatePath('/tarefas')
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

// ── TAREFAS LIVRES ────────────────────────────────────────────────────────────

export async function actionAddTarefa(formData: FormData) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const tarefa = {
    id: Date.now(),
    nome: formData.get('nome') as string,
    tag: formData.get('tag') as TagTarefa,
    done: false,
    prazo: formData.get('prazo') as string ?? '',
  }

  try {
    await dbSaveTarefa(user.id, tarefa)
    revalidatePath('/tarefas')
    revalidatePath('/home')
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

export async function actionToggleTarefa(tarefa: { id: number; nome: string; tag: TagTarefa; done: boolean; prazo: string }) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  try {
    await dbSaveTarefa(user.id, { ...tarefa, done: !tarefa.done })
    revalidatePath('/tarefas')
    revalidatePath('/home')
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}

export async function actionDeleteTarefa(tarefaId: number) {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  try {
    await dbDeleteTarefa(user.id, tarefaId)
    revalidatePath('/tarefas')
    revalidatePath('/home')
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Erro ao salvar' }
  }
}
