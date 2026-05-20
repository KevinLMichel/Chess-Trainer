import type { RepertoireLine } from '../types/repertoire'
import { qgaLines } from './chapters/qga'
import { qgdLines } from './chapters/qgd'
import { semiSlavLines } from './chapters/semiSlav'
import { sidelineLines } from './chapters/sidelines'
import { slavLines } from './chapters/slav'

export const starterRepertoire: RepertoireLine[] = [
  ...qgaLines,
  ...qgdLines,
  ...slavLines,
  ...semiSlavLines,
  ...sidelineLines,
].sort((a, b) => (a.studyOrder ?? 9999) - (b.studyOrder ?? 9999))
