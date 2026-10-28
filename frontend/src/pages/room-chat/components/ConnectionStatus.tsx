import { RotateCw, Wifi, WifiOff } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import Spinner from '../../../components/ui/Spinner'

export type RoomConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

type ConnectionStatusProps = {
  status: RoomConnectionStatus
  errorMessage: string
  onReconnect: () => void
}

const statusDetails: Record<
  RoomConnectionStatus,
  { label: string; variant: 'info' | 'success' | 'warning' | 'danger' }
> = {
  connecting: { label: 'Connecting', variant: 'info' },
  connected: { label: 'Connected', variant: 'success' },
  disconnected: { label: 'Disconnected', variant: 'warning' },
  error: { label: 'Connection error', variant: 'danger' },
}

function ConnectionStatus({
  status,
  errorMessage,
  onReconnect,
}: ConnectionStatusProps) {
  const details = statusDetails[status]

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <Badge
          className="gap-1.5"
          variant={details.variant}
          aria-live="polite"
        >
          {status === 'connecting' ? (
            <Spinner aria-hidden="true" className="h-3.5 w-3.5" size="small" />
          ) : status === 'connected' ? (
            <Wifi aria-hidden="true" size={13} />
          ) : (
            <WifiOff aria-hidden="true" size={13} />
          )}
          {details.label}
        </Badge>
        {errorMessage && (
          <p className="m-0 min-w-0 text-sm text-slate-600 dark:text-slate-400">
            {errorMessage}
          </p>
        )}
      </div>
      {(status === 'disconnected' || status === 'error') && (
        <Button
          className="transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
          onClick={onReconnect}
          variant="secondary"
        >
          <RotateCw aria-hidden="true" size={15} />
          <span>Reconnect</span>
        </Button>
      )}
    </div>
  )
}

export default ConnectionStatus
