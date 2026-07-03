'use client'

import { useState, useTransition, useEffect } from 'react'
import type { Profile } from '@/lib/types'
import { actionSalvarPerfil, actionSalvarTema, actionLogout } from './actions'

// ── Tipos ─────────────────────────────────────────────────────────────────────

type ThemeKey = 'default' | 'dark' | 'midnight' | 'forest' | 'rose'

interface NotifConfig {
  cafe:   string
  pre:    string
  pos:    string
  jantar: string
  fisico: string
}

// ── Constantes ────────────────────────────────────────────────────────────────

const THEMES: { key: ThemeKey; label: string; gradient: string }[] = [
  { key: 'default',  label: 'Bege (padrão)', gradient: 'linear-gradient(135deg,#f4f1eb,#c8441a)' },
  { key: 'dark',     label: 'Dark',          gradient: 'linear-gradient(135deg,#111010,#c8441a)' },
  { key: 'midnight', label: 'Midnight',      gradient: 'linear-gradient(135deg,#0a0e1a,#4a90d9)' },
  { key: 'forest',   label: 'Forest',        gradient: 'linear-gradient(135deg,#f0f5ee,#2e7a2e)' },
  { key: 'rose',     label: 'Rose',          gradient: 'linear-gradient(135deg,#fdf0f3,#c02060)' },
]

const DEFAULT_NOTIF: NotifConfig = {
  cafe:   '07:30',
  pre:    '17:30',
  pos:    '19:30',
  jantar: '20:30',
  fisico: '21:00',
}

const NOTIF_LABELS: { key: keyof NotifConfig; label: string }[] = [
  { key: 'cafe',   label: '☀️ Café da manhã' },
  { key: 'pre',    label: '⚡ Pré-treino'     },
  { key: 'pos',    label: '💪 Pós-treino'     },
  { key: 'jantar', label: '🌙 Jantar'         },
  { key: 'fisico', label: '📝 Registrar físico'},
]

// ── Estilos utilitários ───────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)',
  padding: 18,
  marginBottom: 16,
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

const btnD: React.CSSProperties = {
  ...btnSm, border: 'none', borderRadius: 'var(--radius)',
  fontFamily: 'var(--font-syne)', fontWeight: 700, cursor: 'pointer',
  background: 'var(--red-bg)', color: 'var(--red)', fontSize: 11,
}

const inputStyle: React.CSSProperties = {
  padding: '9px 11px', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
      textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12,
    }}>
      {label}
    </div>
  )
}

