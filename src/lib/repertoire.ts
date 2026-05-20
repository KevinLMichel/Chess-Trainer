import type { LineStats, RepertoireChapter, RepertoireDifficulty, RepertoireLine, StoredProgress } from '../types/repertoire'
import { lineAccuracy } from './storage'

export type BrowserChapter = 'Quickstart' | RepertoireChapter

export const repertoireChapters: BrowserChapter[] = ['Quickstart', 'QGA', 'QGD', 'Slav', 'Semi-Slav', 'Sidelines', 'User Lines']
export const repertoireDifficulties: Array<'All levels' | RepertoireDifficulty> = ['All levels', 'beginner', 'club', 'advanced']

export const lineChapter = (line: RepertoireLine): RepertoireChapter => {
  if (line.source === 'user') return 'User Lines'
  if (line.chapter) return line.chapter
  if (line.opening.includes('Accepted') || line.tags.includes('QGA')) return 'QGA'
  if (line.opening.includes('Declined') || line.tags.includes('QGD')) return 'QGD'
  if (line.opening.includes('Semi-Slav') || line.tags.includes('Semi-Slav')) return 'Semi-Slav'
  if (line.opening.includes('Slav') || line.tags.includes('Slav')) return 'Slav'
  return 'Sidelines'
}

export const lineDifficulty = (line: RepertoireLine): RepertoireDifficulty => line.difficulty ?? 'club'

export const lineSummary = (line: RepertoireLine) =>
  line.summary ?? `${line.opening} line with ${line.moves.filter((move) => move.train).length} trainable White moves.`

export const lineStudyOrder = (line: RepertoireLine) => line.studyOrder ?? Number.MAX_SAFE_INTEGER

export const isQuickstartLine = (line: RepertoireLine) => line.tags.includes('quickstart')

export const sortByStudyOrder = (lines: RepertoireLine[]) =>
  [...lines].sort((a, b) => lineStudyOrder(a) - lineStudyOrder(b) || a.title.localeCompare(b.title))

export const linesForChapter = (lines: RepertoireLine[], chapter: BrowserChapter) => {
  const sorted = sortByStudyOrder(lines)
  if (chapter === 'Quickstart') return sorted.filter(isQuickstartLine)
  return sorted.filter((line) => lineChapter(line) === chapter)
}

export type RepertoireFilters = {
  chapter: BrowserChapter
  search: string
  difficulty: 'All levels' | RepertoireDifficulty
  tag: string
  showCompleted: boolean
}

export const filterRepertoireLines = (lines: RepertoireLine[], progress: StoredProgress, filters: RepertoireFilters) => {
  const query = filters.search.trim().toLowerCase()
  return linesForChapter(lines, filters.chapter).filter((line) => {
    const matchesSearch =
      !query ||
      [line.title, line.opening, line.eco, lineSummary(line), ...line.tags, ...(line.ideas ?? [])]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query))
    const matchesDifficulty = filters.difficulty === 'All levels' || lineDifficulty(line) === filters.difficulty
    const matchesTag = filters.tag === 'All tags' || line.tags.includes(filters.tag)
    const matchesCompleted = filters.showCompleted || !progress.completedLineIds.includes(line.id)
    return matchesSearch && matchesDifficulty && matchesTag && matchesCompleted
  })
}

export const tagsForLines = (lines: RepertoireLine[]) =>
  ['All tags', ...Array.from(new Set(lines.flatMap((line) => line.tags).filter((tag) => tag !== 'quickstart'))).sort()]

export const chapterMetrics = (lines: RepertoireLine[], progress: StoredProgress, chapter: BrowserChapter) => {
  const chapterLines = linesForChapter(lines, chapter)
  const completed = chapterLines.filter((line) => progress.completedLineIds.includes(line.id)).length
  const attempts = chapterLines.reduce((sum, line) => sum + (progress.lineStats[line.id]?.attempts ?? 0), 0)
  const correct = chapterLines.reduce((sum, line) => sum + (progress.lineStats[line.id]?.correct ?? 0), 0)
  const mistakes = chapterLines.reduce((sum, line) => sum + (progress.lineStats[line.id]?.mistakes ?? 0), 0)
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0
  return { total: chapterLines.length, completed, accuracy, mistakes }
}

export const getNextLineInChapter = (lines: RepertoireLine[], currentLineId: string) => {
  const current = lines.find((line) => line.id === currentLineId)
  if (!current) return sortByStudyOrder(lines)[0]
  const chapterLines = linesForChapter(lines, lineChapter(current))
  const currentIndex = chapterLines.findIndex((line) => line.id === currentLineId)
  if (currentIndex === -1) return chapterLines[0] ?? sortByStudyOrder(lines)[0]
  return chapterLines[(currentIndex + 1) % chapterLines.length]
}

export const lineStatsSummary = (stats?: LineStats) => ({
  accuracy: lineAccuracy(stats),
  mistakes: stats?.mistakes ?? 0,
  attempts: stats?.attempts ?? 0,
})
