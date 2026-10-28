import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Hash } from 'lucide-react'
import { Link, useParams } from 'react-router'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { getCurrentUser } from '../../services/api/authApi'
import { listRoomMessages } from '../../services/api/chatApi'
import { getRoom } from '../../services/api/roomsApi'
import type { RoomChatSocketConnection } from '../../services/websocket/roomChatSocket'
import { connectToRoomChat } from '../../services/websocket/roomChatSocket'
import type { MessageResponse } from '../../types/messages'
import type { RoomResponse } from '../../types/rooms'
import { getErrorMessage } from '../../utils/errors'
import { redirectToLoginForExpiredSession } from '../../utils/session'
import ConnectionStatus, {
  type RoomConnectionStatus,
} from './components/ConnectionStatus'
import RoomMessageComposer from './components/RoomMessageComposer'
import RoomMessageList from './components/RoomMessageList'

function mergeMessages(
  ...messageGroups: MessageResponse[][]
): MessageResponse[] {
  const uniqueMessages = new Map<string, MessageResponse>()
  for (const message of messageGroups.flat()) {
    uniqueMessages.set(message.id, message)
  }

  return [...uniqueMessages.values()].sort(
    (first, second) =>
      new Date(first.created_at).getTime() -
      new Date(second.created_at).getTime(),
  )
}

function getCloseMessage(code: number, reason: string): string {
  if (reason) return reason
  if (code === 4401) return 'Sign in again to connect to room chat.'
  if (code === 4403) return 'You do not have access to this room.'
  if (code === 4404) return 'This room could not be found.'
  return 'The chat connection was closed. Try reconnecting.'
}

function RoomChatPage() {
  const { roomId } = useParams()
  const [room, setRoom] = useState<RoomResponse | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [pageError, setPageError] = useState('')
  const [connectionError, setConnectionError] = useState('')
  const [sendError, setSendError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadedRoomId, setLoadedRoomId] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] =
    useState<RoomConnectionStatus>('connecting')
  const [connectionRoomId, setConnectionRoomId] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const connectionRef = useRef<RoomChatSocketConnection | null>(null)

  useEffect(() => {
    if (!roomId) return

    const currentRoomId = roomId

    let isCurrent = true
    let connection: RoomChatSocketConnection | null = null

    async function loadRoomChat() {
      try {
        const [loadedRoom, loadedMessages, user] = await Promise.all([
          getRoom(currentRoomId),
          listRoomMessages(currentRoomId),
          getCurrentUser(),
        ])

        if (!isCurrent) return
        setPageError('')
        setConnectionError('')
        setSendError('')
        setRoom(loadedRoom)
        setCurrentUserId(user.id)
        setMessages(mergeMessages(loadedMessages))
        setLoadedRoomId(currentRoomId)
        setIsLoading(false)
        setConnectionStatus('connecting')

        try {
          connection = connectToRoomChat(currentRoomId, {
            onOpen: () => {
              if (!isCurrent) return
              setConnectionRoomId(currentRoomId)
              setConnectionError('')
              setConnectionStatus('connected')
            },
            onMessage: (message) => {
              if (isCurrent) {
                setMessages((currentMessages) =>
                  mergeMessages(currentMessages, [message]),
                )
              }
            },
            onServerError: (message) => {
              if (isCurrent) setSendError(message)
            },
            onProtocolError: (error) => {
              if (isCurrent) setConnectionError(error.message)
            },
            onError: () => {
              if (!isCurrent) return
              setConnectionRoomId(currentRoomId)
              setConnectionError(
                'Unable to connect to chat. Check your connection and try again.',
              )
              setConnectionStatus('error')
            },
            onClose: (event) => {
              if (!isCurrent) return
              if (event.code === 4401) {
                redirectToLoginForExpiredSession()
                return
              }
              setConnectionRoomId(currentRoomId)
              setConnectionError(getCloseMessage(event.code, event.reason))
              setConnectionStatus(
                event.code === 1000 ? 'disconnected' : 'error',
              )
            },
          })
          connectionRef.current = connection
        } catch (error: unknown) {
          if (!isCurrent) return
          setConnectionRoomId(currentRoomId)
          setConnectionError(
            getErrorMessage(error, 'Unable to connect to room chat.'),
          )
          setConnectionStatus('error')
        }
      } catch (error: unknown) {
        if (!isCurrent) return
        setPageError(
          getErrorMessage(error, 'Unable to load this room and its messages.'),
        )
        setLoadedRoomId(currentRoomId)
        setIsLoading(false)
        setConnectionRoomId(currentRoomId)
        setConnectionStatus('error')
      }
    }

    void loadRoomChat()

    return () => {
      isCurrent = false
      connection?.disconnect()
      if (connectionRef.current === connection) {
        connectionRef.current = null
      }
    }
  }, [roomId, retryCount])

  function handleReconnect() {
    setConnectionError('')
    setSendError('')
    setConnectionStatus('connecting')
    setIsLoading(true)
    setRetryCount((count) => count + 1)
  }

  function handleSend(content: string): boolean {
    setSendError('')
    try {
      const connection = connectionRef.current
      if (!connection) {
        setSendError('Chat connection is unavailable. Reconnect and try again.')
        return false
      }

      connection.sendMessage(content)
      return true
    } catch (error: unknown) {
      setSendError(getErrorMessage(error, 'Unable to send this message.'))
      return false
    }
  }

  const isRoomLoading =
    Boolean(roomId) && (isLoading || loadedRoomId !== roomId)

  if (isRoomLoading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <Spinner
          label="Loading room chat"
          className="text-blue-700 dark:text-blue-300"
        />
      </div>
    )
  }

  if (pageError || !room || !roomId) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="space-y-4" role="alert">
          <div>
            <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-white">
              Could not open this room
            </h2>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {!roomId
                ? 'Room ID is missing.'
                : pageError || 'Room information is unavailable.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleReconnect} variant="secondary">
              Try again
            </Button>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 no-underline hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              to="/rooms"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Back to rooms
            </Link>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-7rem)] min-h-[24rem] w-full max-w-5xl flex-col px-3 py-4 max-[720px]:h-[calc(100dvh-11rem)] sm:px-6 sm:py-6 lg:px-8">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            aria-label="Back to rooms"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            to="/rooms"
          >
            <ArrowLeft aria-hidden="true" size={18} />
          </Link>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Hash aria-hidden="true" size={19} />
          </span>
          <div className="min-w-0">
            <h2 className="m-0 truncate text-lg font-semibold text-slate-900 dark:text-white">
              {room.name}
            </h2>
            <p className="m-0 text-sm text-slate-500 dark:text-slate-400">
              Room conversation
            </p>
          </div>
        </div>
      </header>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">
          <ConnectionStatus
            errorMessage={connectionError}
            onReconnect={handleReconnect}
            status={
              connectionRoomId === roomId
                ? connectionStatus
                : 'connecting'
            }
          />
        </div>

        <RoomMessageList
          currentUserId={currentUserId}
          messages={messages}
        />

        {sendError && (
          <p
            aria-live="polite"
            className="m-0 border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            role="alert"
          >
            {sendError}
          </p>
        )}
        <RoomMessageComposer
          isConnected={connectionStatus === 'connected'}
          onSend={handleSend}
        />
      </Card>
    </main>
  )
}

export default RoomChatPage
