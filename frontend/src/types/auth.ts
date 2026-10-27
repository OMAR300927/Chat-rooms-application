export type RegisterRequest = {
  email: string
  username: string
  password: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type UserResponse = {
  id: string
  email: string
  username: string
  is_active: boolean
  ai_chat_unlocked: boolean
  created_at: string
}
