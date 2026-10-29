import { MessageSquareText } from 'lucide-react'
import type { ConversationResponse } from '../../../types/conversations'

type ConversationListItemProps = {
  conversation: ConversationResponse
  isActive: boolean
  onSelect: () => void
}

function getConversationTitle(conversation: ConversationResponse) {
  if (conversation.title?.trim()) return conversation.title

  const date = new Date(conversation.updated_at)
  if (Number.isNaN(date.getTime())) return 'Conversation'

  return `Conversation · ${new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)}`
}

function ConversationListItem({
  conversation,
  isActive,
  onSelect,
}: ConversationListItemProps) {
  return (
    <li>
      <button
        aria-current={isActive ? 'page' : undefined}
        className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
          isActive
            ? 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
        onClick={onSelect}
        type="button"
      >
        <MessageSquareText
          aria-hidden="true"
          className="shrink-0 opacity-75"
          size={17}
        />
        <span className="truncate text-sm font-medium">
          {getConversationTitle(conversation)}
        </span>
      </button>
    </li>
  )
}

export default ConversationListItem
