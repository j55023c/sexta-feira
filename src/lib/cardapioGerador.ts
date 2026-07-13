import type { Fase, MealKey, RefeicaoCustom } from '@/lib/types'
import { ALIMENTOS_POR_CATEGORIA, type Alimento, type Categoria } from '@/lib/foodDatabase'

// Papel genérico 'proteina' é resolvido pra um pool diferente por refeição
// (ver poolProteina) — em almoço/jantar só comida de verdade, sem shake.
type PapelCategoria = 'proteina' | 'carboidrato' | 'gordura' | 'fruta' | 'vegetal'
interface Papel { categoria: PapelCategoria; pct: number }
interface Arquetipo { papeis: Papel[] }

const ARQUETIPOS: Record<MealKey, Arquetipo> = {
  cafe:   { papeis: [{ categoria: 'proteina', pct: .35 }, { categoria: 'carboidrato', pct: .45 }, { categoria: 'fruta', pct: .15 }, { categoria: 'gordura', pct: .05 }] },
  almoco: { papeis: [{ categoria: 'proteina', pct: .40 }, { categoria: 'carboidrato', pct: .40 }, { categoria: 'vegetal', pct: .12 }, { categoria: 'gordura', pct: .08 }] },
  pre:    { papeis: [{ categoria: 'carboidrato', pct: .75 }, { categoria: 'fruta', pct: .25 }] },
  pos:    { papeis: [{ categoria: 'proteina', pct: .55 }, { categoria: 'carboidrato', pct: .45 }] },
  jantar: { papeis: [{ categoria: 'proteina', pct: .40 }, { categoria: 'carboidrato', pct: .35 }, { categoria: 'vegetal', pct: .17 }, { categoria: 'gordura', pct: .08 }] },
  lanche: { papeis: [{ categoria: 'proteina', pct: .30 }, { categoria: 'carboidrato', pct: .35 }, { categoria: 'fruta', pct: .35 }] },
}

const DISTRIBUICAO_DIARIA: Record<MealKey, number> = {
  cafe: .20, almoco: .30, pre: .12, pos: .15, jantar: .20, lanche: .03,
}

const MEAL_LABELS: Record<MealKey, string> = {
  cafe: 'Café da manhã', almoco: 'Almoço', pre: 'Pré-treino', pos: 'Pós-treino', jantar: 'Jantar', lanche: 'Lanche',
}

const LIMITES_GRAMAS: Record<Exclude<Categoria, 'outros'>, { min: number; max: number }> = {
  proteina_solida: { min: 60, max: 320 },
  proteina_suplemento: { min: 20, max: 45 }, // 1-2 scoops, nunca "300g de whey"
  carboidrato: { min: 30, max: 280 },
  gordura: { min: 5, max: 25 },
  fruta: { min: 50, max: 200 },
  vegetal: { min: 50, max: 150 },
}

function limitesParaAlimento(categoriaPapel: PapelCategoria, alimento: Alimento): { min: number; max: number } {
  if (categoriaPapel === 'proteina') {
    const ehSuplemento = ALIMENTOS_POR_CATEGORIA.proteina_suplemento.includes(alimento)
    return ehSuplemento ? LIMITES_GRAMAS.proteina_suplemento : LIMITES_GRAMAS.proteina_solida
  }
  return LIMITES_GRAMAS[categoriaPapel as Categoria]
}

// Tenta achar, dentro da categoria, um alimento cuja densidade calórica
// permita atingir o alvo da refeição numa gramagem realista. Sem isso, um
// item de baixa densidade (ex: tofu, 68kcal/100g) podia "precisar" de 600g
// pra bater a meta — o corte de segurança evitava a porção absurda, mas
// deixava a caloria do dia bem abaixo do alvo. Girar pra um alimento mais
// denso resolve os dois problemas ao mesmo tempo.
function escolherMelhorAlimento(lista: Alimento[], kcalAlvo: number, seed: number, categoriaPapel: PapelCategoria): Alimento | null {
  if (!lista.length) return null
  const n = lista.length
  for (let tentativa = 0; tentativa < n; tentativa++) {
    const idx = ((seed + tentativa) % n + n) % n
    const candidato = lista[idx]
    const { min, max } = limitesParaAlimento(categoriaPapel, candidato)
    const gramasNecessarias = (kcalAlvo / candidato.kcal) * 100
    if (gramasNecessarias >= min * 0.7 && gramasNecessarias <= max * 1.15) return candidato
  }
  return lista[((seed % n) + n) % n] // nada coube com folga — usa o original, o corte final ainda protege de absurdo
}

