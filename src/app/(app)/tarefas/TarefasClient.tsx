'use client'

import { useState, useTransition } from 'react'
import type { Materia, TarefaLivre, TagTarefa } from '@/lib/types'
import {
  actionAddMateria, actionDeleteMateria, actionToggleTask, actionDeleteTask, actionAddTaskInline,
  actionAddTarefa, actionToggleTarefa, actionDeleteTarefa,
} from './actions'

const TODAY = new Date().toISOString().split('T')[0]

function fmtDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

// ── Cores por tag — sem senai ─────────────────────────────────────────────
const TAG_COLORS: Record<TagTarefa, { bg: string; color: string }> = {
  escola:  { bg: 'var(--blue-bg)',  color: 'var(--blue)'  },
  pessoal: { bg: 'var(--surface2)', color: 'var(--muted)' },
  fitness: { bg: 'var(--green-bg)', color: 'var(--green)' },
}
const TAG_LABELS: Record<TagTarefa, string> = {
  escola: 'Escola', pessoal: 'Pessoal', fitness: 'Fitness',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
}
const btnP: React.CSSProperties = {
  border: 'none', borderRadius: 'var(--radius)', padding: '9px 16px',
  fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
  background: 'var(--accent)', color: 'white',
}
const btnS: React.CSSProperties = {
  ...btnP, background: 'var(--surface2)', color: 'var(--text)',
  border: '1px solid var(--border2)',
}
const btnSm: React.CSSProperties = { padding: '5px 11px', fontSize: 11 }

interface Props {
  materias: Materia[]
  tarefasLivres: TarefaLivre[]
}

