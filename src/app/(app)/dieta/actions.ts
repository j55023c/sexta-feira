'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Cardapio, Fase, RefeicaoCustom } from '@/lib/types'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

// ── Salvar cardápio completo ──────────────────────────────────────────────────
export async function actionSaveCardapio(cardapio: Omit<Cardapio, 'user_id'>) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('cardapios').upsert(
    { ...cardapio, user_id: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (error) return { error: error.message }

  revalidatePath('/dieta')
  revalidatePath('/protocolo')
}

// ── Salvar refeição dentro de um cardápio ────────────────────────────────────
export async function actionSaveRefeicao(
  cardapioId: string,
  mealKey: string,
  refeicoes: Record<string, RefeicaoCustom[]>
) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('cardapios')
    .update({ refeicoes, updated_at: new Date().toISOString() })
    .eq('id', cardapioId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dieta')
}

// ── Deletar cardápio ─────────────────────────────────────────────────────────
export async function actionDeleteCardapio(id: string) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('cardapios')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dieta')
  revalidatePath('/protocolo')
}

// ── Criar novo cardápio ──────────────────────────────────────────────────────
export async function actionCreateCardapio(formData: FormData) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const novoCardapio: Omit<Cardapio, 'user_id'> = {
    id: 'c' + Date.now(),
    nome: formData.get('nome') as string,
    objetivo: formData.get('objetivo') as Fase,
    built_in: false,
    refeicoes: { cafe: [], almoco: [], pre: [], pos: [], jantar: [], lanche: [] },
  }

  const { error } = await sb.from('cardapios').upsert(
    { ...novoCardapio, user_id: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (error) return { error: error.message }

  revalidatePath('/dieta')
  revalidatePath('/protocolo')
}

// ── Definir cardápio ativo no protocolo ──────────────────────────────────────
export async function actionSetCardapioAtivo(cardapioId: string) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('protocolo')
    .update({ cardapio_ativo_id: cardapioId, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dieta')
  revalidatePath('/protocolo')
  revalidatePath('/home')
}
