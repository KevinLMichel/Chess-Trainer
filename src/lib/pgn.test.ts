import { describe, expect, it } from 'vitest'
import { buildLineFromSan, parsePgnDraft, parseSanMoveText } from './pgn'
import { validateLine } from './trainerEngine'

describe('PGN and SAN import helpers', () => {
  it('parses SAN move text into trainable White moves', () => {
    const moves = parseSanMoveText('1. d4 d5 2. c4 dxc4 3. e4 e5')

    expect(moves.map((move) => move.san)).toEqual(['d4', 'd5', 'c4', 'dxc4', 'e4', 'e5'])
    expect(moves.filter((move) => move.train).map((move) => move.san)).toEqual(['d4', 'c4', 'e4'])
  })

  it('extracts PGN headers into a draft line', () => {
    const draft = parsePgnDraft('[Opening "Queen\'s Gambit Accepted"]\n1. d4 d5 2. c4 dxc4 3. e4')

    expect(draft.opening).toBe("Queen's Gambit Accepted")
    expect(draft.moves.at(-1)?.san).toBe('e4')
  })

  it('builds a valid custom line from SAN text', () => {
    const line = buildLineFromSan({
      id: 'user-test',
      title: 'Imported QGA',
      opening: "Queen's Gambit Accepted",
      tags: ['custom'],
      sanText: '1. d4 d5 2. c4 dxc4 3. Nf3 Nf6 4. e3',
    })

    expect(validateLine(line).valid).toBe(true)
  })
})
