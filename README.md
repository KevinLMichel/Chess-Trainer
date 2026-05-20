# Queen's Gambit Trainer

A polished, offline-first chess opening trainer for practicing Queen's Gambit lines as White. It runs entirely in the browser, stores progress locally on the device, and deploys as a static GitHub Pages site.

## Features

- Custom React chessboard with bundled SVG pieces, click-to-move, drag-to-move, board coordinates, legal move dots, and last/correct/wrong move highlights.
- `chess.js`-powered legal move validation, SAN parsing, FEN handling, and safe expected-move comparison.
- Sixteen starter lines covering Queen's Gambit Accepted, Queen's Gambit Declined, Slav, Semi-Slav, Albin, and Chigorin structures.
- Focus Board mode enlarges the board and keeps the main practice controls in a compact bottom rail.
- Practice, Learn, Random Drill, Mistake Review, Full Repertoire Run, Repertoire Browser, Add Line, and Settings views.
- Local progress tracking for score, streaks, best streak, completed lines, per-line accuracy, mistakes, review queue, settings, and custom lines.
- JSON import/export for progress and repertoire, plus a scaffolded PGN/SAN importer for user-created lines.
- PWA support through `vite-plugin-pwa`; app shell and piece assets are cached for offline use after the first load.

## Local Development

PowerShell may block `npm.ps1` on Windows, so use `npm.cmd` if needed.

```powershell
npm.cmd install
npm.cmd run dev
```

Because this repo is configured for GitHub Pages, Vite serves the app under:

```text
http://localhost:5173/Chess-Trainer/
```

## Checks

```powershell
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

## Adding Repertoire Lines

Starter lines live in `src/data/repertoire.ts`. Add new lines as structured data:

```ts
{
  id: 'qga-example',
  title: 'QGA Example',
  opening: "Queen's Gambit Accepted",
  eco: 'D20',
  trainAs: 'white',
  startingFen: 'startpos',
  tags: ['QGA', 'beginner'],
  moves: [
    { san: 'd4', side: 'white', train: true, note: 'White takes space.' },
    { san: 'd5', side: 'black', train: false },
    { san: 'c4', side: 'white', train: true }
  ]
}
```

The app also includes an Add Line screen for local custom lines. Paste SAN or simple PGN, validate with `chess.js`, and save to local storage.

## Deploying

The included workflow builds and deploys to GitHub Pages when `main` is pushed. Before the deployment job can succeed, enable Pages for this repository:

1. Open **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Re-run the failed workflow or push another commit.

The Vite base path is `/Chess-Trainer/`, targeting:

```text
https://KevinLMichel.github.io/Chess-Trainer/
```

## Privacy

No backend, accounts, analytics, engine calls, cloud sync, or external runtime assets are used. Practice data stays in `localStorage` on the current device unless exported manually.

## Asset Attribution

Chess piece SVGs are bundled locally in `public/pieces`. They use the classic Cburnett chess piece set as distributed by lichess and Wikimedia Commons. Credit: Cburnett. See the source project/licensing notes for the Cburnett set before redistributing modified versions.
