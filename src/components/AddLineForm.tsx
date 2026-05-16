import { Save, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { buildLineFromSan, parsePgnDraft } from '../lib/pgn'
import { validateLine } from '../lib/trainerEngine'
import type { RepertoireLine } from '../types/repertoire'

type AddLineFormProps = {
  onSave: (line: RepertoireLine) => void
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function AddLineForm({ onSave }: AddLineFormProps) {
  const [title, setTitle] = useState('Custom Queen Gambit Line')
  const [opening, setOpening] = useState("Queen's Gambit Accepted")
  const [tags, setTags] = useState('custom, white')
  const [moves, setMoves] = useState('1. d4 d5 2. c4 dxc4 3. e4 e5')
  const [message, setMessage] = useState('')

  const parsePgn = () => {
    try {
      const draft = parsePgnDraft(moves, title)
      setTitle(draft.title)
      setOpening(draft.opening)
      setTags(draft.tags.join(', '))
      setMessage('PGN parsed. Review the fields, then save.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not parse PGN.')
    }
  }

  const save = () => {
    try {
      const line = buildLineFromSan({
        id: `user-${slugify(title)}-${Date.now()}`,
        title,
        opening,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        sanText: moves,
      })
      const validation = validateLine(line)
      if (!validation.valid) {
        setMessage(validation.errors.join(' '))
        return
      }

      onSave(line)
      setMessage('Line saved locally.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save this line.')
    }
  }

  return (
    <section className="drawer-card add-line-card">
      <div className="drawer-header">
        <div>
          <span className="eyebrow">Add Line</span>
          <h2>Create a local repertoire line</h2>
        </div>
      </div>
      <div className="form-grid">
        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label>
          Opening
          <input value={opening} onChange={(event) => setOpening(event.target.value)} />
        </label>
        <label>
          Tags
          <input value={tags} onChange={(event) => setTags(event.target.value)} />
        </label>
        <label className="wide-field">
          SAN moves or PGN
          <textarea value={moves} onChange={(event) => setMoves(event.target.value)} />
        </label>
      </div>
      {message ? <div className="hint-box">{message}</div> : null}
      <div className="button-row">
        <button type="button" onClick={parsePgn}>
          <Wand2 size={16} />
          Parse PGN
        </button>
        <button className="primary" type="button" onClick={save}>
          <Save size={16} />
          Save line
        </button>
      </div>
    </section>
  )
}
