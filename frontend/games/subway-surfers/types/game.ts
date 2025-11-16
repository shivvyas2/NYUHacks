export interface Question {
  id: number
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface QuestionsData {
  questions: Question[]
}

export interface Game {
  id: string
  name: string
  description: string
  status: string
}

