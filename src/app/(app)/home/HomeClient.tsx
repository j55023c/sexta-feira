'use client'

import Link from 'next/link'
import type { Profile, Protocolo, Materia, TarefaLivre, FisicoLog } from '@/lib/types'

const TODAY = new Date().toISOString().split('T')[0]

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DIAS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

function fmtDate(d: string) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function tagCls(t: string) {
  const tl = t.toLowerCase()
  if (tl.includes('cárdio') || tl.includes('cardio')) return { bg: 'var(--amber-bg)', color: 'var(--amber)' }
  if (tl.includes('abs') || tl.includes('core')) return { bg: 'var(--purple-bg)', color: 'var(--purple)' }
  if (tl.includes('descanso') || tl.includes('livre')) return { bg: 'var(--surface2)', color: 'var(--muted)' }
  return { bg: 'var(--blue-bg)', color: 'var(--blue)' }
}

interface Props {
  profile: Profile | null
  protocolo: Protocolo | null
  materias: Materia[]
  tarefasLivres: TarefaLivre[]
  fisicoLog: Record<string, FisicoLog>
}

export default function HomeClient({ profile, protocolo, materias, tarefasLivres, fisicoLog }: Props) {
  const now = new Date()
  const dow = now.getDay()
  const diaMap = [6, 0, 1, 2, 3, 4, 5]
  const diaProtocolo = protocolo?.dias[diaMap[dow]]
  const dateStr = `${DIAS_FULL[dow]}, ${now.getDate()} ${MESES[now.getMonth()]}`

  // Pendentes — tarefas de matérias + tarefas livres
  const pendentes: { nome: string; src: string }[] = []
  materias.forEach(m => m.tasks.filter(t => !t.done).forEach(t => pendentes.push({ nome: t.nome, src: m.nome })))
  tarefasLivres.filter(t => !t.done).forEach(t => pendentes.push({ nome: t.nome, src: t.tag }))

  // Matérias com prazo
  const comPrazo = materias
    .filter(m => m.prazo)
    .sort((a, b) => a.prazo.localeCompare(b.prazo))
    .slice(0, 4)

  return (
    <div>
      {/* Grid principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>

        {/* Coluna esquerda */}
        <div>
          {/* Card hoje */}
          <div style={{
            background: 'var(--inverse-bg)',
            color: 'var(--inverse-text)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            marginBottom: 14,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Círculo decorativo */}
            <div style={{
              position: 'absolute', top: -40, right: -40,
              width: 180, height: 180, borderRadius: '50%',
              border: '40px solid rgba(200,68,26,.15)',
            }} />

            <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700, marginBottom: 4, position: 'relative', zIndex: 1 }}>
              Hoje · {DIAS[dow]}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, marginBottom: 10, position: 'relative', zIndex: 1 }}>
              {diaProtocolo?.nome ?? '—'}
            </h3>

            {/* Tags do dia */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10, position: 'relative', zIndex: 1 }}>
              {diaProtocolo?.tags.map(tag => {
                const cls = tagCls(tag)
                return (
                  <span key={tag} style={{
                    display: 'inline-block', fontSize: 9.5, fontWeight: 700,
                    letterSpacing: .8, textTransform: 'uppercase',
                    padding: '2px 8px', borderRadius: 999,
                    background: cls.bg, color: cls.color,
                  }}>
                    {tag}
                  </span>
                )
              })}
            </div>

            {/* Streak */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(200,68,26,.2)', border: '1px solid rgba(200,68,26,.3)',
              borderRadius: 999, padding: '4px 10px', fontSize: 12, fontWeight: 700,
              color: 'var(--accent2)', position: 'relative', zIndex: 1,
            }}>
              🔥 {profile?.streak_count ?? 0} dia{profile?.streak_count !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Pendentes */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>Pendentes</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            </div>

            {pendentes.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: 13, padding: '5px 0' }}>Nenhuma pendente 🎉</div>
            ) : (
              <>
                {pendentes.slice(0, 5).map((it, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 12px', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    fontSize: 13, marginBottom: 5,
                  }}>
                    <div style={{ width: 16, height: 16, flexShrink: 0, border: '2px solid var(--border2)', borderRadius: 4, background: 'var(--surface2)' }} />
                    <span style={{ flex: 1 }}>{it.nome}</span>
                    <span style={{ fontSize: 10, color: 'var(--muted)' }}>{it.src}</span>
                  </div>
                ))}
                {pendentes.length > 5 && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', padding: '4px 0' }}>+{pendentes.length - 5} mais</div>
                )}
              </>
            )}
          </div>

          {/* Ações rápidas */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>Ação rápida</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { href: '/tarefas', icon: '✓', label: 'Nova tarefa', sub: 'Estudos, trabalho, pessoal' },
                { href: '/tarefas', icon: '📚', label: 'Nova matéria', sub: 'Organizar por conteúdo' },
                { href: '/notas', icon: '⚡', label: 'Nota rápida', sub: 'Ideia, lembrete' },
                { href: '/nutricao', icon: '🍽', label: 'Log nutrição', sub: 'Registrar refeição' },
              ].map(btn => (
                <Link key={btn.label} href={btn.href} style={{
                  background: 'var(--surface)', border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius)', padding: '11px 13px',
                  textAlign: 'left', textDecoration: 'none', display: 'block',
                  transition: 'all .14s',
                }}>
                  <span style={{ fontSize: 16, display: 'block', marginBottom: 3 }}>{btn.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block' }}>{btn.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', display: 'block', marginTop: 1 }}>{btn.sub}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna direita */}
        <div>
          {/* Protocolo ativo */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>Protocolo ativo</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.8 }}>
              <strong style={{ fontSize: 14, color: 'var(--text)' }}>{protocolo?.nome ?? '—'}</strong>
              <br />
              <span style={{ fontSize: 12 }}>{protocolo?.desc_texto}</span>
              <br /><br />
              <span style={{ fontSize: 12 }}>{protocolo?.cardio}</span>
            </div>
          </div>

          {/* Matérias com prazo */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 12px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>Matérias com prazo</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            </div>

            {comPrazo.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Nenhum prazo configurado.</div>
            ) : comPrazo.map(m => {
              const d = Math.ceil((new Date(m.prazo).getTime() - new Date(TODAY).getTime()) / 86400000)
              const tagColor = d < 0 ? { bg: 'var(--red-bg)', color: 'var(--red)' }
                : d <= 3 ? { bg: 'var(--amber-bg)', color: 'var(--amber)' }
                : { bg: 'var(--surface2)', color: 'var(--muted)' }
              const label = d < 0 ? 'Vencido' : d === 0 ? 'Hoje' : `${d}d`

              return (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: 13,
                }}>
                  <span style={{ flex: 1, fontWeight: 600 }}>{m.nome}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                    {m.tasks.filter(t => !t.done).length} pend.
                  </span>
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: .8,
                    textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999,
                    background: tagColor.bg, color: tagColor.color,
                  }}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
