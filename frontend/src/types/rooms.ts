export type RoomCreateRequest = {
  name: string
}

export type RoomResponse = {
  id: string
  name: string
  created_by_user_id: string
  created_at: string
}
