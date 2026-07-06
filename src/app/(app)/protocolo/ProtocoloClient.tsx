'use client'

import { useState, useTransition } from 'react'
import type { Protocolo, Cardapio, Profile, HistoricoFase, Fase, DiaProtocolo } from '@/lib/types'
import { actionSaveProtocolo, actionMudarFase, actionSaveCardapio, actionDeleteCardapio } from './actions'

// ── Regras por fase (RASCUNHO — revisar antes de considerar definitivo) ──────
// O index.html original só tinha um conjunto (voltado a cutting). Bulking e
// manutenção abaixo são redação nova, no mesmo tom das originais.
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

const FASE_INFO: Record<Fase, { label: string; icon: string; tagBg: string; tagColor: string }> = {
  bulking:    { label: 'Bulking',     icon: '📈', tagBg: 'var(--blue-bg)',   tagColor: 'var(--blue)'  },
  cutting:    { label: 'Cutting',     icon: '🔥', tagBg: 'var(--amber-bg)', tagColor: 'var(--amber)' },
  manutencao: { label: 'Manutenção',  icon: '⚖️', tagBg: 'var(--green-bg)', tagColor: 'var(--green)' },
}

const TIPO_BAR: Record<string, string> = {
  up:   'linear-gradient(90deg,#1a4080,#2a6ab5)',
  lw:   'linear-gradient(90deg,#2a6030,#4a9e5a)',
  rest: 'linear-gradient(90deg,#888,#aaa)',
  free: 'linear-gradient(90deg,#e2ddd4,#ccc8bf)',
}

// ── Estilos utilitários ───────────────────────────────────────────────────────
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
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
}

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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(25,23,20,.55)', backdropFilter: 'blur(3px)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 460, maxWidth: '95vw', background: 'var(--surface)',
        border: '1px solid var(--border2)', borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 50px rgba(0,0,0,.18)', zIndex: 201,
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

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  protocolo: Protocolo | null
  cardapios: Cardapio[]
  profile: Profile | null
  historico: HistoricoFase[]
}

type Tab = 'semana' | 'cardio' | 'metas' | 'regras' | 'editar'

