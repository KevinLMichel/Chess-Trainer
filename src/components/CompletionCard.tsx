import type { LineStats, RepertoireLine } from '../types/repertoire'
import { lineAccuracy } from '../lib/storage'
import { StepForward } from 'lucide-react'

type CompletionCardProps = {
  line: RepertoireLine
  stats?: LineStats
  onRestart: () => void
  onNext: () => void
  onReview: () => void
}

export function CompletionCard({ line, stats, onRestart, onNext, onReview }: CompletionCardProps) {
  return (
    <div className="completion-card">
      <span className="eyebrow">Line complete</span>
      <h3>Nice work.</h3>
      <p>{line.title}</p>
      <div className="completion-stats">
        <span>
          <strong>{lineAccuracy(stats)}%</strong>
          Accuracy
        </span>
        <span>
          <strong>{stats?.mistakes ?? 0}</strong>
          Mistakes
        </span>
        <span>
          <strong>{stats?.bestStreak ?? 0}</strong>
          Best streak
        </span>
      </div>
      <div className="button-row">
        <button className="primary-next completion-next" type="button" onClick={onNext}>
          <StepForward size={18} />
          Next line
        </button>
        <button type="button" onClick={onRestart}>
          Practice again
        </button>
        <button type="button" onClick={onReview}>
          Review mistakes
        </button>
      </div>
    </div>
  )
}
