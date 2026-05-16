import { Chess } from 'chess.js'
import type { RepertoireLine, RepertoireMove, Side } from '../types/repertoire'
import { colorToSide } from './trainerEngine'

export type PgnDraft = {
  title: string
  opening: string
  tags: string[]
  moves: RepertoireMove[]
}

const RESULT_TOKENS = new Set(['1-0', '0-1', '1/2-1/2', '*'])

export const stripPgnMetadata = (input: string) =>
  input
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+\.(\.\.)?/g, ' ')
    .replace(/\$\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const extractHeader = (input: string, name: string) => {
  const match = input.match(new RegExp(`\\[${name}\\s+"([^"]+)"\\]`, 'i'))
  return match?.[1]
}

export const parseSanMoveText = (input: string, trainAs: Side = 'white'): RepertoireMove[] => {
  const chess = new Chess()
  const tokens = stripPgnMetadata(input)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !RESULT_TOKENS.has(token))

  return tokens.map((token) => {
    const side = colorToSide(chess.turn())
    const move = chess.move(token)
    return {
      san: move.san,
      side,
      train: side === trainAs,
    }
  })
}

export const parsePgnDraft = (input: string, fallbackTitle = 'Custom Queen Gambit Line'): PgnDraft => {
  const opening = extractHeader(input, 'Opening') ?? 'Custom Opening'
  const title = extractHeader(input, 'Variation') ?? opening ?? fallbackTitle
  return {
    title,
    opening,
    tags: opening
      .split(/\s+/)
      .filter((part) => part.length > 3)
      .slice(0, 3),
    moves: parseSanMoveText(input),
  }
}

export const buildLineFromSan = (params: {
  id: string
  title: string
  opening: string
  tags: string[]
  sanText: string
}): RepertoireLine => ({
  id: params.id,
  title: params.title,
  opening: params.opening,
  trainAs: 'white',
  startingFen: 'startpos',
  tags: params.tags,
  source: 'user',
  moves: parseSanMoveText(params.sanText),
})
