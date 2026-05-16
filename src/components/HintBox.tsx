import { destinationHintForMove, pieceNameForMove } from '../lib/trainerEngine'

type HintBoxProps = {
  fen: string
  expectedSan?: string
  hintLevel: number
}

export function HintBox({ fen, expectedSan, hintLevel }: HintBoxProps) {
  if (!expectedSan || hintLevel <= 0) return null

  let text = ''
  if (hintLevel === 1) text = pieceNameForMove(fen, expectedSan)
  if (hintLevel === 2) text = destinationHintForMove(fen, expectedSan)
  if (hintLevel >= 3) text = `Best move: ${expectedSan}.`

  return <div className="hint-box">{text}</div>
}
