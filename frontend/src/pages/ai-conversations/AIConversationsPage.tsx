import { useCallback, useEffect, useState } from 'react'
import { Menu, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { getCurrentUser } from '../../services/api/authApi'
import {
  createConversation,
  getConversation,
  listConversations,
  sendConversationMessage,
} from '../../services/api/conversationsApi'
import { listDocuments } from '../../services/api/documentsApi'
import type { UserResponse } from '../../types/auth'
import type { ConversationDetailResponse, ConversationResponse } from '../../types/conversations'
import type { DocumentResponse } from '../../types/documents'
import { getErrorMessage } from '../../utils/errors'
import AIMessageComposer from './components/AIMessageComposer'
import AIMessageList from './components/AIMessageList'
import ConversationSidebar from './components/ConversationSidebar'
import DocumentSelector from './components/DocumentSelector'

function AIConversationsPage() {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [documents, setDocuments] = useState<DocumentResponse[]>([])
  const [activeConversation, setActiveConversation] =
    useState<ConversationDetailResponse | null>(null)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [pageError, setPageError] = useState('')
  const [conversationError, setConversationError] = useState('')
  const [documentError, setDocumentError] = useState('')
  const [messageError, setMessageError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isConversationsLoading, setIsConversationsLoading] = useState(true)
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true)
  const [isNewConversation, setIsNewConversation] = useState(true)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadPage() {
      setIsLoading(true)
      setIsConversationsLoading(true)
      setIsDocumentsLoading(true)
      setPageError('')
      setConversationError('')
      setDocumentError('')

      const userResult = await getCurrentUser().then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (reason: unknown) => ({ status: 'rejected' as const, reason }),
      )
      if (!isCurrent) return

      if (userResult.status === 'rejected') {
        setPageError(
          getErrorMessage(userResult.reason, 'Unable to load your account.'),
        )
        setIsLoading(false)
        setIsConversationsLoading(false)
        setIsDocumentsLoading(false)
        return
      }

      setUser(userResult.value)
      setIsLoading(false)
      if (!userResult.value.ai_chat_unlocked) {
        setIsConversationsLoading(false)
        setIsDocumentsLoading(false)
        return
      }

      const [conversationResult, documentResult] = await Promise.allSettled([
        listConversations(),
        listDocuments(),
      ])
      if (!isCurrent) return

      if (conversationResult.status === 'fulfilled') {
        setConversations(conversationResult.value)

      } else {
        setConversationError(
          getErrorMessage(
            conversationResult.reason,
            'Unable to load conversations.',
          ),
        )
      }

      if (documentResult.status === 'fulfilled') {
        setDocuments(documentResult.value)

      } else {
        setDocumentError(
          getErrorMessage(documentResult.reason, 'Unable to load documents.'),
        )
      }

      setIsConversationsLoading(false)
      setIsDocumentsLoading(false)
    }

    void loadPage()

    return () => {
      isCurrent = false
    }
  }, [retryCount])

  const handleSelectConversation = useCallback(async (conversationId: string) => {
    setConversationError('')
    setMessageError('')
    setIsSidebarOpen(false)
    setIsNewConversation(false)
    try {
      setActiveConversation(await getConversation(conversationId))
      
    } catch (error: unknown) {
      setConversationError(
        getErrorMessage(error, 'Unable to open this conversation.'),
      )
      setActiveConversation(null)
    }
  }, [])

  async function handleStartConversation() {
    setMessageError('')
    setConversationError('')
    setIsCreatingConversation(true)
    try {
      const conversation = await createConversation({
        document_ids: selectedDocumentIds,
      })
      setActiveConversation(conversation)
      setIsNewConversation(false)
      setConversations((currentConversations) => [
        conversation,
        ...currentConversations.filter(
          (item) => item.id !== conversation.id,
        ),
      ])
    } catch (error: unknown) {
      setConversationError(
        getErrorMessage(error, 'Unable to create a conversation.'),
      )
    } finally {
      setIsCreatingConversation(false)
    }
  }

  async function handleSendMessage(content: string): Promise<boolean> {
    if (!activeConversation) return false

    setMessageError('')
    setIsGenerating(true)
    try {
      const response = await sendConversationMessage(activeConversation.id, {
        content,
      })
      setActiveConversation((currentConversation) =>
        currentConversation
          ? {
              ...currentConversation,
              messages: [...currentConversation.messages, ...response],
              updated_at: new Date().toISOString(),
            }
          : currentConversation,
      )
      setConversations((currentConversations) =>
        currentConversations
          .map((conversation) =>
            conversation.id === activeConversation.id
              ? { ...conversation, updated_at: new Date().toISOString() }
              : conversation,
          )
          .sort(
            (first, second) =>
              new Date(second.updated_at).getTime() -
              new Date(first.updated_at).getTime(),
          ),
      )
      return true
    } catch (error: unknown) {
      setMessageError(
        getErrorMessage(
          error,
          'Unable to generate a response. Your message may have been saved; you can try again.',
        ),
      )
      return false
    } finally {
      setIsGenerating(false)
    }
  }

  function handleNewConversation() {
    setActiveConversation(null)
    setSelectedDocumentIds([])
    setIsNewConversation(true)
    setMessageError('')
    setConversationError('')
    setIsSidebarOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-7rem)] items-center justify-center">
        <Spinner
          aria-label="Loading AI conversations"
          className="text-blue-700 dark:text-blue-300"
        />
      </div>
    )
  }

  if (pageError) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="space-y-4" role="alert">
          <div>
            <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-white">
              Could not load AI conversations
            </h2>
            <p className="mb-0 mt-2 text-sm text-red-700 dark:text-red-300">
              {pageError}
            </p>
          </div>
          <Button
            onClick={() => setRetryCount((count) => count + 1)}
            variant="secondary"
          >
            Try again
          </Button>
        </Card>
      </main>
    )
  }

  if (user && !user.ai_chat_unlocked) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-start gap-4">
          <Sparkles
            aria-hidden="true"
            className="text-blue-700 dark:text-blue-300"
            size={24}
          />
          <div>
            <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-white">
              Unlock AI conversations
            </h2>
            <p className="mb-0 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
              AI conversations are available after unlocking AI access.
            </p>
          </div>
          <Link
            className="inline-flex min-h-10 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white no-underline hover:bg-blue-800"
            to="/payments"
          >
            Go to payments
          </Link>
        </Card>
      </main>
    )
  }

  const activeTitle =
    activeConversation?.title?.trim() || 'New conversation'
  const selectedDocuments =
    activeConversation?.documents ?? []

  return (
    <main className="relative flex h-[calc(100vh-7rem)] min-h-104 overflow-hidden max-[720px]:h-[calc(100dvh-11rem)]">
      <ConversationSidebar
        activeConversationId={activeConversation?.id ?? null}
        conversations={conversations}
        errorMessage={conversationError}
        isLoading={isConversationsLoading}
        isNewConversation={isNewConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNewConversation={handleNewConversation}
        onRetry={() => setRetryCount((count) => count + 1)}
        onSelect={(conversationId) =>
          void handleSelectConversation(conversationId)
        }
      />

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
          <Button
            aria-label="Open conversation list"
            className="size-9 min-h-9 px-0 md:hidden"
            onClick={() => setIsSidebarOpen(true)}
            variant="secondary"
          >
            <Menu aria-hidden="true" size={17} />
          </Button>
          <div className="min-w-0">
            <h2 className="m-0 truncate text-sm font-semibold text-slate-900 dark:text-white">
              {isNewConversation ? 'New conversation' : activeTitle}
            </h2>
            {selectedDocuments.length > 0 && (
              <p className="m-0 truncate text-xs text-slate-500 dark:text-slate-400">
                Sources: {selectedDocuments.map((document) => document.filename).join(', ')}
              </p>
            )}
          </div>
        </header>

        {isNewConversation ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-4 py-8 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
              <Sparkles aria-hidden="true" size={22} />
            </span>
            <div>
              <h3 className="m-0 text-xl font-semibold text-slate-900 dark:text-white">
                What would you like to explore?
              </h3>
              <p className="mb-0 mt-2 text-sm text-slate-600 dark:text-slate-400">
                Start with a question. Optionally select ready PDFs as context.
              </p>
            </div>
            <DocumentSelector
              documents={documents}
              errorMessage={documentError}
              isLoading={isDocumentsLoading}
              onChange={setSelectedDocumentIds}
              selectedDocumentIds={selectedDocumentIds}
            />
            {conversationError && (
              <p
                aria-live="polite"
                className="m-0 text-sm text-red-700 dark:text-red-300"
                role="alert"
              >
                {conversationError}
              </p>
            )}
            <Button
              className="transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
              disabled={isCreatingConversation}
              onClick={() => void handleStartConversation()}
            >
              {isCreatingConversation ? (
                <>
                  <Spinner aria-label="Creating conversation" size="small" />
                  <span>Starting…</span>
                </>
              ) : (
                'Start conversation'
              )}
            </Button>
          </div>
        ) : activeConversation ? (
          <>
            <AIMessageList
              isGenerating={isGenerating}
              messages={activeConversation.messages}
            />
            {messageError && (
              <p
                aria-live="polite"
                className="m-0 border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 sm:px-6"
                role="alert"
              >
                {messageError}
              </p>
            )}
            <AIMessageComposer
              disabled={false}
              isGenerating={isGenerating}
              onSend={handleSendMessage}
            />
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 text-center">
            <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
              Select a conversation or start a new one.
            </p>
            <Button onClick={handleNewConversation}>New conversation</Button>
          </div>
        )}
      </section>
    </main>
  )
}

export default AIConversationsPage
