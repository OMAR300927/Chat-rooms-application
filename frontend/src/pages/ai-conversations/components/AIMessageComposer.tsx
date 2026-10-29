import { useState, type SubmitEvent } from 'react'
import { Send } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Textarea from '../../../components/ui/Textarea'

const MAX_MESSAGE_LENGTH = 20_000

type AIMessageComposerProps = {
  disabled: boolean
  isGenerating: boolean
  onSend: (content: string) => Promise<boolean>
}

function AIMessageComposer({
  disabled,
  isGenerating,
  onSend,
}: AIMessageComposerProps) {
  const [content, setContent] = useState('')

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedContent = content.trim()
    if (!normalizedContent || disabled || isGenerating) return

    if (await onSend(normalizedContent)) {
      setContent('')
    }
  }

  return (
    <form
      className="border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:py-4 lg:px-10"
      onSubmit={handleSubmit}
    >
      <div className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl border border-slate-300 bg-white p-2 shadow-sm focus-within:border-blue-500 dark:border-slate-700 dark:bg-slate-950">
        <label className="sr-only" htmlFor="ai-message-content">
          Ask a question
        </label>
        <Textarea
          className="max-h-40 min-h-11 flex-1 resize-y border-0 bg-transparent py-2.5 shadow-none focus-visible:outline-none dark:bg-transparent"
          disabled={disabled || isGenerating}
          id="ai-message-content"
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => setContent(event.target.value)}
          placeholder={
            disabled
              ? 'Select a conversation to send a message'
              : 'Ask a question…'
          }
          rows={1}
          value={content}
        />
        <Button
          aria-label="Send message"
          className="size-10 shrink-0 transform-gpu transition-transform duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
          disabled={
            disabled || isGenerating || !content.trim() ||
            content.length > MAX_MESSAGE_LENGTH
          }
          type="submit"
        >
          <Send aria-hidden="true" size={17} />
        </Button>
      </div>
      <p className="mb-0 mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
        AI responses may be inaccurate. Verify important information.
      </p>
    </form>
  )
}

export default AIMessageComposer
