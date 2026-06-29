'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Protocolo, Fase } from '@/lib/types'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

export async function actionSaveProtocolo(protocolo: Omit<Protocolo, 'user_id'>) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('protocolo').upsert(
    { ...protocolo, user_id: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) return { error: error.message }
  revalidatePath('/protocolo')
  revalidatePath('/home')
}

export async function actionMudarFase(novaFase: Fase, novoNome: string, novoCardapioId: string, faseAtual: {
  fase: Fase; nome: string; dataInicio: string; kcalMeta: number; protMeta: number
}) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const today = new Date().toISOString().split('T')[0]

  // Arquiva fase atual no histórico
  await sb.from('historico_fases').insert({
    user_id: user.id,
    fase: faseAtual.fase,
    nome: faseAtual.nome,
    data_inicio: faseAtual.dataInicio,
    data_fim: today,
    kcal_meta: faseAtual.kcalMeta,
    prot_meta: faseAtual.protMeta,
  })

  // Atualiza protocolo com nova fase
  const { error } = await sb.from('protocolo').update({
    fase: novaFase,
    nome: novoNome || faseAtual.nome,
    cardapio_ativo_id: novoCardapioId,
    data_inicio: today,
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/protocolo')
  revalidatePath('/home')
}

export async function actionSaveCardapio(cardapio: {
  id: string; nome: string; objetivo: Fase; built_in: boolean; refeicoes: Record<string, unknown[]>
}) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('cardapios').upsert(
    { ...cardapio, user_id: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'id,user_id' }
  )
  if (error) return { error: error.message }
  revalidatePath('/protocolo')
  revalidatePath('/dieta')
}

export async function actionDeleteCardapio(id: string) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb.from('cardapios').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/protocolo')
}
