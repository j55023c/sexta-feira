import { TACO, type TacoItem } from '@/lib/taco'

export interface Alimento {
  id: string
  nome: string
  kcal: number
  prot: number
  carbo: number
  gord: number
  fonte: string
}

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Prepara o nome pra comparação por PALAVRA INTEIRA, não substring solto.
// Sem isso, "maçã" (normalizado "maca") casava como substring dentro de
// "macarrão" (normalizado "macarrao") — mesmo bug em duas variações
// diferentes já apareceu duas vezes nesta sessão, então mato a causa raiz.
function paraComparacao(s: string): string {
  return ' ' + normalizar(s).replace(/[-/()]/g, ' ').replace(/\s+/g, ' ').trim() + ' '
}

function contemPalavra(nomeParaComparacao: string, lista: string[]): boolean {
  return lista.some(k => nomeParaComparacao.includes(' ' + normalizar(k).replace(/[-/()]/g, ' ').replace(/\s+/g, ' ').trim() + ' '))
}

function fromTaco(items: TacoItem[]): Alimento[] {
  return items.map(i => ({
    id: `taco-${i.id}`, nome: i.nome, kcal: i.kcal, prot: i.prot, carbo: i.carbo, gord: i.gord, fonte: 'taco',
  }))
}

const FONTES_REGISTRADAS: { nome: string; itens: Alimento[] }[] = [
  { nome: 'taco', itens: fromTaco(TACO) },
]

export const BANCO_DE_ALIMENTOS: Alimento[] = FONTES_REGISTRADAS.flatMap(f => f.itens)

export type Categoria =
  | 'proteina_solida' | 'proteina_suplemento' | 'carboidrato'
  | 'gordura' | 'fruta' | 'vegetal' | 'outros'

// ─── CLASSIFICAÇÃO: LISTA BRANCA FECHADA ────────────────────────────────────
// Design deliberado: em vez de inferir categoria pelo % de macro (que deixa
// passar cerveja como "fruta", farinha crua como "carbo", salsicha como
// "gordura"), cada item só entra numa categoria se eu explicitamente aprovei
// como comida pronta, real, numa porção que uma pessoa comum comeria.
// Qualquer item da TACO que não bater em nenhuma lista cai em 'outros' e
// NUNCA é sugerido pelo gerador. Prefiro um banco menor e confiável a um
// banco grande com lixo misturado.

const EXCLUSAO_KEYWORDS = [
  // álcool, refrigerante, condimentos, cafeína
  'cerveja', 'refrigerante', 'vinagre', 'ketchup', 'mostarda', 'shoyu', 'maionese',
  'cafe', 'cha verde', 'suco de', 'agua de coco',
  // açúcar puro, doces, ultraprocessados
  'chocolate', 'acucar', 'mel', 'leite condensado', 'sorvete', 'biscoito', 'bolo',
  'geleia', 'creme de avela', 'creme de leite', 'requeijao',
  // carnes processadas / frituras
  'linguica', 'salsicha', 'bacon', 'hamburguer', 'coxinha', 'batata frita', 'pizza',
  // ingredientes crus de preparo — não são "comida pronta"
  'farinha', 'fuba', 'farelo', 'amido',
  // proteína crua — nunca sugerir carne/peixe cru
  ' cru',
]

const PROTEINA_SUPLEMENTO_KEYWORDS = [
  'whey', 'caseina', 'proteina de soja isolada', 'proteina de ervilha',
  'proteina vegana', 'bcaa', 'barra de proteina',
]

const PROTEINA_SOLIDA_KEYWORDS = [
  'frango peito cozido', 'frango sobrecoxa', 'frango coxa', 'patinho cozido',
  'coxao mole coz', 'alcatra cozida', 'file mignon coz', 'carne moida cozida',
  'lombo cozido', 'tilapia grelhada', 'atum em agua', 'salmao grelhado',
  'sardinha em oleo', 'ovo de galinha inteiro cozido', 'clara de ovo cozida',
  'ovo frito', 'omelete simples', 'queijo cottage', 'presunto cozido',
  'peito de peru defumado', 'camarao cozido', 'bacalhau dessalgado cozido',
  'merluza cozida', 'peixe assado', 'carne assada', 'tofu',
  'proteina de soja texturizada coz',
]

