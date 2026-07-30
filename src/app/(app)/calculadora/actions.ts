'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

async function getUser() {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  return { sb, user }
}

// Aplica metas calculadas no perfil (Nutrição) E atualiza protocolo (fase + data_inicio)
export async function actionAplicarMetas(metas: Partial<Profile> & { fase?: 'bulking' | 'cutting' | 'manutencao' }) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { fase, ...profileMetas } = metas
  const today = new Date().toISOString().split('T')[0]

  // 1) Atualiza/cria profile com metas de nutrição (upsert para criar se não existe)
  if (Object.keys(profileMetas).length > 0) {
    const { error } = await sb
      .from('profiles')
      .upsert({ user_id: user.id, ...profileMetas, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    if (error) return { error: error.message }
  }

  // 2) Se veio fase, atualiza protocolo (arquiva fase antiga se mudou)
  // Usa upsert para criar protocolo se não existir
  if (fase) {
    const { data: protocoloAtual } = await sb
      .from('protocolo')
      .select('fase, nome, data_inicio, kcal_meta, prot_meta')
      .eq('user_id', user.id)
      .single()

    const faseMudou = protocoloAtual && protocoloAtual.fase !== fase

    if (faseMudou && protocoloAtual) {
      await sb.from('historico_fases').insert({
        user_id: user.id,
        fase: protocoloAtual.fase,
        nome: protocoloAtual.nome,
        data_inicio: protocoloAtual.data_inicio,
        data_fim: today,
        kcal_meta: protocoloAtual.kcal_meta,
        prot_meta: protocoloAtual.prot_meta,
      })
    }

    // upsert protocolo - cria se não existe, atualiza se existe
    const { error } = await sb.from('protocolo').upsert({
      user_id: user.id,
      fase,
      data_inicio: faseMudou ? today : protocoloAtual?.data_inicio || today,
      nome: protocoloAtual?.nome || `Protocolo ${fase}`,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    if (error) return { error: error.message }
  }

  revalidatePath('/calculadora')
  revalidatePath('/nutricao')
  revalidatePath('/protocolo')
  revalidatePath('/home')
}

// Salva metas manuais no perfil
export async function actionSalvarMetasManuais(metas: {
  kcal_meta: number
  prot_meta: number
  carbo_meta: number
  gord_meta: number
}) {
  const { sb, user } = await getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await sb
    .from('profiles')
    .upsert({ user_id: user.id, ...metas, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/calculadora')
  revalidatePath('/nutricao')
  revalidatePath('/home')
}
