'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Cardapio, Fase, RefeicaoCustom } from '@/lib/types'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

// ── Cards ocultos do guia de referência (já existia — mantido) ───────────────

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

// ── CRUD de "Meus Cardápios" ───────────────────────────────────────────────

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

export async function actionSaveRefeicao(cardapioId: string, refeicoes: Record<string, RefeicaoCustom[]>) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('cardapios')
    .update({ refeicoes, updated_at: new Date().toISOString() })
    .eq('id', cardapioId).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dieta')
}

export async function actionDeleteCardapio(id: string) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('cardapios').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dieta')
  revalidatePath('/protocolo')
}

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

export async function actionSetCardapioAtivo(cardapioId: string) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('protocolo')
    .update({ cardapio_ativo_id: cardapioId, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/dieta')
  revalidatePath('/protocolo')
  revalidatePath('/home')
}

// ── Aceitar cardápio gerado pela Calculadora ──────────────────────────────────
// Recebe o cardápio já montado pelo gerador algorítmico (cardapioGerador.ts,
// chamado a partir da Calculadora) e persiste como uma cópia editável do
// usuário, com id único, já marcando como ativo no protocolo. Reversível: o
// usuário pode trocar o cardápio ativo a qualquer momento em Dieta → Meus
// Cardápios (inclusive editar ou apagar essa cópia como qualquer outra).
export async function actionAceitarCardapioSugerido(sugestao: Omit<Cardapio, 'user_id'>) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const novoCardapio: Omit<Cardapio, 'user_id'> = {
    id: `${sugestao.id}-${Date.now()}`,
    nome: sugestao.nome,
    objetivo: sugestao.objetivo,
    built_in: false,
    refeicoes: sugestao.refeicoes,
  }

  const { error: errCardapio } = await sb.from('cardapios').upsert(
    { ...novoCardapio, user_id: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (errCardapio) return { error: errCardapio.message }

  const { error: errProtocolo } = await sb.from('protocolo')
    .update({ cardapio_ativo_id: novoCardapio.id, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
  if (errProtocolo) return { error: errProtocolo.message }

  revalidatePath('/dieta')
  revalidatePath('/protocolo')
  revalidatePath('/home')
  revalidatePath('/calculadora')

  return { cardapio: novoCardapio }
}
