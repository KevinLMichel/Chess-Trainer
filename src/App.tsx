import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, Minimize2, Plus, RotateCcw, Settings, StepForward, SwitchCamera, Target } from 'lucide-react'
import { ChessBoard } from './components/ChessBoard'
import { AddLineForm } from './components/AddLineForm'
import { LearningPanel } from './components/LearningPanel'
import { MistakeReview } from './components/MistakeReview'
import { ProgressBar } from './components/ProgressBar'
import { RepertoireBrowser } from './components/RepertoireBrowser'
import { SettingsPanel } from './components/SettingsPanel'
import { TopBar } from './components/TopBar'
import { TrainingPanel } from './components/TrainingPanel'
import { starterRepertoire } from './data/repertoire'
import {
  advanceForcedMoves,
  attemptMove,
  createLineSession,
  createPositionSession,
  createReviewItem,
  getExpectedMove,
  makePositionTargets,
  revealAnswer,
  replayLineToIndex,
  validateLine,
} from './lib/trainerEngine'
import {
  defaultProgress,
  exportProgressJson,
  exportRepertoireJson,
  importProgressJson,
  importRepertoireJson,
  loadProgress,
  normalizeProgress,
  recordCorrectMove,
  recordMistake,
  recordReviewCorrect,
  recordReviewMistake,
  saveProgress,
} from './lib/storage'
import { playMoveClick } from './lib/sound'
import type { RepertoireLine, TrainerMode, TrainingSession } from './types/repertoire'

const firstLine = starterRepertoire[0]
const OPPONENT_REPLY_DELAY_MS = 1000

const pickRandom = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

const applyOpponentReply = (line: RepertoireLine, currentSession: TrainingSession) => {
  const advanced = advanceForcedMoves(line, currentSession, true)
  const replyText = advanced.replies.length
    ? `Black replies ${advanced.replies.map((reply) => reply.san).join(', ')}.`
    : ''

  return {
    ...advanced.session,
    feedback:
      advanced.session.status === 'complete'
        ? 'Line complete.'
        : replyText
          ? `${replyText} What's the best move?`
          : advanced.session.feedback,
  }
}

