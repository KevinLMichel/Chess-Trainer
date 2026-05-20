import { ChevronDown, Search, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { accuracyLabel, completionLabel } from '../lib/scoring'
import {
  chapterMetrics,
  filterRepertoireLines,
  lineChapter,
  lineDifficulty,
  lineSummary,
  repertoireChapters,
  repertoireDifficulties,
  tagsForLines,
  type BrowserChapter,
} from '../lib/repertoire'
import type { RepertoireDifficulty, RepertoireLine, StoredProgress } from '../types/repertoire'

type RepertoireBrowserProps = {
  lines: RepertoireLine[]
  progress: StoredProgress
  selectedLineId: string
  onSelectLine: (lineId: string) => void
  onPractice: (lineId: string) => void
}

export function RepertoireBrowser({
  lines,
  progress,
  selectedLineId,
  onSelectLine,
  onPractice,
}: RepertoireBrowserProps) {
  const [chapter, setChapter] = useState<BrowserChapter>('Quickstart')
  const [search, setSearch] = useState('')
  const [difficulty, setDifficulty] = useState<'All levels' | RepertoireDifficulty>('All levels')
  const [tag, setTag] = useState('All tags')
  const [showCompleted, setShowCompleted] = useState(true)

  const availableTags = useMemo(() => tagsForLines(lines), [lines])
  const visibleLines = filterRepertoireLines(lines, progress, { chapter, search, difficulty, tag, showCompleted })
  const activeMetrics = chapterMetrics(lines, progress, chapter)

  return (
    <section className="drawer-card repertoire-library">
      <div className="drawer-header">
        <div>
          <span className="eyebrow">Repertoire</span>
          <h2>Choose a Queen&apos;s Gambit chapter</h2>
          <p>Study {lines.length} local lines by chapter, difficulty, and recurring theme.</p>
        </div>
        <label className="filter-control search-control">
          <Search size={16} />
          <input
            type="search"
            value={search}
            placeholder="Search lines, ideas, tags"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>

      <div className="chapter-tabs" aria-label="Repertoire chapters">
        {repertoireChapters.map((item) => {
          const metrics = chapterMetrics(lines, progress, item)
          return (
            <button
              key={item}
              className={chapter === item ? 'chapter-tab active' : 'chapter-tab'}
              type="button"
              aria-label={`${item} chapter: ${metrics.completed} of ${metrics.total} completed`}
              onClick={() => setChapter(item)}
            >
              <span>{item}</span>
              <small>
                {metrics.completed}/{metrics.total}
              </small>
            </button>
          )
        })}
      </div>

      <div className="library-controls">
        <label>
          Level
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)}>
            {repertoireDifficulties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tag
          <select value={tag} onChange={(event) => setTag(event.target.value)}>
            {availableTags.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="toggle-row library-toggle">
          <input type="checkbox" checked={showCompleted} onChange={(event) => setShowCompleted(event.target.checked)} />
          Show completed
        </label>
      </div>

      <div className="chapter-summary">
        <span>
          <strong>{activeMetrics.total}</strong>
          Lines
        </span>
        <span>
          <strong>{activeMetrics.completed}</strong>
          Completed
        </span>
        <span>
          <strong>{activeMetrics.accuracy || 'New'}</strong>
          {activeMetrics.accuracy ? 'Accuracy' : 'Accuracy'}
        </span>
        <span>
          <strong>{activeMetrics.mistakes}</strong>
          Mistakes
        </span>
      </div>

      <div className="line-grid compact-line-grid">
        {visibleLines.map((line) => {
          const stats = progress.lineStats[line.id]
          const visibleTags = line.tags.filter((item) => item !== 'quickstart').slice(0, 2)
          const hiddenTags = line.tags.filter((item) => item !== 'quickstart').length - visibleTags.length
          return (
            <article key={line.id} className={line.id === selectedLineId ? 'line-card selected compact-line-card' : 'line-card compact-line-card'}>
              <div>
                <span className="eyebrow">
                  {lineChapter(line)} - {lineDifficulty(line)}
                </span>
                <h3>{line.title}</h3>
                <p>{lineSummary(line)}</p>
              </div>
              <div className="tag-row">
                {line.eco ? <span>{line.eco}</span> : null}
                {visibleTags.map((item) => (
                  <span key={item}>{item}</span>
                ))}
                {hiddenTags > 0 ? <span>+{hiddenTags}</span> : null}
              </div>
              <div className="line-metrics">
                <span>{completionLabel(progress.completedLineIds, line.id)}</span>
                <span>Accuracy {accuracyLabel(stats)}</span>
                <span>{stats?.mistakes ?? 0} mistakes</span>
              </div>
              <details className="line-details">
                <summary>
                  <span>Ideas and moves</span>
                  <ChevronDown size={16} />
                </summary>
                <ul>
                  {(line.ideas ?? []).map((idea) => (
                    <li key={idea}>{idea}</li>
                  ))}
                </ul>
                <p>{line.moves.map((move) => move.san).join(' ')}</p>
              </details>
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

      {!visibleLines.length ? <p className="empty-state">No lines match those filters.</p> : null}
    </section>
  )
}
