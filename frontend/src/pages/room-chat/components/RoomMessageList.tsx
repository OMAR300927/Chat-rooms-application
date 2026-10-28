import { useEffect, useRef } from 'react'
import type { MessageResponse } from '../../../types/messages'
import RoomMessageItem from './RoomMessageItem'

type RoomMessageListProps = {
  messages: MessageResponse[]
  currentUserId: string
}

function RoomMessageList({ messages, currentUserId }: RoomMessageListProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <section
      aria-label="Room messages"
      aria-relevant="additions text"
      className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
      role="log"
    >
      {messages.length === 0 ? (
        <div className="flex h-full min-h-48 items-center justify-center">
          <p className="max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
            No messages yet. Send the first message to get the conversation
            started.
          </p>
        </div>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-4 p-0">
          {messages.map((message) => (
            <RoomMessageItem
              isOwnMessage={message.author_id === currentUserId}
              key={message.id}
              message={message}
            />
          ))}
        </ol>
      )}
      <div ref={endOfMessagesRef} />
    </section>
  )
}

export default RoomMessageList