export default function ProtocoloClient({ protocolo: initialProtocolo, cardapios: initialCardapios, profile, historico }: Props) {
  const [protocolo, setProtocolo] = useState<Protocolo>(initialProtocolo ?? {
    nome: 'Meu protocolo', desc_texto: '', cardio: '', fase: 'cutting',
    data_inicio: new Date().toISOString().split('T')[0],
    cardapio_ativo_id: 'padrao', dias: [],
  })
  const [cardapios, setCardapios] = useState(initialCardapios)
  const [tab, setTab] = useState<Tab>('semana')
  const [showModalFase, setShowModalFase] = useState(false)
  const [showModalCardapio, setShowModalCardapio] = useState(false)
  const [isPending, startTransition] = useTransition()

  const fi = FASE_INFO[protocolo.fase]
  const cardapioAtivo = cardapios.find(c => c.id === protocolo.cardapio_ativo_id)
  const regrasAtivas = REGRAS_POR_FASE[protocolo.fase]

  // ── Salvar protocolo ────────────────────────────────────────────────────────
  function handleSaveProtocolo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const updated = {
      ...protocolo,
      nome: fd.get('nome') as string,
      desc_texto: fd.get('desc') as string,
      cardio: fd.get('cardio') as string,
    }
    setProtocolo(updated)
    startTransition(async () => { await actionSaveProtocolo(updated) })
  }

  // ── Mudar fase ──────────────────────────────────────────────────────────────
  function handleMudarFase(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const novaFase = fd.get('fase') as Fase
    const novoNome = fd.get('nome') as string
    const novoCardapio = fd.get('cardapio') as string
    const today = new Date().toISOString().split('T')[0]

    setProtocolo(prev => ({ ...prev, fase: novaFase, nome: novoNome || prev.nome, cardapio_ativo_id: novoCardapio, data_inicio: today }))
    setShowModalFase(false)

    startTransition(async () => {
      await actionMudarFase(novaFase, novoNome, novoCardapio, {
        fase: protocolo.fase, nome: protocolo.nome, dataInicio: protocolo.data_inicio,
        kcalMeta: profile?.kcal_meta ?? 2000, protMeta: profile?.prot_meta ?? 160,
      })
    })
  }

  // ── Criar cardápio ──────────────────────────────────────────────────────────
  function handleCriarCardapio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const novo: Cardapio = {
      id: 'c' + Date.now(),
      nome: fd.get('nome') as string,
      objetivo: fd.get('objetivo') as Fase,
      built_in: false,
      refeicoes: { cafe: [], almoco: [], pre: [], pos: [], jantar: [] },
    }
    setCardapios(prev => [...prev, novo])
    setShowModalCardapio(false)
    startTransition(async () => { await actionSaveCardapio(novo) })
  }

  // ── Apagar cardápio ─────────────────────────────────────────────────────────
  function handleDeleteCardapio(id: string) {
    if (cardapios.length <= 1) return
    const novoAtivo = cardapios.find(c => c.id !== id)
    setCardapios(prev => prev.filter(c => c.id !== id))
    if (protocolo.cardapio_ativo_id === id && novoAtivo) {
      setProtocolo(prev => ({ ...prev, cardapio_ativo_id: novoAtivo.id }))
    }
    startTransition(async () => { await actionDeleteCardapio(id) })
  }

  // ── Update dias inline ──────────────────────────────────────────────────────
  function updateDia(i: number, fields: Partial<DiaProtocolo>) {
    setProtocolo(prev => {
      const dias = prev.dias.map((d, idx) => idx === i ? { ...d, ...fields } : d)
      return { ...prev, dias }
    })
  }

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string }[] = [
    { key: 'semana', label: '📅 Semana tipo' },
    { key: 'cardio', label: '🏃 Cárdio' },
    { key: 'metas', label: '🎯 Metas' },
    { key: 'regras', label: '⚡ Regras' },
    { key: 'editar', label: '✏️ Editar' },
  ]

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

      {/* Cardápio ativo */}
      <div style={{ ...card, marginBottom: 16 }}>
        <Divider label="Cardápio ativo" />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={protocolo.cardapio_ativo_id}
            onChange={e => {
              const id = e.target.value
              setProtocolo(prev => ({ ...prev, cardapio_ativo_id: id }))
              startTransition(async () => { await actionSaveProtocolo({ ...protocolo, cardapio_ativo_id: id }) })
            }}
            style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          >
            {cardapios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <button onClick={() => setShowModalCardapio(true)} style={{ ...btnS, ...btnSm }}>+ Novo</button>
          <button
            onClick={() => { if (cardapioAtivo) handleDeleteCardapio(cardapioAtivo.id) }}
            disabled={cardapios.length <= 1}
            style={{ ...btnSm, border: 'none', borderRadius: 'var(--radius)', fontFamily: 'var(--font-syne)', fontWeight: 700, cursor: 'pointer', background: 'var(--red-bg)', color: 'var(--red)', fontSize: 11, opacity: cardapios.length <= 1 ? .4 : 1 }}
          >🗑 Apagar</button>
        </div>
      </div>

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

      {/* Tab: Semana tipo */}
      {tab === 'semana' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 18 }}>
            {protocolo.dias.map((d, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '10px 10px 12px' }}>
                <div style={{ height: 3, borderRadius: 2, marginBottom: 8, background: TIPO_BAR[d.tipo] ?? TIPO_BAR.free }} />
                <div style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, color: 'var(--hint)', marginBottom: 3 }}>{d.dia}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{d.nome}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {d.tags.map(t => (
                    <span key={t} style={{
                      fontSize: 9.5, fontWeight: 600, padding: '2px 6px', borderRadius: 999, display: 'inline-block', width: 'fit-content',
                      background: d.tipo === 'up' ? 'var(--blue-bg)' : d.tipo === 'lw' ? 'var(--green-bg)' : 'var(--surface2)',
                      color: d.tipo === 'up' ? 'var(--blue)' : d.tipo === 'lw' ? 'var(--green)' : 'var(--muted)',
                    }}>{t}</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              {[
                { label: 'Kcal/dia', val: profile?.kcal_meta ?? 2000 },
                { label: 'Proteína', val: `${profile?.prot_meta ?? 160}g` },
                { label: 'Carbo', val: `${profile?.carbo_meta ?? 220}g` },
              ].map(m => (
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

      {/* Tab: Regras — agora específicas por fase */}
      {tab === 'regras' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: fi.tagBg, color: fi.tagColor, textTransform: 'uppercase', letterSpacing: .8 }}>
              {fi.icon} Regras de {fi.label}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 10, marginBottom: 14 }}>
            {regrasAtivas.map(r => (
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

      {/* Tab: Editar */}
      {tab === 'editar' && (
        <form onSubmit={handleSaveProtocolo}>
          <div style={{ ...card, marginBottom: 14 }}>
            <Field label="Nome do protocolo">
              <input name="nome" type="text" defaultValue={protocolo.nome} placeholder="Ex: Upper/Lower 4×/semana" style={inputStyle} />
            </Field>
            <Field label="Descrição curta">
              <textarea name="desc" rows={2} defaultValue={protocolo.desc_texto} style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} />
            </Field>
          </div>

          <div style={{ ...card, marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>Dias da semana</div>
            {protocolo.dias.map((d, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 120px', gap: 10, alignItems: 'start', marginBottom: 10, paddingBottom: 10, borderBottom: i < protocolo.dias.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }}>{d.dia}</div>
                <div>
                  <input type="text" value={d.nome} onChange={e => updateDia(i, { nome: e.target.value })} style={{ ...inputStyle, marginBottom: 5 }} />
                  <input type="text" value={d.tags.join(', ')} onChange={e => updateDia(i, { tags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} style={{ ...inputStyle, fontSize: 11 }} />
                </div>
                <select value={d.tipo} onChange={e => updateDia(i, { tipo: e.target.value as DiaProtocolo['tipo'] })} style={inputStyle}>
                  <option value="up">Upper</option>
                  <option value="lw">Lower</option>
                  <option value="rest">Descanso</option>
                  <option value="free">Livre</option>
                </select>
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
        <Modal title="🔄 Mudar de fase" onClose={() => setShowModalFase(false)}>
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
            <Field label="Cardápio sugerido">
              <select name="cardapio" defaultValue={protocolo.cardapio_ativo_id} style={inputStyle}>
                {cardapios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
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
        </Modal>
      )}

      {/* Modal: Novo cardápio */}
      {showModalCardapio && (
        <Modal title="🍽 Novo cardápio" onClose={() => setShowModalCardapio(false)}>
          <form onSubmit={handleCriarCardapio} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Field label="Nome do cardápio">
              <input name="nome" type="text" placeholder="Ex: Cardápio do Bulking" required style={inputStyle} />
            </Field>
            <Field label="Objetivo">
              <select name="objetivo" style={inputStyle}>
                <option value="bulking">Bulking 📈</option>
                <option value="cutting">Cutting 🔥</option>
                <option value="manutencao">Manutenção ⚖️</option>
              </select>
            </Field>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
              <button type="button" onClick={() => setShowModalCardapio(false)} style={{ ...btnS, ...btnSm }}>Cancelar</button>
              <button type="submit" disabled={isPending} style={{ ...btnP, ...btnSm }}>Criar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
