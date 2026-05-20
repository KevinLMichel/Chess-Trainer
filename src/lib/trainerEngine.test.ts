import { describe, expect, it } from 'vitest'
import { Chess } from 'chess.js'
import { starterRepertoire } from '../data/repertoire'
import { defaultSettings } from './storage'
import { attemptMove, createLineSession, getExpectedMove, validateLine } from './trainerEngine'

describe('trainerEngine', () => {
  it('ships a 16-line starter repertoire', () => {
    expect(starterRepertoire).toHaveLength(16)
  })

  it('validates every starter line', () => {
    for (const line of starterRepertoire) {
      expect(validateLine(line), line.title).toMatchObject({ valid: true, errors: [] })
    }
  })

  it('accepts the first correct White move and auto-plays Black reply', () => {
    const line = starterRepertoire[0]
    const session = createLineSession(line, 'practice', defaultSettings)
    const result = attemptMove(line, session, { from: 'd2', to: 'd4' }, defaultSettings)

    expect(result.correct).toBe(true)
    expect(result.opponentReplies.map((move) => move.san)).toEqual(['d5'])
    expect(result.session.moveIndex).toBe(2)
    expect(getExpectedMove(line, result.session)?.san).toBe('c4')
  })

  it('rejects legal but incorrect moves and creates a review item', () => {
    const line = starterRepertoire[0]
    const session = createLineSession(line, 'practice', defaultSettings)
    const result = attemptMove(line, session, { from: 'e2', to: 'e4' }, defaultSettings)

    expect(result.correct).toBe(false)
    expect(result.session.status).toBe('wrong')
    expect(result.mistake?.expectedSan).toBe('d4')
  })

  it('can complete an entire starter line by replaying expected trainable moves', () => {
    const line = starterRepertoire[0]
    let session = createLineSession(line, 'practice', defaultSettings)

    while (session.status !== 'complete') {
      const expected = getExpectedMove(line, session)
      expect(expected).toBeDefined()
      const chess = new Chess(session.fen)
      const move = chess.move(expected!.san)
      const result = attemptMove(line, session, { from: move.from, to: move.to }, defaultSettings)
      expect(result.correct).toBe(true)
      session = result.session
    }

    expect(session.completedTrainableMoves).toBe(5)
  })
})
