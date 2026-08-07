import type { Fase, MealKey, RefeicaoCustom } from './types'
import { ALIMENTOS_POR_CATEGORIA, BANCO_DE_ALIMENTOS, classificar, type Alimento, type Categoria } from './foodDatabase'

function classificarPorNome(nome: string): Alimento | null {
  return BANCO_DE_ALIMENTOS.find(a => a.nome === nome) ?? null
}

export type PapelCategoria = 'proteina' | 'carboidrato' | 'gordura' | 'fruta' | 'vegetal'
interface Papel { categoria: PapelCategoria; pct: number }
interface Arquetipo { papeis: Papel[] }

// ─── PREDEFINIÇÕES POR FASE ──────────────────────────────────────────────────
// Baseado em guidelines nutricionais consagrados (ISSN, ACSM, JISSN position stands)
//
// BULKING: superávit calórico controlado, carbo alto peri-treino, proteína alta
// CUTTING: déficit, proteína MUITO alta (preservação), carbo peri-treino, volume vegetal
// MANUTENÇÃO: equilíbrio, distribuição clássica, flexibilidade

interface FaseConfig {
  arquetipos: Record<MealKey, Arquetipo>
  distribuicao: Record<MealKey, number>
  limites: Record<Exclude<Categoria, 'outros'>, { min: number; max: number }>
  // Macros-alvo por kg peso corporal (para validação futura)
  macroPorKg: { prot: number; carbo: number; gord: number }
}

