// ─── ACERVO DE REFEIÇÕES — CUTTING (Guia de referência) ─────────────────────
// Portado do index.html original / guia de referência enviado.
// Conteúdo estático — não é editado pelo usuário, é consulta.

export interface MealItem {
  id: string
  cor: string
  cat: string
  nome: string
  kcal: string
  timing: string
  ingredientes: string[][]
  macros: { P: number; C: number; G: number } | null
  note: string
}

export interface MealSection {
  label: string
  items: MealItem[]
}

export interface MealTab {
  label: string
  tip: string
  sections: MealSection[]
}

export type MealTabKey = 'cafe' | 'almoco' | 'pre' | 'pos' | 'jantar'

export const MEALS_GUIDE: Record<MealTabKey, MealTab> = {
  cafe: {
    label: '☀ Café da manhã',
    tip: '<strong>Regra do café:</strong> sempre que faltar um item, substitua pelo mais próximo em calorias. Banana → pão. Ovo → whey com leite. Pão → banana extra. O café pode variar, mas nunca zere a proteína pela manhã.',
    sections: [
      {
        label: 'Opções padrão',
        items: [
          { id: 'cafe1', cor: '#2a6030', cat: 'Padrão do plano', nome: 'Ovos + pão + banana', kcal: '~500', timing: 'Assim que acordar · 7–8h',
            ingredientes: [['Ovos mexidos', '3 ovos', '150g'], ['Pão francês ou de forma', '1 unid. / 2 fatias', '50–60g'], ['Banana', '1 unidade', '100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 33, C: 44, G: 20 }, note: '' },
          { id: 'cafe2', cor: '#2a6030', cat: 'Mais proteína', nome: '4 ovos + pão + banana', kcal: '~570', timing: 'Assim que acordar · 7–8h',
            ingredientes: [['Ovos mexidos', '4 ovos', '200g'], ['Pão francês ou de forma', '1 unid. / 2 fatias', '50–60g'], ['Banana', '1 unidade', '100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 40, C: 44, G: 25 }, note: 'Bom para dias de treino pesado ou quando sentir mais fome pela manhã.' },
          { id: 'cafe3', cor: '#a06018', cat: 'Sem banana', nome: 'Ovos + 2 pães', kcal: '~500', timing: 'Assim que acordar · 7–8h',
            ingredientes: [['Ovos mexidos', '3 ovos', '150g'], ['Pão francês ou de forma', '2 unid. / 4 fatias', '100–120g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 34, C: 52, G: 20 }, note: 'Troca direta da banana pelo segundo pão — calorias praticamente iguais.' },
        ],
      },
      {
        label: 'Com arroz / alternativas',
        items: [
          { id: 'cafe4', cor: '#c8441a', cat: 'Padrão com arroz', nome: 'Arroz + carne moída + banana', kcal: '~480', timing: 'Assim que acordar · 7–8h',
            ingredientes: [['Arroz branco cozido', '3 col. cheias', '90g'], ['Carne moída patinho', '2,5 col.', '~75g coz.'], ['Banana', '1 unidade', '100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 32, C: 66, G: 9 }, note: 'Arroz + feijão + frango é basicamente o prato do almoço em versão menor.' },
          { id: 'cafe5', cor: '#a06018', cat: 'Troca do arroz', nome: 'Carne moída + batata air fryer + banana', kcal: '~425', timing: 'Assim que acordar · 7–8h',
            ingredientes: [['Batata crua (pré-fritar)', '100g', '100g'], ['Azeite (para a batata)', '1 col. chá', '5ml'], ['Carne moída patinho', '2,5 col.', '~75g coz.'], ['Banana', '1 unidade', '100g']],
            macros: { P: 27, C: 46, G: 17 }, note: '<strong>Preparo:</strong> 100g batata crua em palitos, 5ml azeite, sal e alho em pó. Air fryer 190°C por 15–18 min.' },
          { id: 'cafe6', cor: '#5a2a80', cat: 'Sem banana disponível', nome: 'Arroz + frango desfiado + leite', kcal: '~405', timing: 'Assim que acordar · 7–8h',
            ingredientes: [['Arroz branco cozido', '3 col. cheias', '90g'], ['Frango desfiado cozido', '2,5 col.', '~75g'], ['Leite integral', '200ml', '200g']],
            macros: { P: 39, C: 35, G: 12 }, note: 'Leite no lugar da banana — carbo mais baixo, proteína mais alta. Bom em dia de descanso.' },
          { id: 'cafe7', cor: '#1a6060', cat: 'Treino pesado de manhã', nome: 'Arroz + carne moída + feijão', kcal: '~440', timing: 'Assim que acordar · 7–8h',
            ingredientes: [['Arroz branco cozido', '3 col. cheias', '90g'], ['Carne moída patinho', '2,5 col.', '~75g coz.'], ['Feijão carioca', '1 concha', '80g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 34, C: 43, G: 14 }, note: 'Sem banana, mais saciante. Boa pedida quando o treino é cedo e pesado.' },
        ],
      },
    ],
  },
  almoco: {
    label: '🍽 Almoço',
    tip: '<strong>Hierarquia do almoço:</strong> proteína → feijão → arroz → legume. Se faltar algo, que falte de baixo pra cima. Nunca o arroz sem proteína.',
    sections: [
      {
        label: 'Com carne bovina',
        items: [
          { id: 'alm1', cor: '#c8441a', cat: 'Padrão do plano', nome: 'Carne moída + arroz + feijão', kcal: '~650', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '3 col. cheias', '90g coz.'], ['Carne moída patinho', '2,5 col.', '~100g'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 48, C: 79, G: 12 }, note: '' },
          { id: 'alm2', cor: '#c8441a', cat: 'Troca direta', nome: 'Bife fatiado + arroz + feijão', kcal: '~660', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '3 col. cheias', '90g coz.'], ['Bife fatiado', '2,5 col.', '~100g'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 46, C: 79, G: 14 }, note: '' },
        ],
      },
      {
        label: 'Com frango',
        items: [
          { id: 'alm3', cor: '#2a6030', cat: 'Mais proteína que a carne', nome: 'Frango desfiado + arroz + feijão', kcal: '~630', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '3 col. cheias', '90g coz.'], ['Frango desfiado cozido', '2,5 col.', '~120g'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 54, C: 75, G: 10 }, note: '' },
          { id: 'alm4', cor: '#2a6030', cat: 'Gosto diferente', nome: 'Filé de frango grelhado', kcal: '~645', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '3 col. cheias', '90g coz.'], ['Filé de frango grelhado', '1 filé médio', '~130g'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 56, C: 75, G: 10 }, note: '' },
          { id: 'alm5', cor: '#2a6030', cat: 'Proteína máxima', nome: 'Frango + 1 ovo mexido', kcal: '~690', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '3 col. cheias', '90g coz.'], ['Frango desfiado', '2 col. cheias', '90g'], ['Ovo mexido', '1 ovo', '50g'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g']],
            macros: { P: 57, C: 75, G: 16 }, note: '' },
          { id: 'alm6', cor: '#2a6030', cat: 'Sem feijão disponível', nome: 'Frango + arroz extra', kcal: '~630', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '4 col. cheias', '120g coz.'], ['Filé de frango grelhado', '1 filé médio', '~130g'], ['Salada / legume', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 54, C: 83, G: 8 }, note: '' },
        ],
      },
      {
        label: 'Situações especiais',
        items: [
          { id: 'alm7', cor: '#1a4080', cat: 'Sem carne / sem frango', nome: 'Ovo + feijão + arroz', kcal: '~580', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '3 col. cheias', '90g coz.'], ['Ovos mexidos ou cozidos', '3 ovos', '150g'], ['Feijão carioca', '1,5 concha', '120g'], ['Salada / legume', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 35, C: 82, G: 18 }, note: '<strong>Proteína menor</strong> — adicione 1 ovo a mais se possível.' },
          { id: 'alm8', cor: '#a06018', cat: 'Dia de refeed mensal', nome: 'Almoço recarregado', kcal: '~880', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '5 col. cheias', '150g coz.'], ['Carne / frango', '2,5 col.', '75g coz.'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 50, C: 128, G: 12 }, note: '1× por mês. Carboidrato extra restaura leptina — não é cheat day.' },
          { id: 'alm9', cor: '#888', cat: 'Dia de descanso', nome: 'Almoço reduzido', kcal: '~490', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '2 col. cheias', '60g coz.'], ['Carne / frango', '2 col.', '60g coz.'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 38, C: 55, G: 10 }, note: 'Nos dias sem treino você já pula pré e pós — o almoço pode ser menor.' },
          { id: 'alm10', cor: '#c8441a', cat: 'Misto · proteína alta', nome: 'Frango + carne moída', kcal: '~670', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Arroz branco', '3 col. cheias', '90g coz.'], ['Frango desfiado', '1,5 col.', '~60g'], ['Carne moída', '1 col.', '~40g'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g']],
            macros: { P: 54, C: 75, G: 13 }, note: '' },
        ],
      },
      {
        label: 'Com batata air fryer',
        items: [
          { id: 'alm11', cor: '#a06018', cat: 'Troca do arroz', nome: 'Carne + batata air fryer + feijão', kcal: '~640', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Batata crua', '150g', '150g'], ['Azeite (batata)', '1 col. chá', '5ml'], ['Carne moída patinho', '2,5 col.', '~100g'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g']],
            macros: { P: 45, C: 72, G: 16 }, note: '<strong>Preparo:</strong> 150g batata crua em palitos, 5ml azeite, sal e alho em pó. Air fryer 190°C 18–20 min, virando na metade.' },
          { id: 'alm12', cor: '#a06018', cat: 'Troca do arroz', nome: 'Frango + batata air fryer + feijão', kcal: '~620', timing: 'Ao meio-dia · 12–13h',
            ingredientes: [['Batata crua', '150g', '150g'], ['Azeite (batata)', '1 col. chá', '5ml'], ['Frango desfiado / filé', '2,5 col.', '~120g'], ['Feijão carioca', '1 concha', '80g'], ['Salada / legume', 'à vontade', '~80–100g']],
            macros: { P: 52, C: 68, G: 12 }, note: '<strong>Preparo:</strong> 150g batata crua em palitos, 5ml azeite, 190°C 18–20 min. Proteína maior — boa pedida para dia de treino pesado.' },
        ],
      },
    ],
  },
  pre: {
    label: '⚡ Pré-treino',
    tip: '<strong>Timing:</strong> 60–90 min antes é o ideal. Se comer muito perto do treino (menos de 30 min), reduza a quantidade ou vá só com a banana — estômago cheio prejudica a performance.',
    sections: [
      {
        label: 'Opções',
        items: [
          { id: 'pre1', cor: '#2a6030', cat: 'Padrão do plano', nome: 'Pão + doce de leite + banana', kcal: '~350', timing: '60–90 min antes de treinar',
            ingredientes: [['Pão francês ou de forma', '1 unid. / 2 fatias', '50–60g'], ['Doce de leite', '1,5 col. sopa', '30g'], ['Banana', '1 unidade', '100g']],
            macros: { P: 8, C: 73, G: 4 }, note: 'Zero preparo. Abre e come. Carbo rápido ideal.' },
          { id: 'pre2', cor: '#a06018', cat: 'Sem doce de leite', nome: 'Pão + banana + mel', kcal: '~320', timing: '60–90 min antes de treinar',
            ingredientes: [['Pão francês ou de forma', '1 unid. / 2 fatias', '50–60g'], ['Mel', '1 col. sopa', '20g'], ['Banana', '1 unidade', '100g']],
            macros: { P: 6, C: 69, G: 2 }, note: 'Mel é carbo puro — funciona igual ou melhor que doce de leite pré-treino.' },
          { id: 'pre3', cor: '#1a4080', cat: 'Só o básico', nome: 'Pão + banana', kcal: '~250', timing: '60–90 min antes de treinar',
            ingredientes: [['Pão francês ou de forma', '1 unid. / 2 fatias', '50–60g'], ['Banana', '1 unidade', '100g']],
            macros: { P: 6, C: 53, G: 2 }, note: 'Se não tiver doce de leite nem mel. Funciona — só menos calórico.' },
          { id: 'pre4', cor: '#c8441a', cat: 'Mais carbo · treino pesado', nome: '2 pães + doce de leite + banana', kcal: '~510', timing: '60–90 min antes de treinar',
            ingredientes: [['Pão francês ou de forma', '2 unid. / 4 fatias', '100–120g'], ['Doce de leite', '1,5 col. sopa', '30g'], ['Banana', '1 unidade', '100g']],
            macros: { P: 13, C: 103, G: 6 }, note: 'Para dias de Lower em que queira mais energia — atenção ao total calórico do dia.' },
          { id: 'pre5', cor: '#888', cat: 'Sem pão / sem banana', nome: 'Arroz + doce de leite', kcal: '~260', timing: '60–90 min antes de treinar',
            ingredientes: [['Arroz branco cozido', '2,5 col. cheias', '75g'], ['Doce de leite', '1 col. sopa', '20g']],
            macros: { P: 4, C: 57, G: 2 }, note: 'Incomum mas funciona. Arroz dá carbo de digestão mais lenta.' },
          { id: 'pre6', cor: '#5a2a80', cat: 'Sem apetite antes de treinar', nome: 'Só banana', kcal: '~89', timing: '60–90 min antes de treinar',
            ingredientes: [['Banana', '1–2 unidades', '100–200g']],
            macros: { P: 1, C: 23, G: 0 }, note: 'Melhor do que treinar em jejum total.' },
        ],
      },
    ],
  },
  pos: {
    label: '💪 Pós-treino',
    tip: '<strong>Regra de ouro:</strong> proteína do pós-treino é inegociável. Se faltar tudo, whey com água já resolve. O carbo pode ser compensado no jantar — a proteína não tem segunda chance nessa janela.',
    sections: [
      {
        label: 'Opções',
        items: [
          { id: 'pos1', cor: '#2a6030', cat: 'Padrão do plano', nome: 'Whey + leite + pão + doce de leite', kcal: '~500', timing: 'Até 30–60 min após o treino',
            ingredientes: [['Whey protein', '1 scoop', '30g'], ['Leite integral', '200ml', '200g'], ['Pão francês ou de forma', '1 unid. / 2 fatias', '50–60g'], ['Doce de leite', '1,5 col. sopa', '30g']],
            macros: { P: 37, C: 63, G: 13 }, note: '' },
          { id: 'pos2', cor: '#1a4080', cat: 'Sem whey', nome: '3 ovos + pão + doce de leite', kcal: '~500', timing: 'Até 30–60 min após o treino',
            ingredientes: [['Ovos mexidos / cozidos', '3 ovos', '150g'], ['Pão francês ou de forma', '1 unid. / 2 fatias', '50–60g'], ['Doce de leite', '1,5 col. sopa', '30g'], ['Azeite (refogar)', '1 col. chá', '5ml']],
            macros: { P: 27, C: 52, G: 22 }, note: 'Proteína menor que o whey — adicione 1 ovo a mais se possível.' },
          { id: 'pos3', cor: '#a06018', cat: 'Sem doce de leite', nome: 'Whey + leite + pão + mel', kcal: '~460', timing: 'Até 30–60 min após o treino',
            ingredientes: [['Whey protein', '1 scoop', '30g'], ['Leite integral', '200ml', '200g'], ['Pão francês ou de forma', '1 unid. / 2 fatias', '50–60g'], ['Mel', '1 col. sopa', '20g']],
            macros: { P: 36, C: 56, G: 11 }, note: '' },
          { id: 'pos4', cor: '#c8441a', cat: 'Sem pão disponível', nome: 'Whey + leite + banana', kcal: '~330', timing: 'Até 30–60 min após o treino',
            ingredientes: [['Whey protein', '1 scoop', '30g'], ['Leite integral', '200ml', '200g'], ['Banana', '1 unidade', '100g']],
            macros: { P: 31, C: 36, G: 9 }, note: 'Menos carbo que o padrão — compense com 1 col. extra de arroz no jantar.' },
          { id: 'pos5', cor: '#5a2a80', cat: 'Sem nada / correndo', nome: 'Só o whey com leite', kcal: '~242', timing: 'Até 30–60 min após o treino',
            ingredientes: [['Whey protein', '1 scoop', '30g'], ['Leite integral', '200ml', '200g']],
            macros: { P: 30, C: 13, G: 9 }, note: 'Proteína garantida. Carbo você recupera no jantar. Melhor do que não tomar nada.' },
          { id: 'pos6', cor: '#1a6060', cat: 'Máximo recuperação', nome: 'Whey + leite + 2 pães + doce de leite', kcal: '~660', timing: 'Até 30–60 min após o treino',
            ingredientes: [['Whey protein', '1 scoop', '30g'], ['Leite integral', '200ml', '200g'], ['Pão francês ou de forma', '2 unid. / 4 fatias', '100–120g'], ['Doce de leite', '1,5 col. sopa', '30g']],
            macros: { P: 42, C: 93, G: 15 }, note: 'Só para após treinos muito pesados. Compense reduzindo 1 col. de arroz no jantar.' },
        ],
      },
    ],
  },
  jantar: {
    label: '🌙 Jantar',
    tip: '<strong>Jantar mais leve que o almoço é ideal no cutting</strong> — o carbo à noite não é vilão, mas reduzir um pouco no jantar cria um déficit extra sem sacrifício. 2 col. de arroz no jantar vs 3 no almoço já faz diferença.',
    sections: [
      {
        label: 'Opções padrão',
        items: [
          { id: 'jan1', cor: '#c8441a', cat: 'Padrão do plano', nome: 'Carne / bife + arroz + feijão', kcal: '~550', timing: 'À noite · 19–21h',
            ingredientes: [['Arroz branco', '2 col. cheias', '60g coz.'], ['Carne moída ou bife', '2,5 col.', '~100g'], ['Feijão carioca', '1 concha', '80g'], ['Legume / salada', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 35, C: 60, G: 12 }, note: '' },
          { id: 'jan2', cor: '#2a6030', cat: 'Com frango', nome: 'Frango desfiado + arroz + feijão', kcal: '~530', timing: 'À noite · 19–21h',
            ingredientes: [['Arroz branco', '2 col. cheias', '60g coz.'], ['Frango desfiado', '2,5 col.', '~120g'], ['Feijão carioca', '1 concha', '80g'], ['Legume / salada', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 42, C: 58, G: 8 }, note: '' },
          { id: 'jan3', cor: '#1a4080', cat: 'Sem carne / sem frango', nome: 'Ovo + feijão + arroz', kcal: '~480', timing: 'À noite · 19–21h',
            ingredientes: [['Arroz branco', '2 col. cheias', '60g coz.'], ['Ovos mexidos', '3 ovos', '150g'], ['Feijão carioca', '1,5 concha', '120g'], ['Legume / salada', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 30, C: 63, G: 18 }, note: '' },
          { id: 'jan4', cor: '#a06018', cat: 'Muito cansado / sem apetite', nome: 'Jantar leve', kcal: '~380', timing: 'À noite · 19–21h',
            ingredientes: [['Arroz branco', '1,5 col. cheias', '45g coz.'], ['Carne ou frango', '2 col.', '60g coz.'], ['Feijão carioca', '1 concha', '80g']],
            macros: { P: 32, C: 45, G: 10 }, note: 'Quando o corpo não quer muito — respeitável eventualmente. Não vire rotina.' },
          { id: 'jan5', cor: '#888', cat: 'Dia de descanso total', nome: 'Jantar reduzido', kcal: '~420', timing: 'À noite · 19–21h',
            ingredientes: [['Arroz branco', '1,5 col. cheias', '45g coz.'], ['Carne moída / frango', '2 col.', '60g coz.'], ['Feijão carioca', '1 concha', '80g'], ['Legume', 'à vontade', '~80–100g']],
            macros: { P: 33, C: 50, G: 9 }, note: 'Dias sem treino você já pula pré e pós — o deficit maior vem naturalmente.' },
          { id: 'jan6', cor: '#1a6060', cat: 'Recuperação pós-treino pesado', nome: 'Jantar reforçado', kcal: '~680', timing: 'À noite · 19–21h',
            ingredientes: [['Arroz branco', '3 col. cheias', '90g coz.'], ['Carne / frango', '3 col.', '90g coz.'], ['Feijão carioca', '1 concha', '80g'], ['Legume / salada', 'à vontade', '~80–100g'], ['Azeite', '1 col. chá', '5ml']],
            macros: { P: 55, C: 80, G: 14 }, note: 'Para dias de Lower muito intenso — compense reduzindo o pré-treino no mesmo dia.' },
        ],
      },
      {
        label: 'Com batata air fryer',
        items: [
          { id: 'jan7', cor: '#a06018', cat: 'Troca do arroz', nome: 'Carne + batata air fryer + feijão', kcal: '~540', timing: 'À noite · 19–21h',
            ingredientes: [['Batata crua', '110g', '110g'], ['Azeite (batata)', '1 col. chá', '5ml'], ['Carne moída ou bife', '2,5 col.', '~100g'], ['Feijão carioca', '1 concha', '80g'], ['Legume / salada', 'à vontade', '~80–100g']],
            macros: { P: 35, C: 56, G: 16 }, note: '<strong>Preparo:</strong> 110g batata crua em palitos, 5ml azeite. Air fryer 190°C 15–18 min.' },
          { id: 'jan8', cor: '#a06018', cat: 'Troca do arroz', nome: 'Frango + batata air fryer + feijão', kcal: '~520', timing: 'À noite · 19–21h',
            ingredientes: [['Batata crua', '110g', '110g'], ['Azeite (batata)', '1 col. chá', '5ml'], ['Frango desfiado / filé', '2,5 col.', '~120g'], ['Feijão carioca', '1 concha', '80g'], ['Legume / salada', 'à vontade', '~80–100g']],
            macros: { P: 42, C: 52, G: 12 }, note: 'Melhor opção de proteína das versões com batata à noite.' },
        ],
      },
    ],
  },
}

export interface EmergenciaItem {
  id: string
  cor: string
  cat: string
  nome: string
  note: string
}

export const EMERGENCIAS_GUIDE: EmergenciaItem[] = [
  { id: 'em1', cor: '#c8441a', cat: 'Restaurante / lanchonete', nome: 'Almoçou fora',
    note: 'Peça <strong>frango grelhado ou carne com arroz e salada</strong>. Evite frituras e molhos cremosos. Se não tiver opção limpa, priorize proteína e compense no jantar reduzindo para 1,5 col. de arroz.' },
  { id: 'em2', cor: '#a06018', cat: 'Evento social / churrasco', nome: 'Almoço em família',
    note: '<strong>Não recuse comida.</strong> Coma com consciência: carnes magras primeiro, evite fritura e doce em excesso. Um almoço fora do plano por semana não desfaz nada.' },
  { id: 'em3', cor: '#1a4080', cat: 'Sem tempo', nome: 'Sem tempo para preparar',
    note: 'Prioridade: <strong>proteína primeiro</strong>. Whey com leite resolve em 30 segundos. Pão + banana resolve o carbo. Nunca pule uma refeição por falta de tempo.' },
  { id: 'em4', cor: '#2a6030', cat: 'Sem apetite / enjoo', nome: 'Estômago ruim',
    note: 'Reduz o volume mas <strong>não zera a proteína</strong>. Arroz + frango desfiado é mais fácil de digerir. Whey com leite + banana resolve sem esforço digestivo.' },
  { id: 'em5', cor: '#2a6030', cat: 'Sem carne nem frango', nome: 'Não tem proteína em casa',
    note: '<strong>3 ovos + feijão + arroz</strong> resolve completamente. Ou whey com leite + 4 col. de arroz + feijão. <strong>Ovo é proteína completa</strong> — não subestime.' },
  { id: 'em6', cor: '#2a6030', cat: 'Semana curta de dinheiro', nome: 'Opções baratas',
    note: 'O trio mais barato do cutting: <strong>ovo + arroz + feijão</strong>. Menos de R$5 por refeição, P ~35g, C ~80g. Frango sobrecoxa é a carne mais barata por grama de proteína.' },
  { id: 'em7', cor: '#5a2a80', cat: 'Semana de provas / estresse', nome: 'Período de estresse intenso',
    note: 'Estresse crônico eleva cortisol. <strong>Priorize sono e proteína</strong> acima de tudo. Se comer um pouco mais de carbo para estudar melhor — tudo bem. O cutting pode esperar uma semana.' },
  { id: 'em8', cor: '#c8441a', cat: 'Errou um dia inteiro', nome: 'Fugiu do plano',
    note: '<strong>Não compense cortando calorias no dia seguinte.</strong> Volta ao plano normalmente. Uma exceção por semana não tira o resultado. <strong>Consistência > perfeição.</strong>' },
  { id: 'em9', cor: '#a06018', cat: 'Muita fome antes de dormir', nome: 'Fome noturna',
    note: 'Se sentir fome real, <strong>1 ovo cozido ou 1 pão</strong> resolve sem comprometer o déficit. Não durma com fome intensa — cortisol sobe, sono fica ruim, resultado piora.' },
]

export interface TrocaTable {
  header: string[]
  rows: string[][]
}

export const TROCAS_GUIDE = {
  proteinas: {
    header: ['Proteína', 'Medida caseira', 'Kcal ~', 'Proteína ~'],
    rows: [
      ['Carne moída patinho', '2,5 col. cheias · 75g coz.', '185', '26g'],
      ['Bife fatiado (coxão / alcatra)', '2,5 col. cheias · 75g coz.', '190', '24g'],
      ['Frango desfiado cozido s/ pele', '2,5 col. cheias · 75g coz.', '165', '31g'],
      ['Filé de frango grelhado s/ pele', '1 filé médio', '170', '32g'],
      ['Sobrecoxa de frango s/ pele', '1 unidade · 100g', '175', '26g'],
      ['Frango com pele assado', '2 col. cheias · 60g coz.', '220', '22g'],
      ['Ovos mexidos', '3 ovos · 150g', '216', '18g'],
      ['Whey protein + leite', '1 scoop + 200ml', '242', '30g'],
    ],
  } as TrocaTable,
  carbos: {
    header: ['Carbo', 'Medida / quantidade', 'Kcal ~', 'Carbo ~'],
    rows: [
      ['Arroz branco cozido', '3 col. cheias (~90g)', '117', '26g'],
      ['Pão francês', '1 unidade (~60g)', '160', '30g'],
      ['Pão de forma', '2 fatias (~60g)', '152', '28g'],
      ['Banana', '1 unidade (~100g)', '89', '23g'],
      ['Feijão carioca cozido', '1 concha (~80g)', '96', '17g'],
      ['Feijão preto cozido', '1 concha (~80g)', '90', '16g'],
      ['Doce de leite', '1,5 col. sopa (30g)', '100', '20g'],
      ['Mel', '1 col. sopa (20g)', '60', '16g'],
    ],
  } as TrocaTable,
  gorduras: {
    header: ['Gordura', 'Quantidade', 'Kcal ~'],
    rows: [
      ['Azeite de oliva', '1 col. chá (5ml)', '44'],
      ['Óleo de coco', '1 col. chá (5ml)', '42'],
      ['Manteiga', '1 col. chá (5g)', '36'],
    ],
  } as TrocaTable,
}

export interface RegraGuia {
  num: string
  title: string
  desc: string
}

export const REGRAS_GUIDE: RegraGuia[] = [
  { num: '01', title: 'Proteína é inegociável', desc: 'Pode cortar carbo, pode cortar gordura, pode pular o feijão. Nunca zere a proteína. Meta mínima: 150g/dia. Abaixo disso você perde músculo.' },
  { num: '02', title: 'Salada e legume são livres', desc: 'Folhas, tomate, pepino, cenoura, chuchu, abobrinha — à vontade. Quase zero caloria, aumentam o volume e reduzem a fome real.' },
  { num: '03', title: 'Frango sem pele é preferível', desc: 'Peito ou sobrecoxa sem pele. Com pele, reduza 0,5 col. — mais calórico por grama, menos proteína proporcional.' },
  { num: '04', title: 'Carne gorda = menos quantidade', desc: 'Costela, fraldinha, cupim: reduza para 2 col. cheias. Patinho e coxão duro são os mais magros — preferíveis no cutting.' },
  { num: '05', title: 'Um dia ruim não desfaz nada', desc: 'Voltando ao plano no dia seguinte, um erro é irrelevante no contexto de 20 semanas. O que desfaz é a reação exagerada.' },
  { num: '06', title: 'Nunca compense cortando', desc: 'Errou ontem? Hoje volta ao normal. Não corte calorias para "equilibrar" — isso desregula o ritmo e aumenta risco de binge.' },
  { num: '07', title: 'Sono não é negociável', desc: 'Menos de 7h = cortisol alto, mais fome, menos GH, mais catabolismo. O cutting acontece no sono.' },
  { num: '08', title: 'Consistência > perfeição', desc: '80% de adesão por 20 semanas é infinitamente melhor que 100% por 3 semanas e abandono.' },
  { num: '09', title: 'Fome leve é normal, fome intensa não', desc: 'Fome leve entre refeições é esperada. Fome intensa e constante = déficit alto demais — aumente 200 kcal.' },
  { num: '10', title: 'A força é o termômetro', desc: 'Perdeu mais de 10–15% de força? Primeiro aumente calorias, depois investigue sono e proteína.' },
]

export const MEAL_TAB_ORDER: MealTabKey[] = ['cafe', 'almoco', 'pre', 'pos', 'jantar']
