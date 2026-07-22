'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import type { EntradaNut, Profile, MealKey } from '@/lib/types'
import { searchTaco, type TacoItem } from '@/lib/taco'
import { actionAddEntrada, actionRemoveEntrada } from './actions'
import { getLocalDateString } from '@/lib/utils/date'

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

// Arredonda só no fim: somar termos já arredondados ainda acumula erro de
// ponto flutuante em JS (ex: 12.4 + 8.3 = 20.699999999999996). O bug do
// "48.800000000000004g" nasce exatamente daí. Solução: somar os valores
// crus e arredondar uma única vez, no total.
function round1(n: number) {
  return Math.round(n * 10) / 10
}

function calcTotaisDia(entries: EntradaNut[]) {
  const raw = entries.reduce(
    (acc, e) => {
      const f = e.qty / 100
      return {
        kcal:  acc.kcal  + e.kcal  * f,
        prot:  acc.prot  + e.prot  * f,
        carbo: acc.carbo + e.carbo * f,
        gord:  acc.gord  + e.gord  * f,
      }
    },
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(25,23,20,.55)', backdropFilter: 'blur(3px)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 480, maxWidth: '95vw', maxHeight: '90vh',
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 'var(--radius-lg)', boxShadow: '0 20px 50px rgba(0,0,0,.18)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 18px 13px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 17 }}>✕</button>
        </div>
        <div style={{ padding: 18, overflowY: 'auto' }}>{children}</div>
      </div>
    </>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  nutLog: Record<string, EntradaNut[]>
  profile: Profile | null
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function NutricaoClient({ nutLog: initialLog, profile }: Props) {
  const [nutLog, setNutLog] = useState(initialLog)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [activeMeal, setActiveMeal] = useState<MealKey>('cafe')
  const [showModal, setShowModal] = useState(false)
  const [modalMeal, setModalMeal] = useState<MealKey>('cafe')

  // Estado do buscador TACO dentro do modal
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TacoItem[]>([])
  const [selected, setSelected] = useState<TacoItem | null>(null)
  const [qty, setQty] = useState(100)

  const [isPending, startTransition] = useTransition()
  const searchRef = useRef<HTMLInputElement>(null)

  const entriesDia: EntradaNut[] = nutLog[selectedDate] ?? []
  const totaisDia = calcTotaisDia(entriesDia)

  // Foca no campo de busca quando modal abre
  useEffect(() => {
    if (showModal) {
      setTimeout(() => searchRef.current?.focus(), 80)
      setQuery('')
      setResults([])
      setSelected(null)
      setQty(100)
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
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

      {/* Resumo de macros do dia */}
      <div style={{ ...card, marginBottom: 16 }}>
        <Divider label="Macros do dia" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MacroBar label="Kcal"  val={totaisDia.kcal}  meta={profile?.kcal_meta}  color="var(--accent)" />
          <MacroBar label="Prot"  val={totaisDia.prot}  meta={profile?.prot_meta}  color="#3b82f6" />
          <MacroBar label="Carbo" val={totaisDia.carbo} meta={profile?.carbo_meta} color="#f59e0b" />
          <MacroBar label="Gord"  val={totaisDia.gord}  meta={profile?.gord_meta}  color="#8b5cf6" />
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
        <Modal title={`+ ${MEAL_LABELS[modalMeal]}`} onClose={() => setShowModal(false)}>
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
              Nenhum alimento encontrado para &quot;{query}&quot;.
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
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
                  background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12,
                }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <button onClick={() => setShowModal(false)} style={{ ...btnS, ...btnSm }}>Cancelar</button>
            <button
              onClick={handleAddEntrada}
              disabled={!selected || isPending}
              style={{ ...btnP, ...btnSm, opacity: !selected ? .5 : 1, cursor: !selected ? 'not-allowed' : 'pointer' }}
            >
              {isPending ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
