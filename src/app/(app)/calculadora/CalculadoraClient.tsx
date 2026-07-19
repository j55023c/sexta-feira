'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Profile, FisicoLog, Fase } from '@/lib/types'
import { actionAplicarMetas, actionSalvarMetasManuais } from './actions'
import SugestaoCardapioModal from './SugestaoCardapioModal'

interface ResultadoCalc {
  titulo: string
  kcal: number
  prot: number
  carb: number
  fat: number
  ritmo: string
  guia: { icon: string; txt: string }[]
  fase: Fase
  peso: number
  metaPeso: number | null
}

const card: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)', padding: 18, marginBottom: 16,
}
const btnP: React.CSSProperties = {
  border: 'none', borderRadius: 'var(--radius)', padding: '9px 16px',
  fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 700,
  cursor: 'pointer', background: 'var(--accent)', color: 'white',
}
const btnS: React.CSSProperties = {
  ...btnP, background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border2)',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', border: '1px solid var(--border2)',
  borderRadius: 'var(--radius)', background: 'var(--surface2)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 13, outline: 'none',
}
const grid3: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }
const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }

function SectionLabel({ label }: { label: string }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>{label}</div>
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}
function StatBox({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, fontFamily: mono ? 'var(--font-dm-mono)' : 'var(--font-syne)', color: 'var(--text)' }}>{value}</div>
    </div>
  )
}

interface Props {
  profile: Profile | null
  fisicoLog: Record<string, FisicoLog>
}

