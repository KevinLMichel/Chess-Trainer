import { ArrowLeft, ArrowRight, Target } from 'lucide-react'
import type { RepertoireLine } from '../types/repertoire'

type LearningPanelProps = {
  line: RepertoireLine
  moveIndex: number
  onPrev: () => void
  onNext: () => void
  onPractice: () => void
}

export function LearningPanel({ line, moveIndex, onPrev, onNext, onPractice }: LearningPanelProps) {
  const currentMove = moveIndex > 0 ? line.moves[moveIndex - 1] : undefined

  return (
    <aside className="training-panel">
      <div className="panel-header">
        <span className="eyebrow">Learn</span>
        <h2>{line.opening}</h2>
        <p>{line.title}</p>
      </div>
      <div className="prompt-card neutral">
        <span>{currentMove ? `${currentMove.side === 'white' ? 'White' : 'Black'} plays ${currentMove.san}` : 'Start position'}</span>
      </div>
      <div className="explanation-card">
        <span className="eyebrow">Idea</span>
        <p>
          {currentMove?.note ??
            "Step through the line, then switch to Practice when you're ready to recall the White moves."}
        </p>
      </div>
      <div className="button-row">
        <button type="button" onClick={onPrev} disabled={moveIndex === 0}>
          <ArrowLeft size={16} />
          Previous
        </button>
        <button type="button" onClick={onNext} disabled={moveIndex >= line.moves.length}>
          <ArrowRight size={16} />
          Next
        </button>
        <button className="primary" type="button" onClick={onPractice}>
          <Target size={16} />
          Practice
        </button>
      </div>
    </aside>
  )
}
