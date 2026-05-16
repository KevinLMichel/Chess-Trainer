import { Search, Target } from 'lucide-react'
import { accuracyLabel, completionLabel } from '../lib/scoring'
import type { RepertoireLine, StoredProgress } from '../types/repertoire'

type RepertoireBrowserProps = {
  lines: RepertoireLine[]
  progress: StoredProgress
  selectedLineId: string
  openingFilter: string
  onOpeningFilter: (value: string) => void
  onSelectLine: (lineId: string) => void
  onPractice: (lineId: string) => void
}

export function RepertoireBrowser({
  lines,
  progress,
  selectedLineId,
  openingFilter,
  onOpeningFilter,
  onSelectLine,
  onPractice,
}: RepertoireBrowserProps) {
  const openings = ['All openings', ...Array.from(new Set(lines.map((line) => line.opening)))]
  const visibleLines =
    openingFilter === 'All openings' ? lines : lines.filter((line) => line.opening === openingFilter)

  return (
    <section className="drawer-card">
      <div className="drawer-header">
        <div>
          <span className="eyebrow">Repertoire</span>
          <h2>Choose a Queen&apos;s Gambit line</h2>
        </div>
        <label className="filter-control">
          <Search size={16} />
          <select value={openingFilter} onChange={(event) => onOpeningFilter(event.target.value)}>
            {openings.map((opening) => (
              <option key={opening} value={opening}>
                {opening}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="line-grid">
        {visibleLines.map((line) => {
          const stats = progress.lineStats[line.id]
          return (
            <article key={line.id} className={line.id === selectedLineId ? 'line-card selected' : 'line-card'}>
              <div>
                <span className="eyebrow">{line.opening}</span>
                <h3>{line.title}</h3>
              </div>
              <div className="tag-row">
                {line.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <div className="line-metrics">
                <span>{completionLabel(progress.completedLineIds, line.id)}</span>
                <span>Accuracy {accuracyLabel(stats)}</span>
                <span>{stats?.mistakes ?? 0} mistakes</span>
              </div>
              <div className="button-row">
                <button type="button" onClick={() => onSelectLine(line.id)}>
                  Select
                </button>
                <button className="primary" type="button" onClick={() => onPractice(line.id)}>
                  <Target size={16} />
                  Practice
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
