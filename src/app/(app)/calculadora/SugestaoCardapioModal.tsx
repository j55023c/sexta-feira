'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Fase, MealKey, Cardapio } from '@/lib/types'
import {
  gerarCardapioDetalhado, paraRefeicaoCustom, macrosDeIngredientes,
  opcoesParaCategoria, nomeSugerido, MEAL_LABELS, type RefeicaoGerada,
} from '@/lib/cardapioGerador'
import RefeicaoEditorCard from '@/components/cardapio/RefeicaoEditorCard'
import { actionAceitarCardapioSugerido } from '../dieta/actions'

const MEAL_ORDER: MealKey[] = ['cafe', 'almoco', 'pre', 'pos', 'jantar', 'lanche']

const btnP: React.CSSProperties = {
  border: 'none', borderRadius: 'var(--radius)', padding: '10px 18px',
  fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', background: 'var(--accent)', color: 'white',
}
const btnS: React.CSSProperties = {
  ...btnP, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)',
}

interface Props {
  kcalMeta: number
  protMeta: number
  fase: Fase
  onClose: () => void
}

export default function SugestaoCardapioModal({ kcalMeta, protMeta, fase, onClose }: Props) {
  const router = useRouter()
  const [seed, setSeed] = useState(0)
  const [cardapio, setCardapio] = useState<Record<MealKey, RefeicaoGerada>>(() => gerarCardapioDetalhado(kcalMeta, 0))
  const [isPending, startTransition] = useTransition()
  const [mensagem, setMensagem] = useState('')

  const totalDia = MEAL_ORDER.reduce((acc, mealKey) => {
    const m = macrosDeIngredientes(cardapio[mealKey].ingredientes)
    return { kcal: acc.kcal + m.kcal, prot: acc.prot + m.prot, carbo: acc.carbo + m.carbo, gord: acc.gord + m.gord }
  }, { kcal: 0, prot: 0, carbo: 0, gord: 0 })

  const desvioKcal = Math.round(Math.abs(totalDia.kcal - kcalMeta) / kcalMeta * 100)

  function regenerar() {
    const novoSeed = seed + 1
    setSeed(novoSeed)
    setCardapio(gerarCardapioDetalhado(kcalMeta, novoSeed))
    setMensagem('')
  }

  function ajustarGramas(mealKey: MealKey, idx: number, novasGramas: number) {
    setCardapio(prev => {
      const refeicao = prev[mealKey]
      const novosIngredientes = refeicao.ingredientes.map((ing, i) => i === idx ? { ...ing, gramas: novasGramas } : ing)
      return { ...prev, [mealKey]: { ...refeicao, ingredientes: novosIngredientes } }
    })
  }

  function trocarAlimento(mealKey: MealKey, idx: number, alimentoId: string) {
    setCardapio(prev => {
      const refeicao = prev[mealKey]
      const ing = refeicao.ingredientes[idx]
      if (!ing.categoria) return prev
      const opcoes = opcoesParaCategoria(ing.categoria, mealKey)
      const novo = opcoes.find(a => a.id === alimentoId)
      if (!novo) return prev
      // mantém a contribuição calórica aproximada ao trocar, ajusta a gramagem
      const kcalAtual = ing.alimento.kcal * (ing.gramas / 100)
      const novasGramas = Math.max(10, Math.round((kcalAtual / novo.kcal * 100) / 5) * 5)
      const novosIngredientes = refeicao.ingredientes.map((x, i) => i === idx ? { ...x, alimento: novo, gramas: novasGramas } : x)
      return { ...prev, [mealKey]: { ...refeicao, ingredientes: novosIngredientes } }
    })
  }

  function handleAceitar() {
    setMensagem('')
    const refeicoes: Record<string, ReturnType<typeof paraRefeicaoCustom>[]> = {}
    MEAL_ORDER.forEach(mealKey => { refeicoes[mealKey] = [paraRefeicaoCustom(cardapio[mealKey])] })

    const sugestao: Omit<Cardapio, 'user_id'> = {
      id: `gerado-${fase}-${Date.now()}`,
      nome: nomeSugerido(fase, kcalMeta),
      objetivo: fase,
      built_in: false,
      refeicoes,
    }

    startTransition(async () => {
      const result = await actionAceitarCardapioSugerido(sugestao)
      if (result?.error) { setMensagem('Erro ao salvar: ' + result.error); return }
      onClose()
      router.push('/dieta')
    })
  }

  function handleCriarProprio() {
    onClose()
    router.push('/dieta')
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(25,23,20,.55)', backdropFilter: 'blur(3px)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 560, maxWidth: '95vw', maxHeight: '88vh', background: 'var(--surface)',
        border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 50px rgba(0,0,0,.2)', zIndex: 301,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border2)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800 }}>🍽 Cardápio sugerido</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 17 }}>✕</button>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            Montado a partir do seu alvo de {kcalMeta} kcal · gerado agora, ainda não foi salvo
          </div>
        </div>

        {/* corpo scrollável */}
        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          {MEAL_ORDER.map(mealKey => (
            <RefeicaoEditorCard
              key={mealKey}
              refeicao={cardapio[mealKey]}
              onAjustarGramas={(idx, g) => ajustarGramas(mealKey, idx, g)}
              onTrocarAlimento={(idx, id) => trocarAlimento(mealKey, idx, id)}
            />
          ))}

          <div style={{
            background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12,
            display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 4,
          }}>
            <div>
              <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>Total do dia</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>
                {Math.round(totalDia.kcal)} kcal
                <span style={{ fontSize: 11, color: desvioKcal <= 8 ? 'var(--green)' : 'var(--amber)', marginLeft: 8 }}>
                  ({desvioKcal <= 2 ? 'no alvo' : `${desvioKcal}% do alvo`})
                </span>
              </div>
            </div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-dm-mono)', color: 'var(--muted)' }}>
              P {Math.round(totalDia.prot)}g (meta {protMeta}g) · C {Math.round(totalDia.carbo)}g · G {Math.round(totalDia.gord)}g
            </div>
          </div>

          {mensagem && <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 8 }}>{mensagem}</div>}
        </div>

        {/* footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border2)', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
          <button onClick={regenerar} style={btnS}>🔄 Gerar outra</button>
          <button onClick={handleCriarProprio} style={btnS}>✏️ Criar o meu</button>
          <button onClick={handleAceitar} disabled={isPending} style={{ ...btnP, marginLeft: 'auto' }}>
            {isPending ? 'Salvando...' : '✅ Usar esse cardápio'}
          </button>
        </div>
      </div>
    </>
  )
}
