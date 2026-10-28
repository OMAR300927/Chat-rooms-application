import Badge from '../../../components/ui/Badge'
import type { PaymentResponse, PaymentStatus } from '../../../types/payments'

type PaymentHistoryItemProps = {
  payment: PaymentResponse
}

const statusDetails: Record<
  PaymentStatus,
  { label: string; variant: 'warning' | 'success' | 'danger' | 'neutral' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  paid: { label: 'Paid', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
  expired: { label: 'Expired', variant: 'neutral' },
}

function formatAmount(amountTotal: number | null, currency: string | null) {
  if (amountTotal === null || currency === null) return 'Amount unavailable'

  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    })

    const fractionDigits =
      formatter.resolvedOptions().maximumFractionDigits ?? 2
    return formatter.format(amountTotal / 10 ** fractionDigits)
    
  } catch {
    return 'Amount unavailable'
  }
}

function formatCreatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function PaymentHistoryItem({ payment }: PaymentHistoryItemProps) {
  const status = statusDetails[payment.status] ?? {
    label: 'Unknown',
    variant: 'neutral' as const,
  }

  return (
    <li className="grid gap-3 border-b border-slate-200 py-4 last:border-b-0 dark:border-slate-800 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-6">
      <div>
        <p className="m-0 text-sm font-medium text-slate-900 dark:text-slate-100">
          AI chat access
        </p>
        <time
          className="mt-1 block text-sm text-slate-500 dark:text-slate-400"
          dateTime={payment.created_at}
        >
          {formatCreatedAt(payment.created_at)}
        </time>
      </div>
      <p className="m-0 text-sm font-semibold text-slate-800 dark:text-slate-200">
        {formatAmount(payment.amount_total, payment.currency)}
      </p>
      <Badge className="w-fit" variant={status.variant}>
        {status.label}
      </Badge>
    </li>
  )
}

export default PaymentHistoryItem
