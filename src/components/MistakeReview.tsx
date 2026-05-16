import { Flame, Trash2 } from 'lucide-react'
import type { ReviewItem } from '../types/repertoire'

type MistakeReviewProps = {
  items: ReviewItem[]
  onStart: () => void
  onClearMastered: () => void
}

export function MistakeReview({ items, onStart, onClearMastered }: MistakeReviewProps) {
  const sorted = [...items].sort((a, b) => b.priority - a.priority || b.misses - a.misses)

  return (
    <section className="drawer-card">
      <div className="drawer-header">
        <div>
          <span className="eyebrow">Mistake Review</span>
          <h2>{items.length ? `${items.length} positions queued` : 'No mistakes yet'}</h2>
        </div>
        <button className="primary" type="button" onClick={onStart} disabled={!items.length}>
          <Flame size={16} />
          Start review
        </button>
      </div>
      {!items.length ? (
        <p className="empty-state">Missed positions will appear here automatically. Keep practicing and this becomes your personal review deck.</p>
      ) : (
        <div className="review-list">
          {sorted.slice(0, 8).map((item) => (
            <article key={item.id} className="review-item">
              <div>
                <span className="eyebrow">{item.opening}</span>
                <h3>{item.lineTitle}</h3>
                <p>Expected {item.expectedSan}</p>
              </div>
              <div className="review-metrics">
                <span>Priority {item.priority}</span>
                <span>{item.misses} misses</span>
              </div>
            </article>
          ))}
        </div>
      )}
      <button type="button" onClick={onClearMastered} disabled={!items.length}>
        <Trash2 size={16} />
        Clear mastered
      </button>
    </section>
  )
}
