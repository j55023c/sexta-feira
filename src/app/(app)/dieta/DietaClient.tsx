'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  MEALS_GUIDE, EMERGENCIAS_GUIDE, TROCAS_GUIDE, REGRAS_GUIDE, MEAL_TAB_ORDER,
  type MealItem, type MealTabKey,
} from '@/lib/mealsGuide'
import { actionToggleHiddenCard, actionShowAllHidden } from './actions'

type TabKey = MealTabKey | 'emergencias' | 'trocas' | 'regras'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'cafe', label: MEALS_GUIDE.cafe.label },
  { key: 'almoco', label: MEALS_GUIDE.almoco.label },
  { key: 'pre', label: MEALS_GUIDE.pre.label },
  { key: 'pos', label: MEALS_GUIDE.pos.label },
  { key: 'jantar', label: MEALS_GUIDE.jantar.label },
  { key: 'emergencias', label: '🚨 Emergências' },
  { key: 'trocas', label: '↔ Trocas' },
  { key: 'regras', label: '📋 Regras' },
]

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer',
  position: 'relative', transition: 'transform .16s, box-shadow .16s',
}
const btnS: React.CSSProperties = {
  border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '5px 11px',
  fontFamily: 'var(--font-syne)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
  background: 'var(--surface2)', color: 'var(--text)',
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

interface Props {
  hiddenCards: Record<string, string[]>
}

export default function DietaClient({ hiddenCards: initialHidden }: Props) {
  const [tab, setTab] = useState<TabKey>('cafe')
  const [hiddenCards, setHiddenCards] = useState<Record<string, string[]>>(initialHidden ?? {})
  const [showHiddenSection, setShowHiddenSection] = useState(false)
  const [drawerItem, setDrawerItem] = useState<MealItem | null>(null)
  const [isPending, startTransition] = useTransition()

  const hiddenForTab = hiddenCards[tab] ?? []

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
          style={{
            position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 999,
            background: 'var(--surface3)', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
          }}
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

  function renderDrawer() {
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
                {[{ l: 'Proteína', v: pctP, c: '#1a4080' }, { l: 'Carboidrato', v: pctC, c: '#2a6030' }, { l: 'Gordura', v: pctG, c: '#a06018' }].map(b => (
                  <div key={b.l} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>
                      <span>{b.l}</span><span>{b.v}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--surface2)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 999, width: `${b.v}%`, background: b.c, transition: 'width .4s' }} />
                    </div>
                  </div>
                ))}
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

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Dieta</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>
        Guia de referência (fase cutting). Toque em uma opção pra ver ingredientes e macros.
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

      {renderDrawer()}
    </div>
  )
}
