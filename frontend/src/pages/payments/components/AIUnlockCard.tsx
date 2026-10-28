import { useState } from 'react'
import { ArrowRight, Check, LockKeyhole, Sparkles } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Spinner from '../../../components/ui/Spinner'

type AIUnlockCardProps = {
  isUnlocked: boolean
  isCheckingOut: boolean
  errorMessage: string
  onCheckout: () => Promise<void>
}

function AIUnlockCard({
  isUnlocked,
  isCheckingOut,
  errorMessage,
  onCheckout,
}: AIUnlockCardProps) {
  const [isConfirmingCheckout, setIsConfirmingCheckout] = useState(false)

  async function handleCheckout() {
    if (isCheckingOut || isConfirmingCheckout) return
    setIsConfirmingCheckout(true)

    try {
      await onCheckout()
      
    } finally {
      setIsConfirmingCheckout(false)
    }
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="bg-linear-to-br from-blue-700 to-indigo-800 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <span className="mb-4 grid size-11 place-items-center rounded-xl bg-white/15">
              <Sparkles aria-hidden="true" size={21} />
            </span>
            <h2 className="m-0 text-xl font-semibold tracking-tight sm:text-2xl">
              Unlock AI conversations
            </h2>
            <p className="mb-0 mt-2 text-sm leading-6 text-blue-100">
              Get access to document-grounded AI conversations. Checkout is
              securely handled by Stripe.
            </p>
          </div>
          <div className="shrink-0">
            {isUnlocked ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-400/20 px-4 text-sm font-semibold text-white">
                <Check aria-hidden="true" size={17} />
                AI access unlocked
              </span>
            ) : (
              <Button
                className="min-h-11 bg-white text-blue-800 shadow-sm transition hover:bg-blue-50 disabled:opacity-70"
                disabled={isCheckingOut}
                onClick={handleCheckout}
              >
                {isCheckingOut ? (
                  <>
                    <Spinner
                      aria-label="Starting checkout"
                      className="text-blue-800"
                      size="small"
                    />
                    <span>Opening checkout…</span>
                  </>
                ) : (
                  <>
                    <LockKeyhole aria-hidden="true" size={16} />
                    <span>Unlock AI access</span>
                    <ArrowRight aria-hidden="true" size={16} />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      {errorMessage && (
        <p
          aria-live="polite"
          className="m-0 border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200 sm:px-8"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </Card>
  )
}

export default AIUnlockCard
