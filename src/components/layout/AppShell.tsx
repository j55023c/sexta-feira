'use client'

// AppShell é o único lugar que sabe se o menu mobile está aberto.
// O AppLayout (Server Component) não pode ter useState, então o estado
// sobe pra cá — Sidebar e o botão de hambúrguer compartilham o mesmo state.

import { useState } from 'react'
import Sidebar from './Sidebar'

interface AppShellProps {
  userEmail: string
  children: React.ReactNode
}

export default function AppShell({ userEmail, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Overlay — só existe (e só recebe clique) enquanto o drawer está aberto no mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[140] md:hidden"
          style={{ background: 'rgba(0,0,0,.45)' }}
        />
      )}

      <Sidebar
        userEmail={userEmail}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar — visível só abaixo do breakpoint md (768px) */}
        <div
          className="flex md:hidden items-center gap-3 flex-shrink-0"
          style={{ padding: '10px 14px', borderBottom: '1px solid var(--border2)', background: 'var(--surface)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            style={{
              background: 'none',
              border: '1px solid var(--border2)',
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 16,
              lineHeight: 1,
              color: 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            ☰
          </button>
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
            Sexta-<em style={{ fontStyle: 'normal', color: 'var(--accent)' }}>feira</em>
          </span>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-4 md:px-[26px] md:py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
