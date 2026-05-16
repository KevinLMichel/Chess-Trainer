import type { LineStats, RepertoireLine, ReviewItem, StoredProgress, UserSettings } from '../types/repertoire'

export const STORAGE_KEY = 'queens-gambit-trainer:v1'

export const defaultSettings: UserSettings = {
  boardOrientation: 'white',
  autoPlayOpponent: true,
  showLegalMoves: true,
  showCoordinates: true,
  sound: false,
  hints: true,
  darkMode: true,
  boardTheme: 'warm',
}

export const defaultProgress = (): StoredProgress => ({
  version: 1,
  score: 0,
  streak: 0,
  bestStreak: 0,
  completedLineIds: [],
  lineStats: {},
  reviewQueue: [],
  settings: defaultSettings,
  userLines: [],
  welcomeDismissed: false,
})

const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

export const normalizeProgress = (value: Partial<StoredProgress> | null | undefined): StoredProgress => {
  const fallback = defaultProgress()
  if (!value || typeof value !== 'object') return fallback

  return {
    ...fallback,
    ...value,
    version: 1,
    completedLineIds: Array.isArray(value.completedLineIds) ? value.completedLineIds : [],
    lineStats: value.lineStats && typeof value.lineStats === 'object' ? value.lineStats : {},
    reviewQueue: Array.isArray(value.reviewQueue) ? value.reviewQueue : [],
    settings: { ...defaultSettings, ...(value.settings ?? {}) },
    userLines: Array.isArray(value.userLines) ? value.userLines : [],
    welcomeDismissed: Boolean(value.welcomeDismissed),
  }
}

export const loadProgress = (): StoredProgress => {
  if (!hasStorage()) return defaultProgress()
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultProgress()

  try {
    return normalizeProgress(JSON.parse(raw))
  } catch {
    return defaultProgress()
  }
}

export const saveProgress = (progress: StoredProgress) => {
  if (!hasStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress)))
}

export const exportProgressJson = (progress: StoredProgress) =>
  JSON.stringify(normalizeProgress(progress), null, 2)

export const importProgressJson = (raw: string) => {
  const parsed = JSON.parse(raw)
  return normalizeProgress(parsed)
}

export const exportRepertoireJson = (lines: RepertoireLine[]) => JSON.stringify(lines, null, 2)

export const importRepertoireJson = (raw: string): RepertoireLine[] => {
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Repertoire import must be a JSON array.')
  return parsed.map((line) => ({
    ...line,
    source: 'user' as const,
    tags: Array.isArray(line.tags) ? line.tags : [],
    moves: Array.isArray(line.moves) ? line.moves : [],
  }))
}

const emptyStats = (): LineStats => ({
  attempts: 0,
  correct: 0,
  mistakes: 0,
  completed: 0,
  bestStreak: 0,
})

export const recordCorrectMove = (progress: StoredProgress, lineId: string, completed: boolean): StoredProgress => {
  const now = new Date().toISOString()
  const previousStats = progress.lineStats[lineId] ?? emptyStats()
  const nextStreak = progress.streak + 1
  const completedLineIds = completed
    ? Array.from(new Set([...progress.completedLineIds, lineId]))
    : progress.completedLineIds

  return normalizeProgress({
    ...progress,
    score: progress.score + 10,
    streak: nextStreak,
    bestStreak: Math.max(progress.bestStreak, nextStreak),
    completedLineIds,
    lastPracticedAt: now,
    lineStats: {
      ...progress.lineStats,
      [lineId]: {
        ...previousStats,
        attempts: previousStats.attempts + 1,
        correct: previousStats.correct + 1,
        completed: previousStats.completed + (completed ? 1 : 0),
        bestStreak: Math.max(previousStats.bestStreak, nextStreak),
        lastPracticedAt: now,
      },
    },
  })
}

export const recordMistake = (progress: StoredProgress, lineId: string, mistake: ReviewItem): StoredProgress => {
  const now = new Date().toISOString()
  const previousStats = progress.lineStats[lineId] ?? emptyStats()
  const existing = progress.reviewQueue.find((item) => item.id === mistake.id)
  const reviewQueue = existing
    ? progress.reviewQueue.map((item) =>
        item.id === mistake.id
          ? {
              ...item,
              misses: item.misses + 1,
              priority: Math.min(item.priority + 1, 10),
              lastSeenAt: now,
            }
          : item,
      )
    : [...progress.reviewQueue, mistake]

  return normalizeProgress({
    ...progress,
    streak: 0,
    lastPracticedAt: now,
    reviewQueue,
    lineStats: {
      ...progress.lineStats,
      [lineId]: {
        ...previousStats,
        attempts: previousStats.attempts + 1,
        mistakes: previousStats.mistakes + 1,
        lastPracticedAt: now,
      },
    },
  })
}

export const recordReviewCorrect = (progress: StoredProgress, reviewItemId: string): StoredProgress => {
  const now = new Date().toISOString()
  return normalizeProgress({
    ...progress,
    score: progress.score + 15,
    streak: progress.streak + 1,
    bestStreak: Math.max(progress.bestStreak, progress.streak + 1),
    reviewQueue: progress.reviewQueue
      .map((item) =>
        item.id === reviewItemId
          ? {
              ...item,
              successes: item.successes + 1,
              priority: Math.max(item.priority - 2, 0),
              lastSeenAt: now,
            }
          : item,
      )
      .filter((item) => item.priority > 0 || item.successes < 2),
  })
}

export const recordReviewMistake = (progress: StoredProgress, reviewItemId: string): StoredProgress =>
  normalizeProgress({
    ...progress,
    streak: 0,
    reviewQueue: progress.reviewQueue.map((item) =>
      item.id === reviewItemId
        ? {
            ...item,
            misses: item.misses + 1,
            priority: Math.min(item.priority + 1, 10),
            lastSeenAt: new Date().toISOString(),
          }
        : item,
    ),
  })

export const lineAccuracy = (stats?: LineStats) => {
  if (!stats || stats.attempts === 0) return 0
  return Math.round((stats.correct / stats.attempts) * 100)
}
