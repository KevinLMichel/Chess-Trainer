import { Chess, type Move, type PieceSymbol, type Square } from 'chess.js'
import type {
  MoveAttempt,
  PositionTarget,
  RepertoireLine,
  RepertoireMove,
  ReviewItem,
  TrainingSession,
  UserSettings,
} from '../types/repertoire'

const START_FEN = new Chess().fen()

export type AttemptResult = {
  session: TrainingSession
  correct: boolean
  expectedSan?: string
  userSan?: string
  opponentReplies: Move[]
  completed: boolean
  mistake?: ReviewItem
}

export type LineValidationResult = {
  valid: boolean
  errors: string[]
}

export const createChess = (fen: 'startpos' | string = 'startpos') => {
  if (fen === 'startpos') return new Chess()
  return new Chess(fen)
}

export const chessFromFen = (fen: string) => new Chess(fen)

export const normalizeSan = (san: string) =>
  san
    .trim()
    .replace(/[+#?!]+$/g, '')
    .replace(/^0/g, 'O')
    .replace(/=([QRBN])$/g, '=$1')

export const sideToColor = (side: 'white' | 'black') => (side === 'white' ? 'w' : 'b')

export const colorToSide = (color: 'w' | 'b') => (color === 'w' ? 'white' : 'black')

export const lineTrainableMoves = (line: RepertoireLine) => line.moves.filter((move) => move.train).length

export const completedTrainableMoves = (line: RepertoireLine, moveIndex: number) =>
  line.moves.slice(0, moveIndex).filter((move) => move.train).length

export const getExpectedMove = (
  line: RepertoireLine,
  session: TrainingSession,
): RepertoireMove | undefined => {
  if (session.expectedOverrideSan) {
    return {
      san: session.expectedOverrideSan,
      side: line.trainAs,
      train: true,
      note: session.expectedOverrideNote,
    }
  }

  return line.moves[session.moveIndex]
}

export const replayLineToIndex = (line: RepertoireLine, moveIndex: number) => {
  const chess = createChess(line.startingFen)
  const errors: string[] = []

  for (let index = 0; index < moveIndex; index += 1) {
    const move = line.moves[index]
    try {
      const result = chess.move(move.san)
      if (!result) errors.push(`Move ${index + 1} (${move.san}) could not be applied.`)
      if (result && colorToSide(result.color) !== move.side) {
        errors.push(`Move ${index + 1} (${move.san}) has side ${move.side}, but chess.js read ${result.color}.`)
      }
    } catch {
      errors.push(`Move ${index + 1} (${move.san}) is illegal from the current position.`)
    }
  }

  return { chess, errors }
}

export const validateLine = (line: RepertoireLine): LineValidationResult => {
  const { errors } = replayLineToIndex(line, line.moves.length)
  const sideErrors = line.moves.flatMap((move, index) => {
    if (move.train && move.side !== line.trainAs) {
      return [`Move ${index + 1} (${move.san}) is marked train=true but is not ${line.trainAs}.`]
    }
    return []
  })

  return {
    valid: errors.length === 0 && sideErrors.length === 0,
    errors: [...errors, ...sideErrors],
  }
}

export const createLineSession = (
  line: RepertoireLine,
  mode: TrainingSession['mode'] = 'practice',
  settings?: UserSettings,
): TrainingSession => {
  const session: TrainingSession = {
    id: `${mode}-${line.id}-${Date.now()}`,
    mode,
    lineId: line.id,
    fen: createChess(line.startingFen).fen(),
    moveIndex: 0,
    status: 'awaiting-user',
    feedback: "What's the best move?",
    totalTrainableMoves: lineTrainableMoves(line),
    completedTrainableMoves: 0,
    startedAt: Date.now(),
  }

  return advanceForcedMoves(line, session, settings?.autoPlayOpponent ?? true, true).session
}

export const createPositionSession = (
  target: PositionTarget | ReviewItem,
  mode: Extract<TrainingSession['mode'], 'drill' | 'mistakes'>,
): TrainingSession => ({
  id: `${mode}-${target.id}-${Date.now()}`,
  mode,
  lineId: target.lineId,
  fen: target.fen,
  moveIndex: target.moveIndex,
  status: 'awaiting-user',
  feedback: "What's the best move?",
  expectedOverrideSan: target.expectedSan,
  expectedOverrideNote: target.note,
  reviewItemId: 'priority' in target ? target.id : undefined,
  totalTrainableMoves: 1,
  completedTrainableMoves: 0,
  startedAt: Date.now(),
})

export const advanceForcedMoves = (
  line: RepertoireLine,
  session: TrainingSession,
  autoPlayOpponent: boolean,
  forceAtSessionStart = false,
) => {
  const chess = chessFromFen(session.fen)
  const replies: Move[] = []
  let moveIndex = session.moveIndex
  let lastMove = session.lastMove

  while (moveIndex < line.moves.length) {
    const nextMove = line.moves[moveIndex]
    if (nextMove.train) break
    if (!autoPlayOpponent && !forceAtSessionStart) {
      return {
        session: {
          ...session,
          status: 'opponent-ready' as const,
          feedback: `Ready for Black's reply: ${nextMove.san}`,
          moveIndex,
          fen: chess.fen(),
          lastMove,
          completedTrainableMoves: completedTrainableMoves(line, moveIndex),
        },
        replies,
      }
    }

    const applied = chess.move(nextMove.san)
    replies.push(applied)
    lastMove = { from: applied.from, to: applied.to }
    moveIndex += 1
  }

  const complete = moveIndex >= line.moves.length
  return {
    session: {
      ...session,
      fen: chess.fen(),
      moveIndex,
      lastMove,
      status: complete ? ('complete' as const) : ('awaiting-user' as const),
      feedback: complete ? 'Line complete.' : "What's the best move?",
      completedTrainableMoves: completedTrainableMoves(line, moveIndex),
    },
    replies,
  }
}

export const playOpponentReply = (line: RepertoireLine, session: TrainingSession) =>
  advanceForcedMoves(line, session, true).session

export const attemptMove = (
  line: RepertoireLine,
  session: TrainingSession,
  attempt: MoveAttempt,
  settings: UserSettings,
): AttemptResult => {
  const expected = getExpectedMove(line, session)
  if (!expected) {
    return {
      session: { ...session, status: 'complete', feedback: 'Line complete.' },
      correct: false,
      opponentReplies: [],
      completed: true,
    }
  }

  const chess = chessFromFen(session.fen)
  const expectedChess = chessFromFen(session.fen)
  let expectedMove: Move | null
  let userMove: Move | null

  try {
    expectedMove = expectedChess.move(expected.san)
  } catch {
    expectedMove = null
  }

  try {
    userMove = chess.move({
      from: attempt.from as Square,
      to: attempt.to as Square,
      promotion: attempt.promotion ?? 'q',
    })
  } catch {
    userMove = null
  }

  const expectedSan = expectedMove?.san ?? expected.san
  const legalWrongMove = userMove ? { from: userMove.from, to: userMove.to } : { from: attempt.from, to: attempt.to }
  const isCorrect = Boolean(
    userMove &&
      expectedMove &&
      (normalizeSan(userMove.san) === normalizeSan(expectedMove.san) ||
        (userMove.from === expectedMove.from &&
          userMove.to === expectedMove.to &&
          (userMove.promotion ?? '') === (expectedMove.promotion ?? ''))),
  )

  if (!isCorrect) {
    const mistake = createReviewItem(line, session, expectedSan)
    return {
      session: {
        ...session,
        status: 'wrong',
        feedback: 'Try again.',
        wrongMove: legalWrongMove,
        correctMove: undefined,
      },
      correct: false,
      expectedSan,
      userSan: userMove?.san,
      opponentReplies: [],
      completed: false,
      mistake,
    }
  }

  const correctSession: TrainingSession = {
    ...session,
    fen: chess.fen(),
    moveIndex: session.expectedOverrideSan ? session.moveIndex : session.moveIndex + 1,
    status: session.expectedOverrideSan ? 'complete' : 'correct',
    feedback: 'Correct.',
    explanation: expected.note,
    lastMove: { from: userMove!.from, to: userMove!.to },
    correctMove: { from: expectedMove!.from, to: expectedMove!.to },
    wrongMove: undefined,
    completedTrainableMoves: session.expectedOverrideSan
      ? 1
      : completedTrainableMoves(line, session.moveIndex + 1),
  }

  if (session.expectedOverrideSan) {
    return {
      session: { ...correctSession, feedback: 'Correct. Position complete.' },
      correct: true,
      expectedSan,
      userSan: userMove!.san,
      opponentReplies: [],
      completed: true,
    }
  }

  const advanced = advanceForcedMoves(line, correctSession, settings.autoPlayOpponent)
  const replyText = advanced.replies.length
    ? ` Black replies ${advanced.replies.map((reply) => reply.san).join(', ')}.`
    : ''
  const completed = advanced.session.status === 'complete'

  return {
    session: {
      ...advanced.session,
      status: completed ? 'complete' : advanced.session.status,
      feedback: completed ? 'Line complete.' : `Correct.${replyText}`,
      explanation: expected.note,
      correctMove: correctSession.correctMove,
    },
    correct: true,
    expectedSan,
    userSan: userMove!.san,
    opponentReplies: advanced.replies,
    completed,
  }
}

export const revealAnswer = (line: RepertoireLine, session: TrainingSession, settings: UserSettings) => {
  const expected = getExpectedMove(line, session)
  if (!expected) return session
  const chess = chessFromFen(session.fen)
  const move = chess.move(expected.san)
  const nextSession: TrainingSession = {
    ...session,
    fen: chess.fen(),
    moveIndex: session.expectedOverrideSan ? session.moveIndex : session.moveIndex + 1,
    status: session.expectedOverrideSan ? 'complete' : 'correct',
    feedback: `Best move: ${move.san}`,
    explanation: expected.note,
    lastMove: { from: move.from, to: move.to },
    correctMove: { from: move.from, to: move.to },
    completedTrainableMoves: session.expectedOverrideSan
      ? 1
      : completedTrainableMoves(line, session.moveIndex + 1),
  }

  if (session.expectedOverrideSan) return { ...nextSession, status: 'complete' as const }
  return advanceForcedMoves(line, nextSession, settings.autoPlayOpponent).session
}

export const createReviewItem = (
  line: RepertoireLine,
  session: TrainingSession,
  expectedSan: string,
): ReviewItem => {
  const now = new Date().toISOString()
  return {
    id: `${line.id}-${session.moveIndex}-${session.fen.split(' ')[0]}`,
    lineId: line.id,
    lineTitle: line.title,
    opening: line.opening,
    fen: session.fen,
    expectedSan,
    moveIndex: session.moveIndex,
    note: getExpectedMove(line, session)?.note,
    misses: 1,
    successes: 0,
    priority: 2,
    createdAt: now,
    lastSeenAt: now,
  }
}

export const getLegalMoves = (fen: string, square?: string) => {
  const chess = chessFromFen(fen)
  if (!square) return []
  return chess.moves({ square: square as Square, verbose: true })
}

export const getLegalDestinations = (fen: string, square?: string) =>
  getLegalMoves(fen, square).map((move) => move.to)

export const makePositionTargets = (lines: RepertoireLine[]): PositionTarget[] =>
  lines.flatMap((line) => {
    const targets: PositionTarget[] = []
    const chess = createChess(line.startingFen)

    line.moves.forEach((move, index) => {
      if (move.train) {
        targets.push({
          id: `${line.id}-${index}`,
          lineId: line.id,
          lineTitle: line.title,
          opening: line.opening,
          moveIndex: index,
          fen: chess.fen(),
          expectedSan: move.san,
          note: move.note,
          tags: line.tags,
        })
      }

      chess.move(move.san)
    })

    return targets
  })

export const pieceNameForMove = (fen: string, expectedSan: string) => {
  const chess = chessFromFen(fen)
  const move = chess.move(expectedSan)
  const pieceNames: Record<PieceSymbol, string> = {
    p: 'pawn',
    n: 'knight',
    b: 'bishop',
    r: 'rook',
    q: 'queen',
    k: 'king',
  }

  if (move.piece === 'p') {
    return `Move the ${move.from[0]}-pawn.`
  }

  return `Move the ${pieceNames[move.piece]} from ${move.from}.`
}

export const destinationHintForMove = (fen: string, expectedSan: string) => {
  const chess = chessFromFen(fen)
  const move = chess.move(expectedSan)
  return `The move goes to ${move.to}.`
}

export const safeFen = (fen?: string) => (fen && fen !== 'startpos' ? fen : START_FEN)
