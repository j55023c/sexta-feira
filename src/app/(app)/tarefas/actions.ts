'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Todas as actions usam createServer() — rodam no servidor, têm sessão via cookie.
// As queries vão direto ao Supabase sem passar pelo client browser.

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

// ── TAGS (customizáveis) ──────────────────────────────────────────────────────
// id vem pronto do cliente (gerado lá) pra permitir UI otimista sem esperar o servidor.

export async function actionAddTag(id: string, nome: string, cor: string) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('tags').insert({
    id,
    user_id: user.id,
    nome: nome.trim(),
    cor,
    created_at: new Date().toISOString(),
  })
  if (error) return { error: error.message }

  revalidatePath('/tarefas')
}

export async function actionDeleteTag(tagId: string) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('tags').delete().eq('id', tagId).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/tarefas')
}

// ── MATÉRIAS ──────────────────────────────────────────────────────────────────

export async function actionAddMateria(formData: FormData) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const tasksRaw = (formData.get('tasks') as string ?? '').trim()
  const materia = {
    id: Date.now(),
    user_id: user.id,
    nome: formData.get('nome') as string,
    tag: (formData.get('tag') as string) ?? '',
    prazo: formData.get('prazo') as string ?? '',
    tasks: tasksRaw
      ? tasksRaw.split('\n').filter(Boolean).map((s, i) => ({
          id: Date.now() + i,
          nome: s.trim(),
          done: false,
          prazo: '',
        }))
      : [],
    updated_at: new Date().toISOString(),
  }

  const { error } = await sb.from('materias').upsert(materia, { onConflict: 'id,user_id' })
  if (error) return { error: error.message }

  revalidatePath('/tarefas')
  revalidatePath('/home')
}

export async function actionDeleteMateria(materiaId: number) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('materias').delete().eq('id', materiaId).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/tarefas')
  revalidatePath('/home')
}

export async function actionToggleTask(
  materiaId: number,
  tasks: { id: number; nome: string; done: boolean; prazo: string }[]
) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('materias')
    .update({ tasks, updated_at: new Date().toISOString() })
    .eq('id', materiaId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/tarefas')
  revalidatePath('/home')
}

export async function actionAddTaskInline(
  materiaId: number,
  nomeTarefa: string,
  currentTasks: { id: number; nome: string; done: boolean; prazo: string }[]
) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const novasTasks = [...currentTasks, { id: Date.now(), nome: nomeTarefa, done: false, prazo: '' }]

  const { error } = await sb
    .from('materias')
    .update({ tasks: novasTasks, updated_at: new Date().toISOString() })
    .eq('id', materiaId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/tarefas')
}

export async function actionDeleteTask(
  materiaId: number,
  tasks: { id: number; nome: string; done: boolean; prazo: string }[]
) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('materias')
    .update({ tasks, updated_at: new Date().toISOString() })
    .eq('id', materiaId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/tarefas')
}

// ── TAREFAS LIVRES ────────────────────────────────────────────────────────────
// Se vier "materiaId" no form, a tarefa é anexada dentro daquela matéria.

export async function actionAddTarefa(formData: FormData) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const nome = formData.get('nome') as string
  const tag = (formData.get('tag') as string) ?? ''
  const prazo = (formData.get('prazo') as string) ?? ''
  const materiaId = formData.get('materiaId') as string

  if (materiaId) {
    const { data: materia, error: fetchError } = await sb
      .from('materias')
      .select('tasks')
      .eq('id', materiaId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !materia) return { error: 'Matéria não encontrada' }

    const novaTask = { id: Date.now(), nome, done: false, prazo }
    const novasTasks = [...(materia.tasks ?? []), novaTask]

    const { error } = await sb
      .from('materias')
      .update({ tasks: novasTasks, updated_at: new Date().toISOString() })
      .eq('id', materiaId)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/tarefas')
    revalidatePath('/home')
    return
  }

  const tarefa = {
    id: Date.now(),
    user_id: user.id,
    nome,
    tag,
    done: false,
    prazo,
    updated_at: new Date().toISOString(),
  }

  const { error } = await sb.from('tarefas_livres').upsert(tarefa, { onConflict: 'id,user_id' })
  if (error) return { error: error.message }

  revalidatePath('/tarefas')
  revalidatePath('/home')
}

export async function actionToggleTarefa(tarefa: {
  id: number; nome: string; tag: string; done: boolean; prazo: string
}) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('tarefas_livres')
    .update({ done: !tarefa.done, updated_at: new Date().toISOString() })
    .eq('id', tarefa.id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/tarefas')
  revalidatePath('/home')
}

export async function actionDeleteTarefa(tarefaId: number) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('tarefas_livres').delete().eq('id', tarefaId).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/tarefas')
  revalidatePath('/home')
}
