'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Cardapio, Fase, MealKey, Protocolo } from '@/lib/types'
import {
  MEALS_GUIDE, EMERGENCIAS_GUIDE, TROCAS_GUIDE, REGRAS_GUIDE, MEAL_TAB_ORDER,
  type MealItem, type MealTabKey,
} from '@/lib/mealsGuide'
import {
  refeicaoCustomParaGerada, paraRefeicaoCustom, macrosDeIngredientes,
  opcoesParaCategoria, MEAL_LABELS, type RefeicaoGerada,
} from '@/lib/cardapioGerador'
import RefeicaoEditorCard from '@/components/cardapio/RefeicaoEditorCard'
import { actionToggleHiddenCard, actionShowAllHidden, actionSaveCardapio, actionDeleteCardapio, actionCreateCardapio, actionSetCardapioAtivo } from './actions'

const MEAL_ORDER: MealKey[] = ['cafe', 'almoco', 'pre', 'pos', 'jantar', 'lanche']

type TabKey = MealTabKey | 'emergencias' | 'trocas' | 'regras' | 'cardapios'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'cardapios', label: '🍽 Meus Cardápios' },
  { key: 'cafe', label: MEALS_GUIDE.cafe.label },
  { key: 'almoco', label: MEALS_GUIDE.almoco.label },
  { key: 'pre', label: MEALS_GUIDE.pre.label },
  { key: 'pos', label: MEALS_GUIDE.pos.label },
  { key: 'jantar', label: MEALS_GUIDE.jantar.label },
  { key: 'emergencias', label: '🚨 Emergências' },
  { key: 'trocas', label: '↔ Trocas' },
  { key: 'regras', label: '📋 Regras' },
]

const FASE_INFO: Record<Fase, { label: string; icon: string; tagBg: string; tagColor: string }> = {
  bulking:    { label: 'Bulking',    icon: '📈', tagBg: 'var(--blue-bg)',   tagColor: 'var(--blue)'  },
  cutting:    { label: 'Cutting',    icon: '🔥', tagBg: 'var(--amber-bg)', tagColor: 'var(--amber)' },
  manutencao: { label: 'Manutenção', icon: '⚖️', tagBg: 'var(--green-bg)', tagColor: 'var(--green)' },
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer',
  position: 'relative', transition: 'transform .16s, box-shadow .16s',
}
const btnP: React.CSSProperties = {
  border: 'none', borderRadius: 'var(--radius)', padding: '9px 16px',
  fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', background: 'var(--accent)', color: 'white',
}
const btnS: React.CSSProperties = {
  ...btnP, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)',
}
const btnSm: React.CSSProperties = { padding: '5px 11px', fontSize: 11 }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
}
const mm: React.CSSProperties = { fontSize: 9.5, padding: '2px 6px', borderRadius: 999, fontWeight: 600, fontFamily: 'var(--font-dm-mono)' }

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
    </div>
  )
}

function totaisCardapio(c: Cardapio) {
  const todas = Object.values(c.refeicoes).flat()
  return {
    kcal: Math.round(todas.reduce((s, r) => s + r.kcal, 0)),
    prot: Math.round(todas.reduce((s, r) => s + r.prot, 0)),
  }
}

interface Props {
  hiddenCards: Record<string, string[]>
  cardapios: Cardapio[]
  protocolo: Protocolo | null
}

