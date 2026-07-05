'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { signOut } from '@/app/auth/actions'

// ── Definição dos itens de navegação ─────────────────────────────────────────
const NAV = [
  {
    section: 'Geral',
    items: [
      { href: '/home',      icon: '⊞', label: 'Início' },
      { href: '/tarefas',   icon: '✓', label: 'Tarefas' },
      { href: '/notas',     icon: '✎', label: 'Notas' },
    ],
  },
  {
    section: 'Fitness',
    items: [
      { href: '/protocolo',   icon: '⚡', label: 'Protocolo' },
      { href: '/dieta',       icon: '🍽', label: 'Dieta' },
      { href: '/nutricao',    icon: '📊', label: 'Nutrição' },
      { href: '/fisico',      icon: '💪', label: 'Físico' },
      { href: '/calculadora', icon: '📈', label: 'Calculadora' },
    ],
  },
  {
    section: 'Sistema',
    items: [
      { href: '/config', icon: '⚙', label: 'Configurações' },
    ],
  },
]

// ── Data formatada para o rodapé ──────────────────────────────────────────────
function getFormattedDate() {
  const now = new Date()
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  return `${dias[now.getDay()]}, ${now.getDate()} ${meses[now.getMonth()]}`
}

// ── Componente principal ──────────────────────────────────────────────────────
interface SidebarProps {
  userEmail: string
}

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  // Estado de hover por item — inline style não suporta pseudo-classe :hover,
  // então controlamos via onMouseEnter/onMouseLeave (mesmo padrão do resto do app).
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)

  const isActive = (href: string) => pathname === href

  return (
    <nav
      style={{
        width: 230,
        flexShrink: 0,
        background: 'var(--sidebar-bg)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      {/* ── Brand ── */}
      <div style={{
        padding: '20px 20px 14px',
        borderBottom: '1px solid rgba(255,255,255,.05)',
      }}>
        <div style={{
          fontSize: 9,
          letterSpacing: 2.5,
          textTransform: 'uppercase',
          color: 'var(--accent2)',
          fontWeight: 700,
          marginBottom: 5,
        }}>
          Sistema Pessoal
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 800, color: 'var(--sidebar-text)', lineHeight: 1.15 }}>
          Sexta-<em style={{ fontStyle: 'normal', color: 'var(--accent2)' }}>feira</em>
        </h2>
        <div style={{
          fontSize: 10,
          color: 'var(--sidebar-muted)',
          marginTop: 3,
          fontFamily: 'var(--font-dm-mono)',
        }}>
          {getFormattedDate()}
        </div>
      </div>

      {/* ── Navegação ── */}
      {NAV.map(group => (
        <div key={group.section} style={{ padding: '12px 0 4px' }}>
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'var(--sidebar-muted)',
            padding: '0 18px 5px',
          }}>
            {group.section}
          </div>

          {group.items.map(item => {
            const active = isActive(item.href)
            const hovered = hoveredHref === item.href && !active

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHoveredHref(item.href)}
                onMouseLeave={() => setHoveredHref(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 18px',
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: active || hovered ? 'var(--sidebar-text)' : '#908880',
                  borderLeft: active
                    ? '2px solid var(--accent)'
                    : hovered
                      ? '2px solid var(--accent-glow-30)'
                      : '2px solid transparent',
                  background: active
                    ? 'var(--accent-glow-10)'
                    : hovered
                      ? 'rgba(255,255,255,.04)'
                      : 'transparent',
                  transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                  transition: 'all .16s ease',
                }}
              >
                <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}

      {/* ── Rodapé: usuário + logout ── */}
      <div style={{
        marginTop: 'auto',
        padding: '12px 18px',
        borderTop: '1px solid rgba(255,255,255,.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#22c55e',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 11,
            color: 'var(--sidebar-muted)',
            fontFamily: 'var(--font-dm-mono)',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {userEmail}
          </span>

          <form action={signOut}>
            <button
              type="submit"
              title="Sair"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--sidebar-muted)',
                fontSize: 10,
                padding: '3px 6px',
                borderRadius: 5,
                fontFamily: 'var(--font-syne)',
                transition: 'all .13s',
              }}
            >
              ↩
            </button>
          </form>
        </div>

        <div style={{
          fontSize: 10,
          color: 'var(--sidebar-muted)',
          fontFamily: 'var(--font-dm-mono)',
        }}>
          Sincronizado
        </div>
      </div>
    </nav>
  )
}
