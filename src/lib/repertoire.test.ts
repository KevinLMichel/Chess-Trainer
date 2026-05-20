import { describe, expect, it } from 'vitest'
import { starterRepertoire } from '../data/repertoire'
import { defaultProgress } from './storage'
import {
  chapterMetrics,
  filterRepertoireLines,
  getNextLineInChapter,
  isQuickstartLine,
  linesForChapter,
  repertoireChapters,
  sortByStudyOrder,
  tagsForLines,
  type BrowserChapter,
} from './repertoire'

describe('repertoire browser helpers', () => {
  it('groups the starter repertoire into curated chapters', () => {
    const expectedCounts: Record<BrowserChapter, number> = {
      Quickstart: 12,
      QGA: 25,
      QGD: 21,
      Slav: 13,
      'Semi-Slav': 11,
      Sidelines: 10,
      'User Lines': 0,
    }

    for (const chapter of repertoireChapters) {
      expect(linesForChapter(starterRepertoire, chapter), chapter).toHaveLength(expectedCounts[chapter])
    }
  })

  it('keeps quickstart as a beginner-friendly path across chapters', () => {
    const quickstart = linesForChapter(starterRepertoire, 'Quickstart')

    expect(quickstart.length).toBeGreaterThan(8)
    expect(quickstart.every(isQuickstartLine)).toBe(true)
    expect(new Set(quickstart.map((line) => line.chapter))).toEqual(new Set(['QGA', 'QGD', 'Slav', 'Semi-Slav', 'Sidelines']))
  })

  it('filters by search, level, tag, and completion state', () => {
    const progress = defaultProgress()
    const completedLine = linesForChapter(starterRepertoire, 'QGA')[0]
    const withCompletion = { ...progress, completedLineIds: [completedLine.id] }

    expect(
      filterRepertoireLines(starterRepertoire, progress, {
        chapter: 'QGA',
        search: '3.e4 c5',
        difficulty: 'All levels',
        tag: 'All tags',
        showCompleted: true,
      }).map((line) => line.id),
    ).toContain('qga-3-e4-c5')

    expect(
      filterRepertoireLines(starterRepertoire, progress, {
        chapter: 'QGD',
        search: '',
        difficulty: 'club',
        tag: 'tarrasch',
        showCompleted: true,
      }).every((line) => line.difficulty === 'club' && line.tags.includes('tarrasch')),
    ).toBe(true)

    expect(
      filterRepertoireLines(starterRepertoire, withCompletion, {
        chapter: 'QGA',
        search: '',
        difficulty: 'All levels',
        tag: 'All tags',
        showCompleted: false,
      }).some((line) => line.id === completedLine.id),
    ).toBe(false)
  })

  it('summarizes chapters and keeps tag filters compact', () => {
    const metrics = chapterMetrics(starterRepertoire, defaultProgress(), 'QGA')
    const tags = tagsForLines(starterRepertoire)

    expect(metrics).toMatchObject({ total: 25, completed: 0, accuracy: 0, mistakes: 0 })
    expect(tags[0]).toBe('All tags')
    expect(tags).toContain('center')
    expect(tags).not.toContain('quickstart')
  })

  it('advances to the next line inside the current chapter', () => {
    const qga = linesForChapter(starterRepertoire, 'QGA')
    const ordered = sortByStudyOrder(starterRepertoire)

    expect(getNextLineInChapter(starterRepertoire, qga[0].id)?.id).toBe(qga[1].id)
    expect(getNextLineInChapter(starterRepertoire, qga[qga.length - 1].id)?.id).toBe(qga[0].id)
    expect(getNextLineInChapter(starterRepertoire, 'missing-line')?.id).toBe(ordered[0].id)
  })
})