function App() {
  const [progress, setProgress] = useState(() => loadProgress())
  const allLines = useMemo(() => [...starterRepertoire, ...progress.userLines], [progress.userLines])
  const [selectedLineId, setSelectedLineId] = useState(progress.currentLineId ?? firstLine.id)
  const selectedLine = allLines.find((line) => line.id === selectedLineId) ?? allLines[0]
  const [mode, setMode] = useState<TrainerMode>('practice')
  const [session, setSession] = useState<TrainingSession>(() =>
    createLineSession(selectedLine ?? firstLine, 'practice', progress.settings),
  )
  const [hintLevel, setHintLevel] = useState(0)
  const [openingFilter, setOpeningFilter] = useState('All openings')
  const [learnIndex, setLearnIndex] = useState(0)
  const [toast, setToast] = useState('')
  const [focusMode, setFocusMode] = useState(false)
  const opponentReplyTimer = useRef<number | undefined>(undefined)
  const soundEnabledRef = useRef(progress.settings.sound)

  useEffect(() => {
    saveProgress(progress)
    soundEnabledRef.current = progress.settings.sound
  }, [progress])

  const updateProgress = useCallback((updater: (current: typeof progress) => typeof progress) => {
    setProgress((current) => normalizeProgress(updater(current)))
  }, [])

  const clearOpponentReplyTimer = useCallback(() => {
    if (opponentReplyTimer.current) {
      window.clearTimeout(opponentReplyTimer.current)
      opponentReplyTimer.current = undefined
    }
  }, [])

  useEffect(() => clearOpponentReplyTimer, [clearOpponentReplyTimer])

  const scheduleOpponentReply = useCallback(
    (line: RepertoireLine, pendingSession: TrainingSession) => {
      clearOpponentReplyTimer()
      opponentReplyTimer.current = window.setTimeout(() => {
        setSession((current) => {
          const isStillPending =
            current.id === pendingSession.id &&
            current.lineId === pendingSession.lineId &&
            current.status === 'opponent-ready' &&
            current.moveIndex === pendingSession.moveIndex &&
            current.fen === pendingSession.fen

          if (!isStillPending) return current
          const replySession = applyOpponentReply(line, current)
          void playMoveClick(soundEnabledRef.current)
          return replySession
        })
        opponentReplyTimer.current = undefined
      }, OPPONENT_REPLY_DELAY_MS)
    },
    [clearOpponentReplyTimer],
  )

  const startLine = useCallback(
    (lineId: string, nextMode: Extract<TrainingSession['mode'], 'practice' | 'run'> = 'practice') => {
      clearOpponentReplyTimer()
      const line = allLines.find((candidate) => candidate.id === lineId) ?? allLines[0]
      setSelectedLineId(line.id)
      setMode(nextMode)
      setHintLevel(0)
      setLearnIndex(0)
      setSession(createLineSession(line, nextMode, progress.settings))
      updateProgress((current) => ({ ...current, currentLineId: line.id }))
    },
    [allLines, clearOpponentReplyTimer, progress.settings, updateProgress],
  )

  const startRandomDrill = useCallback(() => {
    clearOpponentReplyTimer()
    const targets = makePositionTargets(allLines)
    const target = pickRandom(targets)
    const line = allLines.find((candidate) => candidate.id === target.lineId) ?? allLines[0]
    setSelectedLineId(line.id)
    setMode('drill')
    setHintLevel(0)
    setSession(createPositionSession(target, 'drill'))
  }, [allLines, clearOpponentReplyTimer])

  const startReview = useCallback(() => {
    clearOpponentReplyTimer()
    const reviewable = progress.reviewQueue
      .filter((item) => allLines.some((line) => line.id === item.lineId))
      .sort((a, b) => b.priority - a.priority || b.misses - a.misses)
    if (!reviewable.length) {
      setMode('mistakes')
      setToast('No missed positions yet.')
      return
    }

    const item = reviewable[0]
    setSelectedLineId(item.lineId)
    setMode('mistakes')
    setHintLevel(0)
    setSession(createPositionSession(item, 'mistakes'))
  }, [allLines, clearOpponentReplyTimer, progress.reviewQueue])

  const nextLine = useCallback(() => {
    if (mode === 'drill') {
      startRandomDrill()
      return
    }
    if (mode === 'mistakes') {
      startReview()
      return
    }

    const currentIndex = allLines.findIndex((line) => line.id === selectedLine.id)
    const next = allLines[(currentIndex + 1) % allLines.length]
    startLine(next.id, mode === 'run' ? 'run' : 'practice')
  }, [allLines, mode, selectedLine.id, startLine, startRandomDrill, startReview])

  const handleMode = (nextMode: TrainerMode) => {
    clearOpponentReplyTimer()
    if (nextMode === 'practice') startLine(selectedLine.id, 'practice')
    else if (nextMode === 'learn') {
      setMode('learn')
      setLearnIndex(0)
    } else if (nextMode === 'drill') startRandomDrill()
    else if (nextMode === 'mistakes') startReview()
    else if (nextMode === 'run') startLine(allLines[0].id, 'run')
    else setMode(nextMode)
  }

  const handleBoardMove = (from: string, to: string, promotion?: string) => {
    if (mode === 'learn' || session.status === 'complete' || session.status === 'opponent-ready') return
    const shouldDelayOpponent = progress.settings.autoPlayOpponent
    const attemptSettings = shouldDelayOpponent
      ? { ...progress.settings, autoPlayOpponent: false }
      : progress.settings
    const result = attemptMove(selectedLine, session, { from, to, promotion }, attemptSettings)
    const nextSession =
      shouldDelayOpponent && result.correct && result.session.status === 'opponent-ready'
        ? { ...result.session, feedback: 'Correct. Black is thinking...' }
        : result.session

    setSession(nextSession)
    setHintLevel(0)

    if (result.correct) {
      void playMoveClick(progress.settings.sound)
      updateProgress((current) => {
        if (mode === 'mistakes' && session.reviewItemId) return recordReviewCorrect(current, session.reviewItemId)
        const markComplete = result.completed && !session.expectedOverrideSan && mode !== 'drill'
        return recordCorrectMove(current, selectedLine.id, markComplete)
      })
    } else if (mode === 'mistakes' && session.reviewItemId) {
      updateProgress((current) => recordReviewMistake(current, session.reviewItemId!))
    } else if (result.mistake) {
      updateProgress((current) => recordMistake(current, selectedLine.id, result.mistake!))
    }

    if (shouldDelayOpponent && result.correct && nextSession.status === 'opponent-ready') {
      scheduleOpponentReply(selectedLine, nextSession)
    }
  }

  const showHint = () => {
    if (!progress.settings.hints) return
    setHintLevel((level) => Math.min(level + 1, 3))
  }

  const showAnswer = () => {
    clearOpponentReplyTimer()
    const expected = getExpectedMove(selectedLine, session)
    if (!expected || session.status === 'complete') return
    const expectedSan = expected.san
    const mistake = createReviewItem(selectedLine, session, expectedSan)
    const answerSettings = progress.settings.autoPlayOpponent
      ? { ...progress.settings, autoPlayOpponent: false }
      : progress.settings
    const answerSession = revealAnswer(selectedLine, session, answerSettings)
    const nextSession =
      progress.settings.autoPlayOpponent && answerSession.status === 'opponent-ready'
        ? { ...answerSession, feedback: `Best move: ${expectedSan}. Black is thinking...` }
        : answerSession

    setSession(nextSession)
    setHintLevel(0)
    void playMoveClick(progress.settings.sound)
    updateProgress((current) => {
      if (mode === 'mistakes' && session.reviewItemId) return recordReviewMistake(current, session.reviewItemId)
      return recordMistake(current, selectedLine.id, mistake)
    })

    if (progress.settings.autoPlayOpponent && nextSession.status === 'opponent-ready') {
      scheduleOpponentReply(selectedLine, nextSession)
    }
  }

  const flipBoard = () => {
    updateProgress((current) => ({
      ...current,
      settings: {
        ...current.settings,
        boardOrientation: current.settings.boardOrientation === 'white' ? 'black' : 'white',
      },
    }))
  }

  const updateSettings = (settings: typeof progress.settings) => {
    updateProgress((current) => ({ ...current, settings }))
  }

  const saveUserLine = (line: RepertoireLine) => {
    updateProgress((current) => ({
      ...current,
      userLines: [...current.userLines.filter((item) => item.id !== line.id), line],
      currentLineId: line.id,
    }))
    setToast('Line saved locally.')
    setTimeout(() => startLine(line.id, 'practice'), 0)
  }

  const importProgress = (raw: string) => {
    try {
      const imported = importProgressJson(raw)
      const importedLines = [...starterRepertoire, ...imported.userLines]
      const line = importedLines.find((candidate) => candidate.id === imported.currentLineId) ?? importedLines[0]
      setProgress(imported)
      setSelectedLineId(line.id)
      setSession(createLineSession(line, 'practice', imported.settings))
      setMode('practice')
      setToast('Progress imported.')
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not import progress.')
    }
  }

  const importRepertoire = (raw: string) => {
    try {
      const imported = importRepertoireJson(raw)
      const valid = imported.filter((line) => validateLine(line).valid)
      updateProgress((current) => ({
        ...current,
        userLines: [...current.userLines.filter((line) => !valid.some((item) => item.id === line.id)), ...valid],
      }))
      setToast(`${valid.length} repertoire lines imported.`)
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not import repertoire.')
    }
  }

  const resetProgress = () => {
    if (!window.confirm('Reset all local progress and user-created lines?')) return
    const next = defaultProgress()
    setProgress(next)
    setSelectedLineId(firstLine.id)
    setSession(createLineSession(firstLine, 'practice', next.settings))
    setMode('practice')
  }

  const learnFen = useMemo(() => replayLineToIndex(selectedLine, learnIndex).chess.fen(), [learnIndex, selectedLine])
  const boardFen = mode === 'learn' ? learnFen : session.fen
  const lineStats = progress.lineStats[selectedLine.id]
  const selectedLineIndex = allLines.findIndex((line) => line.id === selectedLine.id)
  const selectedLineNumber = selectedLineIndex >= 0 ? selectedLineIndex + 1 : 1
  const usesCompactPracticeChrome = mode === 'practice' || mode === 'drill' || mode === 'mistakes' || mode === 'run'

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (event.key.toLowerCase() === 'h') showHint()
      if (event.key.toLowerCase() === 'r') startLine(selectedLine.id, 'practice')
      if (event.key.toLowerCase() === 'n') nextLine()
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  const currentProgressLabel = mode === 'learn' ? 'Learn progress' : 'Line progress'
  const currentProgressValue = mode === 'learn' ? learnIndex : session.completedTrainableMoves
  const currentProgressMax = mode === 'learn' ? selectedLine.moves.length : session.totalTrainableMoves

  return (
    <div className={focusMode ? 'app-shell focus-mode' : 'app-shell'}>
      <TopBar progress={progress} onSettings={() => setMode('settings')} />
      {mode === 'learn' ? <ProgressBar value={currentProgressValue} max={currentProgressMax} label={currentProgressLabel} /> : null}

      {!progress.welcomeDismissed ? (
        <div className="welcome-card">
          <div>
            <span className="eyebrow">First run</span>
            <p>Practice Queen&apos;s Gambit lines offline. Choose the best move for White. Progress stays on this device.</p>
          </div>
          <button type="button" onClick={() => updateProgress((current) => ({ ...current, welcomeDismissed: true }))}>
            Start Practice
          </button>
        </div>
      ) : null}

      <nav className={usesCompactPracticeChrome ? 'app-nav app-nav-compact' : 'app-nav'} aria-label="Primary sections">
        <button className={mode === 'practice' ? 'active' : ''} type="button" onClick={() => startLine(selectedLine.id, 'practice')}>
          <Target size={16} />
          Practice
        </button>
        <button className={mode === 'repertoire' ? 'active' : ''} type="button" onClick={() => setMode('repertoire')}>
          Repertoire
        </button>
        <button className={mode === 'add-line' ? 'active' : ''} type="button" onClick={() => setMode('add-line')}>
          <Plus size={16} />
          Add Line
        </button>
        <button className={mode === 'mistakes' ? 'active' : ''} type="button" onClick={startReview}>
          Mistakes
        </button>
      </nav>

      <main className="trainer-layout">
        <ChessBoard
          key={boardFen}
          fen={boardFen}
          orientation={progress.settings.boardOrientation}
          boardTheme={progress.settings.boardTheme}
          showLegalMoves={progress.settings.showLegalMoves && mode !== 'learn'}
          showCoordinates={progress.settings.showCoordinates}
          lastMove={session.lastMove}
          correctMove={mode === 'learn' ? undefined : session.correctMove}
          wrongMove={mode === 'learn' ? undefined : session.wrongMove}
          onMove={handleBoardMove}
        />
        {mode === 'learn' ? (
          <LearningPanel
            line={selectedLine}
            moveIndex={learnIndex}
            onPrev={() => setLearnIndex((index) => Math.max(index - 1, 0))}
            onNext={() => setLearnIndex((index) => Math.min(index + 1, selectedLine.moves.length))}
            onPractice={() => startLine(selectedLine.id, 'practice')}
          />
        ) : (
          <TrainingPanel
            line={selectedLine}
            session={session}
            mode={mode}
            progress={progress}
            hintLevel={hintLevel}
            lineStats={lineStats}
            compact={focusMode}
            lineNumber={selectedLineNumber}
            lineTotal={allLines.length}
            onHint={showHint}
            onShowAnswer={showAnswer}
            onRestart={() => startLine(selectedLine.id, mode === 'run' ? 'run' : 'practice')}
            onNext={nextLine}
            onReview={startReview}
            onFlip={flipBoard}
            onPlayOpponent={() => {
              clearOpponentReplyTimer()
              setSession((current) => {
                const replySession = applyOpponentReply(selectedLine, current)
                void playMoveClick(soundEnabledRef.current)
                return replySession
              })
            }}
            onMode={handleMode}
          />
        )}
      </main>

      {focusMode ? (
        <div className="focus-controls" aria-label="Focus practice controls">
          <button className="icon-button" type="button" onClick={() => setMode('settings')} aria-label="Open settings">
            <Settings size={19} />
          </button>
          <button type="button" onClick={() => startLine(selectedLine.id, mode === 'run' ? 'run' : 'practice')}>
            <RotateCcw size={18} />
            Restart
          </button>
          <button className="primary-next focus-next" type="button" onClick={nextLine}>
            <StepForward size={19} />
            Next Line
          </button>
          <button className="mode-control" type="button" onClick={() => setMode('repertoire')}>
            Mode
          </button>
          <button className="icon-button" type="button" onClick={flipBoard} aria-label="Flip board">
            <SwitchCamera size={19} />
          </button>
        </div>
      ) : null}

      {mode === 'repertoire' ? (
        <RepertoireBrowser
          lines={allLines}
          progress={progress}
          selectedLineId={selectedLine.id}
          openingFilter={openingFilter}
          onOpeningFilter={setOpeningFilter}
          onSelectLine={(lineId) => {
            setSelectedLineId(lineId)
            updateProgress((current) => ({ ...current, currentLineId: lineId }))
          }}
          onPractice={(lineId) => startLine(lineId, 'practice')}
        />
      ) : null}

      {mode === 'mistakes' ? (
        <MistakeReview
          items={progress.reviewQueue}
          onStart={startReview}
          onClearMastered={() =>
            updateProgress((current) => ({
              ...current,
              reviewQueue: current.reviewQueue.filter((item) => item.priority > 0),
            }))
          }
        />
      ) : null}

      {mode === 'add-line' ? <AddLineForm onSave={saveUserLine} /> : null}

      {mode === 'settings' ? (
        <SettingsPanel
          settings={progress.settings}
          progressJson={exportProgressJson(progress)}
          repertoireJson={exportRepertoireJson(allLines)}
          onSettingsChange={updateSettings}
          onImportProgress={importProgress}
          onImportRepertoire={importRepertoire}
          onResetProgress={resetProgress}
          onClose={() => setMode('practice')}
        />
      ) : null}

      {toast ? (
        <button className="toast" type="button" onClick={() => setToast('')}>
          {toast}
        </button>
      ) : null}
      <button
        className="focus-toggle"
        type="button"
        onClick={() => setFocusMode((value) => !value)}
        aria-label={focusMode ? 'Exit focus board mode' : 'Enter focus board mode'}
      >
        {focusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </button>
    </div>
  )
}

export default App
