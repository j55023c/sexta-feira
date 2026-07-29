'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import type { EntradaNut, Profile, MealKey } from '@/lib/types'
import { searchTaco, type TacoItem } from '@/lib/taco'
import { actionAddEntrada, actionRemoveEntrada, actionAddWater, actionRemoveWater } from './actions'
import { getLocalDateString } from '@/lib/utils/date'
import MobileSheet from '@/components/ui/MobileSheet'

// ── Constantes ────────────────────────────────────────────────────────────────

const TODAY = getLocalDateString()

const MEAL_LABELS: Record<MealKey, string> = {
  cafe:   '☕ Café da manhã',
  almoco: '🍛 Almoço',
  pre:    '⚡ Pré-treino',
  pos:    '💪 Pós-treino',
  jantar: '🌙 Jantar',
  lanche: '🍎 Lanche',
}

const MEAL_KEYS: MealKey[] = ['cafe', 'almoco', 'pre', 'pos', 'jantar', 'lanche']

// ── Estilos utilitários ───────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
}

const btnP: React.CSSProperties = {
  border: 'none', borderRadius: 'var(--radius)', padding: '9px 16px',
  fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', background: 'var(--accent)', color: 'white',
}

const btnS: React.CSSProperties = {
  ...btnP,
  background: 'var(--surface2)', color: 'var(--text)',
  border: '1px solid var(--border2)',
}

const btnSm: React.CSSProperties = { padding: '5px 11px', fontSize: 11 }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// Cada entrada já guarda o TOTAL daquele item (calculado uma vez em
// handleAddEntrada, a partir do valor por-100g da TACO × qty/100). Somar de
// novo multiplicando por e.qty/100 aqui contava a quantidade duas vezes —
// esse era o bug real por trás da "pequena diferença" no subtotal, maior
// que simples resíduo de ponto flutuante. Basta somar os valores como estão.
//
// O round1 continua existindo por outro motivo: mesmo somando os valores já
// corretos, JS ainda pode gerar resíduo de float (ex: 12.4 + 8.3 =
// 20.699999999999996). Arredondar só uma vez, no total final, evita isso.
function round1(n: number) {
  return Math.round(n * 10) / 10
}

function calcTotaisDia(entries: EntradaNut[]) {
  const raw = entries.reduce(
    (acc, e) => ({
      kcal:  acc.kcal  + e.kcal,
      prot:  acc.prot  + e.prot,
      carbo: acc.carbo + e.carbo,
      gord:  acc.gord  + e.gord,
    }),
    { kcal: 0, prot: 0, carbo: 0, gord: 0 }
  )

  return {
    kcal:  Math.round(raw.kcal),
    prot:  round1(raw.prot),
    carbo: round1(raw.carbo),
    gord:  round1(raw.gord),
  }
}

function calcTotaisMeal(entries: EntradaNut[], meal: MealKey) {
  return calcTotaisDia(entries.filter(e => e.meal === meal))
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
    </div>
  )
}

