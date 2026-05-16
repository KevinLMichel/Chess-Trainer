import type { LineStats } from '../types/repertoire'

export const accuracyLabel = (stats?: LineStats) => {
  if (!stats || stats.attempts === 0) return 'New'
  return `${Math.round((stats.correct / stats.attempts) * 100)}%`
}

export const completionLabel = (completedLineIds: string[], lineId: string) =>
  completedLineIds.includes(lineId) ? 'Completed' : 'Open'

export const formatDate = (value?: string) => {
  if (!value) return 'Not yet'
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value))
}
