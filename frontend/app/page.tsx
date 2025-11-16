import { GameCard } from '@/components/GameCard'
import { games } from '@/lib/games'

export default function Home() {
  return (
    <main className="min-h-screen retro-gameboy-bg flex items-center justify-center p-4">
      <div className="retro-gameboy-container max-w-4xl w-full">
        {/* Game Boy Device */}
        <div className="retro-gameboy-device">
          {/* Game Boy Screen Frame */}
          <div className="retro-screen-frame">
            {/* Screen Border */}
            <div className="retro-screen-border">
              {/* Screen Content */}
              <div className="retro-screen-content">
                {/* Header */}
                <header className="text-center mb-8">
                  <h1 className="retro-title mb-2">NYU HACKS ARCADE</h1>
                  <div className="retro-divider"></div>
                  <p className="retro-subtitle mt-2">SELECT GAME</p>
                </header>

                {/* Game List */}
                <div className="retro-game-list">
                  {games.map((game, index) => (
                    <GameCard key={game.id} game={game} index={index} />
                  ))}
                </div>

                {/* Footer Instructions */}
                <div className="retro-footer mt-8">
                  <div className="retro-instruction">
                    <span className="retro-key">A</span> SELECT
                  </div>
                  <div className="retro-instruction">
                    <span className="retro-key">B</span> BACK
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Game Boy Controls */}
          <div className="retro-controls">
            {/* D-Pad */}
            <div className="retro-dpad-container">
              <div className="retro-dpad">
                <div className="retro-dpad-up"></div>
                <div className="retro-dpad-middle">
                  <div className="retro-dpad-left"></div>
                  <div className="retro-dpad-center"></div>
                  <div className="retro-dpad-right"></div>
                </div>
                <div className="retro-dpad-down"></div>
              </div>
              <div className="retro-label">DIRECTION</div>
            </div>

            {/* A and B Buttons */}
            <div className="retro-buttons-container">
              <div className="retro-buttons">
                <div className="retro-button retro-button-b">
                  <div className="retro-button-inner">B</div>
                </div>
                <div className="retro-button retro-button-a">
                  <div className="retro-button-inner">A</div>
                </div>
              </div>
              <div className="retro-label">ACTION</div>
            </div>
          </div>

          {/* Start and Select */}
          <div className="retro-start-select">
            <div className="retro-start-select-button">
              <div className="retro-start-select-label">SELECT</div>
            </div>
            <div className="retro-start-select-button">
              <div className="retro-start-select-label">START</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

