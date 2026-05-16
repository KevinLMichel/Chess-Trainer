import { BookOpen, Clock, Flame, LibraryBig, ListTree, RotateCcw, Target } from 'lucide-react'
import type { ComponentType } from 'react'
import type { TrainerMode } from '../types/repertoire'

type ModeTilesProps = {
  activeMode: TrainerMode
  reviewCount: number
  onMode: (mode: TrainerMode) => void
}

const modes: Array<{
  mode: TrainerMode
  label: string
  detail: string
  icon: ComponentType<{ size?: number }>
  disabled?: boolean
}> = [
  { mode: 'learn', label: 'Learn', detail: 'Step through ideas', icon: BookOpen },
  { mode: 'practice', label: 'Practice', detail: 'Train one line', icon: Target },
  { mode: 'drill', label: 'Drill', detail: 'Random positions', icon: RotateCcw },
  { mode: 'mistakes', label: 'Mistakes', detail: 'Review misses', icon: Flame },
  { mode: 'run', label: 'Run', detail: 'All lines in order', icon: ListTree },
  { mode: 'repertoire', label: 'Repertoire', detail: 'Browse lines', icon: LibraryBig },
  { mode: 'practice', label: 'Timed', detail: 'Future mode', icon: Clock, disabled: true },
]

export function ModeTiles({ activeMode, reviewCount, onMode }: ModeTilesProps) {
  return (
    <section className="mode-grid" aria-label="Training modes">
      {modes.map(({ mode, label, detail, icon: Icon, disabled }) => (
        <button
          key={label}
          type="button"
          className={activeMode === mode && !disabled ? 'mode-tile active' : 'mode-tile'}
          onClick={() => !disabled && onMode(mode)}
          disabled={disabled}
        >
          <Icon size={20} />
          <span>{label}</span>
          <small>{label === 'Mistakes' ? `${reviewCount} queued` : detail}</small>
        </button>
      ))}
    </section>
  )
}
