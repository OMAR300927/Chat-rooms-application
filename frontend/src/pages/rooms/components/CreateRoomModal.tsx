import { useState, type SubmitEvent } from 'react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Modal from '../../../components/ui/Modal'
import Spinner from '../../../components/ui/Spinner'
import { createRoom } from '../../../services/api/roomsApi'
import type { RoomResponse } from '../../../types/rooms'
import { getErrorMessage } from '../../../utils/errors'

type CreateRoomModalProps = {
  open: boolean
  onClose: () => void
  onCreated: (room: RoomResponse) => void
}

function CreateRoomModal({
  open,
  onClose,
  onCreated,
}: CreateRoomModalProps) {
  const [name, setName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleClose() {
    if (isSubmitting) return
    setName('')
    setErrorMessage('')
    onClose()
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedName = name.trim()
    if (!normalizedName) {
      setErrorMessage('Room name must not be blank.')
      return
    }

    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const room = await createRoom({ name: normalizedName })
      setName('')
      onCreated(room)

    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Unable to create the room.'))
      
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      description="Choose a name for your new user chat room."
      onClose={handleClose}
      open={open}
      title="Create a room"
      footer={
        <>
          <Button
            disabled={isSubmitting}
            onClick={handleClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            className="transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            disabled={isSubmitting}
            form="create-room-form"
            type="submit"
          >
            {isSubmitting ? (
              <>
                <Spinner aria-label="Creating room" size="small" />
                <span>Creating…</span>
              </>
            ) : (
              'Create room'
            )}
          </Button>
        </>
      }
    >
      <form className="space-y-4" id="create-room-form" onSubmit={handleSubmit}>
        {errorMessage && (
          <p
            aria-live="polite"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            htmlFor="create-room-name"
          >
            Room name
          </label>
          <Input
            autoFocus
            id="create-room-name"
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. project-chat"
            required
            value={name}
          />
        </div>
      </form>
    </Modal>
  )
}

export default CreateRoomModal
