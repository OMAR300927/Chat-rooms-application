import type { DocumentResponse } from './documents'
import type { AIMessageResponse } from './ai-messages'

export type ConversationCreateRequest = {
  title?: string | null
  document_ids?: string[]
}

export type ConversationResponse = {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export type ConversationDetailResponse = ConversationResponse & {
  documents: DocumentResponse[]
  messages: AIMessageResponse[]
}