export default function CalculadoraClient({ profile, fisicoLog }: Props) {
  const router = useRouter()

  const [peso, setPeso] = useState(profile?.peso?.toString() ?? '')
  const [alt, setAlt] = useState('')
  const [idade, setIdade] = useState('')
  const [sexo, setSexo] = useState<'M' | 'F'>('M')
  const [ativ, setAtiv] = useState('1.55')
  const [fase, setFase] = useState<Fase>('bulking')
  const [meta, setMeta] = useState(profile?.meta_peso?.toString() ?? '')

  const [resultado, setResultado] = useState<ResultadoCalc | null>(null)
  const [showSugestao, setShowSugestao] = useState(false)

  const [mKcal, setMKcal] = useState(profile?.kcal_meta?.toString() ?? '')
  const [mProt, setMProt] = useState(profile?.prot_meta?.toString() ?? '')
  const [mCarbo, setMCarbo] = useState(profile?.carbo_meta?.toString() ?? '')
  const [mGord, setMGord] = useState(profile?.gord_meta?.toString() ?? '')

  const [pai, setPai] = useState('')
  const [mae, setMae] = useState('')
  const [alvoGenetico, setAlvoGenetico] = useState<{ val: number; range: string } | null>(null)

  const [savedManuais, setSavedManuais] = useState(false)
  const [isPending, startTransition] = useTransition()

  function calcFase() {
    const p = parseFloat(peso), a = parseFloat(alt), id = parseInt(idade), m = parseFloat(meta)
    if (!p || !a || !id) return

    const bmr = sexo === 'M' ? (10 * p) + (6.25 * a) - (5 * id) + 5 : (10 * p) + (6.25 * a) - (5 * id) - 161
    const tdee = Math.round(bmr * parseFloat(ativ))

    let kcal: number, protMult: number, ritmo: string, titulo: string
    let guia: { icon: string; txt: string }[]

    if (fase === 'bulking') {
      kcal = tdee + 350; protMult = 2.0; ritmo = '+0.3kg/semana'; titulo = 'Bulking 📈'
      guia = [
        { icon: '🍗', txt: `Proteína mínima de ${Math.round(p * protMult)}g/dia.` },
        { icon: '🍚', txt: 'Carboidrato é o combustível — não corte. Priorize pré e pós-treino.' },
        { icon: '⚖️', txt: 'Ganho ideal: 0.3kg/semana. Mais que isso é gordura, não músculo.' },
        { icon: '💪', txt: 'Treino: sobrecarga progressiva toda sessão.' },
        { icon: '😴', txt: 'Sono de 8-10h é onde o músculo é construído.' },
      ]
    } else if (fase === 'cutting') {
      kcal = tdee - 375; protMult = 2.3; ritmo = '-0.5kg/semana'; titulo = 'Cutting 🔥'
      guia = [
        { icon: '🍗', txt: `Proteína AUMENTA no cutting: ${Math.round(p * protMult)}g/dia.` },
        { icon: '🍚', txt: 'Carbo cai mas não zere. Mantenha ao redor do treino.' },
        { icon: '⚖️', txt: 'Déficit de ~375 kcal/dia. Mais de 500 come músculo.' },
        { icon: '💪', txt: 'Treino: MESMA intensidade. Não reduza no cutting.' },
        { icon: '📉', txt: 'Ritmo: 0.5kg/semana. Se cair mais rápido, suba levemente as calorias.' },
      ]
    } else {
      kcal = tdee; protMult = 2.0; ritmo = '±0kg/semana'; titulo = 'Manutenção ⚖️'
      guia = [
        { icon: '⚖️', txt: 'Período de consolidar ganhos e recuperar.' },
        { icon: '🍗', txt: `Proteína: ${Math.round(p * protMult)}g/dia.` },
        { icon: '💪', txt: 'Continue treinando com intensidade e sobrecarga.' },
      ]
    }

    const prot = Math.round(p * protMult)
    const fat = Math.round(kcal * 0.25 / 9)
    const carb = Math.max(0, Math.round((kcal - (prot * 4) - (fat * 9)) / 4))

    setResultado({ titulo, kcal, prot, carb, fat, ritmo, guia, fase, peso: p, metaPeso: !isNaN(m) ? m : null })
  }

  function calcProgressoPeso(r: ResultadoCalc) {
    if (!r.metaPeso) return null
    const entries = Object.entries(fisicoLog).filter(([, v]) => v?.peso).sort((a, b) => a[0].localeCompare(b[0]))
    const startPeso = entries.length ? entries[0][1].peso! : r.peso
    const totalDist = Math.abs(r.metaPeso - startPeso)
    const feito = Math.abs(r.peso - startPeso)
    const pct = totalDist > 0 ? Math.min((feito / totalDist) * 100, 100) : 0
    const diff = Math.abs(r.metaPeso - r.peso)
    const rate = r.fase === 'bulking' ? 0.3 : r.fase === 'cutting' ? 0.5 : 0
    const semanas = rate > 0 ? Math.ceil(diff / rate) : 0
    return { startPeso, pct, diff, semanas }
  }

  // Ao aplicar as metas, o fluxo muda: em vez de já sair direto pra Nutrição,
  // abrimos o "menuzinho" de sugestão de cardápio — o usuário decide lá se
  // aceita, ajusta ou prefere montar o próprio, e só então navega.
  function handleAplicarMetas() {
    if (!resultado) return
    setMKcal(resultado.kcal.toString())
    setMProt(resultado.prot.toString())
    setMCarbo(resultado.carb.toString())
    setMGord(resultado.fat.toString())

    startTransition(async () => {
      const result = await actionAplicarMetas({
        kcal_meta: resultado.kcal, prot_meta: resultado.prot,
        carbo_meta: resultado.carb, gord_meta: resultado.fat,
        ...(resultado.metaPeso ? { meta_peso: resultado.metaPeso } : {}),
      })
      if (!result?.error) setShowSugestao(true)
    })
  }

  function handleSalvarManuais() {
    const kcal = parseInt(mKcal), prot = parseInt(mProt), carbo = parseInt(mCarbo), gord = parseInt(mGord)
    if (!kcal || !prot || !carbo || !gord) return
    setSavedManuais(false)
    startTransition(async () => {
      const result = await actionSalvarMetasManuais({ kcal_meta: kcal, prot_meta: prot, carbo_meta: carbo, gord_meta: gord })
      if (!result?.error) setSavedManuais(true)
    })
  }

  function calcAlvoGenetico() {
    const p = parseFloat(pai), m = parseFloat(mae)
    if (!p || !m) return
    const alvo = sexo === 'M' ? (p + m + 13) / 2 : (p + m - 13) / 2
    setAlvoGenetico({ val: alvo, range: `Intervalo esperado: ${(alvo - 10).toFixed(0)}–${(alvo + 10).toFixed(0)} cm` })
  }

  const progresso = resultado ? calcProgressoPeso(resultado) : null

  return (
    <div>
      <h1 style={{ fontSize: 21, fontWeight: 800, marginBottom: 3, color: 'var(--text)' }}>Calculadora</h1>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20 }}>Calcule suas necessidades calóricas e defina suas metas.</p>

      <div style={card}>
        <SectionLabel label="Seus dados" />
        <div style={grid3}>
          <Field label="Peso (kg)"><input type="number" step={0.1} placeholder="Ex: 70" value={peso} onChange={e => setPeso(e.target.value)} style={inputStyle} /></Field>
          <Field label="Altura (cm)"><input type="number" step={0.1} placeholder="Ex: 170" value={alt} onChange={e => setAlt(e.target.value)} style={inputStyle} /></Field>
          <Field label="Idade"><input type="number" placeholder="Ex: 25" value={idade} onChange={e => setIdade(e.target.value)} style={inputStyle} /></Field>
        </div>
        <div style={grid3}>
          <Field label="Sexo">
            <select value={sexo} onChange={e => setSexo(e.target.value as 'M' | 'F')} style={inputStyle}>
              <option value="M">Masculino</option><option value="F">Feminino</option>
            </select>
          </Field>
          <Field label="Nível de atividade">
            <select value={ativ} onChange={e => setAtiv(e.target.value)} style={inputStyle}>
              <option value="1.2">Sedentário</option><option value="1.375">Leve (1-3x/sem)</option>
              <option value="1.55">Moderado (3-5x/sem)</option><option value="1.725">Intenso (6-7x/sem)</option>
              <option value="1.9">Muito intenso (2x/dia)</option>
            </select>
          </Field>
          <Field label="Fase desejada">
            <select value={fase} onChange={e => setFase(e.target.value as Fase)} style={inputStyle}>
              <option value="bulking">Bulking 📈</option><option value="cutting">Cutting 🔥</option>
              <option value="manutencao">Manutenção ⚖️</option>
            </select>
          </Field>
        </div>
        <div style={{ marginBottom: 14 }}>
          <Field label="Meta de peso (kg, opcional)">
            <input type="number" step={0.1} placeholder="Ex: 75" value={meta} onChange={e => setMeta(e.target.value)} style={{ ...inputStyle, maxWidth: 200 }} />
          </Field>
        </div>
        <button onClick={calcFase} disabled={!peso || !alt || !idade} style={{ ...btnP, opacity: (!peso || !alt || !idade) ? .5 : 1 }}>Calcular metas</button>
      </div>

      {resultado && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            <span style={{ fontSize: 13, fontWeight: 800 }}>{resultado.titulo}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          </div>
          <div style={{ ...grid3, marginBottom: 14 }}>
            <StatBox label="Kcal/dia" value={resultado.kcal.toString()} />
            <StatBox label="Proteína" value={`${resultado.prot}g`} />
            <StatBox label="Ritmo" value={resultado.ritmo} mono={false} />
          </div>
          <div style={{ ...grid2, marginBottom: 14 }}>
            <StatBox label="Carboidrato" value={`${resultado.carb}g`} />
            <StatBox label="Gordura" value={`${resultado.fat}g`} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {resultado.guia.map((g, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 12.5 }}>
                <span style={{ flexShrink: 0 }}>{g.icon}</span>
                <span style={{ color: 'var(--text)', lineHeight: 1.5 }}>{g.txt}</span>
              </div>
            ))}
          </div>
          {progresso && resultado.metaPeso && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>
                <span>{progresso.startPeso}kg</span><span>{resultado.peso}kg (atual)</span><span>{resultado.metaPeso}kg</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--border2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${progresso.pct.toFixed(1)}%`, background: 'var(--accent)', transition: 'width .4s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 5, textAlign: 'center' }}>
                {progresso.diff.toFixed(1)}kg restantes{progresso.semanas > 0 ? ` · ~${progresso.semanas} semanas` : ''}
              </div>
            </div>
          )}
          <button onClick={handleAplicarMetas} disabled={isPending} style={{ ...btnP, width: '100%' }}>
            {isPending ? 'Aplicando...' : 'Aplicar metas e ver sugestão de cardápio'}
          </button>
        </div>
      )}

      <div style={card}>
        <SectionLabel label="Metas manuais" />
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.5 }}>
          Use a calculadora acima para gerar metas automáticas, ou ajuste manualmente aqui e clique em Salvar.
        </div>
        <div style={grid2}>
          <Field label="Kcal meta/dia"><input type="number" placeholder="Ex: 2000" value={mKcal} onChange={e => { setMKcal(e.target.value); setSavedManuais(false) }} style={inputStyle} /></Field>
          <Field label="Proteína meta (g)"><input type="number" placeholder="Ex: 160" value={mProt} onChange={e => { setMProt(e.target.value); setSavedManuais(false) }} style={inputStyle} /></Field>
        </div>
        <div style={{ ...grid2, marginBottom: 14 }}>
          <Field label="Carboidrato meta (g)"><input type="number" placeholder="Ex: 220" value={mCarbo} onChange={e => { setMCarbo(e.target.value); setSavedManuais(false) }} style={inputStyle} /></Field>
          <Field label="Gordura meta (g)"><input type="number" placeholder="Ex: 55" value={mGord} onChange={e => { setMGord(e.target.value); setSavedManuais(false) }} style={inputStyle} /></Field>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleSalvarManuais} disabled={isPending} style={btnP}>Salvar metas</button>
          {savedManuais && <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-dm-mono)' }}>✓ Salvo</span>}
        </div>
      </div>

      <div style={card}>
        <SectionLabel label="Perfil e altura-alvo genética" />
        <div style={grid3}>
          <Field label="Altura do pai (cm)"><input type="number" step={0.1} placeholder="Ex: 175" value={pai} onChange={e => setPai(e.target.value)} style={inputStyle} /></Field>
          <Field label="Altura da mãe (cm)"><input type="number" step={0.1} placeholder="Ex: 162" value={mae} onChange={e => setMae(e.target.value)} style={inputStyle} /></Field>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={calcAlvoGenetico} disabled={!pai || !mae} style={{ ...btnS, width: '100%', opacity: (!pai || !mae) ? .5 : 1 }}>Calcular</button>
          </div>
        </div>
        {alvoGenetico && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--muted)', marginBottom: 4 }}>Altura-alvo genética (fórmula de Tanner)</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-dm-mono)', color: 'var(--accent)' }}>{alvoGenetico.val.toFixed(1)} cm</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{alvoGenetico.range}</div>
          </div>
        )}
      </div>

      {showSugestao && resultado && (
        <SugestaoCardapioModal
          kcalMeta={resultado.kcal}
          protMeta={resultado.prot}
          fase={resultado.fase}
          onClose={() => setShowSugestao(false)}
        />
      )}
    </div>
  )
}
