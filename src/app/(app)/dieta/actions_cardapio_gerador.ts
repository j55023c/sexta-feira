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

// ── Criar novo cardápio em branco ─────────────────────────────────────────────
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

// ── Aceitar cardápio gerado pela Calculadora ──────────────────────────────────
// Recebe o cardápio já montado pelo gerador algorítmico (cardapioGerador.ts,
// chamado a partir da Calculadora) e persiste como uma cópia editável do
// usuário, com id único (permite gerar e aceitar outra sugestão depois sem
// colidir), já marcando como ativo no protocolo. Reversível: o usuário pode
// trocar o cardápio ativo a qualquer momento em Dieta → Meus Cardápios.
export async function actionAceitarCardapioSugerido(sugestao: Omit<Cardapio, 'user_id'>) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const novoCardapio: Omit<Cardapio, 'user_id'> = {
    id: `${sugestao.id}-${Date.now()}`,
    nome: sugestao.nome,
    objetivo: sugestao.objetivo,
    built_in: false, // vira uma cópia editável do usuário, não a sugestão original
    refeicoes: sugestao.refeicoes,
  }

  const { error: errCardapio } = await sb.from('cardapios').upsert(
    { ...novoCardapio, user_id: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (errCardapio) return { error: errCardapio.message }

  const { error: errProtocolo } = await sb
    .from('protocolo')
    .update({ cardapio_ativo_id: novoCardapio.id, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
  if (errProtocolo) return { error: errProtocolo.message }

  revalidatePath('/dieta')
  revalidatePath('/protocolo')
  revalidatePath('/home')
  revalidatePath('/calculadora')

  return { cardapio: novoCardapio }
}
