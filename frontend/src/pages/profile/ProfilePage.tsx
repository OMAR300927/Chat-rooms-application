import { useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { getCurrentUser } from '../../services/api/authApi'
import type { UserResponse } from '../../types/auth'
import { getErrorMessage } from '../../utils/errors'
import LogoutButton from './components/LogoutButton'
import ProfileDetails from './components/ProfileDetails'

function ProfilePage() {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let isCurrent = true

    async function loadProfile() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const currentUser = await getCurrentUser()
        if (isCurrent) {
          setUser(currentUser)
        }

      } catch (error: unknown) {
        if (isCurrent) {
          setErrorMessage(
            getErrorMessage(error, 'Unable to load your profile. Please try again.'),
          )
        }
        
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadProfile()

    return () => {
      isCurrent = false
    }
  }, [retryCount])

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center">
        <Spinner aria-label="Loading profile" className="text-blue-700 dark:text-blue-300" />
      </div>
    )
  }

  if (errorMessage || !user) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8 sm:px-6 lg:px-8">
        <Card className="space-y-4" role="alert">
          <div>
            <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-white">
              Could not load profile
            </h2>
            <p className="mt-2 text-sm text-red-700 dark:text-red-300">
              {errorMessage || 'Profile information is unavailable.'}
            </p>
          </div>
          <Button
            className="transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            onClick={() => setRetryCount((count) => count + 1)}
            variant="secondary"
          >
            Try again
          </Button>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="m-0 text-sm font-semibold text-blue-700 dark:text-blue-300">
            Account
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Your profile
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            View your account details and access status.
          </p>
        </div>
        <LogoutButton />
      </header>

      <ProfileDetails user={user} />
    </main>
  )
}

export default ProfilePage
