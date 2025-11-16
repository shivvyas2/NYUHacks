# SAT Arcade - Frontend 🎮

Next.js 14 frontend with Three.js-powered 3D SAT learning games.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## 🎯 Games

### **Whack-A-Mole SAT**
- 3D whack-a-mole with SAT questions
- Hit the correct answer before time runs out!
- Files: `games/whackamole/`, `components/WhackAMoleGameContainer.tsx`

### **SAT Balloon Pop**
- Carnival shooter with floating balloons
- Shoot the balloon with the correct answer!
- Files: `games/carnival/`, `components/CarnivalGameContainer.tsx`

### **SAT Zombie Apocalypse** 🧟
- First-person 3D shooter
- Zombies labeled A, B, C, D - shoot the correct one!
- WASD movement, mouse to look, click to shoot
- Files: `games/zombie/`, `components/ZombieGameContainer.tsx`

## 📁 Structure

```
frontend/
├── app/
│   ├── games/[gameId]/page.tsx  # Dynamic game route
│   └── page.tsx                  # Home page
├── components/
│   ├── GameCard.tsx              # Game card
│   ├── GameOverModal.tsx         # Reusable stats modal
│   ├── WhackAMoleGameContainer.tsx
│   ├── CarnivalGameContainer.tsx
│   └── ZombieGameContainer.tsx
├── games/
│   ├── whackamole/
│   │   ├── WhackAMoleGame.ts     # Three.js game engine
│   │   ├── types.ts              # Interfaces
│   │   └── questions.ts          # SAT questions
│   ├── carnival/
│   │   ├── CarnivalGame.ts
│   │   ├── types.ts
│   │   └── questions.ts
│   └── zombie/
│       ├── ZombieGame.ts         # FPS game engine
│       ├── types.ts
│       └── questions.ts
└── lib/
    └── games.ts                  # Game registry
```

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Three.js** - All games use 3D rendering
- **Tailwind CSS**

## 🎨 Adding a New Game

1. Create folder: `games/your-game/`
2. Create `YourGame.ts` with Three.js logic (Scene, Camera, Renderer)
3. Create `YourGameContainer.tsx` React wrapper
4. Add to `lib/games.ts` registry

See existing games as templates!

---

**Built for NYU Hacks 2025! 🎓**
