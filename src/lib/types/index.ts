// ─── TIPOS CENTRAIS DO SEXTA-FEIRA ───────────────────────────────────────────
// Cada interface aqui espelha uma tabela do Supabase.
// Se mudar o banco, muda aqui — e o TypeScript avisa em todos os lugares afetados.

// ── Perfil ──
export interface CustomCheck {
  id: string
  label: string
  emoji: string
  is_default?: boolean
}

export interface Profile {
  user_id: string
  nome: string
  peso: number | null
  meta_peso: number | null
  kcal_meta: number
  prot_meta: number
  carbo_meta: number
  gord_meta: number
  tema: Theme
  notif_times: NotifTimes
  streak_count: number
  streak_last_date: string
  hidden_cards: Record<string, string[]>
  custom_checks: CustomCheck[]
  updated_at?: string
}

// ── Protocolo ──
export interface DiaProtocolo {
  id: string
  dia: string
  nome: string
  tipo: string
  cor: string
  tags: string[]
}

export interface Suplemento {
  id: string
  nome: string
  dose: string
  timing: string
}

export interface Protocolo {
  user_id?: string
  nome: string
  desc_texto: string
  cardio: string
  fase: Fase
  data_inicio: string
  cardapio_ativo_id: string
  dias: DiaProtocolo[]
  duracao_semanas?: number
  suplementos: Suplemento[]
  suplementos_checks?: Record<string, string[]> // date -> suplemento ids marcados
  updated_at?: string
}

// Paleta fixa de cores para tipos de treino (ordem = sugestão de uso)
export const TIPO_CORES = [
  '#2a6ab5', // azul — Upper / Push
  '#4a9e5a', // verde — Lower / Pull
  '#e07b2a', // laranja — Legs
  '#c0392b', // vermelho — Full-body
  '#8e44ad', // roxo — Cardio
  '#16a085', // teal — Core / Mobility
  '#f39c12', // amarelo — HIIT / Condicionamento
  '#95a5a6', // cinza — Rest / Livre
] as const

// ── Cardápio ──
export interface RefeicaoCustom {
  nome: string
  kcal: number
  prot: number
  carbo: number
  gord: number
  timing: string
  ingredientes: string[][]
}

export interface Cardapio {
  id: string
  user_id?: string
  nome: string
  objetivo: Fase
  built_in: boolean
  refeicoes: Record<string, RefeicaoCustom[]>
  updated_at?: string
}

// ── Notas ──
export interface Nota {
  id: number
  user_id?: string
  title: string
  body: string
  tag: TagNota
  date: string
  updated_at?: string
}

// ── Tags de Tarefas (customizáveis pelo usuário) ──
// Guardadas como catálogo separado — a tarefa/matéria guarda o NOME da tag
// como texto simples, não uma referência por id. Ver explicação no chat.
export interface Tag {
  id: string
  user_id?: string
  nome: string
  cor: string
  created_at?: string
}

// ── Matérias e Tarefas ──
export interface Tarefa {
  id: number
  nome: string
  done: boolean
  prazo: string
}

export interface Materia {
  id: number
  user_id?: string
  nome: string
  tag: string
  prazo: string
  tasks: Tarefa[]
  updated_at?: string
}

export interface TarefaLivre {
  id: number
  user_id?: string
  nome: string
  tag: string
  done: boolean
  prazo: string
  updated_at?: string
}

// ── Nutrição ──
export interface EntradaNut {
  nome: string
  kcal: number
  prot: number
  carbo: number
  gord: number
  meal: MealKey
  qty: number
}

// ── Físico ──
export interface FisicoLog {
  user_id?: string
  date: string
  peso: number | null
  altura: number | null
  slept: string | null
  woke: string | null
  musculos: string[] | null
  axial: string | null
  sensacao: string | null
  dor: string | null
  cresceu: string | null
  obs: string | null
  checks: string[]
  updated_at?: string
}

// ── Histórico de fases ──
export interface HistoricoFase {
  fase: Fase
  nome: string
  dataInicio: string
  dataFim: string
  kcalMeta: number
  protMeta: number
}

// ── Sessão ──
export interface ActiveSession {
  user_id: string
  session_id: string
  device_info: string
  updated_at: string
}

