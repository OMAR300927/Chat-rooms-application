export type MessageCreateRequest = {
  content: string
}

export type MessageResponse = {
  id: string
  room_id: string
  author_id: string
  content: string
  created_at: string
}
