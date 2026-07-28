'use client'

import { useEffect, useRef } from 'react'

interface MobileSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  wide?: boolean
}

export default function MobileSheet({ isOpen, onClose, title, children, wide }: MobileSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Trap focus inside sheet when open (desktop modal mode)
  useEffect(() => {
    if (!isOpen) return

    previousActiveElement.current = document.activeElement as HTMLElement

    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      // Desktop: trap focus in modal
      const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const first = focusable?.[0]
      const last = focusable?.[focusable.length - 1]
      first?.focus()

      function handleTab(e: KeyboardEvent) {
        if (e.key !== 'Tab') return
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
      document.addEventListener('keydown', handleTab)
      return () => document.removeEventListener('keydown', handleTab)
    }
  }, [isOpen])

  // Restore focus on close
  useEffect(() => {
    if (!isOpen && previousActiveElement.current) {
      previousActiveElement.current.focus()
    }
  }, [isOpen])

  // Prevent body scroll when open (mobile bottom-sheet)
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 768) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  if (!isOpen) return null

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(25,23,20,.55)',
          backdropFilter: 'blur(3px)',
          zIndex: isMobile ? 300 : 200,
        }}
        aria-hidden="true"
      />

      {/* Sheet content */}
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        style={{
          position: 'fixed',
          zIndex: isMobile ? 301 : 201,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface)',
          border: '1px solid var(--border2)',
          borderRadius: isMobile ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
          boxShadow: isMobile ? '0 -4px 30px rgba(0,0,0,.15)' : '0 20px 50px rgba(0,0,0,.18)',
          maxHeight: isMobile ? '85vh' : '90vh',
          width: isMobile ? '100%' : wide ? 600 : 460,
          maxWidth: isMobile ? '100%' : '95vw',
          bottom: isMobile ? 0 : 'auto',
          top: isMobile ? 'auto' : '50%',
          left: isMobile ? 0 : '50%',
          transform: isMobile ? 'none' : 'translate(-50%,-50%)',
          animation: isMobile ? 'slideUp .25s ease-out' : 'fadeIn .15s ease-out',
        }}
      >
        <style jsx>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translate(-50%,-50%) scale(.98); }
            to { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '16px 18px 13px',
          borderBottom: '1px solid var(--border2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span id="sheet-title" style={{ fontSize: 15, fontWeight: 800 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: 17,
              lineHeight: 1,
              padding: 4,
              borderRadius: 'var(--radius)',
              transition: 'background .1s, color .1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)' }}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: 18,
          overflowY: 'auto',
          flex: 1,
          minHeight: 0,
        }}>
          {children}
        </div>

        {/* Mobile drag handle hint */}
        {isMobile && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '8px 0 12px',
            borderTop: '1px solid var(--border2)',
            marginTop: 'auto',
          }}>
            <div style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'var(--border2)',
            }} />
          </div>
        )}
      </div>
    </>
  )
}