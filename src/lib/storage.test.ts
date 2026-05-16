import { describe, expect, it } from 'vitest'
import { starterRepertoire } from '../data/repertoire'
import { createLineSession, createReviewItem } from './trainerEngine'
import {
  defaultProgress,
  defaultSettings,
  exportProgressJson,
  importProgressJson,
  recordMistake,
  recordReviewCorrect,
} from './storage'

describe('storage helpers', () => {
  it('round-trips exported progress', () => {
    const progress = defaultProgress()
    const imported = importProgressJson(exportProgressJson({ ...progress, score: 42 }))

    expect(imported.score).toBe(42)
    expect(imported.settings).toMatchObject(defaultSettings)
  })

  it('deduplicates repeated mistakes and raises priority', () => {
    const line = starterRepertoire[0]
    const session = createLineSession(line, 'practice', defaultSettings)
    const mistake = createReviewItem(line, session, 'd4')

    const once = recordMistake(defaultProgress(), line.id, mistake)
    const twice = recordMistake(once, line.id, mistake)

    expect(twice.reviewQueue).toHaveLength(1)
    expect(twice.reviewQueue[0].misses).toBe(2)
    expect(twice.reviewQueue[0].priority).toBeGreaterThan(once.reviewQueue[0].priority)
  })

  it('reduces review priority after a correct review answer', () => {
    const line = starterRepertoire[0]
    const session = createLineSession(line, 'practice', defaultSettings)
    const mistake = createReviewItem(line, session, 'd4')
    const progress = recordMistake(defaultProgress(), line.id, mistake)
    const reviewed = recordReviewCorrect(progress, mistake.id)

    expect(reviewed.score).toBe(15)
    expect(reviewed.bestStreak).toBe(1)
    expect(reviewed.reviewQueue[0]?.priority ?? 0).toBeLessThanOrEqual(mistake.priority)
  })
})
