'use client'

import { useState, useTransition } from 'react'
import type { Cardapio, Protocolo, Profile, RefeicaoCustom, Fase, MealKey } from '@/lib/types'
import {
  actionSaveCardapio,
  actionDeleteCardapio,
  actionCreateCardapio,
  actionSetCardapioAtivo,
  actionSaveRefeicao,
} from './actions'

// ── Constantes ────────────────────────────────────────────────────────────────

const MEAL_LABELS: Record<MealKey, string> = {
  cafe:   '☕ Café da manhã',
  almoco: '🍛 Almoço',
  pre:    '⚡ Pré-treino',
  pos:    '💪 Pós-treino',
  jantar: '🌙 Jantar',
  lanche: '🍎 Lanche',
}

const MEAL_KEYS: MealKey[] = ['cafe', 'almoco', 'pre', 'pos', 'jantar', 'lanche']

const FASE_INFO: Record<Fase, { label: string; icon: string; tagBg: string; tagColor: string }> = {
  bulking:    { label: 'Bulking',    icon: '📈', tagBg: 'var(--blue-bg)',   tagColor: 'var(--blue)'  },
  cutting:    { label: 'Cutting',    icon: '🔥', tagBg: 'var(--amber-bg)', tagColor: 'var(--amber)' },
  manutencao: { label: 'Manutenção', icon: '⚖️', tagBg: 'var(--green-bg)', tagColor: 'var(--green)' },
}

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

function calcTotais(refeicoes: Record<string, RefeicaoCustom[]>) {
  let kcal = 0, prot = 0, carbo = 0, gord = 0
  Object.values(refeicoes).forEach(lista =>
    lista.forEach(r => { kcal += r.kcal; prot += r.prot; carbo += r.carbo; gord += r.gord })
  )
  return { kcal, prot, carbo, gord }
}

function emptyRefeicao(): RefeicaoCustom {
  return { nome: '', kcal: 0, prot: 0, carbo: 0, gord: 0, timing: '', ingredientes: [] }
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(25,23,20,.55)', backdropFilter: 'blur(3px)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: wide ? 600 : 460, maxWidth: '95vw', maxHeight: '90vh',
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

// ── Aviso de conflito fase/cardápio ───────────────────────────────────────────

function ConflictWarning({ fase, cardapioObjetivo, onDismiss }: {
  fase: Fase
  cardapioObjetivo: Fase
  onDismiss: () => void
}) {
  const fi = FASE_INFO[fase]
  const ci = FASE_INFO[cardapioObjetivo]

  return (
    <div style={{
      background: 'var(--amber-bg)', border: '1px solid var(--amber)',
      borderRadius: 'var(--radius-lg)', padding: '14px 18px', marginBottom: 16,
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)', marginBottom: 4 }}>
          Conflito detectado
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>
          Sua fase ativa é <strong>{fi.icon} {fi.label}</strong>, mas o cardápio selecionado é para <strong>{ci.icon} {ci.label}</strong>. Isso pode sabotar seus objetivos silenciosamente.
        </div>
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, flexShrink: 0 }}>✕</button>
    </div>
  )
}

// ── Componente de refeição editável ───────────────────────────────────────────

