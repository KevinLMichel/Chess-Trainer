export type Side = 'white' | 'black'

export type TrainerMode =
  | 'practice'
  | 'learn'
  | 'drill'
  | 'mistakes'
  | 'run'
  | 'repertoire'
  | 'add-line'
  | 'settings'

export type BoardOrientation = 'white' | 'black'
export type BoardTheme = 'warm' | 'blue' | 'minimal'

export type RepertoireMove = {
  san: string
  side: Side
  train: boolean
  note?: string
}

export type RepertoireLine = {
  id: string
  title: string
  opening: string
  eco?: string
  trainAs: Side
  startingFen: 'startpos' | string
  tags: string[]
  moves: RepertoireMove[]
  source?: 'starter' | 'user'
}

export type PositionTarget = {
  id: string
  lineId: string
  lineTitle: string
  opening: string
  moveIndex: number
  fen: string
  expectedSan: string
  note?: string
  tags: string[]
}

export type ReviewItem = {
  id: string
  lineId: string
  lineTitle: string
  opening: string
  fen: string
  expectedSan: string
  moveIndex: number
  note?: string
  misses: number
  successes: number
  priority: number
  createdAt: string
  lastSeenAt: string
}

export type LineStats = {
  attempts: number
  correct: number
  mistakes: number
  completed: number
  bestStreak: number
  lastPracticedAt?: string
}

export type UserSettings = {
  boardOrientation: BoardOrientation
  autoPlayOpponent: boolean
  showLegalMoves: boolean
  showCoordinates: boolean
  sound: boolean
  hints: boolean
  darkMode: boolean
  boardTheme: BoardTheme
}

export type StoredProgress = {
  version: 1
  score: number
  streak: number
  bestStreak: number
  completedLineIds: string[]
  lineStats: Record<string, LineStats>
  reviewQueue: ReviewItem[]
  settings: UserSettings
  userLines: RepertoireLine[]
  currentLineId?: string
  lastPracticedAt?: string
  welcomeDismissed: boolean
}

export type MoveAttempt = {
  from: string
  to: string
  promotion?: string
}

export type MoveHighlight = {
  from: string
  to: string
}

export type SessionStatus =
  | 'awaiting-user'
  | 'correct'
  | 'wrong'
  | 'opponent-ready'
  | 'complete'

export type TrainingSession = {
  id: string
  mode: Extract<TrainerMode, 'practice' | 'learn' | 'drill' | 'mistakes' | 'run'>
  lineId: string
  fen: string
  moveIndex: number
  status: SessionStatus
  feedback: string
  explanation?: string
  expectedOverrideSan?: string
  expectedOverrideNote?: string
  reviewItemId?: string
  lastMove?: MoveHighlight
  correctMove?: MoveHighlight
  wrongMove?: MoveHighlight
  completedTrainableMoves: number
  totalTrainableMoves: number
  startedAt: number
}
