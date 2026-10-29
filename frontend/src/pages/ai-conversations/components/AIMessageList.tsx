import { useEffect, useRef } from 'react'
import type { AIMessageResponse } from '../../../types/ai-messages'
import AIMessageItem from './AIMessageItem'

type AIMessageListProps = {
  messages: AIMessageResponse[]
  isGenerating: boolean
}

function AIMessageList({ messages, isGenerating }: AIMessageListProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating])

  return (
    <section
      aria-label="Conversation messages"
      aria-relevant="additions text"
      className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10"
      role="log"
    >
      {messages.length === 0 && !isGenerating ? (
        <div className="flex h-full min-h-48 items-center justify-center">
          <p className="max-w-sm text-center text-sm text-slate-500 dark:text-slate-400">
            Ask a question to start this conversation.
          </p>
        </div>
      ) : (
        <ol className="mx-auto m-0 flex w-full max-w-3xl list-none flex-col gap-6 p-0">
          {messages.map((message) => (
            <AIMessageItem key={message.id} message={message} />
          ))}
          {isGenerating && (
            <li aria-live="polite" className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="grid size-8 place-items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <span className="size-2 animate-pulse rounded-full bg-current" />
              </span>
              Generating an answer…
            </li>
          )}
        </ol>
      )}
      <div ref={endOfMessagesRef} />
    </section>
  )
}

export default AIMessageList