const FASE_CONFIGS: Record<Fase, FaseConfig> = {
  bulking: {
    arquetipos: {
      cafe:   { papeis: [{ categoria: 'proteina', pct: .30 }, { categoria: 'carboidrato', pct: .50 }, { categoria: 'fruta', pct: .15 }, { categoria: 'gordura', pct: .05 }] },
      almoco: { papeis: [{ categoria: 'proteina', pct: .35 }, { categoria: 'carboidrato', pct: .45 }, { categoria: 'vegetal', pct: .10 }, { categoria: 'gordura', pct: .10 }] },
      pre:    { papeis: [{ categoria: 'carboidrato', pct: .70 }, { categoria: 'fruta', pct: .30 }] },
      pos:    { papeis: [{ categoria: 'proteina', pct: .40 }, { categoria: 'carboidrato', pct: .60 }] },
      jantar: { papeis: [{ categoria: 'proteina', pct: .35 }, { categoria: 'carboidrato', pct: .40 }, { categoria: 'vegetal', pct: .15 }, { categoria: 'gordura', pct: .10 }] },
      lanche: { papeis: [{ categoria: 'proteina', pct: .25 }, { categoria: 'carboidrato', pct: .40 }, { categoria: 'fruta', pct: .35 }] },
    },
    distribuicao: { cafe: .22, almoco: .30, pre: .10, pos: .18, jantar: .17, lanche: .03 },
    limites: {
      proteina_solida: { min: 80, max: 400 },
      proteina_suplemento: { min: 25, max: 50 },
      carboidrato: { min: 40, max: 350 },
      gordura: { min: 8, max: 35 },
      fruta: { min: 80, max: 250 },
      vegetal: { min: 50, max: 200 },
    },
    macroPorKg: { prot: 2.0, carbo: 4.5, gord: 0.9 },
  },

  cutting: {
    arquetipos: {
      cafe:   { papeis: [{ categoria: 'proteina', pct: .40 }, { categoria: 'carboidrato', pct: .35 }, { categoria: 'fruta', pct: .15 }, { categoria: 'gordura', pct: .10 }] },
      almoco: { papeis: [{ categoria: 'proteina', pct: .45 }, { categoria: 'carboidrato', pct: .30 }, { categoria: 'vegetal', pct: .18 }, { categoria: 'gordura', pct: .07 }] },
      pre:    { papeis: [{ categoria: 'carboidrato', pct: .80 }, { categoria: 'fruta', pct: .20 }] },
      pos:    { papeis: [{ categoria: 'proteina', pct: .65 }, { categoria: 'carboidrato', pct: .35 }] },
      jantar: { papeis: [{ categoria: 'proteina', pct: .50 }, { categoria: 'carboidrato', pct: .20 }, { categoria: 'vegetal', pct: .25 }, { categoria: 'gordura', pct: .05 }] },
      lanche: { papeis: [{ categoria: 'proteina', pct: .50 }, { categoria: 'carboidrato', pct: .15 }, { categoria: 'fruta', pct: .35 }] },
    },
    distribuicao: { cafe: .25, almoco: .30, pre: .08, pos: .17, jantar: .17, lanche: .03 },
    limites: {
      proteina_solida: { min: 100, max: 350 },
      proteina_suplemento: { min: 25, max: 45 },
      carboidrato: { min: 20, max: 200 },
      gordura: { min: 5, max: 20 },
      fruta: { min: 60, max: 180 },
      vegetal: { min: 80, max: 250 }, // volume ↑ pra saciedade
    },
    macroPorKg: { prot: 2.5, carbo: 2.5, gord: 0.7 },
  },

  manutencao: {
    arquetipos: {
      cafe:   { papeis: [{ categoria: 'proteina', pct: .35 }, { categoria: 'carboidrato', pct: .45 }, { categoria: 'fruta', pct: .15 }, { categoria: 'gordura', pct: .05 }] },
      almoco: { papeis: [{ categoria: 'proteina', pct: .40 }, { categoria: 'carboidrato', pct: .40 }, { categoria: 'vegetal', pct: .12 }, { categoria: 'gordura', pct: .08 }] },
      pre:    { papeis: [{ categoria: 'carboidrato', pct: .75 }, { categoria: 'fruta', pct: .25 }] },
      pos:    { papeis: [{ categoria: 'proteina', pct: .55 }, { categoria: 'carboidrato', pct: .45 }] },
      jantar: { papeis: [{ categoria: 'proteina', pct: .40 }, { categoria: 'carboidrato', pct: .35 }, { categoria: 'vegetal', pct: .17 }, { categoria: 'gordura', pct: .08 }] },
      lanche: { papeis: [{ categoria: 'proteina', pct: .30 }, { categoria: 'carboidrato', pct: .35 }, { categoria: 'fruta', pct: .35 }] },
    },
    distribuicao: { cafe: .20, almoco: .30, pre: .12, pos: .15, jantar: .20, lanche: .03 },
    limites: {
      proteina_solida: { min: 70, max: 320 },
      proteina_suplemento: { min: 20, max: 45 },
      carboidrato: { min: 30, max: 280 },
      gordura: { min: 5, max: 25 },
      fruta: { min: 50, max: 200 },
      vegetal: { min: 50, max: 150 },
    },
    macroPorKg: { prot: 1.8, carbo: 3.5, gord: 0.9 },
  },
}

export function getFaseConfig(fase: Fase): FaseConfig {
  return FASE_CONFIGS[fase]
}

export const MEAL_LABELS: Record<MealKey, string> = {
  cafe: 'Café da manhã', almoco: 'Almoço', pre: 'Pré-treino', pos: 'Pós-treino', jantar: 'Jantar', lanche: 'Lanche',
}

// Almoço e jantar: só comida de verdade. Café, pós-treino e lanche: comida
// ou suplemento, ambos são normais nesses horários.
function poolProteina(mealKey: MealKey): Alimento[] {
  const solida = ALIMENTOS_POR_CATEGORIA.proteina_solida
  const suplemento = ALIMENTOS_POR_CATEGORIA.proteina_suplemento
  if (mealKey === 'almoco' || mealKey === 'jantar') return solida
  return [...solida, ...suplemento]
}

/** Pool de alimentos disponível pra um papel, numa refeição — usado tanto na
 * geração automática quanto pra oferecer opções de troca na tela. */