function RefeicaoEditor({
  refeicao,
  onChange,
  onRemove,
}: {
  refeicao: RefeicaoCustom
  onChange: (r: RefeicaoCustom) => void
  onRemove: () => void
}) {
  return (
    <div style={{
      background: 'var(--surface2)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: 12, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          value={refeicao.nome}
          onChange={e => onChange({ ...refeicao, nome: e.target.value })}
          placeholder="Nome do item (ex: Frango grelhado)"
          style={{ ...inputStyle, flex: 2 }}
        />
        <input
          value={refeicao.timing}
          onChange={e => onChange({ ...refeicao, timing: e.target.value })}
          placeholder="Horário (ex: 07:30)"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={onRemove} style={{ ...btnSm, border: 'none', borderRadius: 'var(--radius)', background: 'var(--red-bg)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font-syne)', fontWeight: 700, whiteSpace: 'nowrap' }}>
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {(['kcal', 'prot', 'carbo', 'gord'] as const).map(k => (
          <div key={k}>
            <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 3 }}>
              {k === 'kcal' ? 'kcal' : k === 'prot' ? 'prot (g)' : k === 'carbo' ? 'carbo (g)' : 'gord (g)'}
            </label>
            <input
              type="number"
              min={0}
              value={refeicao[k] || ''}
              onChange={e => onChange({ ...refeicao, [k]: Number(e.target.value) })}
              style={{ ...inputStyle, textAlign: 'center' }}
            />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 3 }}>
          Ingredientes (um por linha)
        </label>
        <textarea
          rows={2}
          value={refeicao.ingredientes.map(i => Array.isArray(i) ? i.join(' — ') : i).join('\n')}
          onChange={e => onChange({ ...refeicao, ingredientes: e.target.value.split('\n').filter(Boolean).map(l => [l]) })}
          placeholder={'150g frango grelhado\n100g arroz cozido'}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 52 }}
        />
      </div>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  cardapios: Cardapio[]
  protocolo: Protocolo | null
  profile: Profile | null
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function DietaClient({ cardapios: initialCardapios, protocolo, profile }: Props) {
  const [cardapios, setCardapios] = useState(initialCardapios)
  const [activeCardapioId, setActiveCardapioId] = useState(
    protocolo?.cardapio_ativo_id ?? initialCardapios[0]?.id ?? ''
  )
  const [activeMeal, setActiveMeal] = useState<MealKey>('cafe')
  const [showModalCreate, setShowModalCreate] = useState(false)
  const [showModalEdit, setShowModalEdit] = useState(false)
  const [editingMeal, setEditingMeal] = useState<MealKey | null>(null)
  const [editRefeicoes, setEditRefeicoes] = useState<RefeicaoCustom[]>([])
  const [dismissedConflict, setDismissedConflict] = useState(false)
  const [isPending, startTransition] = useTransition()

  const cardapioAtivo = cardapios.find(c => c.id === activeCardapioId) ?? cardapios[0] ?? null
  const totais = cardapioAtivo ? calcTotais(cardapioAtivo.refeicoes) : null

  // Detecta conflito fase vs objetivo do cardápio
  const temConflito = !dismissedConflict
    && protocolo
    && cardapioAtivo
    && cardapioAtivo.objetivo !== protocolo.fase

  // ── Handlers ─────────────────────────────────────────────────────────────

  function handleSelectCardapio(id: string) {
    setActiveCardapioId(id)
    startTransition(async () => { await actionSetCardapioAtivo(id) })
  }

  function handleCreateCardapio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setShowModalCreate(false)
    startTransition(async () => {
      const result = await actionCreateCardapio(fd)
      if (!result?.error) {
        // Reload otimista: cria localmente
        const novo: Cardapio = {
          id: 'c' + Date.now(),
          nome: fd.get('nome') as string,
          objetivo: fd.get('objetivo') as Fase,
          built_in: false,
          refeicoes: { cafe: [], almoco: [], pre: [], pos: [], jantar: [], lanche: [] },
        }
        setCardapios(prev => [...prev, novo])
      }
    })
  }

  function handleDeleteCardapio(id: string) {
    if (cardapios.length <= 1) return
    const remaining = cardapios.filter(c => c.id !== id)
    setCardapios(remaining)
    if (activeCardapioId === id) setActiveCardapioId(remaining[0]?.id ?? '')
    startTransition(async () => { await actionDeleteCardapio(id) })
  }

  function openEditMeal(key: MealKey) {
    if (!cardapioAtivo) return
    setEditingMeal(key)
    setEditRefeicoes([...(cardapioAtivo.refeicoes[key] ?? [])])
    setShowModalEdit(true)
  }

  function handleSaveMeal() {
    if (!cardapioAtivo || !editingMeal) return
    const updatedRefeicoes = { ...cardapioAtivo.refeicoes, [editingMeal]: editRefeicoes }
    setCardapios(prev => prev.map(c =>
      c.id === cardapioAtivo.id ? { ...c, refeicoes: updatedRefeicoes } : c
    ))
    setShowModalEdit(false)
    startTransition(async () => {
      await actionSaveRefeicao(cardapioAtivo.id, editingMeal, updatedRefeicoes)
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const fi = protocolo ? FASE_INFO[protocolo.fase] : null

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Dieta</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>
        Gerencie seus cardápios e planeje suas refeições.
      </p>

      {/* Aviso de conflito fase vs objetivo */}
      {temConflito && (
        <ConflictWarning
          fase={protocolo!.fase}
          cardapioObjetivo={cardapioAtivo!.objetivo}
          onDismiss={() => setDismissedConflict(true)}
        />
      )}

      {/* Seletor de cardápio */}
      <div style={{ ...card, marginBottom: 16 }}>
        <Divider label="Cardápio ativo" />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={activeCardapioId}
            onChange={e => handleSelectCardapio(e.target.value)}
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          >
            {cardapios.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {cardapioAtivo && (
            <span style={{
              fontSize: 9.5, fontWeight: 700, padding: '4px 10px', borderRadius: 999,
              background: FASE_INFO[cardapioAtivo.objetivo].tagBg,
              color: FASE_INFO[cardapioAtivo.objetivo].tagColor,
              textTransform: 'uppercase', letterSpacing: .8, whiteSpace: 'nowrap',
            }}>
              {FASE_INFO[cardapioAtivo.objetivo].icon} {FASE_INFO[cardapioAtivo.objetivo].label}
            </span>
          )}
          <button onClick={() => setShowModalCreate(true)} style={{ ...btnS, ...btnSm }}>+ Novo</button>
          <button
            onClick={() => cardapioAtivo && handleDeleteCardapio(cardapioAtivo.id)}
            disabled={cardapios.length <= 1}
            style={{
              ...btnSm, border: 'none', borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-syne)', fontWeight: 700, cursor: 'pointer',
              background: 'var(--red-bg)', color: 'var(--red)', fontSize: 11,
              opacity: cardapios.length <= 1 ? .4 : 1,
            }}
          >
            🗑 Apagar
          </button>
        </div>
      </div>

      {/* Totais diários */}
      {totais && (
        <div style={{ ...card, marginBottom: 16 }}>
          <Divider label="Total diário" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Kcal', val: totais.kcal, meta: profile?.kcal_meta },
              { label: 'Proteína', val: totais.prot, meta: profile?.prot_meta, unit: 'g' },
              { label: 'Carbo', val: totais.carbo, meta: profile?.carbo_meta, unit: 'g' },
              { label: 'Gordura', val: totais.gord, meta: profile?.gord_meta, unit: 'g' },
            ].map(m => {
              const pct = m.meta ? Math.min(100, Math.round((m.val / m.meta) * 100)) : null
              const over = m.meta ? m.val > m.meta : false
              return (
                <div key={m.label} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: over ? 'var(--red)' : 'var(--text)' }}>
                    {m.val}{m.unit ?? ''}
                  </div>
                  {m.meta && (
                    <>
                      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
                        meta: {m.meta}{m.unit ?? ''}
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'var(--border2)', marginTop: 6, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${pct}%`,
                          background: over ? 'var(--red)' : 'var(--accent)',
                          transition: 'width .3s',
                        }} />
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Tabs de refeições */}
      {cardapioAtivo && (
        <div>
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', marginBottom: 18, overflowX: 'auto' }}>
            {MEAL_KEYS.map(key => {
              const count = cardapioAtivo.refeicoes[key]?.length ?? 0
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

          {/* Lista de itens da refeição ativa */}
          <div>
            {(cardapioAtivo.refeicoes[activeMeal] ?? []).length === 0 ? (
              <div style={{
                ...card, textAlign: 'center', color: 'var(--muted)',
                padding: 36, marginBottom: 14,
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🍽</div>
                <div style={{ fontSize: 13 }}>Nenhum item nesta refeição.</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Clique em &quot;Editar refeição&quot; para adicionar.</div>
              </div>
            ) : (
              <div style={{ marginBottom: 14 }}>
                {(cardapioAtivo.refeicoes[activeMeal] ?? []).map((r, i) => (
                  <div key={i} style={{
                    ...card, marginBottom: 8,
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{r.nome || 'Sem nome'}</span>
                        {r.timing && (
                          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>
                            🕐 {r.timing}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Kcal', val: r.kcal },
                          { label: 'Prot', val: r.prot, unit: 'g' },
                          { label: 'Carbo', val: r.carbo, unit: 'g' },
                          { label: 'Gord', val: r.gord, unit: 'g' },
                        ].map(m => (
                          <span key={m.label} style={{
                            fontSize: 11, fontFamily: 'var(--font-dm-mono)',
                            background: 'var(--surface2)', padding: '2px 8px',
                            borderRadius: 999, color: 'var(--muted)',
                          }}>
                            {m.label}: <strong style={{ color: 'var(--text)' }}>{m.val}{m.unit ?? ''}</strong>
                          </span>
                        ))}
                      </div>
                      {r.ingredientes?.length > 0 && (
                        <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.7 }}>
                          {r.ingredientes.map((ing, j) => (
                            <div key={j}>• {Array.isArray(ing) ? ing.join(' — ') : ing}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => openEditMeal(activeMeal)} style={{ ...btnP, ...btnSm }}>
              ✏️ Editar {MEAL_LABELS[activeMeal].split(' ').slice(1).join(' ')}
            </button>
          </div>
        </div>
      )}

      {/* Estado vazio — sem cardápios */}
      {cardapios.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🍽</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Nenhum cardápio cadastrado</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>
            Crie seu primeiro cardápio para começar a organizar sua dieta.
          </div>
          <button onClick={() => setShowModalCreate(true)} style={btnP}>+ Criar cardápio</button>
        </div>
      )}

      {/* Modal: Criar cardápio */}
      {showModalCreate && (
        <Modal title="🍽 Novo cardápio" onClose={() => setShowModalCreate(false)}>
          <form onSubmit={handleCreateCardapio} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Field label="Nome do cardápio">
              <input name="nome" type="text" placeholder="Ex: Cutting — Semana 1" required style={inputStyle} />
            </Field>
            <Field label="Objetivo">
              <select name="objetivo" defaultValue={protocolo?.fase ?? 'cutting'} style={inputStyle}>
                <option value="cutting">🔥 Cutting</option>
                <option value="bulking">📈 Bulking</option>
                <option value="manutencao">⚖️ Manutenção</option>
              </select>
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button type="button" onClick={() => setShowModalCreate(false)} style={{ ...btnS, ...btnSm }}>Cancelar</button>
              <button type="submit" disabled={isPending} style={{ ...btnP, ...btnSm }}>Criar</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Editar refeição */}
      {showModalEdit && editingMeal && (
        <Modal
          title={`✏️ ${MEAL_LABELS[editingMeal]}`}
          onClose={() => setShowModalEdit(false)}
          wide
        >
          <div style={{ marginBottom: 12 }}>
            {editRefeicoes.map((r, i) => (
              <RefeicaoEditor
                key={i}
                refeicao={r}
                onChange={updated => setEditRefeicoes(prev => prev.map((x, j) => j === i ? updated : x))}
                onRemove={() => setEditRefeicoes(prev => prev.filter((_, j) => j !== i))}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setEditRefeicoes(prev => [...prev, emptyRefeicao()])}
              style={{ ...btnS, ...btnSm }}
            >
              + Adicionar item
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowModalEdit(false)} style={{ ...btnS, ...btnSm }}>Cancelar</button>
              <button onClick={handleSaveMeal} disabled={isPending} style={{ ...btnP, ...btnSm }}>
                {isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
