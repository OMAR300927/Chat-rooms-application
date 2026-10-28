import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router'
import Button from '../../components/ui/Button'
import { listRooms } from '../../services/api/roomsApi'
import type { RoomResponse } from '../../types/rooms'
import { getErrorMessage } from '../../utils/errors'
import CreateRoomModal from './components/CreateRoomModal'
import RoomList from './components/RoomList'

function RoomsPage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<RoomResponse[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isCurrentRequest = true

    listRooms()
      .then((loadedRooms) => {
        if (isCurrentRequest) setRooms(loadedRooms)
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) {
          setErrorMessage(getErrorMessage(error, 'Unable to load rooms.'))
        }
      })
      .finally(() => {
        if (isCurrentRequest) setIsLoading(false)
      })

    return () => {
      isCurrentRequest = false
    }
  }, [reloadKey])

  function handleRetry() {
    setIsLoading(true)
    setErrorMessage('')
    setReloadKey((key) => key + 1)
  }

  function handleRoomCreated(room: RoomResponse) {
    setIsCreateModalOpen(false)
    navigate(`/rooms/${room.id}`)
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 text-sm font-semibold text-blue-700 dark:text-blue-300">
            Community
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Chat rooms
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Find a room to join or create one for your group.
          </p>
        </div>
        <Button
          className="transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus aria-hidden="true" size={17} />
          <span>Create room</span>
        </Button>
      </header>

      <RoomList
        errorMessage={errorMessage}
        isLoading={isLoading}
        onRetry={handleRetry}
        rooms={rooms}
      />

      <CreateRoomModal
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleRoomCreated}
        open={isCreateModalOpen}
      />
    </main>
  )
}

export default RoomsPage