export function opcoesParaCategoria(categoria: PapelCategoria, mealKey: MealKey): Alimento[] {
  if (categoria === 'proteina') return poolProteina(mealKey)
  return ALIMENTOS_POR_CATEGORIA[categoria]
}

function limitesParaAlimento(categoriaPapel: PapelCategoria, alimento: Alimento, fase: Fase): { min: number; max: number } {
  const config = getFaseConfig(fase)
  const limites = config.limites
  if (categoriaPapel === 'proteina') {
    const ehSuplemento = ALIMENTOS_POR_CATEGORIA.proteina_suplemento.includes(alimento)
    return ehSuplemento ? limites.proteina_suplemento : limites.proteina_solida
  }
  // Depois do early return acima, o TypeScript já estreita categoriaPapel pra
  // 'carboidrato' | 'gordura' | 'fruta' | 'vegetal' sozinho — nada de cast
  // manual pra Categoria (isso reintroduzia 'outros' como chave válida e
  // quebrava o type-check do next build).
  return limites[categoriaPapel]
}

function escolherMelhorAlimento(lista: Alimento[], kcalAlvo: number, seed: number, categoriaPapel: PapelCategoria, fase: Fase): Alimento | null {
  if (!lista.length) return null
  const n = lista.length
  for (let tentativa = 0; tentativa < n; tentativa++) {
    const idx = ((seed + tentativa) % n + n) % n
    const candidato = lista[idx]
    const { min, max } = limitesParaAlimento(categoriaPapel, candidato, fase)
    const gramasNecessarias = (kcalAlvo / candidato.kcal) * 100
    if (gramasNecessarias >= min * 0.7 && gramasNecessarias <= max * 1.15) return candidato
  }
  return lista[((seed % n) + n) % n]
}

function arredondarGramas(g: number, categoriaPapel: PapelCategoria, alimento: Alimento, fase: Fase): number {
  const { min, max } = limitesParaAlimento(categoriaPapel, alimento, fase)
  const arred = Math.round(g / 5) * 5
  return Math.min(max, Math.max(min, arred))
}

// ─── ESTRUTURA "DETALHADA" (editável na tela) ───────────────────────────────
// Guarda o Alimento original de cada ingrediente (não só o texto formatado),
// pra permitir recalcular macros ao vivo quando o usuário ajusta gramas ou
// troca o alimento na tela de sugestão.

export interface IngredienteGerado {
  alimento: Alimento
  gramas: number
  categoria: PapelCategoria | null // null = item legado/custom sem categoria reconhecida — editável, mas sem opção de troca
}

export interface RefeicaoGerada {
  mealKey: MealKey
  nome: string
  ingredientes: IngredienteGerado[]
}

function montarRefeicao(mealKey: MealKey, kcalAlvo: number, seed: number, fase: Fase): RefeicaoGerada {
  const config = getFaseConfig(fase)
  const arquetipo = config.arquetipos[mealKey]
  const ingredientes: IngredienteGerado[] = []

  arquetipo.papeis.forEach((papel, i) => {
    const lista = opcoesParaCategoria(papel.categoria, mealKey)
    const kcalPapel = kcalAlvo * papel.pct
    const alimento = escolherMelhorAlimento(lista, kcalPapel, seed + i * 13, papel.categoria, fase)
    if (!alimento) return
    const gramas = arredondarGramas((kcalPapel / alimento.kcal) * 100, papel.categoria, alimento, fase)
    ingredientes.push({ alimento, gramas, categoria: papel.categoria })
  })

  return { mealKey, nome: MEAL_LABELS[mealKey], ingredientes }
}

function categoriaParaPapel(c: Categoria): PapelCategoria | null {
  switch (c) {
    case 'proteina_solida':
    case 'proteina_suplemento': return 'proteina'
    case 'carboidrato': return 'carboidrato'
    case 'gordura': return 'gordura'
    case 'fruta': return 'fruta'
    case 'vegetal': return 'vegetal'
    default: return null
  }
}

