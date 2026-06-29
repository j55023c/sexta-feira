'use client'

import { useState, useEffect, useRef } from 'react'
import type { Nota, TagNota } from '@/lib/types'
import { actionSaveNota, actionDeleteNota } from './actions'

const TODAY = new Date().toISOString().split('T')[0]

function fmtDate(d: string) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

const TAG_LABELS: Record<TagNota, string> = {
  geral: 'Geral', senai: 'Estudos', escola: 'Escola', fitness: 'Fitness', ideia: 'Ideia',
}

interface Props { notas: Nota[] }

export default function NotasClient({ notas: initialNotas }: Props) {
  const [notas, setNotas] = useState(initialNotas)
  const [activeId, setActiveId] = useState<number | null>(initialNotas[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeNota = notas.find(n => n.id === activeId) ?? null

  // Filtra lista pela busca
  const filtered = notas.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  )

  // Autosave com debounce de 700ms
  function scheduleAutoSave(nota: Nota) {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      actionSaveNota({ id: nota.id, title: nota.title, body: nota.body, tag: nota.tag, date: nota.date })
    }, 700)
  }

  function updateActive(fields: Partial<Nota>) {
    if (!activeId) return
    setNotas(prev => prev.map(n => {
      if (n.id !== activeId) return n
      const updated = { ...n, ...fields, date: TODAY }
      scheduleAutoSave(updated)
      return updated
    }))
  }

  function newNota() {
    const n: Nota = { id: Date.now(), title: 'Nova nota', body: '', tag: 'geral', date: TODAY }
    setNotas(prev => [n, ...prev])
    setActiveId(n.id)
    actionSaveNota(n)
  }

  function deleteNota(id: number) {
    setNotas(prev => prev.filter(n => n.id !== id))
    if (activeId === id) {
      const remaining = notas.filter(n => n.id !== id)
      setActiveId(remaining[0]?.id ?? null)
    }
    actionDeleteNota(id)
  }

  // Cleanup timer on unmount
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Notas</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>Anotações rápidas, resumos e lembretes. Salvo automaticamente.</p>

      {/* Controles */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={newNota} style={{
          border: 'none', borderRadius: 'var(--radius)', padding: '5px 11px',
          fontFamily: 'var(--font-syne)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          background: 'var(--accent)', color: 'white',
        }}>+ Nova nota</button>
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            maxWidth: 220, padding: '5px 11px', border: '1px solid var(--border2)',
            borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)',
            fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
          }}
        />
      </div>

      {/* Layout: lista + editor */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, height: 'calc(100vh - 220px)' }}>

        {/* Lista de notas */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: 8 }}>Nenhuma nota.</div>
          )}
          {filtered.map(n => (
            <div
              key={n.id}
              onClick={() => setActiveId(n.id)}
              style={{
                padding: '11px 13px',
                background: 'var(--surface)',
                border: `1px solid ${n.id === activeId ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                cursor: 'pointer',
                boxShadow: n.id === activeId ? '0 0 0 2px rgba(200,68,26,.07)' : 'none',
                position: 'relative',
              }}
            >
              {/* Botão deletar */}
              <button
                onClick={e => { e.stopPropagation(); deleteNota(n.id) }}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--hint)', fontSize: 11, padding: '2px 5px',
                  borderRadius: 5, opacity: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >✕</button>

              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2, paddingRight: 16 }}>
                {n.title || 'Sem título'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>{fmtDate(n.date)}</span>
                <span style={{
                  fontSize: 8, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
                  padding: '1px 6px', borderRadius: 999, background: 'var(--surface2)', color: 'var(--muted)',
                }}>{TAG_LABELS[n.tag]}</span>
              </div>
              {n.body && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {n.body.slice(0, 55)}{n.body.length > 55 ? '...' : ''}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Editor */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
          {activeNota ? (
            <>
              {/* Barra superior do editor */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  value={activeNota.title}
                  onChange={e => updateActive({ title: e.target.value })}
                  placeholder="Título..."
                  style={{
                    flex: 1, background: 'none', border: 'none',
                    fontFamily: 'var(--font-syne)', fontSize: 15, fontWeight: 700,
                    color: 'var(--text)', outline: 'none', padding: 0,
                  }}
                />
                <select
                  value={activeNota.tag}
                  onChange={e => updateActive({ tag: e.target.value as TagNota })}
                  style={{
                    width: 110, padding: '4px 8px', border: '1px solid var(--border2)',
                    borderRadius: 'var(--radius)', background: 'var(--surface2)',
                    color: 'var(--text)', fontFamily: 'var(--font-syne)', fontSize: 12, outline: 'none',
                  }}
                >
                  {(Object.entries(TAG_LABELS) as [TagNota, string][]).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              {/* Área de texto */}
              <textarea
                value={activeNota.body}
                onChange={e => updateActive({ body: e.target.value })}
                placeholder="Escreva aqui..."
                style={{
                  flex: 1, border: 'none', background: 'none',
                  fontFamily: 'var(--font-syne)', fontSize: 13, color: 'var(--text)',
                  outline: 'none', resize: 'none', padding: 16, lineHeight: 1.75,
                }}
              />
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13 }}>
              Selecione ou crie uma nota.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
