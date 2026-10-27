import type { RoomCreateRequest, RoomResponse } from '../../types/rooms'
import coreApi from './coreApi'

export async function createRoom(
  request: RoomCreateRequest,
): Promise<RoomResponse> {
  const response = await coreApi.post<RoomResponse>('/rooms', request)
  return response.data
}

export async function listRooms(): Promise<RoomResponse[]> {
  const response = await coreApi.get<RoomResponse[]>('/rooms')
  return response.data
}

export async function getRoom(roomId: string): Promise<RoomResponse> {
  const response = await coreApi.get<RoomResponse>(`/rooms/${roomId}`)
  return response.data
}

export async function joinRoom(roomId: string): Promise<void> {
  await coreApi.post<void>(`/rooms/${roomId}/join`)
}

export async function leaveRoom(roomId: string): Promise<void> {
  await coreApi.delete<void>(`/rooms/${roomId}/leave`)
}
