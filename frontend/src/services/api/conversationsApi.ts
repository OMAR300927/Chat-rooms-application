import type {
  ConversationCreateRequest,
  ConversationDetailResponse,
  ConversationResponse,
} from '../../types/conversations'

import type {
  AIMessageCreateRequest,
  SendAIMessageResponse,
} from '../../types/ai-messages'

import aiApi from './aiApi'

export async function createConversation(
  request: ConversationCreateRequest = {},
): Promise<ConversationDetailResponse> {
  const response = await aiApi.post<ConversationDetailResponse>(
    '/conversations',
    request,
  )
  return response.data
}

export async function listConversations(): Promise<ConversationResponse[]> {
  const response =
    await aiApi.get<ConversationResponse[]>('/conversations')
  return response.data
}

export async function getConversation(
  conversationId: string,
): Promise<ConversationDetailResponse> {
  const response = await aiApi.get<ConversationDetailResponse>(
    `/conversations/${conversationId}`,
  )
  return response.data
}

export async function sendConversationMessage(
  conversationId: string,
  request: AIMessageCreateRequest,
): Promise<SendAIMessageResponse> {
  const response = await aiApi.post<SendAIMessageResponse>(
    `/conversations/${conversationId}/messages`,
    request,
  )
  return response.data
}

export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  await aiApi.delete<void>(`/conversations/${conversationId}`)
}
