import { Hash } from 'lucide-react'
import type { RoomResponse } from '../../../types/rooms'
import Badge from '../../../components/ui/Badge'
import JoinRoomButton from './JoinRoomButton'

type RoomListItemProps = {
  room: RoomResponse
}

function RoomListItem({ room }: RoomListItemProps) {
  const createdDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(room.created_at))

  return (
    <li className="flex flex-col gap-4 border-b border-slate-200 py-5 last:border-b-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <Hash aria-hidden="true" size={19} />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 wrap-break-word text-base font-semibold text-slate-900 dark:text-slate-100">
              {room.name}
            </h3>
            <Badge variant="neutral">Room</Badge>
          </div>
          <p className="m-0 text-sm text-slate-600 dark:text-slate-400">
            Created {createdDate}
          </p>
        </div>
      </div>
      <JoinRoomButton roomId={room.id} />
    </li>
  )
}

export default RoomListItem
