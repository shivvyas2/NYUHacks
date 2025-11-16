'use client'

import { DashboardLayout } from '@/components/DashboardLayout'
import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api/client'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [chartsLoaded, setChartsLoaded] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userStats = await apiClient.getUserStats()
        setStats(userStats)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
    // Load charts after component mounts
    setChartsLoaded(true)
  }, [])

  // Mock data for demonstration - replace with actual API data
  const averageScore = stats?.overall_accuracy ? Math.round(stats.overall_accuracy * 100) : 0
  const targetScore = 1500 // Target SAT score
  const gamesPlayed = stats?.total_games_played || 0

  // SAT Categories data
  const satCategories = [
    { name: 'Math', solved: 45, strong: true, accuracy: 85 },
    { name: 'Reading', solved: 38, strong: false, accuracy: 72 },
    { name: 'Writing', solved: 42, strong: true, accuracy: 88 },
    { name: 'Grammar', solved: 35, strong: false, accuracy: 65 },
  ]

  // Performance over time (last 6 months) - for grouped bar chart
  const performanceData = [
    { month: 'Jan', yourScore: 1200, targetScore: 1500 },
    { month: 'Feb', yourScore: 1250, targetScore: 1500 },
    { month: 'Mar', yourScore: 1300, targetScore: 1500 },
    { month: 'Apr', yourScore: 1350, targetScore: 1500 },
    { month: 'May', yourScore: 1400, targetScore: 1500 },
    { month: 'Jun', yourScore: 1450, targetScore: 1500 },
  ]

  // Donut chart data
  const donutData = [
    { name: 'Math', value: satCategories[0].solved, color: '#0288D1' },
    { name: 'Reading', value: satCategories[1].solved, color: '#1976D2' },
    { name: 'Writing', value: satCategories[2].solved, color: '#1565C0' },
  ]

  const totalDonut = donutData.reduce((sum, d) => sum + d.value, 0)
  const donutPercentages = donutData.map(d => ({
    ...d,
    percentage: (d.value / totalDonut) * 100
  }))

  // Monthly sales line chart data
  const monthlySalesData = [35, 60, 30, 55, 40]
  const maxSales = Math.max(...monthlySalesData)
  const minSales = Math.min(...monthlySalesData)
  const salesRange = maxSales - minSales || 1

  // Calculate bar heights for performance chart
  const maxScore = 1600
  const chartHeight = 200
  const calculateBarHeight = (score: number) => (score / maxScore) * chartHeight

  // Strong and Weak Areas
  const strongAreas = satCategories.filter(c => c.strong)
  const weakAreas = satCategories.filter(c => !c.strong)

  return (
    <DashboardLayout>
      <div className="p-6 min-h-screen bg-gray-50">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back</h1>
            <p className="text-base text-gray-600">Analytical Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-gray-50">
              <span className="text-sm text-gray-700">Today {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <button className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium shadow-sm" style={{
              backgroundColor: '#0288D1'
            }}>
              + Add New
            </button>
          </div>
        </div>

        {/* First Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          {/* Welcome Card */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-lg shadow-lg p-[30px] h-full relative overflow-hidden border border-gray-100">
              <div className="flex items-center justify-between relative z-10">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3 leading-tight">
                    Hey there! <br /> Keep practicing to improve your SAT score.
                  </h3>
                  <button className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium shadow-sm mt-4" style={{
                    backgroundColor: '#0288D1'
                  }}>
                    View Progress
                  </button>
                </div>
                <div className="w-32 h-32 flex items-center justify-center opacity-20">
                  <svg className="w-24 h-24 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Average Score Card (Earnings style) */}
          <div className="lg:col-span-3">
            <div className="rounded-lg p-[30px] h-full text-white shadow-lg" style={{
              backgroundColor: '#0288D1'
            }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Your Average Score</h3>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-4xl font-bold mb-2">{1340}</p>
              <p className="text-white/80 text-base">Out of 1600</p>
            </div>
          </div>

          {/* Games Played Card (Monthly Sales style) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-[30px] h-full border border-gray-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg text-gray-600 mb-1">Games Played</p>
                  <p className="text-3xl font-bold text-gray-800">{5}</p>
                </div>
                <div className="w-14 h-14 rounded-lg flex items-center justify-center" style={{
                  backgroundColor: '#FFE082'
                }}>
                  <svg className="w-7 h-7" style={{ color: '#F57C00' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {/* Area Chart */}
              <div className="absolute bottom-0 left-0 right-0 h-[90px] -mx-[30px]">
                <svg width="100%" height="100%" className="overflow-visible">
                  <defs>
                    <linearGradient id="salesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0288D1" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#0288D1" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M 0 ${90 - ((monthlySalesData[0] - minSales) / salesRange) * 70} 
                        L ${100 * (1/4)} ${90 - ((monthlySalesData[1] - minSales) / salesRange) * 70}
                        L ${100 * (2/4)} ${90 - ((monthlySalesData[2] - minSales) / salesRange) * 70}
                        L ${100 * (3/4)} ${90 - ((monthlySalesData[3] - minSales) / salesRange) * 70}
                        L 100 ${90 - ((monthlySalesData[4] - minSales) / salesRange) * 70}
                        L 100 90 L 0 90 Z`}
                    fill="url(#salesGradient)"
                  />
                  <path
                    d={`M 0 ${90 - ((monthlySalesData[0] - minSales) / salesRange) * 70} 
                        L ${100 * (1/4)} ${90 - ((monthlySalesData[1] - minSales) / salesRange) * 70}
                        L ${100 * (2/4)} ${90 - ((monthlySalesData[2] - minSales) / salesRange) * 70}
                        L ${100 * (3/4)} ${90 - ((monthlySalesData[3] - minSales) / salesRange) * 70}
                        L 100 ${90 - ((monthlySalesData[4] - minSales) / salesRange) * 70}`}
                    fill="none"
                    stroke="#0288D1"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Overview Chart (Sales Overview style) */}
        <div className="bg-white rounded-lg shadow-lg p-[30px] mb-4 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">Score Performance Overview</h3>
              <p className="text-sm text-gray-500">Your progress over the last 6 months</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#0288D1' }}></div>
                <span className="text-sm font-medium" style={{ color: '#0288D1' }}>Your Score</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#64B5F6' }}></div>
                <span className="text-sm font-medium" style={{ color: '#64B5F6' }}>Target Score</span>
              </div>
            </div>
          </div>
          {/* Bar Chart */}
          <div className="h-[265px] flex items-end justify-between gap-2">
            {performanceData.map((item, index) => {
              const yourHeight = calculateBarHeight(item.yourScore)
              const targetHeight = calculateBarHeight(item.targetScore)
              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full">
                  <div className="w-full flex items-end justify-center gap-1 mb-2 h-[200px]">
                    <div 
                      className="w-[42%] rounded-t transition-all"
                      style={{ 
                        height: `${yourHeight}px`,
                        backgroundColor: '#0288D1',
                        minHeight: yourHeight > 0 ? '4px' : '0'
                      }}
                    ></div>
                    <div 
                      className="w-[42%] rounded-t transition-all"
                      style={{ 
                        height: `${targetHeight}px`,
                        backgroundColor: '#64B5F6',
                        minHeight: targetHeight > 0 ? '4px' : '0'
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{item.month}</span>
                </div>
              )
            })}
          </div>
          {/* Y-axis labels */}
          <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
            <span>1000</span>
            <span>1300</span>
            <span>1600</span>
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
          {/* SAT Categories Donut Chart (Total Sales style) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-lg p-[30px] h-full border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">SAT Categories</h3>
                  <p className="text-sm text-gray-500">Overview of Categories</p>
                </div>
                <select className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white text-gray-700">
                  <option>March 2024</option>
                </select>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-lg text-gray-600">Questions Solved</p>
                  <p className="text-3xl font-bold text-gray-800">{satCategories.reduce((sum, c) => sum + c.solved, 0)}</p>
                </div>
                {/* Donut Chart */}
                <div className="relative h-[280px] flex items-center justify-center">
                  <svg width="280" height="280" className="transform -rotate-90">
                    <circle
                      cx="140"
                      cy="140"
                      r="80"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="16"
                    />
                    {donutPercentages.map((item, index) => {
                      const circumference = 2 * Math.PI * 80
                      const offset = donutPercentages.slice(0, index).reduce((sum, d) => sum + (d.percentage / 100) * circumference, 0)
                      const dashArray = (item.percentage / 100) * circumference
                      return (
                        <circle
                          key={index}
                          cx="140"
                          cy="140"
                          r="80"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="16"
                          strokeDasharray={dashArray}
                          strokeDashoffset={-offset}
                          strokeLinecap="round"
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-8 h-8" style={{ color: '#adb0bb' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-6">
                  {donutData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance by Category Table */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-lg p-[30px] h-full border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Performance by Category</h3>
                  <p className="text-sm text-gray-500">Your strengths and weaknesses</p>
                </div>
                <select className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white text-gray-700">
                  <option>March 2024</option>
                </select>
              </div>
              <div className="overflow-x-auto -mx-[30px] px-[30px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Category</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Accuracy</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-700">Questions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {satCategories.map((cat, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                              backgroundColor: idx === 0 ? '#BBDEFB' : idx === 1 ? '#90CAF9' : idx === 2 ? '#FFE082' : '#CE93D8'
                            }}>
                              <span className="text-sm font-medium" style={{
                                color: idx === 0 ? '#0288D1' : idx === 1 ? '#1976D2' : idx === 2 ? '#F57C00' : '#7B1FA2'
                              }}>{cat.name[0]}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                              <p className="text-xs text-gray-500">SAT {cat.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 rounded text-xs font-medium" style={{
                            backgroundColor: cat.strong ? '#C8E6C9' : '#FFCDD2',
                            color: cat.strong ? '#388E3C' : '#D32F2F',
                            border: `1px solid ${cat.strong ? '#81C784' : '#EF9A9A'}`
                          }}>
                            {cat.strong ? 'Strong' : 'Weak'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-800">{cat.accuracy}%</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm font-medium text-gray-800">{cat.solved}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Third Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Target Score Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-lg p-[30px] h-full border border-gray-100">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Your Target Score</h3>
                <p className="text-sm text-gray-500">Set your goal</p>
              </div>
              <div className="text-center py-8">
                <div className="text-5xl font-bold mb-2" style={{ color: '#0288D1' }}>{targetScore}</div>
                <p className="text-gray-500 text-sm mb-4">Out of 1600</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div 
                    className="h-3 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((1360 / targetScore) * 100, 100)}%`,
                      backgroundColor: '#0288D1'
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {Math.round((averageScore / targetScore) * 100)}% towards your goal
                </p>
              </div>
            </div>
          </div>

          {/* Strong Areas */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-lg p-[30px] h-full border border-gray-100">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Strong Areas</h3>
                <p className="text-sm text-gray-500">Your best performing categories</p>
              </div>
              <div className="space-y-4">
                {strongAreas.map((area, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-md"
                    style={{
                      backgroundColor: '#E8F5E9',
                      border: '1px solid #C8E6C9'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: '#4CAF50'
                        }}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-gray-800 mb-0.5">{area.name}</p>
                        <p className="text-sm text-gray-600 font-normal">{area.accuracy}% accuracy</p>
                      </div>
                    </div>
                    <div 
                      className="px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm"
                      style={{
                        backgroundColor: '#4CAF50',
                        color: '#fff'
                      }}
                    >
                      +{area.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weak Areas */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-lg p-[30px] h-full border border-gray-100">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1">Areas to Improve</h3>
                <p className="text-sm text-gray-500">Focus on these categories</p>
              </div>
              <div className="space-y-4">
                {weakAreas.map((area, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between p-4 rounded-lg transition-all hover:shadow-md"
                    style={{
                      backgroundColor: '#FFEBEE',
                      border: '1px solid #FFCDD2'
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: '#F44336'
                        }}
                      >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-gray-800 mb-0.5">{area.name}</p>
                        <p className="text-sm text-gray-600 font-normal">{area.accuracy}% accuracy</p>
                      </div>
                    </div>
                    <div 
                      className="px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm"
                      style={{
                        backgroundColor: '#F44336',
                        color: '#fff'
                      }}
                    >
                      {area.accuracy}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
