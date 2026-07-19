'use client'

import type { MealKey } from '@/lib/types'
import { opcoesParaCategoria, macrosDeIngredientes, type RefeicaoGerada } from '@/lib/cardapioGerador'

const inputStyle: React.CSSProperties = {
  width: 64, padding: '5px 7px', border: '1px solid var(--border2)',
  borderRadius: 6, background: 'var(--surface2)', color: 'var(--text)',
  fontFamily: 'var(--font-dm-mono)', fontSize: 12, outline: 'none', textAlign: 'right',
}

const selectStyle: React.CSSProperties = {
  flex: 1, padding: '5px 7px', border: '1px solid var(--border2)',
  borderRadius: 6, background: 'var(--surface2)', color: 'var(--text)',
  fontFamily: 'var(--font-syne)', fontSize: 12.5, outline: 'none', minWidth: 0,
}

const mealIcons: Record<MealKey, string> = {
  cafe: '☀️', almoco: '🍽', pre: '⚡', pos: '💪', jantar: '🌙', lanche: '🍎',
}

interface Props {
  refeicao: RefeicaoGerada
  onTrocarAlimento: (idxIngrediente: number, alimentoId: string) => void
  onAjustarGramas: (idxIngrediente: number, novasGramas: number) => void
}

export default function RefeicaoEditorCard({ refeicao, onTrocarAlimento, onAjustarGramas }: Props) {
  const macros = macrosDeIngredientes(refeicao.ingredientes)

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 14, marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 15 }}>{mealIcons[refeicao.mealKey]}</span>
        <span style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>{refeicao.nome}</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-dm-mono)', color: 'var(--accent)' }}>
          {Math.round(macros.kcal)} kcal
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {refeicao.ingredientes.map((ing, idx) => {
          const opcoes = ing.categoria ? opcoesParaCategoria(ing.categoria, refeicao.mealKey) : []
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {ing.categoria ? (
                <select
                  value={ing.alimento.id}
                  onChange={e => onTrocarAlimento(idx, e.target.value)}
                  style={selectStyle}
                >
                  {!opcoes.find(o => o.id === ing.alimento.id) && (
                    <option value={ing.alimento.id}>{ing.alimento.nome}</option>
                  )}
                  {opcoes.map(o => (
                    <option key={o.id} value={o.id}>{o.nome}</option>
                  ))}
                </select>
              ) : (
                <span style={{ flex: 1, fontSize: 12.5, color: 'var(--muted)' }}>{ing.alimento.nome}</span>
              )}
              <input
                type="number"
                min={1}
                max={1000}
                value={ing.gramas}
                onChange={e => onAjustarGramas(idx, Math.max(1, Math.min(1000, parseInt(e.target.value, 10) || 1)))}
                style={inputStyle}
              />
              <span style={{ fontSize: 11, color: 'var(--muted)', width: 12 }}>g</span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 9, paddingTop: 9, borderTop: '1px solid var(--border)', fontSize: 10.5, color: 'var(--muted)', fontFamily: 'var(--font-dm-mono)' }}>
        <span>P {Math.round(macros.prot)}g</span>
        <span>C {Math.round(macros.carbo)}g</span>
        <span>G {Math.round(macros.gord)}g</span>
      </div>
    </div>
  )
}
