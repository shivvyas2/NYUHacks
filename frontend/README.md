# Frontend

Next.js frontend application for the NYU Hacks Arcade. All games are built with Three.js for 3D graphics.

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
│   ├── subway-surfers/   # Subway Surfers game
│   │   ├── SubwaySurfersGame.ts
│   │   └── assets/       # Game assets (models, textures, etc.)
│   ├── squid-game/       # Squid Game
│   │   ├── SquidGameGame.ts
│   │   └── assets/       # Game assets
│   ├── mario/            # Mario game
│   │   ├── MarioGame.ts
│   │   └── assets/       # Game assets
│   └── pac-man/          # Pac-Man game
│       ├── PacManGame.ts
│       └── assets/       # Game assets
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
- **Three.js** - 3D graphics and game rendering
- **HTML5 Canvas** - Canvas rendering (for placeholders)

## Development Guidelines

### Adding a New Game

1. Create a new game folder in `games/[game-name]/`
2. Create the game class file `[GameName]Game.ts` extending `BaseGame`
3. Create an `assets/` folder for game assets (models, textures, sounds, etc.)
4. Implement required methods: `init()`, `update()`, `render()`, `handleInput()`
   - Use Three.js for 3D rendering (Scene, Camera, Renderer)
   - Load assets from the `assets/` folder
5. Register the game in `games/GameRenderer.ts`
6. Add game metadata to `lib/games.ts`

### Game Architecture

Each game extends `BaseGame` which provides:
- Game state management
- Common game properties (score, level, lives, etc.)
- Abstract methods for game-specific logic

