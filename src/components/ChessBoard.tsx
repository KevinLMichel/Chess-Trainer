import { useEffect, useMemo, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { getLegalDestinations } from '../lib/trainerEngine'
import type { BoardOrientation, BoardTheme, MoveHighlight } from '../types/repertoire'

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['1', '2', '3', '4', '5', '6', '7', '8']

type Piece = {
  color: Color
  type: PieceSymbol
}

type ChessBoardProps = {
  fen: string
  orientation: BoardOrientation
  boardTheme: BoardTheme
  showLegalMoves: boolean
  showCoordinates: boolean
  lastMove?: MoveHighlight
  correctMove?: MoveHighlight
  wrongMove?: MoveHighlight
  onMove: (from: string, to: string, promotion?: string) => void
}

type DragState = {
  from: string
  piece: Piece
  x: number
  y: number
}

const pieceKey = (piece: Piece) => `${piece.color}${piece.type.toUpperCase()}`

const pieceSrc = (piece: Piece) => `${import.meta.env.BASE_URL}pieces/${pieceKey(piece)}.svg`

const squareFromPoint = (
  board: HTMLDivElement,
  clientX: number,
  clientY: number,
  orientation: BoardOrientation,
) => {
  const rect = board.getBoundingClientRect()
  const size = rect.width / 8
  const fileIndex = Math.floor((clientX - rect.left) / size)
  const rankIndex = Math.floor((clientY - rect.top) / size)

  if (fileIndex < 0 || fileIndex > 7 || rankIndex < 0 || rankIndex > 7) return undefined

  const file = orientation === 'white' ? files[fileIndex] : files[7 - fileIndex]
  const rank = orientation === 'white' ? ranks[7 - rankIndex] : ranks[rankIndex]
  return `${file}${rank}`
}

const buildBoard = (fen: string) => {
  const chess = new Chess(fen)
  const board = new Map<string, Piece>()

  chess.board().forEach((row, rowIndex) => {
    row.forEach((piece, fileIndex) => {
      if (!piece) return
      const square = `${files[fileIndex]}${8 - rowIndex}`
      board.set(square, piece)
    })
  })

  return { chess, board }
}

export function ChessBoard({
  fen,
  orientation,
  boardTheme,
  showLegalMoves,
  showCoordinates,
  lastMove,
  correctMove,
  wrongMove,
  onMove,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null)
  const [selected, setSelected] = useState<string>()
  const [drag, setDrag] = useState<DragState>()
  const { chess, board } = useMemo(() => buildBoard(fen), [fen])
  const turn = chess.turn()
  const orderedFiles = orientation === 'white' ? files : [...files].reverse()
  const orderedRanks = orientation === 'white' ? [...ranks].reverse() : ranks
  const legalDestinations = useMemo(
    () => (showLegalMoves && selected ? getLegalDestinations(fen, selected) : []),
    [fen, selected, showLegalMoves],
  )

  useEffect(() => {
    if (!drag) return

    const handleMove = (event: PointerEvent) => {
      setDrag((current) => (current ? { ...current, x: event.clientX, y: event.clientY } : current))
    }

    const handleUp = (event: PointerEvent) => {
      const square = boardRef.current
        ? squareFromPoint(boardRef.current, event.clientX, event.clientY, orientation)
        : undefined
      if (square && square !== drag.from) onMove(drag.from, square, 'q')
      setDrag(undefined)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp, { once: true })
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [drag, onMove, orientation])

  const selectOrMove = (square: string) => {
    const piece = board.get(square)
    if (!selected) {
      if (piece && piece.color === turn) setSelected(square)
      return
    }

    if (square === selected) {
      setSelected(undefined)
      return
    }

    if (piece && piece.color === turn) {
      setSelected(square)
      return
    }

    setSelected(undefined)
    onMove(selected, square, 'q')
  }

  const startDrag = (event: ReactPointerEvent, square: string, piece: Piece) => {
    if (piece.color !== turn) return
    event.preventDefault()
    setSelected(square)
    setDrag({ from: square, piece, x: event.clientX, y: event.clientY })
  }

  return (
    <div className={`board-wrap board-${boardTheme}`}>
      <div ref={boardRef} className="chess-board" role="grid" aria-label="Chess board">
        {orderedRanks.flatMap((rank, rankIndex) =>
          orderedFiles.map((file, fileIndex) => {
            const square = `${file}${rank}` as Square
            const piece = board.get(square)
            const isLight = (fileIndex + rankIndex) % 2 === 0
            const isSelected = selected === square
            const isLast = lastMove?.from === square || lastMove?.to === square
            const isCorrect = correctMove?.from === square || correctMove?.to === square
            const isWrong = wrongMove?.from === square || wrongMove?.to === square
            const isLegal = legalDestinations.includes(square)
            const showFile = showCoordinates && rank === (orientation === 'white' ? '1' : '8')
            const showRank = showCoordinates && file === (orientation === 'white' ? 'a' : 'h')

            return (
              <button
                key={square}
                data-square={square}
                className={[
                  'board-square',
                  isLight ? 'light' : 'dark',
                  isSelected ? 'selected' : '',
                  isLast ? 'last' : '',
                  isCorrect ? 'correct' : '',
                  isWrong ? 'wrong' : '',
                  isLegal ? 'legal' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                type="button"
                role="gridcell"
                aria-label={square}
                onClick={() => selectOrMove(square)}
              >
                {showRank ? <span className="coord rank">{rank}</span> : null}
                {showFile ? <span className="coord file">{file}</span> : null}
                {isLegal && !piece ? <span className="legal-dot" /> : null}
                {isLegal && piece ? <span className="legal-ring" /> : null}
                {piece ? (
                  <img
                    className={drag?.from === square ? 'piece dragging-source' : 'piece'}
                    src={pieceSrc(piece)}
                    alt={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                    draggable={false}
                    onPointerDown={(event) => startDrag(event, square, piece)}
                  />
                ) : null}
              </button>
            )
          }),
        )}
        {drag ? (
          <img
            className="drag-piece"
            src={pieceSrc(drag.piece)}
            alt=""
            style={{ transform: `translate(${drag.x}px, ${drag.y}px)` }}
            draggable={false}
          />
        ) : null}
      </div>
    </div>
  )
}