export default function DietaClient({ hiddenCards: initialHidden, cardapios: initialCardapios, protocolo }: Props) {
  const [tab, setTab] = useState<TabKey>('cardapios')
  const [hiddenCards, setHiddenCards] = useState<Record<string, string[]>>(initialHidden ?? {})
  const [showHiddenSection, setShowHiddenSection] = useState(false)
  const [drawerItem, setDrawerItem] = useState<MealItem | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── estado de "Meus Cardápios" ──────────────────────────────────────────
  const [cardapiosState, setCardapiosState] = useState<Cardapio[]>(initialCardapios ?? [])
  const [cardapioAtivoId, setCardapioAtivoId] = useState(protocolo?.cardapio_ativo_id ?? '')
  const [cardapioAberto, setCardapioAberto] = useState<Cardapio | null>(null)
  const [drawerVisivel, setDrawerVisivel] = useState(false) // controla a transição de slide
  const [editingRefeicoes, setEditingRefeicoes] = useState<Record<MealKey, RefeicaoGerada>>({} as Record<MealKey, RefeicaoGerada>)
  const [nomeEditando, setNomeEditando] = useState('')
  const [showModalNovo, setShowModalNovo] = useState(false)

  const hiddenForTab = MEAL_TAB_ORDER.includes(tab as MealTabKey) ? (hiddenCards[tab] ?? []) : []

  function hideCard(id: string) {
    setHiddenCards(prev => ({ ...prev, [tab]: [...(prev[tab] ?? []), id] }))
    startTransition(async () => { await actionToggleHiddenCard(tab, id, true) })
  }
  function showCard(id: string) {
    setHiddenCards(prev => ({ ...prev, [tab]: (prev[tab] ?? []).filter(x => x !== id) }))
    startTransition(async () => { await actionToggleHiddenCard(tab, id, false) })
  }
  function showAllHidden() {
    setHiddenCards(prev => ({ ...prev, [tab]: [] }))
    setShowHiddenSection(false)
    startTransition(async () => { await actionShowAllHidden(tab) })
  }

  // ── abrir/fechar drawer de cardápio, com animação de slide ──────────────
  function abrirCardapio(c: Cardapio) {
    setCardapioAberto(c)
    setNomeEditando(c.nome)
    const rec = {} as Record<MealKey, RefeicaoGerada>
    MEAL_ORDER.forEach(mealKey => {
      const refeicaoSalva = (c.refeicoes[mealKey] ?? [])[0]
      rec[mealKey] = refeicaoSalva
        ? refeicaoCustomParaGerada(mealKey, refeicaoSalva)
        : { mealKey, nome: MEAL_LABELS[mealKey], ingredientes: [] }
    })
    setEditingRefeicoes(rec)
    // monta fechado e só na próxima animação frame libera o transform — é o
    // que garante que a transição de slide realmente aconteça (senão o
    // navegador já pinta aberto de primeira, sem transição visível)
    setDrawerVisivel(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerVisivel(true)))
  }

  function fecharDrawer() {
    setDrawerVisivel(false)
    setTimeout(() => setCardapioAberto(null), 300)
  }

  function ajustarGramasDrawer(mealKey: MealKey, idx: number, novasGramas: number) {
    setEditingRefeicoes(prev => {
      const refeicao = prev[mealKey]
      const novos = refeicao.ingredientes.map((ing, i) => i === idx ? { ...ing, gramas: novasGramas } : ing)
      return { ...prev, [mealKey]: { ...refeicao, ingredientes: novos } }
    })
  }

  function trocarAlimentoDrawer(mealKey: MealKey, idx: number, alimentoId: string) {
    setEditingRefeicoes(prev => {
      const refeicao = prev[mealKey]
      const ing = refeicao.ingredientes[idx]
      if (!ing.categoria) return prev
      const opcoes = opcoesParaCategoria(ing.categoria, mealKey)
      const novo = opcoes.find(a => a.id === alimentoId)
      if (!novo) return prev
      const kcalAtual = ing.alimento.kcal * (ing.gramas / 100)
      const novasGramas = Math.max(10, Math.round((kcalAtual / novo.kcal * 100) / 5) * 5)
      const novos = refeicao.ingredientes.map((x, i) => i === idx ? { ...x, alimento: novo, gramas: novasGramas } : x)
      return { ...prev, [mealKey]: { ...refeicao, ingredientes: novos } }
    })
  }

  function handleSalvarCardapio() {
    if (!cardapioAberto) return
    const refeicoes: Record<string, ReturnType<typeof paraRefeicaoCustom>[]> = {}
    MEAL_ORDER.forEach(mealKey => { refeicoes[mealKey] = [paraRefeicaoCustom(editingRefeicoes[mealKey])] })
    const atualizado: Cardapio = { ...cardapioAberto, nome: nomeEditando, refeicoes }
    setCardapiosState(prev => prev.map(c => c.id === atualizado.id ? atualizado : c))
    startTransition(async () => { await actionSaveCardapio(atualizado) })
    fecharDrawer()
  }

  function handleDeletarCardapio() {
    if (!cardapioAberto) return
    if (cardapiosState.length <= 1) return
    const id = cardapioAberto.id
    setCardapiosState(prev => prev.filter(c => c.id !== id))
    startTransition(async () => { await actionDeleteCardapio(id) })
    fecharDrawer()
  }

  function handleDefinirAtivo() {
    if (!cardapioAberto) return
    setCardapioAtivoId(cardapioAberto.id)
    startTransition(async () => { await actionSetCardapioAtivo(cardapioAberto.id) })
  }

  function handleCriarCardapio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setShowModalNovo(false)
    startTransition(async () => {
      await actionCreateCardapio(fd)
      const novo: Cardapio = {
        id: 'c' + Date.now(),
        nome: fd.get('nome') as string,
        objetivo: fd.get('objetivo') as Fase,
        built_in: false,
        refeicoes: { cafe: [], almoco: [], pre: [], pos: [], jantar: [], lanche: [] },
      }
      setCardapiosState(prev => [...prev, novo])
    })
  }

  // ── Meus Cardápios ───────────────────────────────────────────────────────
  function renderMeusCardapios() {
    return (
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setShowModalNovo(true)} style={{ ...btnP, ...btnSm }}>+ Novo cardápio</button>
        </div>

        {cardapiosState.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32, textAlign: 'center', color: 'var(--muted)' }}>
            Nenhum cardápio ainda. Crie um do zero ou aceite uma sugestão na Calculadora.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
            {cardapiosState.map(c => {
              const totais = totaisCardapio(c)
              const ativo = cardapioAtivoId === c.id
              const fi = FASE_INFO[c.objetivo]
              return (
                <div
                  key={c.id}
                  onClick={() => abrirCardapio(c)}
                  style={{
                    ...card, padding: 14,
                    border: ativo ? '2px solid var(--accent)' : '1px solid var(--border)',
                  }}
                >
                  {ativo && (
                    <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 8.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--accent)', color: 'white' }}>
                      ATIVO
                    </span>
                  )}
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: fi.tagColor, marginBottom: 4 }}>
                    {fi.icon} {fi.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, paddingRight: ativo ? 50 : 0 }}>{c.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>
                    {totais.kcal} kcal · P{totais.prot}g
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  function MealCard({ item }: { item: MealItem }) {
    return (
      <div style={card} onClick={() => setDrawerItem(item)}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${item.cor}, ${item.cor}aa)` }} />
        <div style={{ padding: '11px 13px' }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: item.cor, marginBottom: 4 }}>{item.cat}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, lineHeight: 1.3 }}>{item.nome}</div>
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 11, color: 'var(--accent)', marginBottom: 6 }}>{item.kcal} kcal</div>
          {item.ingredientes.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5 }}>
              {item.ingredientes.map(i => i[0]).join(' · ')}
            </div>
          )}
          {item.macros && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 7 }}>
              <span style={{ ...mm, background: 'var(--blue-bg)', color: 'var(--blue)' }}>P {item.macros.P}g</span>
              <span style={{ ...mm, background: 'var(--green-bg)', color: 'var(--green)' }}>C {item.macros.C}g</span>
              <span style={{ ...mm, background: 'var(--amber-bg)', color: 'var(--amber)' }}>G {item.macros.G}g</span>
            </div>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); hideCard(item.id) }}
          title="Ocultar este card"
          style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 999, background: 'var(--surface3)', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer' }}
        >✕</button>
      </div>
    )
  }

  function renderMealTab(key: MealTabKey) {
    const data = MEALS_GUIDE[key]
    const hidden = hiddenCards[key] ?? []
    return (
      <div>
        {data.sections.map(sec => {
          const visible = sec.items.filter(m => !hidden.includes(m.id))
          if (!visible.length) return null
          return (
            <div key={sec.label}>
              <Divider label={sec.label} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
                {visible.map(m => <MealCard key={m.id} item={m} />)}
              </div>
            </div>
          )
        })}
        <div style={{ borderLeft: '3px solid var(--accent)', padding: '9px 12px', background: 'var(--accent-glow-10)', borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.65, marginTop: 14 }}
          dangerouslySetInnerHTML={{ __html: data.tip }} />
      </div>
    )
  }

  function renderEmergencias() {
    const hidden = hiddenCards.emergencias ?? []
    const visible = EMERGENCIAS_GUIDE.filter(m => !hidden.includes(m.id))
    const hiddenItems = EMERGENCIAS_GUIDE.filter(m => hidden.includes(m.id))
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
          {visible.map(m => (
            <div key={m.id} style={{ ...card, cursor: 'default' }}>
              <div style={{ height: 4, background: `linear-gradient(90deg, ${m.cor}, ${m.cor}aa)` }} />
              <div style={{ padding: '11px 13px' }}>
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: m.cor, marginBottom: 4 }}>{m.cat}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{m.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: m.note }} />
              </div>
              <button
                onClick={() => hideCard(m.id)}
                title="Ocultar"
                style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 999, background: 'var(--surface3)', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer' }}
              >✕</button>
            </div>
          ))}
        </div>
        {showHiddenSection && hiddenItems.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Divider label={`Ocultos (${hiddenItems.length})`} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 10 }}>
              {hiddenItems.map(m => (
                <div key={m.id} style={{ ...card, cursor: 'default', opacity: .6 }}>
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${m.cor}, ${m.cor}aa)` }} />
                  <div style={{ padding: '11px 13px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: m.cor, marginBottom: 4 }}>{m.cat}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nome}</div>
                  </div>
                  <button
                    onClick={() => showCard(m.id)}
                    title="Mostrar de novo"
                    style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 999, background: 'var(--green)', border: 'none', color: 'white', fontSize: 11, cursor: 'pointer' }}
                  >↩</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderTrocas() {
    const tbl = (t: typeof TROCAS_GUIDE.proteinas) => (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', fontSize: 13 }}>
        <thead>
          <tr>
            {t.header.map(h => (
              <th key={h} style={{ background: 'var(--inverse-bg)', color: 'var(--inverse-text)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', padding: '10px 13px', textAlign: 'left', fontWeight: 700 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{
                  padding: '8px 13px', borderBottom: i < t.rows.length - 1 ? '1px solid var(--border)' : 'none',
                  color: j === 0 ? 'var(--muted)' : j === 1 ? 'var(--text)' : j === 2 ? 'var(--accent)' : 'var(--text)',
                  fontWeight: j === 1 || j === 3 ? 700 : 400,
                  fontFamily: j === 2 ? 'var(--font-dm-mono)' : 'var(--font-syne)',
                }}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
    return (
      <div>
        <Divider label="Proteínas — equivalências por 100g" />
        {tbl(TROCAS_GUIDE.proteinas)}
        <Divider label="Carboidratos — equivalências" />
        {tbl(TROCAS_GUIDE.carbos)}
        <Divider label="Gorduras — equivalências" />
        {tbl(TROCAS_GUIDE.gorduras)}
        <div style={{ background: 'var(--inverse-bg)', color: 'var(--inverse-text)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', fontSize: 13, lineHeight: 1.65, marginTop: 14 }}>
          <strong style={{ color: 'var(--accent2)' }}>Regra das trocas:</strong> proteína → troque por proteína de caloria similar. Carbo → troque por carbo similar. Nunca substitua proteína por carbo achando que vai dar no mesmo.
        </div>
      </div>
    )
  }

  function renderRegras() {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 14 }}>
          {REGRAS_GUIDE.map(r => (
            <div key={r.num} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--surface2)', lineHeight: 1, marginBottom: 5 }}>{r.num}</div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{r.title}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'var(--inverse-bg)', color: 'var(--inverse-text)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', fontSize: 13, lineHeight: 1.65 }}>
          <strong style={{ color: 'var(--accent2)' }}>Hierarquia universal:</strong> proteína ✓ → leguminosa ✓ → carboidrato ✓ → gordura ✓ → vegetais.
        </div>
      </div>
    )
  }

  function renderDrawerGuia() {
    if (!drawerItem) return null
    const m = drawerItem
    const total = m.macros ? m.macros.P * 4 + m.macros.C * 4 + m.macros.G * 9 : 0
    const pctP = m.macros && total ? Math.round((m.macros.P * 4 / total) * 100) : 0
    const pctC = m.macros && total ? Math.round((m.macros.C * 4 / total) * 100) : 0
    const pctG = m.macros && total ? Math.round((m.macros.G * 9 / total) * 100) : 0

    return (
      <>
        <div onClick={() => setDrawerItem(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(25,23,20,.5)', zIndex: 500 }} />
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(460px, 100vw)',
          background: 'var(--surface)', zIndex: 501, display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,.15)', overflow: 'hidden',
        }}>
          <div style={{ height: 4, background: `linear-gradient(90deg, ${m.cor}, ${m.cor}88)`, flexShrink: 0 }} />
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: m.cor, marginBottom: 4 }}>{m.cat}</div>
              <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginBottom: 3 }}>{m.nome}</div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>{m.kcal} kcal</div>
            </div>
            <button onClick={() => setDrawerItem(null)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border2)', background: 'var(--surface2)', cursor: 'pointer', fontSize: 16, color: 'var(--muted)' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '10px 12px', fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
              ⏰ <strong style={{ color: 'var(--text)' }}>{m.timing}</strong>
            </div>
            {m.ingredientes.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--hint)', marginBottom: 8 }}>Ingredientes</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
                  <tbody>
                    {m.ingredientes.map((ing, i) => (
                      <tr key={i} style={{ borderBottom: i < m.ingredientes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '8px 4px', fontSize: 13, color: 'var(--muted)', width: '40%' }}>{ing[0]}</td>
                        <td style={{ padding: '8px 4px', fontSize: 13, fontWeight: 600, width: '32%' }}>{ing[1]}</td>
                        <td style={{ padding: '8px 4px', fontSize: 12, fontFamily: 'var(--font-dm-mono)', color: 'var(--accent)', fontWeight: 600, textAlign: 'right', width: '28%' }}>{ing[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
            {m.macros && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--hint)', marginBottom: 8 }}>Macronutrientes</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                  <div style={{ background: 'var(--blue-bg)', color: 'var(--blue)', borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Proteína</div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>{m.macros.P}g</div>
                    <div style={{ fontSize: 10, marginTop: 1 }}>{m.macros.P * 4} kcal · {pctP}%</div>
                  </div>
                  <div style={{ background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Carbo</div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>{m.macros.C}g</div>
                    <div style={{ fontSize: 10, marginTop: 1 }}>{m.macros.C * 4} kcal · {pctC}%</div>
                  </div>
                  <div style={{ background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 'var(--radius)', padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Gordura</div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>{m.macros.G}g</div>
                    <div style={{ fontSize: 10, marginTop: 1 }}>{m.macros.G * 9} kcal · {pctG}%</div>
                  </div>
                </div>
              </>
            )}
            {m.note && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--hint)', marginBottom: 8, marginTop: 16 }}>Observação</div>
                <div style={{ background: 'rgba(200,68,26,.05)', borderLeft: '2px solid var(--accent)', borderRadius: '0 var(--radius) var(--radius) 0', padding: '10px 12px', fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}
                  dangerouslySetInnerHTML={{ __html: m.note }} />
              </>
            )}
          </div>
        </div>
      </>
    )
  }

  // ── Drawer de edição de cardápio, com animação de slide ──────────────────
  function renderDrawerCardapio() {
    if (!cardapioAberto) return null
    const ehAtivo = cardapioAtivoId === cardapioAberto.id
    return (
      <>
        <div
          onClick={fecharDrawer}
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: drawerVisivel ? 'rgba(25,23,20,.5)' : 'rgba(25,23,20,0)',
            transition: 'background .25s',
            pointerEvents: drawerVisivel ? 'all' : 'none',
          }}
        />
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(540px,100vw)',
          background: 'var(--surface)', zIndex: 401, display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,.15)', overflow: 'hidden',
          transform: drawerVisivel ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .32s cubic-bezier(.32,0,.15,1)',
        }}>
          <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <input
              value={nomeEditando}
              onChange={e => setNomeEditando(e.target.value)}
              style={{ flex: 1, background: 'none', border: 'none', fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700, color: 'var(--text)', outline: 'none', padding: 0 }}
            />
            {ehAtivo && (
              <span style={{ fontSize: 8.5, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: 'var(--accent)', color: 'white', flexShrink: 0 }}>ATIVO</span>
            )}
            <button onClick={fecharDrawer} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 17, flexShrink: 0 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
            {MEAL_ORDER.map(mealKey => (
              <RefeicaoEditorCard
                key={mealKey}
                refeicao={editingRefeicoes[mealKey]}
                onAjustarGramas={(idx, g) => ajustarGramasDrawer(mealKey, idx, g)}
                onTrocarAlimento={(idx, id) => trocarAlimentoDrawer(mealKey, idx, id)}
              />
            ))}
          </div>

          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border2)', display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleDeletarCardapio}
              disabled={cardapiosState.length <= 1}
              style={{ ...btnSm, border: 'none', borderRadius: 'var(--radius)', background: 'var(--red-bg)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 700, opacity: cardapiosState.length <= 1 ? .4 : 1 }}
            >
              🗑 Apagar
            </button>
            {!ehAtivo && <button onClick={handleDefinirAtivo} style={{ ...btnS, ...btnSm }}>Definir como ativo</button>}
            <button onClick={handleSalvarCardapio} disabled={isPending} style={{ ...btnP, ...btnSm, marginLeft: 'auto' }}>
              {isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Dieta</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>
        Seus cardápios editáveis, e um guia de referência (fase cutting) pra consulta.
      </p>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', marginBottom: 18, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowHiddenSection(false) }} style={{
            padding: '10px 15px', background: 'none', border: 'none',
            fontFamily: 'var(--font-syne)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.key ? 'var(--accent)' : 'var(--muted)', whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {MEAL_TAB_ORDER.includes(tab as MealTabKey) && hiddenForTab.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowHiddenSection(v => !v)} style={btnS}>
            👁 {hiddenForTab.length} card{hiddenForTab.length > 1 ? 's' : ''} oculto{hiddenForTab.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
      {tab === 'emergencias' && (hiddenCards.emergencias ?? []).length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={() => setShowHiddenSection(v => !v)} style={btnS}>
            👁 {(hiddenCards.emergencias ?? []).length} oculto(s)
          </button>
        </div>
      )}

      {tab === 'cardapios' && renderMeusCardapios()}
      {MEAL_TAB_ORDER.includes(tab as MealTabKey) && renderMealTab(tab as MealTabKey)}
      {tab === 'emergencias' && renderEmergencias()}
      {tab === 'trocas' && renderTrocas()}
      {tab === 'regras' && renderRegras()}

      {showHiddenSection && MEAL_TAB_ORDER.includes(tab as MealTabKey) && hiddenForTab.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Divider label={`Ocultos (${hiddenForTab.length})`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {hiddenForTab.map(id => (
              <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius)' }}>
                <span style={{ flex: 1, fontSize: 12.5 }}>{id}</span>
                <button onClick={() => showCard(id)} style={{ ...btnS, padding: '3px 9px', fontSize: 10 }}>Mostrar</button>
              </div>
            ))}
            <button onClick={showAllHidden} disabled={isPending} style={{ ...btnS, alignSelf: 'flex-start' }}>Mostrar todos</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 20, fontSize: 11.5, color: 'var(--muted)' }}>
        <Link href="/nutricao" style={{ color: 'var(--accent)' }}>Registrar refeição em Nutrição →</Link>
      </div>

      {renderDrawerGuia()}
      {renderDrawerCardapio()}

      {showModalNovo && (
        <>
          <div onClick={() => setShowModalNovo(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(25,23,20,.55)', backdropFilter: 'blur(3px)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 400, maxWidth: '95vw', background: 'var(--surface)',
            border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 50px rgba(0,0,0,.18)', zIndex: 201,
          }}>
            <div style={{ padding: '16px 18px 13px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>🍽 Novo cardápio</span>
              <button onClick={() => setShowModalNovo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 17 }}>✕</button>
            </div>
            <form onSubmit={handleCriarCardapio} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div>
                <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>Nome do cardápio</label>
                <input name="nome" type="text" placeholder="Ex: Cutting — Semana 1" required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>Objetivo</label>
                <select name="objetivo" defaultValue={protocolo?.fase ?? 'cutting'} style={inputStyle}>
                  <option value="cutting">🔥 Cutting</option>
                  <option value="bulking">📈 Bulking</option>
                  <option value="manutencao">⚖️ Manutenção</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                <button type="button" onClick={() => setShowModalNovo(false)} style={{ ...btnS, ...btnSm }}>Cancelar</button>
                <button type="submit" disabled={isPending} style={{ ...btnP, ...btnSm }}>Criar (começa vazio)</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
