import axios from 'axios'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import Button from '../../../components/ui/Button'
import Spinner from '../../../components/ui/Spinner'
import { joinRoom } from '../../../services/api/roomsApi'
import { getErrorMessage } from '../../../utils/errors'

type JoinRoomButtonProps = {
  roomId: string
}

function JoinRoomButton({ roomId }: JoinRoomButtonProps) {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  async function handleJoin() {
    setErrorMessage('')
    setIsJoining(true)

    try {
      await joinRoom(roomId)
      navigate(`/rooms/${roomId}`)

    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        navigate(`/rooms/${roomId}`)
        return
      }

      setErrorMessage(getErrorMessage(error, 'Unable to join this room.'))
      
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button
        className="min-w-24 transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        disabled={isJoining}
        onClick={handleJoin}
      >
        {isJoining ? (
          <>
            <Spinner aria-label="Joining room" size="small" />
            <span>Joining…</span>
          </>
        ) : (
          'Join room'
        )}
      </Button>
      {errorMessage && (
        <p
          aria-live="polite"
          className="max-w-56 text-left text-xs text-red-700 dark:text-red-300 sm:text-right"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  )
}

export default JoinRoomButton