const GORDURA_KEYWORDS = [
  'azeite', 'oleo de', 'manteiga', 'margarina', 'castanha', 'amendoim',
  'amendoas torradas', 'noz', 'nozes', 'pistache', 'semente de', 'abacate',
  'azeitona',
  // nota: usar "amêndoas torradas" (frase completa), não "amêndoa" solto —
  // "amêndoa" sozinho também casava com "Leite de amêndoa" (bebida com só
  // 1.4g de gordura/100g, não é fonte de gordura de verdade)
]

const FRUTA_KEYWORDS = [
  'banana', 'maca', 'laranja', 'mamao', 'manga', 'morango', 'uva', 'abacaxi',
  'melancia', 'melao', 'goiaba', 'caju', 'acai', 'maracuja', 'graviola',
  'cupuacu', 'pitanga', 'jabuticaba',
]

const VEGETAL_KEYWORDS = [
  'tomate', 'alface', 'cenoura', 'brocolis', 'couve manteiga', 'espinafre',
  'abobrinha', 'chuchu', 'pepino', 'cebola', 'pimentao', 'beterraba',
  'milho verde', 'repolho', 'quiabo', 'jilo', 'maxixe', 'vagem', 'aspargo',
  'berinjela', 'couve-flor', 'acelga', 'rucula', 'agriao', 'ora-pro-nobis',
  'abobora cozida',
  // nota: "alho" foi removido de propósito — é tempero (gramas de tempero),
  // ninguém come 100g de alho cru como acompanhamento
]

const CARBOIDRATO_KEYWORDS = [
  'arroz branco cozido', 'arroz integral cozido', 'batata inglesa cozida',
  'batata doce cozida', 'mandioca cozida', 'macarrao cozido', 'pao frances',
  'pao de forma integral', 'aveia em flocos', 'granola', 'tapioca',
  'quinoa cozida', 'inhame cozido', 'cara cozido', 'biomassa de banana verde',
  'feijao carioca cozido', 'feijao preto cozido', 'lentilha cozida',
  'grao-de-bico cozido', 'cuscuz milho cozido', 'polenta cozida',
  'pao de queijo assado', 'tapioca recheada', 'soja cozida',
]

const LISTAS: { categoria: Exclude<Categoria, 'outros'>; keywords: string[] }[] = [
  { categoria: 'proteina_suplemento', keywords: PROTEINA_SUPLEMENTO_KEYWORDS },
  { categoria: 'proteina_solida', keywords: PROTEINA_SOLIDA_KEYWORDS },
  { categoria: 'gordura', keywords: GORDURA_KEYWORDS },
  { categoria: 'fruta', keywords: FRUTA_KEYWORDS },
  { categoria: 'vegetal', keywords: VEGETAL_KEYWORDS },
  { categoria: 'carboidrato', keywords: CARBOIDRATO_KEYWORDS },
]

export function classificar(a: Alimento): Categoria {
  if (a.kcal <= 5) return 'outros' // sem valor calórico real (sal, água) — evita divisão por zero

  const nomeComp = paraComparacao(a.nome)
  if (contemPalavra(nomeComp, EXCLUSAO_KEYWORDS)) return 'outros'

  // Quando mais de uma lista bate no mesmo nome (ex: "manteiga" bate em
  // gordura, mas "couve manteiga" bate em vegetal), a palavra-chave mais
  // ESPECÍFICA (mais longa) vence. Evita que uma palavra genérica sequestre
  // um item que na verdade pertence a outra categoria — já vi essa classe de
  // bug aparecer 3 vezes com prioridade fixa por categoria.
  let melhorCategoria: Categoria = 'outros'
  let melhorTamanho = 0
  for (const { categoria, keywords } of LISTAS) {
    for (const k of keywords) {
      const kComp = ' ' + normalizar(k).replace(/[-/()]/g, ' ').replace(/\s+/g, ' ').trim() + ' '
      if (nomeComp.includes(kComp) && kComp.length > melhorTamanho) {
        melhorTamanho = kComp.length
        melhorCategoria = categoria
      }
    }
  }
  return melhorCategoria // sem nenhuma correspondência aprovada → 'outros', nunca sugerido
}

export const ALIMENTOS_POR_CATEGORIA: Record<Categoria, Alimento[]> = (() => {
  const grupos: Record<Categoria, Alimento[]> = {
    proteina_solida: [], proteina_suplemento: [], carboidrato: [],
    gordura: [], fruta: [], vegetal: [], outros: [],
  }
  for (const a of BANCO_DE_ALIMENTOS) grupos[classificar(a)].push(a)
  return grupos
})()
