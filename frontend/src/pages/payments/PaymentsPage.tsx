import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { getCurrentUser } from '../../services/api/authApi'
import { createCheckoutSession, getPaymentHistory } from '../../services/api/paymentsApi'
import type { UserResponse } from '../../types/auth'
import type { PaymentResponse } from '../../types/payments'
import { getErrorMessage } from '../../utils/errors'
import AIUnlockCard from './components/AIUnlockCard'
import PaymentHistory from './components/PaymentHistory'

function PaymentsPage() {
  const [searchParams] = useSearchParams()
  const [user, setUser] = useState<UserResponse | null>(null)
  const [payments, setPayments] = useState<PaymentResponse[]>([])
  const [accountError, setAccountError] = useState('')
  const [historyError, setHistoryError] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadPaymentPage() {
      setIsLoading(true)
      setIsHistoryLoading(true)
      setAccountError('')
      setHistoryError('')

      const [userResult, paymentsResult] = await Promise.allSettled([
        getCurrentUser(),
        getPaymentHistory(),
      ])

      if (!isCurrent) return

      if (userResult.status === 'fulfilled') {
        setUser(userResult.value)

      } else {
        setAccountError(
          getErrorMessage(
            userResult.reason,
            'Unable to load your AI access status.',
          ),
        )
      }

      if (paymentsResult.status === 'fulfilled') {
        setPayments(paymentsResult.value)

      } else {
        setHistoryError(
          getErrorMessage(
            paymentsResult.reason,
            'Unable to load your payment history.',
          ),
        )
      }

      setIsLoading(false)
      setIsHistoryLoading(false)
    }

    void loadPaymentPage()

    return () => {
      isCurrent = false
    }
  }, [reloadCount])

  async function handleCheckout() {
    setCheckoutError('')
    setIsCheckingOut(true)
    try {
      const checkout = await createCheckoutSession()
      const checkoutUrl = new URL(checkout.checkout_url)
      if (checkoutUrl.protocol !== 'https:' && checkoutUrl.protocol !== 'http:') {
        throw new Error('The checkout service returned an invalid URL.')
      }

      window.location.assign(checkoutUrl.toString())
      
    } catch (error: unknown) {
      setCheckoutError(
        getErrorMessage(error, 'Unable to start checkout. Please try again.'),
      )
      setIsCheckingOut(false)
    }
  }

  const checkoutResult = searchParams.get('checkout')
  const isPaymentConfirmed = user?.ai_chat_unlocked === true

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="m-0 text-sm font-semibold text-blue-700 dark:text-blue-300">
          Account
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Payments & AI access
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Manage access to AI conversations and review your checkout history.
        </p>
      </header>

      {checkoutResult === 'success' && (
        <Card
          className={`p-4 ${
            isPaymentConfirmed
              ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40'
              : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40'
          }`}
          role="status"
        >
          <h3 className="m-0 text-sm font-semibold text-slate-900 dark:text-white">
            {isPaymentConfirmed
              ? 'Payment confirmed'
              : 'Checkout completed'}
          </h3>
          <p className="mb-0 mt-1 text-sm text-slate-700 dark:text-slate-300">
            {isPaymentConfirmed
              ? 'AI conversations are now unlocked on your account.'
              : 'Your payment is being confirmed. Refresh this page in a moment if access has not been unlocked yet.'}
          </p>
        </Card>
      )}
      {checkoutResult === 'cancel' && (
        <Card
          className="border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40"
          role="status"
        >
          <p className="m-0 text-sm text-amber-900 dark:text-amber-200">
            Checkout was canceled. You have not been charged.
          </p>
        </Card>
      )}

      {isLoading ? (
        <Card className="flex min-h-36 items-center justify-center">
          <Spinner
            aria-label="Loading AI access"
            className="text-blue-700 dark:text-blue-300"
          />
        </Card>
      ) : accountError ? (
        <Card className="flex flex-col items-start gap-3" role="alert">
          <div>
            <h3 className="m-0 text-base font-semibold text-slate-900 dark:text-white">
              Could not load AI access
            </h3>
            <p className="mb-0 mt-1 text-sm text-red-700 dark:text-red-300">
              {accountError}
            </p>
          </div>
          <Button
            onClick={() => setReloadCount((count) => count + 1)}
            variant="secondary"
          >
            Try again
          </Button>
        </Card>
      ) : user ? (
        <AIUnlockCard
          errorMessage={checkoutError}
          isCheckingOut={isCheckingOut}
          isUnlocked={user.ai_chat_unlocked}
          onCheckout={handleCheckout}
        />
      ) : null}

      <PaymentHistory
        errorMessage={historyError}
        isLoading={isHistoryLoading}
        onRetry={() => setReloadCount((count) => count + 1)}
        payments={payments}
      />

      {checkoutResult === 'success' && !isLoading && !isPaymentConfirmed && (
        <div className="flex justify-end">
          <Button
            onClick={() => setReloadCount((count) => count + 1)}
            variant="secondary"
          >
            Refresh payment status
          </Button>
        </div>
      )}
    </main>
  )
}

export default PaymentsPage
