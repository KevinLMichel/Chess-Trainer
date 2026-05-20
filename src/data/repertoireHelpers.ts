import type { RepertoireChapter, RepertoireDifficulty, RepertoireLine } from '../types/repertoire'

export type LineSeed = {
  id: string
  title: string
  opening: string
  eco?: string
  chapter: Exclude<RepertoireChapter, 'User Lines'>
  difficulty: RepertoireDifficulty
  studyOrder: number
  summary: string
  tags: string[]
  ideas: string[]
  moves: string[]
  notes?: Record<string, string>
}

const whiteNotes: Record<string, string> = {
  d4: 'White claims central space and starts a Queen pawn game built around control of e5 and c5.',
  c4: "The Queen's Gambit challenges d5 and asks Black whether they can afford to leave the center.",
  e4: 'White grabs the full pawn center, using time and space as compensation for the c-pawn.',
  e3: 'White opens the f1 bishop and prepares to recover c4 without overextending the center.',
  Nf3: 'White develops, controls e5, and keeps castling plans ready before chasing material.',
  Nc3: 'White adds pressure to d5 and increases central control with a natural developing move.',
  Bxc4: 'White recovers the gambit pawn while developing the bishop to an active diagonal.',
  exd4: 'White recaptures toward the center and keeps the structure simple and healthy.',
  cxd5: 'White clarifies the center and chooses the pawn structure before Black does.',
  Bg5: 'White pins a defender and makes Black work harder to maintain central control.',
  Bh4: 'White keeps the bishop active and preserves pressure after Black asks it a question.',
  Bxe7: 'White trades at the right moment, reducing Black activity or removing a key defender.',
  Bd3: 'White develops toward the kingside and points a bishop at h7, a common attacking motif.',
  Rc1: 'White places a rook on the c-file before the structure opens or a target appears there.',
  'O-O': 'White castles, connecting the rooks and making the center safer to open.',
  Qa4: 'White uses check or pressure to disturb Black before recovering the c-pawn.',
  'Qa4+': 'White checks and pressures c4, forcing Black to spend time on coordination.',
  a4: 'White undermines Black queenside pawns and prevents ...b5 from comfortably holding c4.',
  axb5: 'White removes the base of Black queenside support and exposes the c4 pawn.',
  d5: 'White gains space and fixes the center before Black can freely challenge it.',
  e5: 'White advances with tempo, gaining space while kicking a developed piece or restricting Black.',
  g3: 'White prepares a kingside fianchetto and strengthens control of the long diagonal.',
  Nge2: 'White keeps the f-pawn flexible and supports central or kingside regrouping.',
  Qc2: 'White supports e4, eyes h7, and prepares coordinated pressure from queen and bishop.',
  Qe2: 'White supports central play and keeps castling/rook coordination smooth.',
  Nd2: 'White reinforces key central squares and avoids tactical pins on the c3 knight.',
  Ne5: 'White plants a knight in the center and challenges Black before they fully consolidate.',
  Nh4: 'White asks the developed bishop a direct question and may win the bishop pair.',
  Bf4: 'White develops actively before locking in the dark-squared bishop.',
  'Bxf6': "White trades on f6 to reduce Black control and reshape the position on White's terms.",
  Be2: 'White develops quietly, keeps the king safe, and avoids unnecessary tactical targets.',
  Bb3: 'White preserves the bishop on the active diagonal after Black attacks it.',
  Bd2: 'White meets the check with development and keeps the center intact.',
  bxc3: 'White accepts structural change in return for a strong center and open b-file.',
  a3: 'White controls b4 and prepares queenside expansion without allowing an annoying piece jump.',
  g4: 'White gains kingside space and challenges Black before the Semi-Slav structure becomes comfortable.',
}

const blackNotes: Record<string, string> = {
  d5: 'Black meets White in the center.',
  dxc4: 'Black accepts the gambit pawn and asks White to prove compensation.',
  e6: "Black supports d5 and builds a solid Queen's Gambit Declined structure.",
  c6: 'Black reinforces d5 and creates Slav or Semi-Slav structure.',
  Nf6: 'Black develops and fights for e4.',
  e5: "Black strikes at White's center before it becomes permanent.",
  c5: "Black challenges d4 and tries to reduce White's central space.",
  cxd4: "Black exchanges in the center to limit White's pawn duo.",
  exd4: 'Black releases central tension and opens lines.',
  exd5: 'Black recaptures and accepts the chosen pawn structure.',
  Nxd5: 'Black recaptures centrally and places a knight on an active square.',
  Nc6: 'Black develops with pressure on d4 and e5.',
  Bg4: 'Black pins the knight and increases pressure on the center.',
  Bb4: "Black pins or checks to disturb White's development.",
  'Bb4+': 'Black checks, trying to make White spend a tempo before continuing the central fight.',
  Be7: 'Black prepares to castle and reduces the impact of the pin.',
  'O-O': 'Black castles and prepares central counterplay.',
  h6: 'Black asks the bishop to declare its intentions.',
  b5: 'Black tries to hold the c4 pawn with queenside expansion.',
  a6: 'Black prepares ...b5 or controls b5.',
  b6: 'Black prepares to develop the light-squared bishop and solve a key QGD problem.',
  Qa5: 'Black creates pin pressure and tactical tension in Cambridge Springs structures.',
  Bf5: 'Black develops the light-squared bishop outside the pawn chain.',
  Nbd7: 'Black reinforces key central squares and keeps options flexible.',
  Ne4: 'Black seeks simplification and central piece activity.',
  Qxe7: 'Black recaptures and keeps the position solid after exchanges.',
  Qxd5: 'Black centralizes the queen after winning or recovering central material.',
  f5: 'Black grabs kingside and central space, creating a Stonewall-style structure.',
}

const noteForMove = (seed: LineSeed, san: string, index: number) => {
  const side = index % 2 === 0 ? 'white' : 'black'
  const keyedNote = seed.notes?.[`${index}:${san}`] ?? seed.notes?.[san]
  if (keyedNote) return keyedNote
  if (side === 'white') return whiteNotes[san] ?? `White plays ${san} to improve development and keep the Queen's Gambit plan coherent.`
  return blackNotes[san] ?? `Black replies ${san}, shaping the structure and asking White to keep the initiative.`
}

export const defineLine = (seed: LineSeed): RepertoireLine => ({
  id: seed.id,
  title: seed.title,
  opening: seed.opening,
  eco: seed.eco,
  chapter: seed.chapter,
  difficulty: seed.difficulty,
  studyOrder: seed.studyOrder,
  summary: seed.summary,
  trainAs: 'white',
  startingFen: 'startpos',
  tags: Array.from(new Set(seed.tags)),
  ideas: seed.ideas,
  source: 'starter',
  moves: seed.moves.map((san, index) => ({
    san,
    side: index % 2 === 0 ? 'white' : 'black',
    train: index % 2 === 0,
    note: noteForMove(seed, san, index),
  })),
})

export const defineLines = (seeds: LineSeed[]) => seeds.map(defineLine)
