/**
 * FastAPI Backend Client
 * Handles all API calls to the FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
      } else {
        localStorage.removeItem('auth_token')
      }
    }
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'include', // Include credentials for CORS
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }))
        throw new Error(error.detail || `HTTP error! status: ${response.status}`)
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return {} as T
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Authentication endpoints
  async signup(email: string, password: string) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async login(email: string, password: string) {
    const response = await this.request<{ access_token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    
    // Store token
    if (response.access_token) {
      this.setToken(response.access_token)
    }
    
    return response
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      })
    } finally {
      // Always clear token even if request fails
      this.setToken(null)
    }
  }

  async getCurrentUser() {
    return this.request('/api/auth/me')
  }

  // Game endpoints
  async saveScore(gameId: string, analytics: any) {
    return this.request('/api/games/save-score', {
      method: 'POST',
      body: JSON.stringify({
        gameId,
        analytics,
      }),
    })
  }

  // Statistics endpoints
  async getUserStats() {
    return this.request('/api/stats/user')
  }

  async getRecentSessions(limit: number = 10) {
    return this.request(`/api/stats/sessions?limit=${limit}`)
  }

  // Question endpoints
  async getQuestions(topic?: string, difficulty?: string, limit: number = 10) {
    const params = new URLSearchParams()
    if (topic) params.append('topic', topic)
    if (difficulty) params.append('difficulty', difficulty)
    params.append('limit', limit.toString())
    
    return this.request(`/api/questions/?${params.toString()}`)
  }

  async getTopics() {
    return this.request('/api/questions/topics')
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

