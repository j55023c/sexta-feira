// ─── TIPOS CENTRAIS DO SEXTA-FEIRA ───────────────────────────────────────────
// Cada interface aqui espelha uma tabela do Supabase.
// Se mudar o banco, muda aqui — e o TypeScript avisa em todos os lugares afetados.

// ── Perfil ──
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
  updated_at?: string
}

// ── Protocolo ──
export interface DiaProtocolo {
  dia: string
  nome: string
  tipo: 'up' | 'lw' | 'rest' | 'free'
  tags: string[]
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
  updated_at?: string
}

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
  tag: TagTarefa
  prazo: string
  tasks: Tarefa[]
  updated_at?: string
}

export interface TarefaLivre {
  id: number
  user_id?: string
  nome: string
  tag: TagTarefa
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

export type TagTarefa = 'senai' | 'escola' | 'pessoal' | 'fitness'

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
}

export const defaultProtocolo: Omit<Protocolo, 'user_id'> = {
  nome: 'Meu protocolo',
  desc_texto: 'Configure seu protocolo na aba Editar.',
  cardio: 'Defina sua rotina de cárdio na aba Editar.',
  fase: 'cutting',
  data_inicio: new Date().toISOString().split('T')[0],
  cardapio_ativo_id: 'padrao',
  dias: [
    { dia: 'Seg', nome: 'Treino A', tipo: 'up', tags: ['Treino A'] },
    { dia: 'Ter', nome: 'Treino B', tipo: 'lw', tags: ['Treino B'] },
    { dia: 'Qua', nome: 'Descanso', tipo: 'rest', tags: ['Descanso'] },
    { dia: 'Qui', nome: 'Treino A', tipo: 'up', tags: ['Treino A'] },
    { dia: 'Sex', nome: 'Treino B', tipo: 'lw', tags: ['Treino B'] },
    { dia: 'Sáb', nome: 'Livre', tipo: 'free', tags: ['Descanso'] },
    { dia: 'Dom', nome: 'Livre', tipo: 'free', tags: ['Descanso'] },
  ],
}