function CfgRow({ label, desc, children }: { label: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {desc && <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>{desc}</div>}
      </div>
      {children && <div style={{ flexShrink: 0 }}>{children}</div>}
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  profile: Profile | null
  userEmail: string
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ConfiguracoesClient({ profile, userEmail }: Props) {
  // Perfil
  const [nome,     setNome]     = useState(profile?.nome      ?? '')
  const [peso,     setPeso]     = useState(profile?.peso?.toString()      ?? '')
  const [metaPeso, setMetaPeso] = useState(profile?.meta_peso?.toString() ?? '')
  const [savedPerfil, setSavedPerfil] = useState(false)

  // Tema
  const [activeTheme, setActiveTheme] = useState<ThemeKey>(
    (profile?.theme as ThemeKey) ?? 'default'
  )

  // Lembretes
  const [notif, setNotif] = useState<NotifConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sf_notif')
        return stored ? { ...DEFAULT_NOTIF, ...JSON.parse(stored) } : DEFAULT_NOTIF
      } catch { return DEFAULT_NOTIF }
    }
    return DEFAULT_NOTIF
  })
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default')
  const [savedNotif, setSavedNotif] = useState(false)

  const [isPending, startTransition] = useTransition()
  const [confirmClear, setConfirmClear] = useState(false)

  // Inicializa permissão de notificação
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission)
    }
  }, [])

  // ── Tema ──────────────────────────────────────────────────────────────────

  function handleSetTheme(theme: ThemeKey) {
    setActiveTheme(theme)
    document.documentElement.setAttribute('data-theme', theme)
    startTransition(async () => { await actionSalvarTema(theme) })
  }

  // ── Perfil ────────────────────────────────────────────────────────────────

  function handleSalvarPerfil() {
    setSavedPerfil(false)
    startTransition(async () => {
      const result = await actionSalvarPerfil({
        nome:      nome || null,
        peso:      peso ? parseFloat(peso) : null,
        meta_peso: metaPeso ? parseFloat(metaPeso) : null,
      })
      if (!result?.error) setSavedPerfil(true)
    })
  }

  // ── Lembretes ─────────────────────────────────────────────────────────────

  async function handleRequestNotif() {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
  }

  function handleSaveNotif() {
    localStorage.setItem('sf_notif', JSON.stringify(notif))
    setSavedNotif(true)
    setTimeout(() => setSavedNotif(false), 2500)
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  function handleLogout() {
    startTransition(async () => { await actionLogout() })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Configurações</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>
        Personalize o app, gerencie sua conta e seus dados.
      </p>

      {/* ── Conta ── */}
      <div style={card}>
        <SectionTitle label="Conta" />
        <CfgRow label="Usuário ativo" desc={userEmail}>
          <button onClick={handleLogout} disabled={isPending} style={{ ...btnS, ...btnSm }}>
            Sair da conta
          </button>
        </CfgRow>
      </div>

      {/* ── Perfil ── */}
      <div style={card}>
        <SectionTitle label="Perfil" />

        <CfgRow label="Nome">
          <input
            type="text"
            value={nome}
            onChange={e => { setNome(e.target.value); setSavedPerfil(false) }}
            placeholder="Seu nome"
            style={{ ...inputStyle, maxWidth: 200, width: '100%' }}
          />
        </CfgRow>

        <CfgRow label="Peso atual (kg)">
          <input
            type="number"
            step={0.1}
            value={peso}
            onChange={e => { setPeso(e.target.value); setSavedPerfil(false) }}
            style={{ ...inputStyle, maxWidth: 120, width: '100%' }}
          />
        </CfgRow>

        <CfgRow label="Meta de peso (kg)">
          <input
            type="number"
            step={0.1}
            value={metaPeso}
            onChange={e => { setMetaPeso(e.target.value); setSavedPerfil(false) }}
            style={{ ...inputStyle, maxWidth: 120, width: '100%' }}
          />
        </CfgRow>

        <CfgRow
          label="Kcal e proteína"
          desc="Defina na aba Calculadora →"
        />

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={handleSalvarPerfil} disabled={isPending} style={btnP}>
            Salvar configurações
          </button>
          {savedPerfil && (
            <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-dm-mono)' }}>
              ✓ Salvo
            </span>
          )}
        </div>
      </div>

      {/* ── Tema ── */}
      <div style={card}>
        <SectionTitle label="Tema" />
        <CfgRow label="Aparência">
          <div style={{ display: 'flex', gap: 10 }}>
            {THEMES.map(t => (
              <button
                key={t.key}
                title={t.label}
                onClick={() => handleSetTheme(t.key)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: t.gradient,
                  border: activeTheme === t.key
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                  cursor: 'pointer',
                  outline: activeTheme === t.key ? '2px solid var(--surface)' : 'none',
                  outlineOffset: -5,
                  transition: 'border .15s',
                }}
              />
            ))}
          </div>
        </CfgRow>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
          Tema atual: <strong style={{ color: 'var(--text)' }}>
            {THEMES.find(t => t.key === activeTheme)?.label}
          </strong>
        </div>
      </div>

      {/* ── Lembretes ── */}
      <div style={card}>
        <SectionTitle label="Lembretes" />
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
          O app precisa estar aberto (ou instalado como PWA) para enviar notificações.
        </div>

        {NOTIF_LABELS.map(({ key, label }) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
            <input
              type="time"
              value={notif[key]}
              onChange={e => setNotif(prev => ({ ...prev, [key]: e.target.value }))}
              style={{ ...inputStyle, width: 'auto' }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
          <button onClick={handleSaveNotif} style={{ ...btnS, ...btnSm }}>
            Salvar lembretes
          </button>
          <button
            onClick={handleRequestNotif}
            disabled={notifPermission === 'granted'}
            style={{
              ...btnP, ...btnSm,
              opacity: notifPermission === 'granted' ? .5 : 1,
              cursor: notifPermission === 'granted' ? 'default' : 'pointer',
            }}
          >
            {notifPermission === 'granted' ? '✓ Notificações ativas' : 'Ativar notificações'}
          </button>
          {savedNotif && (
            <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-dm-mono)' }}>
              ✓ Salvo
            </span>
          )}
        </div>
      </div>

      {/* ── Backup ── */}
      <div style={card}>
        <SectionTitle label="Backup" />

        <CfgRow
          label="Exportar JSON"
          desc="Baixa todos os dados do perfil."
        >
          <button
            onClick={() => {
              const dados = { profile, exportedAt: new Date().toISOString() }
              const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `sfhq_backup_${new Date().toISOString().split('T')[0]}.json`
              a.click()
            }}
            style={{ ...btnS, ...btnSm }}
          >
            📤 Exportar
          </button>
        </CfgRow>

        <CfgRow
          label="Limpar dados"
          desc="Irreversível — remove dados locais e de sessão."
        >
          {!confirmClear ? (
            <button onClick={() => setConfirmClear(true)} style={btnD}>
              🗑 Limpar
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setConfirmClear(false)} style={{ ...btnS, ...btnSm }}>
                Cancelar
              </button>
              <button
                onClick={() => {
                  localStorage.clear()
                  setConfirmClear(false)
                }}
                style={btnD}
              >
                Confirmar
              </button>
            </div>
          )}
        </CfgRow>
      </div>
    </div>
  )
}
