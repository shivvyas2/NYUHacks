# Frontend - NYU Hacks Arcade

Next.js frontend application for the NYU Hacks Arcade. All games are built with Three.js for 3D graphics.

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── dashboard/         # User dashboard
│   ├── games/             # Game pages
│   │   └── [gameId]/     # Dynamic game routes
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   ├── stats/              # Statistics page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── AuthButton.tsx     # Authentication button
│   ├── DashboardLayout.tsx # Dashboard layout
│   ├── GameCard.tsx       # Game card component
│   ├── GameContainer.tsx  # Game canvas container
│   └── [Game]GameContainer.tsx # Game-specific containers
├── games/                 # Game implementations
│   ├── BaseGame.ts       # Base game class
│   ├── GameRenderer.ts   # Game renderer
│   ├── subway-surfers/   # Subway Surfers game
│   ├── squid-game/       # Squid Game
│   ├── mario/            # Mario game
│   ├── pac-man/          # Pac-Man game
│   ├── whackamole/       # Whack-A-Mole game
│   ├── zombie/           # Zombie game
│   └── carnival/         # Carnival game
├── lib/                   # Utilities
│   ├── api/              # API client
│   │   └── client.ts     # FastAPI backend client
│   └── games.ts          # Game metadata
├── public/                # Static assets
│   ├── games/            # Game assets (models, textures, etc.)
│   └── questions.json    # Question bank
├── types/                 # TypeScript types
│   └── game.ts           # Game type definitions
└── middleware.ts          # Next.js middleware (auth)
```

## Getting Started

### Prerequisites

- **Node.js 18+**
- **npm** or **yarn**

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The frontend will automatically connect to the backend at `http://localhost:8000` (default).

### Build

```bash
npm run build
npm start
```

## Environment Variables

Create a `.env.local` file in the frontend directory (optional for localhost):

```env
# Backend API URL (defaults to http://localhost:8000 if not set)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase Configuration (optional - only if using Supabase client-side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Note:** For production deployment, set these in Vercel Dashboard → Environment Variables.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Three.js** - 3D graphics and game rendering
- **Tailwind CSS** - Styling
- **Supabase** - Authentication and database (via backend API)

## Available Games

- **Subway Surfers** - Endless runner - dodge obstacles and collect coins!
- **Squid Game** - Survive the challenges inspired by the popular series!
- **Mario** - Classic platformer - jump, run, and collect coins!
- **Pac-Man** - Classic maze game - eat dots and avoid ghosts!
- **Whack-A-Mole** - Whack the mole with the correct SAT answer!
- **Zombie Apocalypse** - First-person shooter! Shoot zombies with correct answers!
- **Carnival** - Pop balloons to answer SAT questions!

## Development Guidelines

### Adding a New Game

1. **Create game folder** in `games/[game-name]/`
2. **Create game class** `[GameName]Game.ts` extending `BaseGame`
3. **Create assets folder** for game assets (models, textures, sounds, etc.)
4. **Implement required methods:**
   - `init()` - Initialize game state
   - `update(deltaTime)` - Update game logic
   - `render(ctx)` - Render game graphics
   - `handleInput(key)` - Handle user input
   - `cleanup()` - Clean up resources
5. **Register the game** in `games/GameRenderer.ts`
6. **Add game metadata** to `lib/games.ts`

### Game Architecture

Each game extends `BaseGame` which provides:
- Game state management (score, level, lives, pause, game over)
- Common game properties
- Abstract methods for game-specific logic

**Three.js Games:**
- Use Three.js Scene, Camera, and WebGLRenderer
- Load assets from `public/games/[game-name]/assets/`
- Render to the main canvas element

**2D Canvas Games:**
- Use HTML5 Canvas 2D context
- Draw directly to canvas

### API Integration

The frontend uses `lib/api/client.ts` to communicate with the backend:

```typescript
import { apiClient } from '@/lib/api/client'

// Authentication
await apiClient.signup(email, password)
await apiClient.login(email, password)
await apiClient.logout()
await apiClient.getCurrentUser()

// Games
await apiClient.saveScore(gameId, analytics)

// Statistics
await apiClient.getUserStats()
await apiClient.getRecentSessions(limit)

// Questions
await apiClient.getQuestions(topic, difficulty, limit)
await apiClient.getTopics()
```

## Deployment

### Deploy to Vercel

**Using Vercel CLI:**
```bash
cd frontend
vercel --prod
```

**Using Vercel Dashboard:**
1. Go to https://vercel.com
2. Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Add environment variables (see below)
5. Deploy

**Using deployment script:**
```bash
cd frontend
./deploy.sh
```

### Environment Variables for Production

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (e.g., `https://your-backend.vercel.app`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (optional) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (optional) |

**Important:**
- Use `NEXT_PUBLIC_` prefix for client-side accessible variables
- Set for all environments (Production, Preview, Development)
- Use **Plain Text** type (not Secret)
- Redeploy after adding variables

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Authentication

Authentication is handled through the backend API. The frontend:
- Stores auth tokens in `localStorage`
- Includes tokens in API requests via `Authorization` header
- Uses middleware to protect routes (currently disabled for testing)

## File Structure Details

### Components

- **GameContainer.tsx** - Main game container for Three.js games
- **WhackAMoleGameContainer.tsx** - Custom container for Whack-A-Mole
- **ZombieGameContainer.tsx** - Custom container for Zombie game
- **CarnivalGameContainer.tsx** - Custom container for Carnival game
- **DashboardLayout.tsx** - Layout wrapper for dashboard pages
- **AuthButton.tsx** - Authentication button component

### Games

Each game directory contains:
- `[GameName]Game.ts` - Main game class
- `types.ts` - TypeScript types (if needed)
- `questions.ts` or `questions.json` - Game-specific questions
- `assets/` - Game assets (models, textures, sounds)

### API Client

The `lib/api/client.ts` file handles all backend communication:
- Automatic token management
- Error handling
- CORS configuration
- Request/response formatting

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or use different port
PORT=3001 npm run dev
```

### Cannot Connect to Backend

1. Make sure backend is running on `http://localhost:8000`
2. Check `NEXT_PUBLIC_API_URL` is set correctly
3. Check browser console for CORS errors
4. Verify backend CORS allows `http://localhost:3000`

### Module Not Found Errors

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Build Errors

1. Run type checking: `npm run type-check`
2. Fix TypeScript errors
3. Check for missing dependencies
4. Verify all imports are correct

## Performance Optimization

- Games use Three.js for efficient 3D rendering
- Assets are loaded on-demand
- Game state is managed efficiently
- Canvas rendering is optimized for 60fps

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Requires WebGL support for 3D games

## License

MIT
