'use client'

import Link from 'next/link'
import type { Profile, Protocolo, Materia, TarefaLivre, FisicoLog } from '@/lib/types'

const TODAY = new Date().toISOString().split('T')[0]
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function tagStyle(t: string): React.CSSProperties {
  const tl = t.toLowerCase()
  if (tl.includes('cárdio') || tl.includes('cardio')) return { background: 'var(--amber-bg)', color: 'var(--amber)' }
  if (tl.includes('abs') || tl.includes('core')) return { background: 'var(--purple-bg)', color: 'var(--purple)' }
  if (tl.includes('descanso') || tl.includes('livre')) return { background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)' }
  return { background: 'var(--blue-bg)', color: 'var(--blue)' }
}

const tag: React.CSSProperties = {
  display: 'inline-block', fontSize: 9.5, fontWeight: 700,
  letterSpacing: .8, textTransform: 'uppercase',
  padding: '2px 8px', borderRadius: 999,
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)', padding: 18,
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
    </div>
  )
}

interface Props {
  profile: Profile | null
  protocolo: Protocolo | null
  materias: Materia[]
  tarefasLivres: TarefaLivre[]
  fisicoLog: Record<string, FisicoLog>
}

export default function HomeClient({ profile, protocolo, materias, tarefasLivres }: Props) {
  const now = new Date()
  const dow = now.getDay()
  const diaMap = [6, 0, 1, 2, 3, 4, 5]
  const diaProtocolo = protocolo?.dias[diaMap[dow]]

  const pendentes: { nome: string; src: string }[] = []
  materias.forEach(m => m.tasks.filter(t => !t.done).forEach(t => pendentes.push({ nome: t.nome, src: m.nome })))
  tarefasLivres.filter(t => !t.done).forEach(t => pendentes.push({ nome: t.nome, src: t.tag }))

  const comPrazo = materias.filter(m => m.prazo).sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 4)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

      {/* Coluna esquerda */}
      <div>
        {/* Card hoje — fundo escuro, círculo decorativo agora tingido pela cor do tema ativo */}
        <div style={{
          background: 'var(--inverse-bg)',
          color: 'var(--inverse-text)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 20px',
          marginBottom: 14,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Círculo decorativo — era rgba(200,68,26,.15) fixo, agora var(--accent-glow-15) */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 180, height: 180, borderRadius: '50%',
            border: '40px solid var(--accent-glow-15)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700, marginBottom: 4 }}>
              Hoje · {DIAS[dow]}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2, marginBottom: 8, color: 'var(--inverse-text)' }}>
              {diaProtocolo?.nome ?? '—'}
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {diaProtocolo?.tags.map(t => (
                <span key={t} style={{ ...tag, ...tagStyle(t) }}>{t}</span>
              ))}
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'var(--accent-glow-20)', border: '1px solid var(--accent-glow-30)',
              borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700, color: 'var(--accent2)',
            }}>
              🔥 {profile?.streak_count ?? 0} dia{profile?.streak_count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Pendentes */}
        <div style={{ ...card, marginBottom: 14 }}>
          <Divider label="Pendentes" />
          {pendentes.length === 0
            ? <div style={{ color: 'var(--muted)', fontSize: 13 }}>Nenhuma pendente 🎉</div>
            : <>
              {pendentes.slice(0, 5).map((it, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '7px 10px', background: 'var(--surface)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                  fontSize: 13, marginBottom: 5,
                }}>
                  <div style={{ width: 14, height: 14, flexShrink: 0, border: '2px solid var(--border2)', borderRadius: 3 }} />
                  <span style={{ flex: 1 }}>{it.nome}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{it.src}</span>
                </div>
              ))}
              {pendentes.length > 5 && <div style={{ fontSize: 11, color: 'var(--muted)', paddingTop: 4 }}>+{pendentes.length - 5} mais</div>}
            </>
          }
        </div>

        {/* Ações rápidas */}
        <div style={card}>
          <Divider label="Ação rápida" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { href: '/tarefas', icon: '✓', label: 'Nova tarefa', sub: 'Estudos, trabalho, pessoal' },
              { href: '/tarefas', icon: '📚', label: 'Nova matéria', sub: 'Organizar por conteúdo' },
              { href: '/notas', icon: '⚡', label: 'Nota rápida', sub: 'Ideia, lembrete' },
              { href: '/nutricao', icon: '🍽', label: 'Log nutrição', sub: 'Registrar refeição' },
            ].map(btn => (
              <Link key={btn.label} href={btn.href} style={{
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', padding: '11px 13px',
                textDecoration: 'none', display: 'block',
              }}>
                <span style={{ fontSize: 15, display: 'block', marginBottom: 3 }}>{btn.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block' }}>{btn.label}</span>
                <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginTop: 1 }}>{btn.sub}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Coluna direita */}
      <div>
        <div style={{ ...card, marginBottom: 14 }}>
          <Divider label="Protocolo ativo" />
          <strong style={{ fontSize: 13, color: 'var(--text)', display: 'block', marginBottom: 4 }}>{protocolo?.nome ?? '—'}</strong>
          <span style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, display: 'block' }}>{protocolo?.desc_texto}</span>
          {protocolo?.cardio && <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 8 }}>{protocolo.cardio}</span>}
        </div>

        <div style={card}>
          <Divider label="Matérias com prazo" />
          {comPrazo.length === 0
            ? <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nenhum prazo configurado.</div>
            : comPrazo.map(m => {
              const d = Math.ceil((new Date(m.prazo).getTime() - new Date(TODAY).getTime()) / 86400000)
              const cor = d < 0 ? { bg: 'var(--red-bg)', c: 'var(--red)' } : d <= 3 ? { bg: 'var(--amber-bg)', c: 'var(--amber)' } : { bg: 'var(--surface2)', c: 'var(--muted)' }
              const label = d < 0 ? 'Vencido' : d === 0 ? 'Hoje' : `${d}d`
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <span style={{ flex: 1, fontWeight: 600 }}>{m.nome}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>{m.tasks.filter(t => !t.done).length} pend.</span>
                  <span style={{ ...tag, background: cor.bg, color: cor.c }}>{label}</span>
                </div>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}