/**
 * Reconstrói uma refeição editável a partir de um cardápio já salvo no banco
 * (RefeicaoCustom, formato de texto). Usado na tela "Meus Cardápios" pra
 * permitir editar algo que já existia. Se o alimento bate com a TACO, vira
 * editável com troca de opções normalmente. Se não bate (item legado ou
 * digitado manualmente), ainda dá pra ajustar a gramagem, só não tem opção
 * de troca — não finjo saber a categoria de algo que não reconheço.
 */
export function refeicaoCustomParaGerada(mealKey: MealKey, r: RefeicaoCustom): RefeicaoGerada {
  const n = r.ingredientes.length || 1
  const ingredientes: IngredienteGerado[] = r.ingredientes.map(([nome, , gramasStr]) => {
    const gramas = Math.max(1, parseInt(gramasStr, 10) || 100)
    const encontrado = classificarPorNome(nome)
    if (encontrado) {
      return { alimento: encontrado, gramas, categoria: categoriaParaPapel(classificar(encontrado)) }
    }
    // fallback: reconstrói um "alimento" aproximado por 100g a partir do
    // total salvo da refeição, dividido igualmente entre os ingredientes
    const fator = 100 / gramas
    const alimentoAproximado: Alimento = {
      id: `custom-${nome}`, nome, fonte: 'custom',
      kcal: (r.kcal / n) * fator, prot: (r.prot / n) * fator,
      carbo: (r.carbo / n) * fator, gord: (r.gord / n) * fator,
    }
    return { alimento: alimentoAproximado, gramas, categoria: null }
  })
  return { mealKey, nome: r.nome || MEAL_LABELS[mealKey], ingredientes }
}

export function gerarCardapioDetalhado(kcalMeta: number, fase: Fase, seed = 0): Record<MealKey, RefeicaoGerada> {
  const config = getFaseConfig(fase)
  const resultado = {} as Record<MealKey, RefeicaoGerada>
  ;(Object.keys(config.distribuicao) as MealKey[]).forEach((mealKey, i) => {
    const kcalAlvo = kcalMeta * config.distribuicao[mealKey]
    resultado[mealKey] = montarRefeicao(mealKey, kcalAlvo, seed + i * 31, fase)
  })
  return resultado
}

export function macrosDeIngredientes(ingredientes: IngredienteGerado[]) {
  return ingredientes.reduce((acc, ing) => {
    const f = ing.gramas / 100
    acc.kcal += ing.alimento.kcal * f
    acc.prot += ing.alimento.prot * f
    acc.carbo += ing.alimento.carbo * f
    acc.gord += ing.alimento.gord * f
    return acc
  }, { kcal: 0, prot: 0, carbo: 0, gord: 0 })
}

export function paraRefeicaoCustom(r: RefeicaoGerada): RefeicaoCustom {
  const m = macrosDeIngredientes(r.ingredientes)
  return {
    nome: r.nome,
    kcal: Math.round(m.kcal), prot: Math.round(m.prot), carbo: Math.round(m.carbo), gord: Math.round(m.gord),
    timing: '',
    ingredientes: r.ingredientes.map(ing => [ing.alimento.nome, `${ing.gramas}g`, `${ing.gramas}g`]),
  }
}

// ─── API "SIMPLES" (compatível com o que já existia e com o formato salvo no banco) ──

export function gerarCardapio(kcalMeta: number, fase: Fase, seed = 0): Record<MealKey, RefeicaoCustom[]> {
  const detalhado = gerarCardapioDetalhado(kcalMeta, fase, seed)
  const resultado = {} as Record<MealKey, RefeicaoCustom[]>
  ;(Object.keys(detalhado) as MealKey[]).forEach(mealKey => {
    resultado[mealKey] = [paraRefeicaoCustom(detalhado[mealKey])]
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
