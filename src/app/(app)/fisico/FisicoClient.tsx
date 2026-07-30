'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Pencil, Check } from 'lucide-react'
import type { FisicoLog, Profile, CustomCheck } from '@/lib/types'
import { actionSaveFisico, actionSaveCustomChecks } from './actions'

// ── Constantes ────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const MUSCULOS_OPTS = [
  'Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps',
  'Abdômen', 'Quadríceps', 'Posterior', 'Glúteo', 'Panturrilha',
]

// Defaults (fallback quando profile.custom_checks vazio)
const DEFAULT_CHECKS: CustomCheck[] = [
  { id: 'agua', label: 'Água (2L+)', emoji: '💧', is_default: true },
  { id: 'proteina', label: 'Proteína batida', emoji: '🥩', is_default: true },
  { id: 'sono', label: 'Sono ok', emoji: '😴', is_default: true },
  { id: 'treino', label: 'Treino feito', emoji: '🏋️', is_default: true },
  { id: 'verduras', label: 'Legumes/verduras', emoji: '🥗', is_default: true },
  { id: 'sol', label: 'Sol / caminhada', emoji: '☀️', is_default: true },
  { id: 'junk', label: 'Sem junk food', emoji: '📵', is_default: true },
  { id: 'descanso', label: 'Descanso ativo', emoji: '🧘', is_default: true },
]

const SENSACAO_OPTS = ['Ótimo', 'Bem', 'Normal', 'Cansado', 'Péssimo']
const AXIAL_OPTS = ['Nenhuma', 'Leve', 'Moderada', 'Intensa']
const DOR_OPTS = ['Nenhuma', 'Leve', 'Moderada', 'Intensa']
const CRESCEU_OPTS = ['Sim', 'Talvez', 'Não']

const EMOJI_QUICK = ['💧', '🥩', '😴', '🏋️', '🥗', '☀️', '📵', '🧘', '💊', '📖', '🧠', '🚶', '🏃', '💤', '🎯', '⭐', '🔥', '❤️']

// ── Estilos utilitários ───────────────────────────────────────────────────────

const card = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
  marginBottom: 14,
}

const btnP = {
  border: 'none', borderRadius: 'var(--radius)', padding: '9px 16px',
  fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', background: 'var(--accent)', color: 'white',
}

const btnS = {
  ...btnP,
  background: 'var(--surface2)', color: 'var(--text)',
  border: '1px solid var(--border2)',
}

const btnSm = { padding: '5px 11px', fontSize: 11 }

const inputStyle = {
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

function emptyLog(date: string): Omit<FisicoLog, 'user_id'> {
  return {
    date, peso: null, altura: null, slept: null, woke: null,
    musculos: [], axial: null, sensacao: null, dor: null, cresceu: null,
    obs: null, checks: [],
  }
}

function generateId() {
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
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
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
      cursor: 'pointer', fontFamily: 'var(--font-syne)', transition: 'all .13s',
      border: active ? 'none' : '1px solid var(--border2)',
      background: active ? 'var(--accent)' : 'var(--surface2)',
      color: active ? 'white' : 'var(--muted)',
    }}>
      {label}
    </button>
  )
}