export default function TarefasClient({ materias: initialMaterias, tarefasLivres: initialTarefas }: Props) {
  const [mode, setMode] = useState<'materia' | 'lista'>('materia')
  const [openBlocks, setOpenBlocks] = useState<Record<number, boolean>>({})
  const [showModalMateria, setShowModalMateria] = useState(false)
  const [showModalTarefa, setShowModalTarefa] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [materias, setMaterias] = useState(initialMaterias)
  const [tarefasLivres, setTarefas] = useState(initialTarefas)

  function toggleBlock(id: number) {
    setOpenBlocks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // ── Matérias ────────────────────────────────────────────────────────────
  function handleAddMateria(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const nome = fd.get('nome') as string
    if (!nome?.trim()) return
    setShowModalMateria(false)
    startTransition(async () => { await actionAddMateria(fd) })
  }

  function handleDeleteMateria(id: number) {
    setMaterias(prev => prev.filter(m => m.id !== id))
    startTransition(async () => { await actionDeleteMateria(id) })
  }

  function handleToggleTask(materiaId: number, taskId: number) {
    const materia = materias.find(m => m.id === materiaId)
    if (!materia) return
    const updatedTasks = materia.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    setMaterias(prev => prev.map(m => m.id === materiaId ? { ...m, tasks: updatedTasks } : m))
    startTransition(async () => { await actionToggleTask(materiaId, updatedTasks) })
  }

  function handleDeleteTask(materiaId: number, taskId: number) {
    const materia = materias.find(m => m.id === materiaId)
    if (!materia) return
    const updatedTasks = materia.tasks.filter(t => t.id !== taskId)
    setMaterias(prev => prev.map(m => m.id === materiaId ? { ...m, tasks: updatedTasks } : m))
    startTransition(async () => { await actionDeleteTask(materiaId, updatedTasks) })
  }

  function handleAddTaskInline(materiaId: number) {
    const nome = prompt('Nome da atividade:')
    if (!nome?.trim()) return
    const materia = materias.find(m => m.id === materiaId)
    if (!materia) return
    const novaTask = { id: Date.now(), nome: nome.trim(), done: false, prazo: '' }
    const updatedTasks = [...materia.tasks, novaTask]
    setMaterias(prev => prev.map(m => m.id === materiaId ? { ...m, tasks: updatedTasks } : m))
    startTransition(async () => { await actionAddTaskInline(materiaId, nome.trim(), materia.tasks) })
  }

  // ── Tarefas livres (agora com vínculo opcional a matéria) ────────────────
  function handleAddTarefa(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const nome = fd.get('nome') as string
    const materiaId = fd.get('materiaId') as string
    if (!nome?.trim()) return
    setShowModalTarefa(false)

    if (materiaId) {
      const materia = materias.find(m => m.id === Number(materiaId))
      if (materia) {
        const novaTask = { id: Date.now(), nome: nome.trim(), done: false, prazo: fd.get('prazo') as string ?? '' }
        setMaterias(prev => prev.map(m => m.id === materia.id ? { ...m, tasks: [...m.tasks, novaTask] } : m))
      }
    }
    startTransition(async () => { await actionAddTarefa(fd) })
  }

  function handleToggleTarefa(t: TarefaLivre) {
    setTarefas(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))
    startTransition(async () => { await actionToggleTarefa(t) })
  }

  function handleDeleteTarefa(id: number) {
    setTarefas(prev => prev.filter(x => x.id !== id))
    startTransition(async () => { await actionDeleteTarefa(id) })
  }

  // ── Render: view por matéria ─────────────────────────────────────────────
  function renderMaterias() {
    if (!materias.length) return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, textAlign: 'center', color: 'var(--muted)' }}>
        Nenhuma matéria. Clique em &quot;+ Nova matéria&quot;.
      </div>
    )

    return materias.map(m => {
      const pend = m.tasks.filter(t => !t.done).length
      const d = m.prazo ? Math.ceil((new Date(m.prazo).getTime() - new Date(TODAY).getTime()) / 86400000) : null
      const prazoLabel = d === null ? 'Sem prazo' : d < 0 ? 'Vencido' : d === 0 ? 'Hoje' : fmtDate(m.prazo)
      const prazoColor = d === null ? 'var(--muted)' : d < 0 ? 'var(--red)' : d <= 3 ? 'var(--amber)' : 'var(--muted)'
      const prazoBackground = d === null ? 'var(--surface2)' : d < 0 ? 'var(--red-bg)' : d <= 3 ? 'var(--amber-bg)' : 'var(--surface2)'
      const isOpen = openBlocks[m.id]
      const tagStyle = TAG_COLORS[m.tag] ?? TAG_COLORS.pessoal

      return (
        <div key={m.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 12, overflow: 'hidden' }}>
          <div
            onClick={() => toggleBlock(m.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer', borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}
          >
            <span style={{
              fontSize: 9.5, fontWeight: 700, letterSpacing: .8, textTransform: 'uppercase',
              padding: '2px 8px', borderRadius: 999,
              background: tagStyle.bg, color: tagStyle.color,
            }}>
              {TAG_LABELS[m.tag] ?? m.tag}
            </span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{m.nome}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: prazoBackground, color: prazoColor }}>
              {prazoLabel}
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>{pend} pend.</span>
            <button
              onClick={e => { e.stopPropagation(); handleDeleteMateria(m.id) }}
              style={{ ...btnP, ...btnSm, background: 'var(--red-bg)', color: 'var(--red)', border: 'none' }}
            >✕</button>
          </div>

          {isOpen && (
            <div>
              {m.tasks.map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 16px', fontSize: 13, borderBottom: '1px solid var(--border)',
                }}>
                  <input
                    type="checkbox"
                    checked={t.done}
                    onChange={() => handleToggleTask(m.id, t.id)}
                    style={{ width: 16, height: 16, flexShrink: 0, cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                  <span style={{ flex: 1, textDecoration: t.done ? 'line-through' : 'none', color: t.done ? 'var(--muted)' : 'var(--text)' }}>
                    {t.nome}
                  </span>
                  {t.prazo && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>{fmtDate(t.prazo)}</span>}
                  <button
                    onClick={() => handleDeleteTask(m.id, t.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--hint)', fontSize: 12, padding: '2px 4px' }}
                  >✕</button>
                </div>
              ))}
              <div style={{ padding: '8px 16px 6px' }}>
                <button onClick={() => handleAddTaskInline(m.id)} style={{ ...btnS, ...btnSm }}>+ Atividade</button>
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  // ── Render: lista geral ───────────────────────────────────────────────────
  function renderLista() {
    const all = [
      ...materias.flatMap(m => m.tasks.map(t => ({ ...t, src: m.nome, tipo: 'materia' as const, materiaId: m.id }))),
      ...tarefasLivres.map(t => ({ ...t, src: TAG_LABELS[t.tag] ?? t.tag, tipo: 'livre' as const, materiaId: 0 })),
    ]
    const pend = all.filter(t => !t.done)
    const done = all.filter(t => t.done)

    const renderRow = (t: typeof all[0]) => (
      <div key={`${t.tipo}-${t.id}`} style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        marginBottom: 7, fontSize: 13,
        textDecoration: t.done ? 'line-through' : 'none',
        color: t.done ? 'var(--muted)' : 'var(--text)',
      }}>
        <input
          type="checkbox"
          checked={t.done}
          onChange={() => {
            if (t.tipo === 'livre') {
              const tf = tarefasLivres.find(x => x.id === t.id)
              if (tf) handleToggleTarefa(tf)
            } else {
              handleToggleTask(t.materiaId, t.id)
            }
          }}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
        />
        <span style={{ flex: 1, fontWeight: 600 }}>{t.nome}</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--surface2)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>
          {t.src}
        </span>
        {t.prazo && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{fmtDate(t.prazo)}</span>}
      </div>
    )

    if (!pend.length && !done.length) return (
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 28, textAlign: 'center', color: 'var(--muted)' }}>
        Nenhuma tarefa.
      </div>
    )

    return (
      <>
        {pend.length > 0 && <><Divider label={`Pendentes (${pend.length})`} />{pend.map(renderRow)}</>}
        {done.length > 0 && <><Divider label={`Concluídas (${done.length})`} />{done.map(renderRow)}</>}
      </>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Tarefas</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>Organize suas atividades por disciplina ou em lista única.</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => setMode('materia')} style={{ ...btnP, ...btnSm, background: mode === 'materia' ? 'var(--accent)' : 'var(--surface2)', color: mode === 'materia' ? 'white' : 'var(--text)', border: mode === 'materia' ? 'none' : '1px solid var(--border2)' }}>Por matéria</button>
        <button onClick={() => setMode('lista')} style={{ ...btnP, ...btnSm, background: mode === 'lista' ? 'var(--accent)' : 'var(--surface2)', color: mode === 'lista' ? 'white' : 'var(--text)', border: mode === 'lista' ? 'none' : '1px solid var(--border2)' }}>Lista geral</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
          <button onClick={() => setShowModalMateria(true)} style={{ ...btnS, ...btnSm }}>+ Nova matéria</button>
          <button onClick={() => setShowModalTarefa(true)} style={{ ...btnP, ...btnSm }}>+ Tarefa</button>
        </div>
      </div>

      {mode === 'materia' ? renderMaterias() : renderLista()}

      {showModalMateria && (
        <Modal title="Nova matéria" onClose={() => setShowModalMateria(false)}>
          <form onSubmit={handleAddMateria} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Field label="Nome"><input name="nome" type="text" placeholder="Ex: Eletricidade básica" required style={inputStyle} /></Field>
            <Field label="Tag">
              <select name="tag" style={inputStyle}>
                <option value="escola">Escola</option>
                <option value="pessoal">Pessoal</option>
              </select>
            </Field>
            <Field label="Prazo"><input name="prazo" type="date" style={inputStyle} /></Field>
            <Field label="Atividades (uma por linha)">
              <textarea name="tasks" rows={4} placeholder={"Ler apostila\nResolver exercícios\nEntregar"} style={{ ...inputStyle, resize: 'vertical', minHeight: 75 }} />
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button type="button" onClick={() => setShowModalMateria(false)} style={{ ...btnS, ...btnSm }}>Cancelar</button>
              <button type="submit" disabled={isPending} style={{ ...btnP, ...btnSm }}>Criar</button>
            </div>
          </form>
        </Modal>
      )}

      {showModalTarefa && (
        <Modal title="Nova tarefa" onClose={() => setShowModalTarefa(false)}>
          <form onSubmit={handleAddTarefa} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Field label="Nome"><input name="nome" type="text" placeholder="Ex: Resolver exercício da apostila" required style={inputStyle} /></Field>
            <Field label="Tag">
              <select name="tag" style={inputStyle}>
                <option value="escola">Escola</option>
                <option value="pessoal">Pessoal</option>
                <option value="fitness">Fitness</option>
              </select>
            </Field>
            <Field label="Vincular a uma matéria (opcional)">
              <select name="materiaId" style={inputStyle}>
                <option value="">— Lista geral —</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </Field>
            <Field label="Prazo"><input name="prazo" type="date" style={inputStyle} /></Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button type="button" onClick={() => setShowModalTarefa(false)} style={{ ...btnS, ...btnSm }}>Cancelar</button>
              <button type="submit" disabled={isPending} style={{ ...btnP, ...btnSm }}>Adicionar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(25,23,20,.55)', backdropFilter: 'blur(3px)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 460, maxWidth: '95vw', background: 'var(--surface)',
        border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 50px rgba(0,0,0,.18)', zIndex: 201, padding: 0,
      }}>
        <div style={{ padding: '16px 18px 13px', borderBottom: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 800 }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 17 }}>✕</button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </>
  )
}
