'use client'

import { useState, useTransition } from 'react'
import type { FisicoLog, Profile } from '@/lib/types'
import { actionSaveFisico } from './actions'

// ── Constantes ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const MUSCULOS_OPTS = [
  'Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps',
  'Abdômen', 'Quadríceps', 'Posterior', 'Glúteo', 'Panturrilha',
]

const CHECKS_OPTS = [
  '💧 Água (2L+)',
  '🥩 Proteína batida',
  '😴 Sono ok',
  '🏋️ Treino feito',
  '🥗 Legumes/verduras',
  '☀️ Sol / caminhada',
  '📵 Sem junk food',
  '🧘 Descanso ativo',
]

const SENSACAO_OPTS = ['Ótimo', 'Bem', 'Normal', 'Cansado', 'Péssimo']
const AXIAL_OPTS    = ['Nenhuma', 'Leve', 'Moderada', 'Intensa']
const DOR_OPTS      = ['Nenhuma', 'Leve', 'Moderada', 'Intensa']
const CRESCEU_OPTS  = ['Sim', 'Talvez', 'Não']

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

function emptyLog(date: string): Omit<FisicoLog, 'user_id'> {
  return {
    date,
    peso: null,
    altura: null,
    slept: null,
    woke: null,
    musculos: [],
    axial: null,
    sensacao: null,
    dor: null,
    cresceu: null,
    obs: null,
    checks: [],
  }
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

function ToggleChip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'var(--font-syne)', transition: 'all .13s',
        border: active ? 'none' : '1px solid var(--border2)',
        background: active ? 'var(--accent)' : 'var(--surface2)',
        color: active ? 'white' : 'var(--muted)',
      }}
    >
      {label}
    </button>
  )
}

function SelectChip({
  options, value, onChange,
}: { options: string[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <ToggleChip
          key={opt}
          label={opt}
          active={value === opt}
          onClick={() => onChange(value === opt ? '' : opt)}
        />
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

  const existing = fisicoLog[selectedDate]
  const [form, setForm] = useState<Omit<FisicoLog, 'user_id'>>(existing ?? emptyLog(selectedDate))

  // Ao trocar data, carrega o log existente ou cria em branco
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

  function toggleCheck(c: string) {
    const atual = form.checks ?? []
    update('checks', atual.includes(c) ? atual.filter(x => x !== c) : [...atual, c])
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
                    type="number"
                    step={0.1}
                    min={30}
                    max={300}
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
                  type="number"
                  step={0.1}
                  min={100}
                  max={250}
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
                const label =
                  imc < 18.5 ? 'Abaixo do peso' :
                  imc < 25   ? 'Peso normal' :
                  imc < 30   ? 'Sobrepeso' : 'Obesidade'
                const color =
                  imc < 18.5 ? 'var(--blue)' :
                  imc < 25   ? 'var(--green)' :
                  imc < 30   ? 'var(--amber)' : 'var(--red)'
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
              <SelectChip
                options={SENSACAO_OPTS}
                value={form.sensacao}
                onChange={v => update('sensacao', v || null)}
              />
            </Field>

            <Field label="Fadiga axial (lombar/cervical)">
              <SelectChip
                options={AXIAL_OPTS}
                value={form.axial}
                onChange={v => update('axial', v || null)}
              />
            </Field>

            <Field label="Dor muscular (DOMS)">
              <SelectChip
                options={DOR_OPTS}
                value={form.dor}
                onChange={v => update('dor', v || null)}
              />
            </Field>

            <Field label="Sentiu que cresceu / progrediu?">
              <SelectChip
                options={CRESCEU_OPTS}
                value={form.cresceu}
                onChange={v => update('cresceu', v || null)}
              />
            </Field>
          </div>

          {/* Checklist diário */}
          <div style={{ ...card, marginBottom: 14 }}>
            <Divider label="Checklist do dia" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CHECKS_OPTS.map(c => {
                const active = (form.checks ?? []).includes(c)
                return (
                  <label
                    key={c}
                    onClick={() => toggleCheck(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      cursor: 'pointer', fontSize: 13, userSelect: 'none',
                      color: active ? 'var(--text)' : 'var(--muted)',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: active ? 'none' : '2px solid var(--border2)',
                      background: active ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>}
                    </div>
                    {c}
                  </label>
                )
              })}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--muted)' }}>
              {(form.checks ?? []).length}/{CHECKS_OPTS.length} completos
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
    </div>
  )
}
