import { MessageSquareText, PanelLeftClose, RotateCw } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Spinner from '../../../components/ui/Spinner'
import type { ConversationResponse } from '../../../types/conversations'
import ConversationListItem from './ConversationListItem'
import NewConversationButton from './NewConversationButton'

type ConversationSidebarProps = {
  conversations: ConversationResponse[]
  activeConversationId: string | null
  isNewConversation: boolean
  isLoading: boolean
  errorMessage: string
  isOpen: boolean
  onSelect: (conversationId: string) => void
  onNewConversation: () => void
  onClose: () => void
  onRetry: () => void
}

function ConversationSidebar({
  conversations,
  activeConversationId,
  isNewConversation,
  isLoading,
  errorMessage,
  isOpen,
  onSelect,
  onNewConversation,
  onClose,
  onRetry,
}: ConversationSidebarProps) {
  return (
    <aside
      aria-label="AI conversations"
      className={`${
        isOpen ? 'flex' : 'hidden'
      } absolute inset-0 z-20 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:relative md:inset-auto md:z-auto md:flex md:w-72 md:shrink-0`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-white">
            Conversations
          </h2>
          <p className="mb-0 mt-1 text-xs text-slate-500 dark:text-slate-400">
            Your AI chat history
          </p>
        </div>
        <Button
          aria-label="Close conversation list"
          className="size-9 min-h-9 px-0 md:hidden"
          onClick={onClose}
          variant="secondary"
        >
          <PanelLeftClose aria-hidden="true" size={17} />
        </Button>
      </div>

      <NewConversationButton
        className="mb-5"
        onClick={onNewConversation}
      />

      {isLoading ? (
        <div className="flex flex-1 items-start justify-center pt-10">
          <Spinner
            aria-label="Loading conversations"
            className="text-blue-700 dark:text-blue-300"
          />
        </div>
      ) : errorMessage ? (
        <div className="flex flex-col items-start gap-3 px-1">
          <p className="m-0 text-sm text-red-700 dark:text-red-300" role="alert">
            {errorMessage}
          </p>
          <Button onClick={onRetry} variant="secondary">
            <RotateCw aria-hidden="true" size={15} />
            <span>Try again</span>
          </Button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-2 py-8 text-center">
          <MessageSquareText
            aria-hidden="true"
            className="text-slate-400 dark:text-slate-500"
            size={22}
          />
          <p className="m-0 text-sm font-medium text-slate-800 dark:text-slate-200">
            No conversations yet
          </p>
          <p className="m-0 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Start a new conversation to begin.
          </p>
        </div>
      ) : (
        <nav aria-label="Conversation history" className="min-h-0 flex-1 overflow-y-auto">
          <ul className="m-0 list-none space-y-1 p-0">
            {conversations.map((conversation) => (
              <ConversationListItem
                conversation={conversation}
                isActive={
                  conversation.id === activeConversationId &&
                  !isNewConversation
                }
                key={conversation.id}
                onSelect={() => onSelect(conversation.id)}
              />
            ))}
          </ul>
        </nav>
      )}
    </aside>
  )
}

export default ConversationSidebar
