# NYU Hacks Arcade

A collection of classic arcade games built with Next.js, TypeScript, and HTML5 Canvas.

## Project Structure

This is a monorepo containing both frontend and backend code:

```
├── frontend/              # Next.js frontend application
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── games/            # Game implementations
│   ├── lib/              # Utilities
│   └── types/            # TypeScript types
└── backend/              # Backend API and server
```

## Games

- 🐍 **Snake** - Classic snake game
- 🏓 **Pong** - The original arcade classic
- 🧩 **Tetris** - Stack blocks and clear lines

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Frontend Build

```bash
cd frontend
npm run build
npm start
```

### Backend Setup

Backend implementation coming soon. See `backend/README.md` for details.

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **HTML5 Canvas** - Game rendering
- **Tailwind CSS** - Styling (via inline styles)

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

## License

MIT

