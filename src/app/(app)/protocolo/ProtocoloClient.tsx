'use client'

import { useState, useTransition, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Protocolo, Profile, HistoricoFase, Fase, DiaProtocolo, Suplemento } from '@/lib/types'
import MobileSheet from '@/components/ui/MobileSheet'
import { actionSaveProtocolo, actionMudarFase } from './actions'

// ── Regras por fase (RASCUNHO — revisar antes de considerar definitivo) ──────
const REGRAS_POR_FASE: Record<Fase, { num: string; title: string; desc: string }[]> = {
  cutting: [
    { num: '01', title: 'Proteína é inegociável', desc: 'Pode cortar carbo, pode cortar gordura, pode pular o feijão. Nunca zere a proteína. Meta mínima: 150g/dia.' },
    { num: '02', title: 'Salada e legume são livres', desc: 'Folhas, tomate, pepino, cenoura, chuchu, abobrinha — à vontade. Quase zero caloria.' },
    { num: '03', title: 'Frango sem pele é preferível', desc: 'Peito ou sobrecoxa sem pele. Com pele, reduza 0,5 col.' },
    { num: '04', title: 'Carne gorda = menos quantidade', desc: 'Costela, fraldinha, cupim: reduza para 2 col. cheias. Patinho e coxão duro são os mais magros.' },
    { num: '05', title: 'Um dia ruim não desfaz nada', desc: 'Voltando ao plano no dia seguinte, um erro é irrelevante no contexto de 20 semanas.' },
    { num: '06', title: 'Nunca compense cortando', desc: 'Errou ontem? Hoje volta ao normal. Não corte calorias para "equilibrar".' },
    { num: '07', title: 'Sono não é negociável', desc: 'Menos de 7h = cortisol alto, mais fome, menos GH, mais catabolismo.' },
    { num: '08', title: 'Consistência > perfeição', desc: '80% de adesão por 20 semanas é infinitamente melhor que 100% por 3 semanas e abandono.' },
    { num: '09', title: 'Fome leve é normal, fome intensa não', desc: 'Fome intensa e constante = déficit alto demais — aumente 200 kcal.' },
    { num: '10', title: 'A força é o termômetro', desc: 'Perdeu mais de 10–15% de força? Primeiro aumente calorias, depois investigue sono e proteína.' },
  ],
  bulking: [
    { num: '01', title: 'Proteína continua prioridade', desc: 'O superávit não é desculpa pra relaxar na proteína. Meta mínima segue em 2g/kg.' },
    { num: '02', title: 'Superávit controlado', desc: '300–500 kcal acima da manutenção. Mais que isso é gordura acumulando, não músculo.' },
    { num: '03', title: 'Peso subindo rápido demais é sinal de alerta', desc: 'Ganho acima de 0,5kg/semana quase sempre é gordura. Ajuste as calorias pra baixo.' },
    { num: '04', title: 'Sobrecarga progressiva é o motor', desc: 'Sem progredir carga/repetição, o superávit vira só gordura — o estímulo é o que conta.' },
    { num: '05', title: 'Coma mais nos dias de treino pesado', desc: 'Ciclar carboidrato ao redor do treino rende mais que espalhar igual no dia todo.' },
    { num: '06', title: 'Sono de 8h+ é onde o músculo é construído', desc: 'Bulking com sono ruim é superávit desperdiçado.' },
    { num: '07', title: 'Ritmo ideal: ~0,3kg/semana', desc: 'Mais rápido que isso quase sempre significa gordura entrando junto.' },
    { num: '08', title: 'Gordura não é vilã aqui', desc: 'Só não deixe passar de ~30% das calorias totais — o resto é carbo pra sustentar o treino.' },
    { num: '09', title: 'Evite o "bulk sujo"', desc: 'Comer qualquer coisa em excesso não acelera ganho de músculo, só de gordura.' },
    { num: '10', title: 'Consistência de 12+ semanas > 3 semanas de exagero', desc: 'Bulking é jogo longo. Resultado visível vem da manutenção do processo, não da intensidade de uma semana.' },
  ],
  manutencao: [
    { num: '01', title: 'Objetivo é estabilidade, não progresso rápido', desc: 'Aqui você consolida o que já foi conquistado — não é hora de forçar nada.' },
    { num: '02', title: 'Calorias na média do TDEE', desc: 'Sem déficit nem superávit forçado. O corpo tende a se ajustar sozinho perto do gasto real.' },
    { num: '03', title: 'Proteína continua alta', desc: 'É o macronutriente que preserva o que você construiu na fase anterior.' },
    { num: '04', title: 'Ótima janela pra recalibrar hábitos', desc: 'Sono, rotina de treino, organização da dieta — ajuste aqui o que ficou pra trás.' },
    { num: '05', title: 'Sem prazo fixo', desc: 'Fique nessa fase até se sentir pronto pra decidir a próxima direção com clareza.' },
    { num: '06', title: 'Pesagem semanal já basta', desc: 'Pesar todo dia nessa fase só gera ruído — a tendência de 7 dias é o que importa.' },
    { num: '07', title: 'Treino continua com intensidade', desc: 'Manutenção não é sinônimo de treino leve — a sobrecarga progressiva não pausa.' },
    { num: '08', title: 'Boa fase pra testar', desc: 'Novo alimento, novo horário de treino, novo suplemento — o risco de sair da meta é baixo aqui.' },
    { num: '09', title: 'Oscilação de ±1kg é normal', desc: 'Água corporal e glicogênio flutuam. Não é motivo de alarme nem de ação corretiva.' },
    { num: '10', title: 'Use como base pra decidir a próxima fase', desc: 'Terminando a manutenção com dados estáveis, fica mais fácil escolher: cutting ou bulking de novo.' },
  ],
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'] as const

const FASE_INFO: Record<Fase, { label: string; icon: string; tagBg: string; tagColor: string }> = {
  bulking:    { label: 'Bulking',     icon: '📈', tagBg: 'var(--blue-bg)',   tagColor: 'var(--blue)'  },
  cutting:    { label: 'Cutting',     icon: '🔥', tagBg: 'var(--amber-bg)', tagColor: 'var(--amber)' },
  manutencao: { label: 'Manutenção',  icon: '⚖️', tagBg: 'var(--green-bg)', tagColor: 'var(--green)' },
}

function generateId() {
  return `sup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)', padding: 18,
}
const btnP: React.CSSProperties = {
  border: 'none', borderRadius: 'var(--radius)', padding: '9px 16px',
  fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', background: 'var(--accent)', color: 'white',
}
const btnS: React.CSSProperties = {
  ...btnP, background: 'var(--surface2)', color: 'var(--text)',
  border: '1px solid var(--border2)',
}
const btnSm: React.CSSProperties = { padding: '5px 11px', fontSize: 11 }
const btnDanger: React.CSSProperties = {
  ...btnP, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
}
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' }

function fmtDate(d: string) {
  if (!d) return ''
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 0 }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
      <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

// ── Suplementos Tab ────────────────────────────────────────────────────────────
function SuplementosTab({ 
  suplementos: suplementosIniciais, 
  onSuplementosChange, 
  checks: checksIniciais,
  onChecksChange,
  fi 
}: { 
  suplementos: Suplemento[]; 
  onSuplementosChange: (sups: Suplemento[]) => void;
  checks: Record<string, string[]>;
  onChecksChange: (checks: Record<string, string[]>) => void;
  fi: typeof FASE_INFO[Fase]; 
}) {
  const [suplementos, setSuplementos] = useState<Suplemento[]>(suplementosIniciais)
  const [checks, setChecks] = useState<Record<string, string[]>>(checksIniciais)
  const [showForm, setShowForm] = useState(false)
  const [editingSup, setEditingSup] = useState<Suplemento | null>(null)
  const [form, setForm] = useState({ nome: '', dose: '', timing: '' })
  const hoje = new Date().toISOString().split('T')[0]
  const marcadosHoje = new Set(checks[hoje] ?? [])

  function toggle(supId: string) {
    const atuais = new Set(checks[hoje] ?? [])
    if (atuais.has(supId)) {
      atuais.delete(supId)
    } else {
      atuais.add(supId)
    }
    const novoChecks = { ...checks, [hoje]: Array.from(atuais) }
    setChecks(novoChecks)
    onChecksChange(novoChecks)
  }

  function handleSaveSup(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) return

    let updated: Suplemento[]
    if (editingSup) {
      updated = suplementos.map(s => s.id === editingSup.id ? { ...s, ...form } : s)
    } else {
      const novo: Suplemento = { id: generateId(), ...form }
      updated = [...suplementos, novo]
    }
    setSuplementos(updated)
    onSuplementosChange(updated)
    setShowForm(false)
    setEditingSup(null)
    setForm({ nome: '', dose: '', timing: '' })
  }

  function handleDeleteSup(id: string) {
    const updated = suplementos.filter(s => s.id !== id)
    setSuplementos(updated)
    onSuplementosChange(updated)
    // Remove também dos checks
    const novoChecks = { ...checks }
    Object.keys(novoChecks).forEach(date => {
      novoChecks[date] = novoChecks[date].filter(sid => sid !== id)
    })
    setChecks(novoChecks)
    onChecksChange(novoChecks)
  }

  const completedCount = suplementos.filter(s => marcadosHoje.has(s.id)).length

  return (
    <div>
      <div style={{ ...card, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--hint)' }}>
            {fi.icon} Suplementação — {fi.label}
          </span>
          <button
            onClick={() => { setEditingSup(null); setForm({ nome: '', dose: '', timing: '' }); setShowForm(true); }}
            style={{ padding: '4px 8px', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
          >
            + Adicionar
          </button>
          <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
            <span>Progresso</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{completedCount}/{suplementos.length}</span>
          </div>
          <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 3, width: `${suplementos.length > 0 ? Math.round((completedCount / suplementos.length) * 100) : 0}%`, transition: 'width .3s ease' }} />
          </div>
        </div>

        {/* Grid 2 colunas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {suplementos.map((s) => {
            const active = marcadosHoje.has(s.id)
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 'var(--radius)',
                  background: active ? 'var(--accent-glow-10)' : 'var(--surface)',
                  border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                  transition: 'all .13s',
                  color: active ? 'var(--text)' : 'var(--muted)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = active ? 'var(--accent-glow-10)' : 'var(--surface2)'
                  const actions = e.currentTarget.querySelector('.sup-actions') as HTMLElement | null
                  if (actions) actions.style.opacity = '1'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = active ? 'var(--accent-glow-10)' : 'var(--surface)'
                  const actions = e.currentTarget.querySelector('.sup-actions') as HTMLElement | null
                  if (actions) actions.style.opacity = '0'
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    border: active ? 'none' : '2px solid var(--border2)',
                    background: active ? 'var(--accent)' : 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, cursor: 'pointer', padding: 0,
                  }}
                >
                  {active ? '✓' : '💊'}
                </button>

                <span style={{ flex: 1, fontSize: 12.5, userSelect: 'none' }}>{s.nome}</span>

                <div className="sup-actions" style={{ display: 'flex', gap: 4, opacity: 0, transition: 'opacity .13s', flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setEditingSup(s); setForm({ nome: s.nome, dose: s.dose, timing: s.timing }); setShowForm(true); }}
                    style={{ padding: '4px', borderRadius: 4, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteSup(s.id); }}
                    style={{ padding: '4px', borderRadius: 4, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--red)', cursor: 'pointer', display: 'flex' }}
                    title="Excluir"
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius)', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text)' }}>Nota:</strong> A lista de suplementos e as marcações diárias sincronizam entre dispositivos.
        </div>
      </div>
      <div style={{ borderLeft: '3px solid var(--accent)', padding: '9px 12px', background: 'var(--accent-glow-10)', borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.65 }}>
        <strong style={{ color: 'var(--text)' }}>Sugestão baseada na fase:</strong> a lista acima é um ponto de partida. Adicione, edite ou remova itens conforme sua necessidade e orientação profissional.
      </div>

      {/* Modal Add/Edit */}
      <MobileSheet
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingSup(null); setForm({ nome: '', dose: '', timing: '' }) }}
        title={editingSup ? 'Editar Suplemento' : 'Novo Suplemento'}
        wide={false}
      >
        <form onSubmit={handleSaveSup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Nome</label>
            <input
              type="text" value={form.nome} onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: Creatina" required autoFocus
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Dose</label>
            <input
              type="text" value={form.dose} onChange={e => setForm(prev => ({ ...prev, dose: e.target.value }))}
              placeholder="Ex: 5g"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Horário</label>
            <input
              type="text" value={form.timing} onChange={e => setForm(prev => ({ ...prev, timing: e.target.value }))}
              placeholder="Ex: Pós-treino"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={() => { setShowForm(false); setEditingSup(null); setForm({ nome: '', dose: '', timing: '' }) }} style={btnS}>Cancelar</button>
            <button type="submit" style={btnP}>{editingSup ? 'Atualizar' : 'Adicionar'}</button>
          </div>
        </form>
      </MobileSheet>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  protocolo: Protocolo | null
  profile: Profile | null
  historico?: HistoricoFase[]
}

type Tab = 'semana' | 'cardio' | 'metas' | 'regras' | 'progresso' | 'suplementos' | 'editar'

export default function ProtocoloClient({ protocolo: initialProtocolo, profile }: Props) {
  const [protocolo, setProtocolo] = useState<Protocolo>(initialProtocolo ?? {
    nome: 'Meu protocolo', desc_texto: '', cardio: '', fase: 'cutting',
    data_inicio: new Date().toISOString().split('T')[0],
    cardapio_ativo_id: 'padrao', dias: [], duracao_semanas: 12,
    suplementos: [],
    suplementos_checks: {},
  })
  const [tab, setTab] = useState<Tab>('semana')
  const [showModalFase, setShowModalFase] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [hoveredDiaId, setHoveredDiaId] = useState<string | null>(null)

  const fi = FASE_INFO[protocolo.fase]
  const regrasAtivas = REGRAS_POR_FASE[protocolo.fase]

  // ── Helpers de progresso ────────────────────────────────────────────────────
  const progresso = useMemo(() => {
      if (!protocolo.duracao_semanas) return null
      const inicio = new Date(protocolo.data_inicio)
      const fim = new Date(inicio)
      fim.setDate(fim.getDate() + protocolo.duracao_semanas * 7)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const total = fim.getTime() - inicio.getTime()
      const passado = hoje.getTime() - inicio.getTime()
      const pct = Math.max(0, Math.min(100, Math.round((passado / total) * 100)))
      const semanasTotais = protocolo.duracao_semanas
      const semanasPassadas = Math.max(0, Math.ceil(passado / (7 * 86400000)))
      const semanasRestantes = Math.max(0, semanasTotais - semanasPassadas)
      const diasRestantes = Math.max(0, Math.ceil((fim.getTime() - hoje.getTime()) / 86400000))
      return { pct, semanasTotais, semanasPassadas, semanasRestantes, diasRestantes, fim: fim.toISOString().split('T')[0] }
    }, [protocolo.data_inicio, protocolo.duracao_semanas])

      // ── Salvar protocolo ────────────────────────────────────────────────────────
      function handleSaveProtocolo(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const updated = {
              ...protocolo,
              nome: fd.get('nome') as string,
              desc_texto: fd.get('desc') as string,
              cardio: fd.get('cardio') as string,
              duracao_semanas: Number(fd.get('duracao_semanas')) || undefined,
            }
        setProtocolo(updated)
        startTransition(async () => { await actionSaveProtocolo(updated) })
      }

      // ── Auto-save debounced ─────────────────────────────────────────────────────
      const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
      const isSavingRef = useRef(false)

      function triggerAutoSave() {
        if (isSavingRef.current) return
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = setTimeout(() => {
          isSavingRef.current = true
          startTransition(async () => {
            try {
              await actionSaveProtocolo(protocolo)
            } finally {
              isSavingRef.current = false
            }
          })
        }, 800) // debounce 800ms
      }

      // Auto-save quando campos críticos mudam
      useEffect(() => {
        triggerAutoSave()
      }, [protocolo.duracao_semanas, protocolo.data_inicio, protocolo.suplementos, protocolo.suplementos_checks, protocolo.dias])

      // ── Mudar fase ──────────────────────────────────────────────────────────────
      function handleMudarFase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const novaFase = fd.get('fase') as Fase
    const novoNome = fd.get('nome') as string
    const today = new Date().toISOString().split('T')[0]

    setProtocolo(prev => ({ ...prev, fase: novaFase, nome: novoNome || prev.nome, data_inicio: today }))
    setShowModalFase(false)

    startTransition(async () => {
      await actionMudarFase(novaFase, novoNome, protocolo.cardapio_ativo_id, {
        fase: protocolo.fase, nome: protocolo.nome, dataInicio: protocolo.data_inicio,
        kcalMeta: profile?.kcal_meta ?? 2000, protMeta: profile?.prot_meta ?? 160,
      })
    })
  }

  // ── CRUD Dias ───────────────────────────────────────────────────────────────
  function updateDia(id: string, fields: Partial<DiaProtocolo>) {
    setProtocolo(prev => ({
      ...prev,
      dias: prev.dias.map(d => d.id === id ? { ...d, ...fields } : d)
    }))
  }

  function addDia() {
      const novoDia = DIAS_SEMANA[protocolo.dias.length % 7]
      const novoId = crypto.randomUUID?.() ?? Date.now().toString(36)
      const corPadrao = '#95a5a6'
      setProtocolo(prev => ({
        ...prev,
        dias: [...prev.dias, {
          id: novoId,
          dia: novoDia,
          nome: `Treino ${prev.dias.length + 1}`,
          tipo: '',
          cor: corPadrao,
          tags: []
        }]
      }))
    }

  function removeDia(id: string) {
    if (protocolo.dias.length <= 1) return
    setProtocolo(prev => ({ ...prev, dias: prev.dias.filter(d => d.id !== id) }))
  }

  function reorderDias(novoArray: DiaProtocolo[]) {
    setProtocolo(prev => ({ ...prev, dias: novoArray }))
  }

  const TABS: { key: Tab; label: string }[] = [
      { key: 'semana', label: '📅 Semana' },
      { key: 'progresso', label: '📈 Progresso' },
      { key: 'cardio', label: '🏃 Cárdio' },
      { key: 'metas', label: '🎯 Metas' },
      { key: 'regras', label: '⚡ Regras' },
      { key: 'suplementos', label: '💊 Suplementos' },
      { key: 'editar', label: '✏️ Editar' },
    ]

    // ── Progresso: estado local para datas editáveis ──────────────────────────────
    const [progressoDataInicio, setProgressoDataInicio] = useState(protocolo.data_inicio)
    const [progressoDataFim, setProgressoDataFim] = useState(progresso?.fim ?? '')

    // Recalcula progresso quando datas mudam
    const progressoEditavel = useMemo(() => {
      if (!progressoDataInicio || !progressoDataFim) return null
      const inicio = new Date(progressoDataInicio)
      const fim = new Date(progressoDataFim)
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      if (fim <= inicio) return null
      const total = fim.getTime() - inicio.getTime()
      const passado = hoje.getTime() - inicio.getTime()
      const pct = Math.max(0, Math.min(100, Math.round((passado / total) * 100)))
      const semanasTotais = Math.ceil((fim.getTime() - inicio.getTime()) / (7 * 86400000))
      const semanasPassadas = Math.max(0, Math.ceil(passado / (7 * 86400000)))
      const semanasRestantes = Math.max(0, semanasTotais - semanasPassadas)
      const diasRestantes = Math.max(0, Math.ceil((fim.getTime() - hoje.getTime()) / 86400000))
      return { pct, semanasTotais, semanasPassadas, semanasRestantes, diasRestantes, fim: progressoDataFim }
    }, [progressoDataInicio, progressoDataFim])

    // Sincroniza com protocolo quando ele muda (ex: carregou do banco)
    useEffect(() => {
      setProgressoDataInicio(protocolo.data_inicio)
      if (protocolo.duracao_semanas) {
        const fim = new Date(protocolo.data_inicio)
        fim.setDate(fim.getDate() + protocolo.duracao_semanas * 7)
        setProgressoDataFim(fim.toISOString().split('T')[0])
      } else {
        setProgressoDataFim('')
      }
    }, [protocolo.data_inicio, protocolo.duracao_semanas])

    function handleProgressoDataChange(campo: 'inicio' | 'fim', value: string) {
      if (campo === 'inicio') setProgressoDataInicio(value)
      else setProgressoDataFim(value)
      // Atualiza o protocolo também
      setProtocolo(prev => ({ ...prev, data_inicio: campo === 'inicio' ? value : prev.data_inicio }))
    }

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Protocolo</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>Seu treino, cardápio e metas em um só lugar.</p>

      {/* Card fase atual */}
      <div style={{
        background: 'var(--inverse-bg)', color: 'var(--inverse-text)',
        borderRadius: 'var(--radius-lg)', padding: '18px 20px',
        marginBottom: 16, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', border: '40px solid var(--accent-glow-15)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent2)', fontWeight: 700, marginBottom: 4 }}>
            Fase atual · desde {fmtDate(protocolo.data_inicio)}
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, color: 'var(--inverse-text)' }}>
            {fi.icon} {protocolo.nome}
          </h3>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: fi.tagBg, color: fi.tagColor, textTransform: 'uppercase', letterSpacing: .8 }}>{fi.label}</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--surface2)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>{profile?.kcal_meta ?? 2000} kcal/dia</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--surface2)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8 }}>{profile?.prot_meta ?? 160}g proteína</span>
          </div>
          <button onClick={() => setShowModalFase(true)} style={{ ...btnS, ...btnSm, background: 'rgba(255,255,255,.12)', color: 'var(--inverse-text)', border: '1px solid rgba(255,255,255,.2)' }}>
            🔄 Mudar de fase
          </button>
        </div>
      </div>

      {/* Cardápio ativo — agora é link direto pro guia de Dieta, não seletor */}
      <Link href="/dieta" style={{ textDecoration: 'none' }}>
        <div style={{ ...card, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'border-color .14s' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🍽</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Guia de dieta</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Café, almoço, pré/pós-treino, jantar, emergências e trocas — fase {fi.label.toLowerCase()}</div>
          </div>
          <span style={{ color: 'var(--accent)', fontSize: 18 }}>→</span>
        </div>
      </Link>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border2)', marginBottom: 18, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 15px', background: 'none', border: 'none',
            fontFamily: 'var(--font-syne)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.key ? 'var(--accent)' : 'var(--muted)',
            whiteSpace: 'nowrap',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Tab: Semana */}
                  {tab === 'semana' && (
                    <div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-[18px]">
                        {protocolo.dias.map((d) => (
                          <div
                            key={d.id}
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-lg)',
                              padding: '10px 10px 12px',
                              position: 'relative',
                            }}
                            onMouseEnter={() => setHoveredDiaId(d.id)}
                            onMouseLeave={() => setHoveredDiaId(null)}
                          >
                            <div
                              style={{
                                height: 3,
                                borderRadius: 2,
                                marginBottom: 8,
                                background: d.cor ?? '#95a5a6',
                              }}
                            />
                            <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, color: 'var(--hint)', marginBottom: 3 }}>{d.dia}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{d.nome}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {d.tags.map((t) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 600,
                                    padding: '2px 6px',
                                    borderRadius: 999,
                                    display: 'inline-block',
                                    width: 'fit-content',
                                    background: `${d.cor}22`,
                                    color: d.cor,
                                    border: `1px solid ${d.cor}44`,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: 'var(--inverse-bg)', color: 'var(--inverse-text)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', fontSize: 13, lineHeight: 1.65 }}>
                        <strong style={{ color: 'var(--accent2)' }}>{protocolo.nome}</strong> · {protocolo.desc_texto}
                      </div>
                    </div>
                  )}

            {/* Tab: Progresso */}
                        {tab === 'progresso' && (
                          <div>
                            {progressoEditavel ? (
                              <>
                                <div style={{ ...card, marginBottom: 14 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: fi.tagBg, color: fi.tagColor, textTransform: 'uppercase', letterSpacing: .8 }}>
                                      {fi.icon} {protocolo.nome}
                                    </span>
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, marginBottom: 14 }}>
                                    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, textAlign: 'center' }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Início</div>
                                      <input
                                        type="date"
                                        value={progressoDataInicio}
                                        onChange={e => handleProgressoDataChange('inicio', e.target.value)}
                                        style={{ ...inputStyle, fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-dm-mono)', textAlign: 'center', color: 'var(--text)' }}
                                      />
                                    </div>
                                    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, textAlign: 'center' }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Fim</div>
                                      <input
                                        type="date"
                                        value={progressoDataFim}
                                        onChange={e => handleProgressoDataChange('fim', e.target.value)}
                                        style={{ ...inputStyle, fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-dm-mono)', textAlign: 'center', color: 'var(--accent)' }}
                                      />
                                    </div>
                                    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, textAlign: 'center' }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Semanas totais</div>
                                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: 'var(--text)' }}>{progressoEditavel.semanasTotais}</div>
                                    </div>
                                    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, textAlign: 'center' }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Semanas passadas</div>
                                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: 'var(--blue)' }}>{progressoEditavel.semanasPassadas}</div>
                                    </div>
                                    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, textAlign: 'center' }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Semanas restantes</div>
                                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: 'var(--amber)' }}>{progressoEditavel.semanasRestantes}</div>
                                    </div>
                                    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, textAlign: 'center' }}>
                                      <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Dias restantes</div>
                                      <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: 'var(--red)' }}>{progressoEditavel.diasRestantes}</div>
                                    </div>
                                  </div>
                                  {/* Barra de progresso */}
                                  <div style={{ marginBottom: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
                                      <span>Progresso da fase</span>
                                      <span style={{ color: 'var(--accent)' }}>{progressoEditavel.pct}%</span>
                                    </div>
                                    <div style={{ height: 10, background: 'var(--surface2)', borderRadius: 999, overflow: 'hidden' }}>
                                      <div
                                        style={{
                                          width: `${progressoEditavel.pct}%`,
                                          height: '100%',
                                          background: 'linear-gradient(90deg,var(--accent),var(--accent2))',
                                          borderRadius: 999,
                                          transition: 'width 0.4s ease',
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.6 }}>
                                    Semana <strong style={{ color: 'var(--text)' }}>{progressoEditavel.semanasPassadas}</strong> de <strong style={{ color: 'var(--text)' }}>{progressoEditavel.semanasTotais}</strong> · {progressoEditavel.diasRestantes} dias para o fim estimado
                                  </div>
                                </div>
                                <div style={{ borderLeft: '3px solid var(--accent)', padding: '9px 12px', background: 'var(--accent-glow-10)', borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.65 }}>
                                  <strong style={{ color: 'var(--text)' }}>Dica:</strong> Edite as datas acima — o progresso recalcula automaticamente. A data de início também atualiza o protocolo.
                                </div>
                              </>
                            ) : (
                              <div style={{ ...card, textAlign: 'center', padding: 30 }}>
                                <div style={{ fontSize: 28, marginBottom: 8 }}>📈</div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: 'var(--text)' }}>Datas não definidas</div>
                                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
                                  Defina a data de início e fim acima para ver o progresso da fase, barra animada e contagem regressiva.
                                </div>
                              </div>
                            )}
                          </div>
                        )}

            {/* Tab: Cárdio */}
            {tab === 'cardio' && (
              <div>
                <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start', padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🏃</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Protocolo de cárdio</div>
                    <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: protocolo.cardio.replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
                <div style={{ borderLeft: '3px solid var(--accent)', padding: '9px 12px', background: 'var(--accent-glow-10)', borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.65 }}>
                  <strong style={{ color: 'var(--text)' }}>Prioridade:</strong> treino de força sempre primeiro. Cárdio só depois.
                </div>
              </div>
            )}

            {/* Tab: Metas */}
            {tab === 'metas' && (
              <div>
                <div style={{ ...card, marginBottom: 14 }}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: 'Kcal/dia', val: profile?.kcal_meta ?? 2000 },
                      { label: 'Proteína', val: `${profile?.prot_meta ?? 160}g` },
                      { label: 'Carbo', val: `${profile?.carbo_meta ?? 220}g` },
                    ].map((m) => (
                      <div key={m.label} style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: 12, textAlign: 'center' }}>
                        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>{m.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-dm-mono)' }}>{m.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ borderLeft: '3px solid var(--accent)', padding: '9px 12px', background: 'var(--accent-glow-10)', borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.65 }}>
                  Para recalcular com base no seu peso atual, use a <a href="/calculadora" style={{ color: 'var(--accent)' }}>Calculadora →</a>
                </div>
              </div>
            )}

            {/* Tab: Regras — específicas por fase */}
            {tab === 'regras' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: fi.tagBg, color: fi.tagColor, textTransform: 'uppercase', letterSpacing: .8 }}>
                    {fi.icon} Regras de {fi.label}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 14 }}>
                  {regrasAtivas.map((r) => (
                    <div key={r.num} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 14 }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--surface2)', lineHeight: 1, marginBottom: 5 }}>{r.num}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{r.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.6 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--inverse-bg)', color: 'var(--inverse-text)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', fontSize: 13, lineHeight: 1.65 }}>
                  <strong style={{ color: 'var(--accent2)' }}>Hierarquia universal:</strong> proteína ✓ → leguminosa ✓ → carboidrato ✓ → gordura ✓ → vegetais.
                </div>
              </div>
            )}

            {/* Tab: Suplementos */}
                                                {tab === 'suplementos' && (
                                                  <SuplementosTab 
                                                    suplementos={protocolo.suplementos ?? []} 
                                                    onSuplementosChange={(sups) => setProtocolo(prev => ({ ...prev, suplementos: sups }))}
                                                    checks={protocolo.suplementos_checks ?? {}}
                                                    onChecksChange={(cks) => setProtocolo(prev => ({ ...prev, suplementos_checks: cks }))}
                                                    fi={fi} 
                                                  />
                                                )}

            {/* Tab: Editar */}
                        {tab === 'editar' && (
                          <form onSubmit={handleSaveProtocolo}>
                            <div style={{ ...card, marginBottom: 14 }}>
                              <Field label="Nome do protocolo">
                                <input name="nome" type="text" defaultValue={protocolo.nome} placeholder="Ex: Push/Pull/Legs 6×/semana" style={inputStyle} />
                              </Field>
                              <Field label="Descrição curta">
                                <textarea name="desc" rows={2} defaultValue={protocolo.desc_texto} style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} />
                              </Field>
                              <Field label="Duração da fase (semanas)">
                                <input name="duracao_semanas" type="number" min="1" max="52" defaultValue={protocolo.duracao_semanas ?? ''} style={inputStyle} />
                              </Field>
                            </div>

                            <div style={{ ...card, marginBottom: 14 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div style={{ fontSize: 14, fontWeight: 800 }}>Dias da semana</div>
                                <button type="button" onClick={addDia} style={{ ...btnP, ...btnSm, fontSize: 11, padding: '6px 12px' }}>
                                  + Adicionar dia
                                </button>
                              </div>
                              {protocolo.dias.map((d) => (
                                <div
                                  key={d.id}
                                  className="grid grid-cols-1 sm:grid-cols-[60px_1fr_1fr_40px] gap-2 sm:gap-[10px] items-start"
                                  style={{
                                    marginBottom: 10,
                                    paddingBottom: 10,
                                    borderBottom: d.id !== protocolo.dias[protocolo.dias.length - 1]?.id ? '1px solid var(--border)' : 'none',
                                    opacity: hoveredDiaId === d.id ? 1 : 0.85,
                                    transition: 'opacity 0.15s',
                                  }}
                                  onMouseEnter={() => setHoveredDiaId(d.id)}
                                  onMouseLeave={() => setHoveredDiaId(null)}
                                >
                                  <div style={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }}>{d.dia}</div>
                                  <div>
                                    <input type="text" value={d.nome} onChange={(e) => updateDia(d.id, { nome: e.target.value })} style={{ ...inputStyle, marginBottom: 5 }} />
                                    <input type="text" value={d.tags.join(', ')} onChange={(e) => updateDia(d.id, { tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} style={{ ...inputStyle, fontSize: 11 }} />
                                  </div>
                                  <input
                                    type="text"
                                    value={d.tipo}
                                    onChange={(e) => updateDia(d.id, { tipo: e.target.value })}
                                    style={inputStyle}
                                    placeholder="Tipo do treino"
                                  />
                                  <button type="button" onClick={() => removeDia(d.id)} disabled={protocolo.dias.length <= 1} style={{ ...btnDanger, ...btnSm, padding: '5px 8px', opacity: protocolo.dias.length <= 1 ? 0.4 : 1, visibility: hoveredDiaId === d.id || protocolo.dias.length <= 1 ? 'visible' : 'hidden', transition: 'opacity 0.15s, visibility 0.15s' }} title="Remover dia">
                                    🗑
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div style={{ ...card, marginBottom: 14 }}>
                              <Field label="Cárdio">
                                <textarea name="cardio" rows={3} defaultValue={protocolo.cardio} style={{ ...inputStyle, resize: 'vertical', minHeight: 75 }} />
                              </Field>
                            </div>

                            <button type="submit" disabled={isPending} style={btnP}>
                              {isPending ? 'Salvando...' : 'Salvar protocolo'}
                            </button>
                          </form>
                        )}

            {/* Modal: Mudar fase */}
            {showModalFase && (
              <MobileSheet
                isOpen={showModalFase}
                onClose={() => setShowModalFase(false)}
                title="🔄 Mudar de fase"
              >
                <form onSubmit={handleMudarFase} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <div style={{ borderLeft: '3px solid var(--accent)', padding: '9px 12px', background: 'var(--accent-glow-10)', borderRadius: '0 var(--radius) var(--radius) 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 4 }}>
                    A fase atual será arquivada no histórico. As regras da aba Regras trocam automaticamente.
                  </div>
                  <Field label="Nova fase">
                    <select name="fase" defaultValue={protocolo.fase} style={inputStyle}>
                      <option value="bulking">Bulking 📈</option>
                      <option value="cutting">Cutting 🔥</option>
                      <option value="manutencao">Manutenção ⚖️</option>
                    </select>
                  </Field>
                  <Field label="Nome do novo protocolo">
                    <input name="nome" type="text" placeholder="Ex: Cutting — Jul 2026" style={inputStyle} />
                  </Field>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                    <button type="button" onClick={() => setShowModalFase(false)} style={{ ...btnS, ...btnSm }}>Cancelar</button>
                    <button type="submit" disabled={isPending} style={{ ...btnP, ...btnSm }}>Confirmar</button>
                  </div>
                </form>
              </MobileSheet>
            )}
    </div>
  )
}