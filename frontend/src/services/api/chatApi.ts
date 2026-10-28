import type { MessageResponse } from '../../types/messages'
import coreApi from './coreApi'

export async function listRoomMessages(
  roomId: string,
  limit = 100,
  offset = 0,
): Promise<MessageResponse[]> {
  const response = await coreApi.get<MessageResponse[]>(
    `/chat/rooms/${encodeURIComponent(roomId)}/messages`,
    { params: { limit, offset } },
  )
  return response.data
}
