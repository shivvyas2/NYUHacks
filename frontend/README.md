# Frontend

Next.js frontend application for the NYU Hacks Arcade.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── games/             # Game pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── GameCard.tsx      # Game card component
│   └── GameContainer.tsx # Game canvas container
├── games/                 # Game implementations
│   ├── BaseGame.ts       # Base game class
│   ├── GameRenderer.ts   # Game renderer
│   ├── snake/            # Snake game
│   ├── pong/             # Pong game
│   └── tetris/           # Tetris game
├── lib/                   # Utilities
│   └── games.ts          # Game metadata
└── types/                 # TypeScript types
    └── game.ts            # Game type definitions
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **HTML5 Canvas** - Game rendering

## Development Guidelines

### Adding a New Game

1. Create a new game class in `games/[game-name]/[GameName]Game.ts`
2. Extend the `BaseGame` class
3. Implement required methods: `init()`, `update()`, `render()`, `handleInput()`
4. Register the game in `games/GameRenderer.ts`
5. Add game metadata to `lib/games.ts`

### Game Architecture

Each game extends `BaseGame` which provides:
- Game state management
- Common game properties (score, level, lives, etc.)
- Abstract methods for game-specific logic

