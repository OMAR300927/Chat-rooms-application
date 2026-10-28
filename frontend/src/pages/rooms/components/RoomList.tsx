import { Hash, RotateCw } from 'lucide-react'
import type { RoomResponse } from '../../../types/rooms'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Spinner from '../../../components/ui/Spinner'
import RoomListItem from './RoomListItem'

type RoomListProps = {
  rooms: RoomResponse[]
  isLoading: boolean
  errorMessage: string
  onRetry: () => void
}

function RoomList({
  rooms,
  isLoading,
  errorMessage,
  onRetry,
}: RoomListProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-white">
            Available rooms
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Find a room and join the conversation.
          </p>
        </div>
        <span className="hidden size-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:grid">
          <Hash aria-hidden="true" size={19} />
        </span>
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center">
          <Spinner
            aria-label="Loading rooms"
            className="text-blue-700 dark:text-blue-300"
          />
        </div>
      ) : errorMessage ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
          <p className="m-0 max-w-md text-sm text-red-700 dark:text-red-300" role="alert">
            {errorMessage}
          </p>
          <Button
            className="transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            onClick={onRetry}
            variant="secondary"
          >
            <RotateCw aria-hidden="true" size={16} />
            <span>Try again</span>
          </Button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <Hash aria-hidden="true" size={20} />
          </span>
          <p className="m-0 text-sm font-medium text-slate-800 dark:text-slate-200">
            No rooms yet
          </p>
          <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
            Create a room to start a conversation.
          </p>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {rooms.map((room) => (
            <RoomListItem key={room.id} room={room} />
          ))}
        </ul>
      )}
    </Card>
  )
}

export default RoomList
