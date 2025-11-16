'use client'

import { GameAnalytics } from '@/games/whackamole/types'

interface GameOverModalProps {
  analytics: GameAnalytics
  onRestart: () => void
}

export function GameOverModal({ analytics, onRestart }: GameOverModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-2xl w-full border-2 border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🎉</div>
          <h2 className="text-4xl font-bold text-white mb-1">
            Game Complete!
          </h2>
          <p className="text-gray-400 text-sm">Great job on finishing the challenge</p>
        </div>

        {/* Main Stats - Compact Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-white">{analytics.score}</div>
            <div className="text-blue-200 text-xs font-semibold mt-1">SCORE</div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-white">{analytics.accuracy.toFixed(0)}%</div>
            <div className="text-green-200 text-xs font-semibold mt-1">ACCURACY</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-white">{analytics.correctAnswers}</div>
            <div className="text-purple-200 text-xs font-semibold mt-1">CORRECT</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 text-center">
            <div className="text-3xl font-black text-white">{analytics.streakInfo.maxStreak}</div>
            <div className="text-orange-200 text-xs font-semibold mt-1">MAX STREAK</div>
          </div>
        </div>

        {/* Topic Performance - Compact */}
        <div className="bg-gray-800/50 rounded-xl p-4 mb-5">
          <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>Performance by Topic</span>
          </h3>
          <div className="space-y-2">
            {Object.entries(analytics.topicPerformance).map(([topic, perf]) => (
              <div key={topic} className="flex items-center gap-3">
                <div className="text-white text-xs font-medium w-20">{topic}</div>
                <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${perf.accuracy}%` }}
                  />
                </div>
                <div className="text-gray-400 text-xs w-16 text-right">
                  {perf.correct}/{perf.total}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-gray-800/50 rounded-xl p-3 mb-5 text-center">
          <div className="text-gray-400 text-xs mb-1">Average Response Time</div>
          <div className="text-2xl font-bold text-white">
            {(analytics.averageResponseTime / 1000).toFixed(1)}s
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onRestart}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg py-3 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            🎮 Play Again
          </button>
          <div className="text-center p-2 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-xs">
              🤖 Analytics sent to AI for personalized learning
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

