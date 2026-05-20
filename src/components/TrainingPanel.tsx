import { ChevronDown, Eye, HelpCircle, Repeat, RotateCcw, StepForward, SwitchCamera } from 'lucide-react'
import { getExpectedMove } from '../lib/trainerEngine'
import { lineAccuracy } from '../lib/storage'
import { lineChapter, lineDifficulty, lineSummary } from '../lib/repertoire'
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
  lineNumber: number
  lineTotal: number
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
  lineNumber,
  lineTotal,
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

  const modeLabel =
    mode === 'mistakes'
      ? 'Review'
      : mode === 'drill'
        ? 'Drill'
        : mode === 'run'
          ? 'Run'
          : mode === 'repertoire'
            ? 'Repertoire'
            : mode === 'add-line'
              ? 'Add line'
              : mode === 'settings'
                ? 'Settings'
                : 'Practice'
  const progressPercent =
    session.totalTrainableMoves > 0
      ? Math.min(100, Math.round((session.completedTrainableMoves / session.totalTrainableMoves) * 100))
      : 0
  const visibleTags = line.tags.slice(0, 2)
  const hiddenTagCount = Math.max(0, line.tags.length - visibleTags.length)

  return (
    <aside className={compact ? 'training-panel compact-panel' : 'training-panel'}>
      <section className="coach-panel">
        <div className="session-strip">
          <span className="eyebrow">{modeLabel}</span>
          <strong>{line.title}</strong>
          <span>
            {lineChapter(line)} - {lineDifficulty(line)}
          </span>
          <span>
            Line {lineNumber}/{lineTotal}
          </span>
        </div>

        <div className="rail-progress" aria-label="Line progress">
          <div className="progress-meta">
            <span>Line progress</span>
            <span>
              {session.completedTrainableMoves}/{session.totalTrainableMoves}
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
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

        {isComplete ? (
          <CompletionCard line={line} stats={lineStats} onRestart={onRestart} onNext={onNext} onReview={onReview} />
        ) : (
          <>
            <div className="coach-actions" aria-label="Practice actions">
              <button className="primary-next action-next" type="button" onClick={onNext}>
                <StepForward size={18} />
                Next Line
              </button>
              <div className="secondary-actions">
                <button type="button" onClick={onHint}>
                  <HelpCircle size={17} />
                  Hint
                </button>
                <button type="button" onClick={onShowAnswer}>
                  <Eye size={17} />
                  Answer
                </button>
                <button type="button" onClick={onRestart}>
                  <RotateCcw size={17} />
                  Restart
                </button>
                <button type="button" onClick={onReview}>
                  <Repeat size={17} />
                  Review
                </button>
                <button type="button" onClick={onFlip}>
                  <SwitchCamera size={17} />
                  Flip
                </button>
              </div>
            </div>

            <HintBox fen={session.fen} expectedSan={expected?.san} hintLevel={hintLevel} />

            {session.explanation ? (
              <details className="coach-disclosure coach-note" open>
                <summary>
                  <span>Coach note</span>
                  <ChevronDown size={16} />
                </summary>
                <p>{session.explanation}</p>
              </details>
            ) : null}

            {line.ideas?.length ? (
              <details className="coach-disclosure">
                <summary>
                  <span>Why these moves?</span>
                  <ChevronDown size={16} />
                </summary>
                <ul>
                  {line.ideas.map((idea) => (
                    <li key={idea}>{idea}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        )}
      </section>

      <section className="study-panel">
        <MoveList line={line} session={session} />
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
        <details className="reference-disclosure">
          <summary>
            <span>Line details</span>
            <ChevronDown size={16} />
          </summary>
          <p>{line.opening}</p>
          <p>{lineSummary(line)}</p>
          <p>
            {lineChapter(line)} - {lineDifficulty(line)}
            {line.eco ? ` - ${line.eco}` : ''}
          </p>
          <div className="tag-row compact-tags">
            {line.eco ? <span>{line.eco}</span> : null}
            {visibleTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
            {hiddenTagCount ? <span>+{hiddenTagCount}</span> : null}
          </div>
          {hiddenTagCount ? (
            <div className="tag-row all-tags">
              {line.tags.slice(visibleTags.length).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          ) : null}
          {line.ideas?.length ? (
            <ul>
              {line.ideas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          ) : null}
        </details>
        {compact ? null : (
          <details className="reference-disclosure mode-disclosure">
            <summary>
              <span>Modes</span>
              <ChevronDown size={16} />
            </summary>
            <ModeTiles activeMode={mode} reviewCount={progress.reviewQueue.length} onMode={onMode} />
          </details>
        )}
      </section>
    </aside>
  )
}
