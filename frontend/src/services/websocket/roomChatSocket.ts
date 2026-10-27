import { CORE_API_BASE_URL } from '../../utils/apiBaseUrl'
import type { MessageResponse } from '../../types/messages'

export type RoomChatSocketHandlers = {
  onOpen?: (event: Event) => void
  onMessage?: (message: MessageResponse) => void
  onServerError?: (message: string) => void
  onProtocolError?: (error: Error) => void
  onError?: (event: Event) => void
  onClose?: (event: CloseEvent) => void
}

export type RoomChatSocketConnection = {
  readonly readyState: number
  sendMessage: (content: string) => void
  disconnect: (code?: number, reason?: string) => void
}

type ServerErrorMessage = {
  error: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isMessageResponse(value: unknown): value is MessageResponse {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    typeof value.room_id === 'string' &&
    typeof value.author_id === 'string' &&
    typeof value.content === 'string' &&
    typeof value.created_at === 'string'
  )
}

function isServerErrorMessage(value: unknown): value is ServerErrorMessage {
  return (
    isRecord(value) &&
    typeof value.error === 'string'
  )
}

function createRoomChatUrl(roomId: string): string {
  const url = new URL(
    `${CORE_API_BASE_URL}/chat/rooms/${encodeURIComponent(roomId)}/ws`,
  )

  if (url.protocol === 'http:') {
    url.protocol = 'ws:'

  } else if (url.protocol === 'https:') {
    url.protocol = 'wss:'

  } else {
    throw new Error('Core API URL must use HTTP or HTTPS')
  }

  return url.toString()
}

export function connectToRoomChat(
  roomId: string,
  handlers: RoomChatSocketHandlers = {},
): RoomChatSocketConnection {
  if (!roomId.trim()) {
    throw new Error('Room ID must not be blank')
  }

  const socket = new WebSocket(createRoomChatUrl(roomId))

  socket.addEventListener('open', (event) => {
    handlers.onOpen?.(event)
  })

  socket.addEventListener('message', (event: MessageEvent<string>) => {
    let payload: unknown
    try {
      payload = JSON.parse(event.data)

    } catch {
      handlers.onProtocolError?.(
        new Error('Room chat sent a message that was not valid JSON'),
      )
      return
    }

    if (isServerErrorMessage(payload)) {
      handlers.onServerError?.(payload.error)
      return
    }

    if (!isMessageResponse(payload)) {
      handlers.onProtocolError?.(
        new Error('Room chat sent a message with an unexpected format'),
      )
      return
    }

    handlers.onMessage?.(payload)
  })

  socket.addEventListener('error', (event) => {
    handlers.onError?.(event)
  })

  socket.addEventListener('close', (event) => {
    handlers.onClose?.(event)
  })

  return {
    get readyState() {
      return socket.readyState
    },
    sendMessage(content: string) {
      const normalizedContent = content.trim()
      if (!normalizedContent) {
        throw new Error('Message content must not be blank')
      }
      
      if (socket.readyState !== WebSocket.OPEN) {
        throw new Error('Room chat connection is not open')
      }

      socket.send(JSON.stringify({ content: normalizedContent }))
    },
    disconnect(code = 1000, reason = 'Client disconnected') {
      if (
        socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN
      ) {
        socket.close(code, reason)
      }
    },
  }
}
