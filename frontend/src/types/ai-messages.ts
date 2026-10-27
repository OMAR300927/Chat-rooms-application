export type AIMessageRole = 'user' | 'assistant'

export type AIMessageCreateRequest = {
  content: string
}

export type AIMessageResponse = {
  id: string
  conversation_id: string
  role: AIMessageRole
  content: string
  created_at: string
}

export type SendAIMessageResponse = AIMessageResponse[]