// Almoço e jantar: só comida de verdade. Café, pós-treino e lanche: comida
// ou suplemento, ambos são normais nesses horários.
function poolProteina(mealKey: MealKey): Alimento[] {
  const solida = ALIMENTOS_POR_CATEGORIA.proteina_solida
  const suplemento = ALIMENTOS_POR_CATEGORIA.proteina_suplemento
  if (mealKey === 'almoco' || mealKey === 'jantar') return solida
  return [...solida, ...suplemento]
}

function poolPara(categoria: PapelCategoria, mealKey: MealKey): Alimento[] {
  if (categoria === 'proteina') return poolProteina(mealKey)
  return ALIMENTOS_POR_CATEGORIA[categoria]
}

function arredondarGramas(g: number, alimento: Alimento): number {
  // Suplemento em pó tem limite próprio (nunca "300g de whey"), mesmo que
  // tenha entrado pela pool combinada de proteína.
  const ehSuplemento = ALIMENTOS_POR_CATEGORIA.proteina_suplemento.includes(alimento)
  const { min, max } = ehSuplemento ? LIMITES_GRAMAS.proteina_suplemento : LIMITES_GRAMAS.proteina_solida
  const arred = Math.round(g / 5) * 5
  return Math.min(max, Math.max(min, arred))
}

function arredondarGramasCategoria(g: number, categoria: Categoria): number {
  if (categoria === 'outros') return Math.round(g / 5) * 5
  const { min, max } = LIMITES_GRAMAS[categoria]
  const arred = Math.round(g / 5) * 5
  return Math.min(max, Math.max(min, arred))
}

function montarRefeicao(mealKey: MealKey, kcalAlvo: number, seed: number): RefeicaoCustom {
  const arquetipo = ARQUETIPOS[mealKey]
  const ingredientes: string[][] = []
  let kcal = 0, prot = 0, carbo = 0, gord = 0

  arquetipo.papeis.forEach((papel, i) => {
    const lista = poolPara(papel.categoria, mealKey)
    const kcalPapel = kcalAlvo * papel.pct
    const alimento = escolherMelhorAlimento(lista, kcalPapel, seed + i * 13, papel.categoria)
    if (!alimento) return
    const gramas = papel.categoria === 'proteina'
      ? arredondarGramas((kcalPapel / alimento.kcal) * 100, alimento)
      : arredondarGramasCategoria((kcalPapel / alimento.kcal) * 100, papel.categoria)
    const fator = gramas / 100
    kcal += alimento.kcal * fator
    prot += alimento.prot * fator
    carbo += alimento.carbo * fator
    gord += alimento.gord * fator
    ingredientes.push([alimento.nome, `${gramas}g`, `${gramas}g`])
  })

  return {
    nome: MEAL_LABELS[mealKey],
    kcal: Math.round(kcal), prot: Math.round(prot), carbo: Math.round(carbo), gord: Math.round(gord),
    timing: '', ingredientes,
  }
}

export function gerarCardapio(kcalMeta: number, seed = 0): Record<MealKey, RefeicaoCustom[]> {
  const resultado = {} as Record<MealKey, RefeicaoCustom[]>
  ;(Object.keys(DISTRIBUICAO_DIARIA) as MealKey[]).forEach((mealKey, i) => {
    const kcalAlvo = kcalMeta * DISTRIBUICAO_DIARIA[mealKey]
    resultado[mealKey] = [montarRefeicao(mealKey, kcalAlvo, seed + i * 31)]
  })
  return resultado
}

export function macrosTotais(refeicoes: Record<string, RefeicaoCustom[]>) {
  const todas = Object.values(refeicoes).flat()
  return {
    kcal: Math.round(todas.reduce((s, r) => s + r.kcal, 0)),
    prot: Math.round(todas.reduce((s, r) => s + r.prot, 0)),
    carbo: Math.round(todas.reduce((s, r) => s + r.carbo, 0)),
    gord: Math.round(todas.reduce((s, r) => s + r.gord, 0)),
  }
}

export function nomeSugerido(fase: Fase, kcalMeta: number): string {
  const FASE_LABEL: Record<Fase, string> = { cutting: 'Cutting', bulking: 'Bulking', manutencao: 'Manutenção' }
  return `${FASE_LABEL[fase]} — sugestão ${Math.round(kcalMeta)} kcal`
}
