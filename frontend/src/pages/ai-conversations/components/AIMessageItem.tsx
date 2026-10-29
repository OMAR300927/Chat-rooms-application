import { Bot, UserRound } from 'lucide-react'
import type { AIMessageResponse } from '../../../types/ai-messages'

type AIMessageItemProps = {
  message: AIMessageResponse
}

function AIMessageItem({ message }: AIMessageItemProps) {
  const isAssistant = message.role === 'assistant'

  return (
    <li className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
      {isAssistant && (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          <Bot aria-hidden="true" size={17} />
        </span>
      )}
      <article
        className={`max-w-[min(90%,48rem)] rounded-2xl px-4 py-3 ${
          isAssistant
            ? 'rounded-tl-md border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
            : 'rounded-tr-md bg-blue-700 text-white'
        }`}
      >
        <p className="m-0 whitespace-pre-wrap wrap-break-word text-sm leading-7">
          {message.content}
        </p>
        <time
          className={`mt-2 block text-right text-[0.7rem] ${
            isAssistant
              ? 'text-slate-500 dark:text-slate-400'
              : 'text-blue-100'
          }`}
          dateTime={message.created_at}
        >
          {new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
          }).format(new Date(message.created_at))}
        </time>
      </article>
      {!isAssistant && (
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
          <UserRound aria-hidden="true" size={16} />
        </span>
      )}
    </li>
  )
}

export default AIMessageItem