function SelectChip({ options, value, onChange }: { options: string[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <ToggleChip key={opt} label={opt} active={value === opt} onClick={() => onChange(value === opt ? '' : opt)} />
      ))}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  fisicoLog: Record<string, FisicoLog>
  profile: Profile | null
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function FisicoClient({ fisicoLog: initialLog, profile }: Props) {
  const [fisicoLog, setFisicoLog] = useState(initialLog)
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Custom checks (do profile ou defaults)
  const [customChecks, setCustomChecks] = useState<CustomCheck[]>(
    profile?.custom_checks?.length ? profile.custom_checks : DEFAULT_CHECKS
  )
  const [showCheckForm, setShowCheckForm] = useState(false)
  const [editingCheck, setEditingCheck] = useState<CustomCheck | null>(null)
  const [checkForm, setCheckForm] = useState<Partial<CustomCheck>>({})

  const existing = fisicoLog[selectedDate]
  const [form, setForm] = useState<Omit<FisicoLog, 'user_id'>>(existing ?? emptyLog(selectedDate))

  function handleDateChange(date: string) {
    setSelectedDate(date)
    setSaved(false)
    setForm(fisicoLog[date] ?? emptyLog(date))
  }

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setSaved(false)
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function toggleMusculo(m: string) {
    const atual = form.musculos ?? []
    update('musculos', atual.includes(m) ? atual.filter(x => x !== m) : [...atual, m])
  }

  function toggleCheck(checkLabel: string) {
    const atual = form.checks ?? []
    update('checks', atual.includes(checkLabel) ? atual.filter(x => x !== checkLabel) : [...atual, checkLabel])
  }

  function handleSave() {
    const log = { ...form, date: selectedDate }
    setFisicoLog(prev => ({ ...prev, [selectedDate]: { ...log, user_id: '' } }))
    setSaved(false)
    startTransition(async () => {
      const result = await actionSaveFisico(log)
      if (!result?.error) setSaved(true)
    })
  }

  // ── CRUD Custom Checks ────────────────────────────────────────────────────

  function handleSaveCheck(e: React.FormEvent) {
    e.preventDefault()
    if (!checkForm.label?.trim()) return

    let updated: CustomCheck[]
    if (editingCheck) {
      updated = customChecks.map(c => c.id === editingCheck.id ? { ...c, ...checkForm } as CustomCheck : c)
    } else {
      const novo: CustomCheck = {
        id: generateId(),
        label: checkForm.label,
        emoji: checkForm.emoji || '✅',
        is_default: false,
      }
      updated = [...customChecks, novo]
    }

    setCustomChecks(updated)
    setShowCheckForm(false)
    setEditingCheck(null)
    setCheckForm({})
    startTransition(() => { void actionSaveCustomChecks(updated) })
  }

  function handleDeleteCheck(id: string) {
    const updated = customChecks.filter(c => c.id !== id)
    setCustomChecks(updated)
    startTransition(() => { void actionSaveCustomChecks(updated) })
  }

  // Peso atual e anterior para comparação
  const datesComLog = Object.keys(fisicoLog).sort()
  const idxAtual = datesComLog.indexOf(selectedDate)
  const datePrev = idxAtual > 0 ? datesComLog[idxAtual - 1] : null
  const pesoPrev = datePrev ? fisicoLog[datePrev]?.peso : null
  const pesoAtual = form.peso
  const diffPeso = pesoAtual && pesoPrev ? (pesoAtual - pesoPrev) : null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Físico</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>
        Registre seu progresso diário — peso, sono, treino e sensações.
      </p>

      {/* Seletor de data */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <input
          type="date"
          value={selectedDate}
          max={TODAY}
          onChange={e => handleDateChange(e.target.value)}
          style={{ ...inputStyle, maxWidth: 180 }}
        />
        {selectedDate !== TODAY && (
          <button onClick={() => handleDateChange(TODAY)} style={{ ...btnS, ...btnSm }}>
            Hoje
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>
          {fisicoLog[selectedDate] ? '✓ Registrado' : '— Sem registro'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Coluna esquerda */}
        <div>
          {/* Corpo */}
          <div style={{ ...card, marginBottom: 14 }}>
            <Divider label="Corpo" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Peso (kg)">
                <div>
                  <input
                    type="number" step={0.1} min={30} max={300}
                    value={form.peso ?? ''}
                    onChange={e => update('peso', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Ex: 78.5"
                    style={inputStyle}
                  />
                  {diffPeso !== null && (
                    <div style={{
                      fontSize: 11, marginTop: 4, fontFamily: 'var(--font-dm-mono)',
                      color: diffPeso > 0 ? 'var(--green)' : diffPeso < 0 ? 'var(--accent)' : 'var(--muted)',
                    }}>
                      {diffPeso > 0 ? '+' : ''}{diffPeso.toFixed(1)}kg vs {fmtDate(datePrev!)}
                    </div>
                  )}
                  {profile?.meta_peso && (
                    <div style={{ fontSize: 11, marginTop: 3, color: 'var(--muted)' }}>
                      Meta: {profile.meta_peso}kg
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Altura (cm)">
                <input
                  type="number" step={0.1} min={100} max={250}
                  value={form.altura ?? ''}
                  onChange={e => update('altura', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Ex: 175"
                  style={inputStyle}
                />
              </Field>
            </div>

            {/* IMC calculado */}
            {form.peso && form.altura && (
              (() => {
                const imc = form.peso / Math.pow(form.altura / 100, 2)
                const label = imc < 18.5 ? 'Abaixo do peso' : imc < 25 ? 'Peso normal' : imc < 30 ? 'Sobrepeso' : 'Obesidade'
                const color = imc < 18.5 ? 'var(--blue)' : imc < 25 ? 'var(--green)' : imc < 30 ? 'var(--amber)' : 'var(--red)'
                return (
                  <div style={{
                    background: 'var(--surface2)', borderRadius: 'var(--radius)',
                    padding: '8px 12px', fontSize: 12, display: 'flex', gap: 8, alignItems: 'center',
                  }}>
                    <span style={{ color: 'var(--muted)' }}>IMC:</span>
                    <strong style={{ fontFamily: 'var(--font-dm-mono)', color }}>{imc.toFixed(1)}</strong>
                    <span style={{ color }}>{label}</span>
                  </div>
                )
              })()
            )}
          </div>

          {/* Sono */}
          <div style={{ ...card, marginBottom: 14 }}>
            <Divider label="Sono" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Dormiu às">
                <input
                  type="time"
                  value={form.slept ?? ''}
                  onChange={e => update('slept', e.target.value || null)}
                  style={inputStyle}
                />
              </Field>
              <Field label="Acordou às">
                <input
                  type="time"
                  value={form.woke ?? ''}
                  onChange={e => update('woke', e.target.value || null)}
                  style={inputStyle}
                />
              </Field>
            </div>
            {form.slept && form.woke && (
              (() => {
                const [sh, sm] = form.slept.split(':').map(Number)
                const [wh, wm] = form.woke.split(':').map(Number)
                let mins = (wh * 60 + wm) - (sh * 60 + sm)
                if (mins < 0) mins += 24 * 60
                const horas = Math.floor(mins / 60)
                const minutos = mins % 60
                const ok = horas >= 7
                return (
                  <div style={{
                    fontSize: 12, fontFamily: 'var(--font-dm-mono)', marginTop: 4,
                    color: ok ? 'var(--green)' : 'var(--amber)',
                  }}>
                    {horas}h{minutos > 0 ? `${minutos}min` : ''} de sono {ok ? '✓' : '— abaixo do ideal'}
                  </div>
                )
              })()
            )}
          </div>

          {/* Observações */}
          <div style={card}>
            <Divider label="Observações" />
            <textarea
              rows={3}
              value={form.obs ?? ''}
              onChange={e => update('obs', e.target.value || null)}
              placeholder="Anotações livres do dia..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
            />
          </div>
        </div>

        {/* Coluna direita */}
        <div>
          {/* Músculos treinados */}
          <div style={{ ...card, marginBottom: 14 }}>
            <Divider label="Músculos treinados" />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MUSCULOS_OPTS.map(m => (
                <ToggleChip
                  key={m}
                  label={m}
                  active={(form.musculos ?? []).includes(m)}
                  onClick={() => toggleMusculo(m)}
                />
              ))}
            </div>
          </div>

          {/* Sensações */}
          <div style={{ ...card, marginBottom: 14 }}>
            <Divider label="Sensações" />

            <Field label="Como você se sentiu hoje">
              <SelectChip options={SENSACAO_OPTS} value={form.sensacao} onChange={v => update('sensacao', v || null)} />
            </Field>

            <Field label="Fadiga axial (lombar/cervical)">
              <SelectChip options={AXIAL_OPTS} value={form.axial} onChange={v => update('axial', v || null)} />
            </Field>

            <Field label="Dor muscular (DOMS)">
              <SelectChip options={DOR_OPTS} value={form.dor} onChange={v => update('dor', v || null)} />
            </Field>

            <Field label="Sentiu que cresceu / progrediu?">
              <SelectChip options={CRESCEU_OPTS} value={form.cresceu} onChange={v => update('cresceu', v || null)} />
            </Field>
          </div>

          {/* Checklist diário (customizável) */}
          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Divider label="Checklist do dia" />
              <button
                onClick={() => { setEditingCheck(null); setCheckForm({}); setShowCheckForm(true); }}
                style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + Adicionar
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {customChecks.map((check, i) => {
                const active = (form.checks ?? []).includes(check.label)
                return (
                  <label
                    key={check.id}
                    onClick={() => toggleCheck(check.label)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', fontSize: 13, userSelect: 'none',
                      padding: '8px 10px', borderRadius: 'var(--radius)',
                      background: active ? 'var(--accent-glow-10)' : 'transparent',
                      border: active ? '1px solid var(--accent)' : '1px solid transparent',
                      transition: 'all .13s',
                      color: active ? 'var(--text)' : 'var(--muted)',
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                      border: active ? 'none' : '2px solid var(--border2)',
                      background: active ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                    }}>
                      {active ? <Check style={{ width: 14, height: 14, color: 'white' }} /> : <span>{check.emoji}</span>}
                    </div>

                    <span style={{ flex: 1, textAlign: 'left' }}>{check.label}</span>

                    <div style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity .13s' }}>
                      {!check.is_default && (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); setEditingCheck(check); setCheckForm({ label: check.label, emoji: check.emoji }); setShowCheckForm(true); }}
                            style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--muted)', cursor: 'pointer', fontSize: 11 }}
                          >
                            <Pencil style={{ width: 12, height: 12 }} />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteCheck(check.id); }}
                            style={{ padding: '4px 8px', borderRadius: 4, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--red)', cursor: 'pointer', fontSize: 11 }}
                          >
                            <Trash2 style={{ width: 12, height: 12 }} />
                          </button>
                        </>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)', textAlign: 'right' }}>
              {(form.checks ?? []).length}/{customChecks.length} completos
            </div>
          </div>
        </div>
      </div>

      {/* Botão salvar */}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={handleSave} disabled={isPending} style={btnP}>
          {isPending ? 'Salvando...' : 'Salvar registro'}
        </button>
        {saved && (
          <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-dm-mono)' }}>
            ✓ Salvo com sucesso
          </span>
        )}
      </div>

      {/* Modal Add/Edit Check */}
      {showCheckForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCheckForm(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground mb-4">{editingCheck ? 'Editar' : 'Novo'} Check</h2>
            <form onSubmit={handleSaveCheck} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground mb-1.5">Emoji</label>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {EMOJI_QUICK.map(emo => (
                    <button
                      key={emo} type="button"
                      onClick={() => setCheckForm(prev => ({ ...prev, emoji: emo }))}
                      className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-all ${
                        checkForm.emoji === emo ? 'bg-accent/20 ring-1 ring-accent' : 'bg-surface2 hover:bg-surface'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
                <input
                  type="text" value={checkForm.emoji || ''} onChange={e => setCheckForm(prev => ({ ...prev, emoji: e.target.value }))}
                  placeholder="ou digite" maxLength={4}
                  className="w-full px-3 py-1.5 border border-border2 rounded-lg bg-surface2 text-xs text-foreground outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[1px] text-muted-foreground mb-1.5">Descrição</label>
                <input
                  type="text" value={checkForm.label || ''} onChange={e => setCheckForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Ex: Beber 3L de água" required
                  className="w-full px-3 py-2 border border-border2 rounded-lg bg-surface text-foreground text-sm outline-none focus:border-accent/40"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowCheckForm(false)} className="px-4 py-2 rounded-lg border border-border2 text-sm text-muted-foreground hover:bg-surface transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity">{editingCheck ? 'Atualizar' : 'Adicionar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}