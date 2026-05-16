import type { RepertoireLine, TrainingSession } from '../types/repertoire'

type MoveListProps = {
  line: RepertoireLine
  session: TrainingSession
}

const displayMove = (san: string, index: number, session: TrainingSession, isTrainable: boolean) => {
  if (session.expectedOverrideSan) return san
  if (index === session.moveIndex && isTrainable && session.status !== 'complete') return '?'
  return san
}

export function MoveList({ line, session }: MoveListProps) {
  const rows = []
  for (let index = 0; index < line.moves.length; index += 2) {
    rows.push([line.moves[index], line.moves[index + 1]])
  }

  return (
    <section className="panel-section">
      <div className="section-heading">
        <h3>Line moves</h3>
      </div>
      <ol className="move-list">
        {rows.map(([white, black], rowIndex) => {
          const whiteIndex = rowIndex * 2
          const blackIndex = whiteIndex + 1
          return (
            <li key={`${line.id}-${rowIndex}`}>
              <span className="move-number">{rowIndex + 1}.</span>
              <span
                className={[
                  'move-pill',
                  whiteIndex < session.moveIndex ? 'done' : '',
                  whiteIndex === session.moveIndex ? 'current' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {white ? displayMove(white.san, whiteIndex, session, white.train) : ''}
              </span>
              <span
                className={[
                  'move-pill',
                  blackIndex < session.moveIndex ? 'done' : '',
                  blackIndex === session.moveIndex ? 'current' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {black ? displayMove(black.san, blackIndex, session, black.train) : ''}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
