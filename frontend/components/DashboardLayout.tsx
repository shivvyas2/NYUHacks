'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { games } from '@/lib/games'
import { AuthButton } from './AuthButton'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          {sidebarOpen && (
            <h1 className="text-xl font-bold text-gray-800">SATistics</h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/dashboard'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={pathname === '/dashboard' ? { backgroundColor: '#0288D1' } : {}}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {sidebarOpen && <span className="font-medium">Dashboard</span>}
            </Link>

            <Link
              href="/stats"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                pathname === '/stats'
                  ? 'text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={pathname === '/stats' ? { backgroundColor: '#0288D1' } : {}}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {sidebarOpen && <span className="font-medium">Statistics</span>}
            </Link>

            {/* Games Section */}
            {sidebarOpen && (
              <div className="pt-4">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Games
                </div>
              </div>
            )}

            {games.map((game) => {
              // Remove emojis and get first letter/character for icon
              const cleanName = game.name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()
              const displayName = cleanName.split(' ')[0]
              const iconLetter = displayName.charAt(0).toUpperCase()
              
              return (
                <Link
                  key={game.id}
                  href={`/games/${game.id}/select`}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    pathname?.includes(`/games/${game.id}`)
                      ? 'text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  style={pathname?.includes(`/games/${game.id}`) ? { backgroundColor: '#0288D1' } : {}}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm font-bold" style={{
                    backgroundColor: pathname?.includes(`/games/${game.id}`) ? 'rgba(255,255,255,0.2)' : '#f3f4f6',
                    color: pathname?.includes(`/games/${game.id}`) ? '#fff' : '#6b7280'
                  }}>
                    {iconLetter}
                  </div>
                  {sidebarOpen && (
                    <span className="font-medium text-sm">{cleanName}</span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-4">
          <AuthButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        {/* Header Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-400">
              <span className="text-sm font-medium text-gray-700">U</span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}