function MacroBar({ label, val, meta, color }: { label: string; val: number; meta?: number | null; color: string }) {
  const pct = meta ? Math.min(100, Math.round((val / meta) * 100)) : null
  const over = meta ? val > meta : false
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'var(--font-dm-mono)', fontWeight: 700, color: over ? 'var(--red)' : 'var(--text)' }}>
          {val}{label !== 'Kcal' ? 'g' : ''}
          {meta ? <span style={{ color: 'var(--muted)', fontWeight: 400 }}> / {meta}{label !== 'Kcal' ? 'g' : ''}</span> : null}
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border2)', overflow: 'hidden' }}>
        {pct !== null && (
          <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: over ? 'var(--red)' : color, transition: 'width .4s' }} />
        )}
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  nutLog: Record<string, EntradaNut[]>
  profile: Profile | null
  waterLog: Record<string, number>
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function NutricaoClient({ nutLog: initialLog, profile, waterLog: initialWaterLog }: Props) {
  const [nutLog, setNutLog] = useState(initialLog)
  const [waterLog, setWaterLog] = useState(initialWaterLog)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [activeMeal, setActiveMeal] = useState<MealKey>('cafe')
  const [showModal, setShowModal] = useState(false)
  const [modalMeal, setModalMeal] = useState<MealKey>('cafe')
  const [modalMode, setModalMode] = useState<'busca' | 'manual'>('busca')

  // Estado do buscador TACO dentro do modal
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TacoItem[]>([])
  const [selected, setSelected] = useState<TacoItem | null>(null)
  const [qty, setQty] = useState(100)

  // Estado do alimento manual
  const [manualNome, setManualNome] = useState('')
  const [manualKcal, setManualKcal] = useState(0)
  const [manualProt, setManualProt] = useState(0)
  const [manualCarbo, setManualCarbo] = useState(0)
  const [manualGord, setManualGord] = useState(0)
  const [manualQty, setManualQty] = useState(100)

  const [isPending, startTransition] = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  const entriesDia: EntradaNut[] = nutLog[selectedDate] ?? []
  const totaisDia = calcTotaisDia(entriesDia)
  const waterToday = waterLog[selectedDate] ?? 0
  const waterMeta = profile?.peso ? Math.round(profile.peso * 35) : 2500 // 35ml/kg

  // Foca no campo de busca quando modal abre
  useEffect(() => {
    if (showModal) {
      setTimeout(() => searchRef.current?.focus(), 80)
      setQuery('')
      setResults([])
      setSelected(null)
      setQty(100)
      setModalMode('busca')
      setManualNome('')
      setManualKcal(0)
      setManualProt(0)
      setManualCarbo(0)
      setManualGord(0)
      setManualQty(100)
    }
  }, [showModal])

  // Busca TACO em tempo real
  useEffect(() => {
    setResults(query.length >= 2 ? searchTaco(query) : [])
    setSelected(null)
  }, [query])

  // ── Handlers ─────────────────────────────────────────────────────────────

  function openModal(meal: MealKey) {
    setModalMeal(meal)
    setShowModal(true)
  }

  function handleAddEntrada() {
    if (!selected) return
    const f = qty / 100
    const entrada: EntradaNut = {
      nome:  selected.nome,
      kcal:  Math.round(selected.kcal  * f),
      prot:  Math.round(selected.prot  * f * 10) / 10,
      carbo: Math.round(selected.carbo * f * 10) / 10,
      gord:  Math.round(selected.gord  * f * 10) / 10,
      meal:  modalMeal,
      qty,
    }

    const newEntries = [...entriesDia, entrada]
    setNutLog(prev => ({ ...prev, [selectedDate]: newEntries }))
    setSelected(null)
    setQuery('')
    setResults([])
    setQty(100)
    setShowModal(false)

    startTransition(async () => {
      await actionAddEntrada(selectedDate, entrada, entriesDia)
    })
  }

  function handleRemoveEntrada(index: number) {
      const newEntries = entriesDia.filter((_, i) => i !== index)
      setNutLog(prev => ({ ...prev, [selectedDate]: newEntries }))
      startTransition(async () => {
        await actionRemoveEntrada(selectedDate, index, entriesDia)
      })
    }

    function handleAddManual() {
      if (!manualNome.trim() || (manualKcal === 0 && manualProt === 0 && manualCarbo === 0 && manualGord === 0)) return

      const entrada: EntradaNut = {
        nome: manualNome.trim(),
        kcal: manualKcal,
        prot: manualProt,
        carbo: manualCarbo,
        gord: manualGord,
        meal: modalMeal,
        qty: manualQty,
      }

      const newEntries = [...entriesDia, entrada]
      setNutLog(prev => ({ ...prev, [selectedDate]: newEntries }))
      setManualNome('')
      setManualKcal(0)
      setManualProt(0)
      setManualCarbo(0)
      setManualGord(0)
      setManualQty(100)
      setShowModal(false)

      startTransition(async () => {
        await actionAddEntrada(selectedDate, entrada, entriesDia)
      })
    }

    // Macros da prévia no modal (baseado em qty selecionada)
    const preview = selected
      ? {
          kcal:  Math.round(selected.kcal  * qty / 100),
          prot:  Math.round(selected.prot  * qty / 100 * 10) / 10,
          carbo: Math.round(selected.carbo * qty / 100 * 10) / 10,
          gord:  Math.round(selected.gord  * qty / 100 * 10) / 10,
        }
      : null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Nutrição</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>
        Registre suas refeições e acompanhe seus macros diários.
      </p>

      {/* Seletor de data */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          type="date"
          value={selectedDate}
          max={TODAY}
          onChange={e => setSelectedDate(e.target.value)}
          style={{ ...inputStyle, maxWidth: 180 }}
        />
        {selectedDate !== TODAY && (
          <button onClick={() => setSelectedDate(TODAY)} style={{ ...btnS, ...btnSm }}>
            Hoje
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>
          {fmtDate(selectedDate)}
        </span>
      </div>

      {/* Barras de progresso (compactas) */}
                              <div style={{ ...card, marginBottom: 16 }}>
                                <Divider label="Detalhe" />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <MacroBar label="Kcal"  val={totaisDia.kcal}  meta={profile?.kcal_meta}  color="var(--accent)" />
                                  <MacroBar label="Prot"  val={totaisDia.prot}  meta={profile?.prot_meta}  color="#3b82f6" />
                                  <MacroBar label="Carbo" val={totaisDia.carbo} meta={profile?.carbo_meta} color="#f59e0b" />
                                  <MacroBar label="Gord"  val={totaisDia.gord}  meta={profile?.gord_meta}  color="#8b5cf6" />
                                </div>
                              </div>

                              {/* Água */}
                        <div style={{ ...card, marginBottom: 16 }}>
                          <Divider label="Água" />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                              width: 72, height: 72, borderRadius: '50%',
                              background: 'conic-gradient(var(--accent) calc(var(--pct,0)*3.6deg), var(--border2) 0deg)',
                              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: 'inset 0 0 0 6px var(--surface), 0 2px 8px rgba(0,0,0,0.1)',
                            }}>
                              <div style={{
                                                              width: 54, height: 54, borderRadius: '50%',
                                                              background: 'var(--surface)', display: 'flex', flexDirection: 'column',
                                                              alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                              <span style={{
                                                                fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-syne)',
                                                                color: 'var(--text)',
                                                              }}>
                                                                {waterMeta > 0 ? Math.min(100, Math.round((waterToday / waterMeta) * 100)) : 0}%
                                                              </span>
                                                              <span style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>
                                                                {waterToday}ml
                                                              </span>
                                                            </div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>
                                  Hidratação
                                </span>
                                <span style={{ fontSize: 12, fontFamily: 'var(--font-dm-mono)', fontWeight: 700, color: 'var(--text)' }}>
                                  {waterToday} / {waterMeta}ml
                                </span>
                              </div>
                              <div style={{ height: 8, borderRadius: 4, background: 'var(--border2)', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', width: `${waterMeta > 0 ? Math.min(100, Math.round((waterToday / waterMeta) * 100)) : 0}%`,
                                  borderRadius: 4, background: 'var(--accent)', transition: 'width .4s'
                                }} />
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <button
                                onClick={async () => {
                                  const res = await actionAddWater(selectedDate, 200, waterToday)
                                  if (!res.error && res.ml !== undefined) {
                                    setWaterLog(prev => ({ ...prev, [selectedDate]: res.ml! }))
                                  }
                                }}
                                style={{
                                  ...btnP, ...btnSm, padding: '8px 12px', fontSize: 11,
                                  background: 'var(--accent)', minWidth: 60,
                                }}
                              >
                                +200ml
                              </button>
                              <button
                                onClick={async () => {
                                  const res = await actionRemoveWater(selectedDate, waterToday)
                                  if (!res.error && res.ml !== undefined) {
                                    setWaterLog(prev => ({ ...prev, [selectedDate]: res.ml! }))
                                  }
                                }}
                                style={{
                                  ...btnS, ...btnSm, padding: '8px 12px', fontSize: 11,
                                  border: '1px solid var(--border2)', minWidth: 60,
                                }}
                              >
                                -200ml
                              </button>
                            </div>
                          </div>
                        </div>

                  {/* Tabs de refeição */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', marginBottom: 18, overflowX: 'auto' }}>
        {MEAL_KEYS.map(key => {
          const count = entriesDia.filter(e => e.meal === key).length
          return (
            <button
              key={key}
              onClick={() => setActiveMeal(key)}
              style={{
                padding: '10px 15px', background: 'none', border: 'none',
                fontFamily: 'var(--font-syne)', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap',
                borderBottom: activeMeal === key ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeMeal === key ? 'var(--accent)' : 'var(--muted)',
              }}
            >
              {MEAL_LABELS[key]}
              {count > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 9, fontWeight: 700,
                  background: activeMeal === key ? 'var(--accent)' : 'var(--surface2)',
                  color: activeMeal === key ? 'white' : 'var(--muted)',
                  padding: '1px 5px', borderRadius: 999,
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Entradas da refeição ativa */}
      <div>
        {entriesDia.filter(e => e.meal === activeMeal).length === 0 ? (
          <div style={{ ...card, textAlign: 'center', color: 'var(--muted)', padding: 32, marginBottom: 14 }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📊</div>
            <div style={{ fontSize: 13 }}>Nenhum alimento registrado nesta refeição.</div>
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            {entriesDia.map((e, i) => {
              if (e.meal !== activeMeal) return null
              return (
                <div key={i} style={{
                  ...card, marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{e.nome}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {[
                        { label: 'Kcal', val: e.kcal },
                        { label: 'Prot', val: e.prot, unit: 'g' },
                        { label: 'Carbo', val: e.carbo, unit: 'g' },
                        { label: 'Gord', val: e.gord, unit: 'g' },
                      ].map(m => (
                        <span key={m.label} style={{
                          fontSize: 11, fontFamily: 'var(--font-dm-mono)',
                          background: 'var(--surface2)', padding: '2px 8px',
                          borderRadius: 999, color: 'var(--muted)',
                        }}>
                          {m.label}: <strong style={{ color: 'var(--text)' }}>{m.val}{m.unit ?? ''}</strong>
                        </span>
                      ))}
                      <span style={{
                        fontSize: 11, fontFamily: 'var(--font-dm-mono)',
                        background: 'var(--surface2)', padding: '2px 8px',
                        borderRadius: 999, color: 'var(--muted)',
                      }}>
                        {e.qty}g
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveEntrada(i)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--hint)', fontSize: 14, padding: '4px 6px',
                      borderRadius: 'var(--radius)', flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}

            {/* Subtotal da refeição */}
            {(() => {
              const t = calcTotaisMeal(entriesDia, activeMeal)
              return (
                <div style={{
                  fontSize: 11.5, color: 'var(--muted)', padding: '6px 4px',
                  fontFamily: 'var(--font-dm-mono)',
                }}>
                  Subtotal: {t.kcal} kcal · {t.prot}g prot · {t.carbo}g carbo · {t.gord}g gord
                </div>
              )
            })()}
          </div>
        )}

        <button onClick={() => openModal(activeMeal)} style={{ ...btnP, ...btnSm }}>
          + Adicionar alimento
        </button>
      </div>

      {/* Modal: Adicionar alimento */}
            {showModal && (
              <MobileSheet
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={`+ ${MEAL_LABELS[modalMeal]}`}
              >
                {/* Tabs: Buscar vs Manual */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', marginBottom: 12 }}>
                  <button
                    onClick={() => setModalMode('busca')}
                    style={{
                      flex: 1, padding: '10px 0', background: 'none', border: 'none',
                      fontFamily: 'var(--font-syne)', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', color: modalMode === 'busca' ? 'var(--accent)' : 'var(--muted)',
                      borderBottom: modalMode === 'busca' ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                  >
                    🔍 Buscar (TACO)
                  </button>
                  <button
                    onClick={() => setModalMode('manual')}
                    style={{
                      flex: 1, padding: '10px 0', background: 'none', border: 'none',
                      fontFamily: 'var(--font-syne)', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', color: modalMode === 'manual' ? 'var(--accent)' : 'var(--muted)',
                      borderBottom: modalMode === 'manual' ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                  >
                    ✏️ Manual
                  </button>
                </div>

                {modalMode === 'busca' && (
                  <>
                    {/* Busca */}
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                        Buscar alimento (TACO)
                      </label>
                      <input
                        ref={searchRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Ex: frango, arroz, ovo..."
                        style={inputStyle}
                      />
                    </div>

                    {/* Resultados da busca */}
                    {results.length > 0 && !selected && (
                      <div style={{
                        border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                        maxHeight: 220, overflowY: 'auto', marginBottom: 12,
                      }}>
                        {results.map(item => (
                          <div
                            key={item.id}
                            onClick={() => setSelected(item)}
                            style={{
                              padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                              borderBottom: '1px solid var(--border)',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              transition: 'background .1s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ fontWeight: 600 }}>{item.nome}</span>
                            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>
                              {item.kcal} kcal/100g
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {query.length >= 2 && results.length === 0 && !selected && (
                      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 12, padding: '8px 0' }}>
                        Nenhum alimento encontrado para "{query}".
                      </div>
                    )}

                    {/* Alimento selecionado + quantidade */}
                    {selected && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{
                          background: 'var(--surface2)', borderRadius: 'var(--radius)',
                          padding: '10px 14px', marginBottom: 12,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 700 }}>{selected.nome}</span>
                          <button
                            onClick={() => { setSelected(null); setQuery('') }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}
                          >
                            ✕
                          </button>
                        </div>

                        <div style={{ marginBottom: 12 }}>
                          <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                            Quantidade (g)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={2000}
                            value={qty}
                            onChange={e => setQty(Number(e.target.value))}
                            style={{ ...inputStyle, maxWidth: 140 }}
                          />
                        </div>

                        {/* Prévia dos macros */}
                        {preview && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12 }}>
                            {[
                              { label: 'Kcal',  val: preview.kcal },
                              { label: 'Prot',  val: preview.prot,  unit: 'g' },
                              { label: 'Carbo', val: preview.carbo, unit: 'g' },
                              { label: 'Gord',  val: preview.gord,  unit: 'g' },
                            ].map(m => (
                              <div key={m.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>{m.label}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>{m.val}{m.unit ?? ''}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {modalMode === 'manual' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                        Nome do alimento
                      </label>
                      <input
                        type="text"
                        value={manualNome}
                        onChange={e => setManualNome(e.target.value)}
                        placeholder="Ex: Whey protein, banana com pasta de amendoim..."
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                          Kcal
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={5000}
                          value={manualKcal}
                          onChange={e => setManualKcal(Number(e.target.value))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                          Proteína (g)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={500}
                          step={0.1}
                          value={manualProt}
                          onChange={e => setManualProt(Number(e.target.value))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                          Carboidrato (g)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={500}
                          step={0.1}
                          value={manualCarbo}
                          onChange={e => setManualCarbo(Number(e.target.value))}
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                          Gordura (g)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={500}
                          step={0.1}
                          value={manualGord}
                          onChange={e => setManualGord(Number(e.target.value))}
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
                        Quantidade (g) — opcional, só para referência
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={2000}
                        value={manualQty}
                        onChange={e => setManualQty(Number(e.target.value))}
                        style={{ ...inputStyle, maxWidth: 140 }}
                      />
                    </div>

                    {(manualKcal > 0 || manualProt > 0 || manualCarbo > 0 || manualGord > 0) && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12 }}>
                        {[
                          { label: 'Kcal',  val: manualKcal },
                          { label: 'Prot',  val: manualProt,  unit: 'g' },
                          { label: 'Carbo', val: manualCarbo, unit: 'g' },
                          { label: 'Gord',  val: manualGord,  unit: 'g' },
                        ].map(m => (
                          <div key={m.label} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>{m.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>{m.val}{m.unit ?? ''}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                  <button onClick={() => setShowModal(false)} style={{ ...btnS, ...btnSm }}>Cancelar</button>
                  <button
                    onClick={modalMode === 'busca' ? handleAddEntrada : handleAddManual}
                    disabled={modalMode === 'busca' ? (!selected || isPending) : (!manualNome.trim() || (manualKcal === 0 && manualProt === 0 && manualCarbo === 0 && manualGord === 0) || isPending)}
                    style={{
                      ...btnP, ...btnSm,
                      opacity: (modalMode === 'busca' ? (!selected ? .5 : 1) : (!manualNome.trim() || (manualKcal === 0 && manualProt === 0 && manualCarbo === 0 && manualGord === 0) ? .5 : 1)),
                      cursor: (modalMode === 'busca' ? (!selected ? 'not-allowed' : 'pointer') : (!manualNome.trim() || (manualKcal === 0 && manualProt === 0 && manualCarbo === 0 && manualGord === 0) ? 'not-allowed' : 'pointer'))
                    }}
                  >
                    {isPending ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </MobileSheet>
            )}
    </div>
  )
}