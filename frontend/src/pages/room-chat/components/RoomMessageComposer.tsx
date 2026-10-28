import { useState, type SubmitEvent } from 'react'
import { Send } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Textarea from '../../../components/ui/Textarea'

type RoomMessageComposerProps = {
  isConnected: boolean
  onSend: (content: string) => boolean
}

function RoomMessageComposer({
  isConnected,
  onSend,
}: RoomMessageComposerProps) {
  const [content, setContent] = useState('')

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedContent = content.trim()
    if (!normalizedContent || !isConnected) return

    if (onSend(normalizedContent)) {
      setContent('')
    }
  }

  return (
    <form
      className="flex items-end gap-3 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:p-4"
      onSubmit={handleSubmit}
    >
      <label className="sr-only" htmlFor="room-message-content">
        Write a message
      </label>
      <Textarea
        className="max-h-40 min-h-12 flex-1 resize-y rounded-xl py-3"
        disabled={!isConnected}
        id="room-message-content"
        onChange={(event) => setContent(event.target.value)}
        placeholder={
          isConnected ? 'Write a message…' : 'Connect to send a message'
        }
        rows={1}
        value={content}
      />
      <Button
        aria-label="Send message"
        className="size-12 shrink-0 transform-gpu transition-transform duration-150 active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100"
        disabled={!isConnected || !content.trim()}
        type="submit"
      >
        <Send aria-hidden="true" size={18} />
      </Button>
    </form>
  )
}

export default RoomMessageComposer