// ─── ENUMS / UNIONS ──────────────────────────────────────────────────────────

export type Fase = 'bulking' | 'cutting' | 'manutencao'

export type Theme = 'default' | 'dark' | 'midnight' | 'forest' | 'rose'

export type MealKey = 'cafe' | 'almoco' | 'pre' | 'pos' | 'jantar' | 'lanche'

export type TagNota = 'geral' | 'senai' | 'escola' | 'fitness' | 'ideia'

export type NotifTimes = {
  cafe: string
  pre: string
  pos: string
  jantar: string
  fisico: string
}

// ─── ESTADO GLOBAL (equivalente ao objeto S do HTML atual) ───────────────────
// Usado pelo contexto React para manter os dados em memória
export interface AppState {
  profile: Profile
  protocolo: Protocolo
  cardapios: Cardapio[]
  notas: Nota[]
  materias: Materia[]
  tarefasLivres: TarefaLivre[]
  tags: Tag[]
  nutLog: Record<string, EntradaNut[]>
  waterLog: Record<string, number>
  fisicoLog: Record<string, FisicoLog>
  historicoFases: HistoricoFase[]
}

// ─── DEFAULTS ────────────────────────────────────────────────────────────────
// Valores padrão ao criar um novo usuário — espelho do S inicial do HTML

export const defaultProfile: Omit<Profile, 'user_id'> = {
  nome: '',
  peso: null,
  meta_peso: null,
  kcal_meta: 2000,
  prot_meta: 160,
  carbo_meta: 220,
  gord_meta: 55,
  tema: 'default',
  notif_times: { cafe: '07:30', pre: '17:30', pos: '19:30', jantar: '20:30', fisico: '21:00' },
  streak_count: 0,
  streak_last_date: '',
  hidden_cards: {},
  custom_checks: [],
}

export const defaultProtocolo: Omit<Protocolo, 'user_id'> = {
  nome: 'Meu protocolo',
  desc_texto: 'Configure seu protocolo na aba Editar.',
  cardio: 'Defina sua rotina de cárdio na aba Editar.',
  fase: 'cutting',
  data_inicio: new Date().toISOString().split('T')[0],
  cardapio_ativo_id: 'padrao',
  duracao_semanas: 12,
  suplementos: [
    { id: 'sup_creatina', nome: 'Creatina', dose: '5g', timing: 'Qualquer horário' },
    { id: 'sup_whey', nome: 'Whey', dose: '30g', timing: 'Pós-treino' },
    { id: 'sup_cafeina', nome: 'Cafeína', dose: '200mg', timing: 'Pré-treino (opcional)' },
  ],
  suplementos_checks: {},
  dias: [
    { id: crypto.randomUUID?.() ?? '1', dia: 'Seg', nome: 'Treino A', tipo: 'Push', cor: '#2a6ab5', tags: ['Peito', 'Tríceps', 'Ombro'] },
    { id: crypto.randomUUID?.() ?? '2', dia: 'Ter', nome: 'Treino B', tipo: 'Pull', cor: '#4a9e5a', tags: ['Costas', 'Bíceps'] },
    { id: crypto.randomUUID?.() ?? '3', dia: 'Qua', nome: 'Descanso', tipo: 'Rest', cor: '#95a5a6', tags: ['Descanso'] },
    { id: crypto.randomUUID?.() ?? '4', dia: 'Qui', nome: 'Treino C', tipo: 'Legs', cor: '#e07b2a', tags: ['Perna', 'Glúteo'] },
    { id: crypto.randomUUID?.() ?? '5', dia: 'Sex', nome: 'Treino D', tipo: 'Full-body', cor: '#c0392b', tags: ['Corpo todo'] },
    { id: crypto.randomUUID?.() ?? '6', dia: 'Sáb', nome: 'Cárdio', tipo: 'Cardio', cor: '#8e44ad', tags: ['HIIT', 'LISS'] },
    { id: crypto.randomUUID?.() ?? '7', dia: 'Dom', nome: 'Livre', tipo: 'Livre', cor: '#95a5a6', tags: ['Descanso'] },
  ],
}
