import { Clock3, RotateCw, ReceiptText } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Spinner from '../../../components/ui/Spinner'
import type { PaymentResponse } from '../../../types/payments'
import PaymentHistoryItem from './PaymentHistoryItem'

type PaymentHistoryProps = {
  payments: PaymentResponse[]
  isLoading: boolean
  errorMessage: string
  onRetry: () => void
}

function PaymentHistory({
  payments,
  isLoading,
  errorMessage,
  onRetry,
}: PaymentHistoryProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <ReceiptText aria-hidden="true" size={19} />
          </span>
          <div>
            <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-white">
              Payment history
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              View your recent AI access checkouts.
            </p>
          </div>
        </div>
        <Clock3
          aria-hidden="true"
          className="mt-1 text-slate-400 dark:text-slate-500"
          size={18}
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-36 items-center justify-center">
          <Spinner
            aria-label="Loading payment history"
            className="text-blue-700 dark:text-blue-300"
          />
        </div>
      ) : errorMessage ? (
        <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
          <p
            className="m-0 max-w-md text-sm text-red-700 dark:text-red-300"
            role="alert"
          >
            {errorMessage}
          </p>
          <Button onClick={onRetry} variant="secondary">
            <RotateCw aria-hidden="true" size={15} />
            <span>Try again</span>
          </Button>
        </div>
      ) : payments.length === 0 ? (
        <div className="flex min-h-36 flex-col items-center justify-center text-center">
          <p className="m-0 text-sm font-medium text-slate-800 dark:text-slate-200">
            No payments yet
          </p>
          <p className="mb-0 mt-1 text-sm text-slate-600 dark:text-slate-400">
            Completed and pending checkouts will appear here.
          </p>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {payments.map((payment) => (
            <PaymentHistoryItem key={payment.id} payment={payment} />
          ))}
        </ul>
      )}
    </Card>
  )
}

export default PaymentHistory
