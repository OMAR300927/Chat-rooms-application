import type { MessageResponse } from '../../../types/messages'

type RoomMessageItemProps = {
  message: MessageResponse
  isOwnMessage: boolean
}

function RoomMessageItem({ message, isOwnMessage }: RoomMessageItemProps) {
  const date = new Date(message.created_at)
  const timeLabel = Number.isNaN(date.getTime())
    ? 'Time unavailable'
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)

  return (
    <li className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <article
        className={`max-w-[min(85%,42rem)] rounded-2xl px-4 py-3 shadow-sm ${
          isOwnMessage
            ? 'rounded-br-md bg-blue-700 text-white'
            : 'rounded-bl-md border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
        }`}
      >
        <div
          className={`mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${
            isOwnMessage
              ? 'text-blue-100'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="font-semibold">{isOwnMessage ? 'You' : 'Room member'}</span>
          <time dateTime={message.created_at}>{timeLabel}</time>
        </div>
        <p className="m-0 whitespace-pre-wrap wrap-break-word text-sm leading-6">
          {message.content}
        </p>
      </article>
    </li>
  )
}

export default RoomMessageItem
