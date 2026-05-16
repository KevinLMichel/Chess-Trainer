import { Settings } from 'lucide-react'
import type { StoredProgress } from '../types/repertoire'

type TopBarProps = {
  progress: StoredProgress
  onSettings: () => void
}

export function TopBar({ progress, onSettings }: TopBarProps) {
  return (
    <header className="top-bar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          Q
        </span>
        <div>
          <h1>Queen&apos;s Gambit Trainer</h1>
          <p>Offline opening practice</p>
        </div>
      </div>
      <div className="top-stats" aria-label="Local practice statistics">
        <span>
          <strong>{progress.score}</strong>
          Score
        </span>
        <span>
          <strong>{progress.streak}</strong>
          Streak
        </span>
        <span>
          <strong>{progress.bestStreak}</strong>
          Best
        </span>
        <button className="icon-button" type="button" onClick={onSettings} aria-label="Open settings">
          <Settings size={20} />
        </button>
      </div>
    </header>
  )
}
