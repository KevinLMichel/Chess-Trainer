import { Download, RotateCcw, Upload, X } from 'lucide-react'
import { useState } from 'react'
import type { BoardTheme, UserSettings } from '../types/repertoire'

type SettingsPanelProps = {
  settings: UserSettings
  progressJson: string
  repertoireJson: string
  onSettingsChange: (settings: UserSettings) => void
  onImportProgress: (raw: string) => void
  onImportRepertoire: (raw: string) => void
  onResetProgress: () => void
  onClose: () => void
}

const downloadJson = (filename: string, contents: string) => {
  const blob = new Blob([contents], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function SettingsPanel({
  settings,
  progressJson,
  repertoireJson,
  onSettingsChange,
  onImportProgress,
  onImportRepertoire,
  onResetProgress,
  onClose,
}: SettingsPanelProps) {
  const [importText, setImportText] = useState('')
  const [importKind, setImportKind] = useState<'progress' | 'repertoire'>('progress')

  const update = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value })
  }

  const submitImport = () => {
    if (!importText.trim()) return
    if (importKind === 'progress') onImportProgress(importText)
    if (importKind === 'repertoire') onImportRepertoire(importText)
    setImportText('')
  }

  return (
    <section className="drawer-card settings-card">
      <div className="drawer-header">
        <div>
          <span className="eyebrow">Local settings</span>
          <h2>Study preferences</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close settings">
          <X size={18} />
        </button>
      </div>

      <div className="settings-grid">
        <label>
          Board orientation
          <select value={settings.boardOrientation} onChange={(event) => update('boardOrientation', event.target.value as 'white' | 'black')}>
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </label>
        <label>
          Board theme
          <select value={settings.boardTheme} onChange={(event) => update('boardTheme', event.target.value as BoardTheme)}>
            <option value="warm">Classic study</option>
            <option value="blue">Modern blue</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>
        <label className="toggle-row">
          <input type="checkbox" checked={settings.autoPlayOpponent} onChange={(event) => update('autoPlayOpponent', event.target.checked)} />
          Auto-play Black replies
        </label>
        <label className="toggle-row">
          <input type="checkbox" checked={settings.showLegalMoves} onChange={(event) => update('showLegalMoves', event.target.checked)} />
          Show legal moves
        </label>
        <label className="toggle-row">
          <input type="checkbox" checked={settings.showCoordinates} onChange={(event) => update('showCoordinates', event.target.checked)} />
          Show coordinates
        </label>
        <label className="toggle-row">
          <input type="checkbox" checked={settings.sound} onChange={(event) => update('sound', event.target.checked)} />
          Sound
        </label>
      </div>

      <div className="button-row">
        <button type="button" onClick={() => downloadJson('queens-gambit-progress.json', progressJson)}>
          <Download size={16} />
          Export progress
        </button>
        <button type="button" onClick={() => downloadJson('queens-gambit-repertoire.json', repertoireJson)}>
          <Download size={16} />
          Export repertoire
        </button>
        <button className="danger-button" type="button" onClick={onResetProgress}>
          <RotateCcw size={16} />
          Reset progress
        </button>
      </div>

      <div className="import-box">
        <div className="section-heading">
          <h3>Import JSON</h3>
          <select value={importKind} onChange={(event) => setImportKind(event.target.value as 'progress' | 'repertoire')}>
            <option value="progress">Progress</option>
            <option value="repertoire">Repertoire</option>
          </select>
        </div>
        <textarea
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
          placeholder="Paste exported JSON here"
        />
        <button type="button" onClick={submitImport}>
          <Upload size={16} />
          Import
        </button>
      </div>
    </section>
  )
}
