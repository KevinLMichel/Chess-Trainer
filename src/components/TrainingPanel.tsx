import { Eye, HelpCircle, Repeat, RotateCcw, StepForward, SwitchCamera } from 'lucide-react'
import { getExpectedMove } from '../lib/trainerEngine'
import { lineAccuracy } from '../lib/storage'
import type { LineStats, RepertoireLine, StoredProgress, TrainerMode, TrainingSession } from '../types/repertoire'
import { CompletionCard } from './CompletionCard'
import { HintBox } from './HintBox'
import { ModeTiles } from './ModeTiles'
import { MoveList } from './MoveList'

type TrainingPanelProps = {
  line: RepertoireLine
  session: TrainingSession
  mode: TrainerMode
  progress: StoredProgress
  hintLevel: number
  lineStats?: LineStats
  compact?: boolean
  onHint: () => void
  onShowAnswer: () => void
  onRestart: () => void
  onNext: () => void
  onReview: () => void
  onFlip: () => void
  onPlayOpponent: () => void
  onMode: (mode: TrainerMode) => void
}

export function TrainingPanel({
  line,
  session,
  mode,
  progress,
  hintLevel,
  lineStats,
  compact = false,
  onHint,
  onShowAnswer,
  onRestart,
  onNext,
  onReview,
  onFlip,
  onPlayOpponent,
  onMode,
}: TrainingPanelProps) {
  const expected = getExpectedMove(line, session)
  const isComplete = session.status === 'complete'
  const feedbackClass =
    session.status === 'correct' || session.status === 'complete'
      ? 'success'
      : session.status === 'wrong'
        ? 'danger'
        : 'neutral'

  return (
    <aside className={compact ? 'training-panel compact-panel' : 'training-panel'}>
      <section className="coach-panel">
        <div className="panel-header">
          <span className="eyebrow">{mode === 'mistakes' ? 'Mistake Review' : mode === 'drill' ? 'Drill' : 'Practice'}</span>
          <h2>{line.opening}</h2>
          <p>{line.title}</p>
          <div className="tag-row">
            {line.eco ? <span>{line.eco}</span> : null}
            {line.tags.slice(0, 4).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>

        <div className={`prompt-card ${feedbackClass}`}>
          <span>{session.feedback}</span>
          {session.status === 'opponent-ready' ? (
            <button type="button" onClick={onPlayOpponent}>
              Play reply
            </button>
          ) : null}
        </div>

        {session.explanation ? (
          <div className="explanation-card">
            <span className="eyebrow">Coach note</span>
            <p>{session.explanation}</p>
          </div>
        ) : null}

        {line.ideas?.length ? (
          <div className="theory-card">
            <span className="eyebrow">Line ideas</span>
            <ul>
              {line.ideas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <HintBox fen={session.fen} expectedSan={expected?.san} hintLevel={hintLevel} />

        {isComplete ? (
          <CompletionCard line={line} stats={lineStats} onRestart={onRestart} onNext={onNext} onReview={onReview} />
        ) : (
          <div className="action-grid">
            <button type="button" onClick={onHint}>
              <HelpCircle size={18} />
              Hint
            </button>
            <button type="button" onClick={onShowAnswer}>
              <Eye size={18} />
              Show answer
            </button>
            <button type="button" onClick={onRestart}>
              <RotateCcw size={18} />
              Restart
            </button>
            <button className="primary-next action-next" type="button" onClick={onNext}>
              <StepForward size={18} />
              Next Line
            </button>
            <button type="button" onClick={onReview}>
              <Repeat size={18} />
              Review
            </button>
            <button type="button" onClick={onFlip}>
              <SwitchCamera size={18} />
              Flip
            </button>
          </div>
        )}
      </section>

      <section className="study-panel">
        <div className="study-stats" aria-label="Line statistics">
          <span>
            <strong>
              {session.completedTrainableMoves}/{session.totalTrainableMoves}
            </strong>
            Solved
          </span>
          <span>
            <strong>{lineAccuracy(lineStats)}%</strong>
            Accuracy
          </span>
          <span>
            <strong>{lineStats?.mistakes ?? 0}</strong>
            Mistakes
          </span>
        </div>
        <MoveList line={line} session={session} />
        {compact ? null : <ModeTiles activeMode={mode} reviewCount={progress.reviewQueue.length} onMode={onMode} />}
      </section>
    </aside>
  )
}
