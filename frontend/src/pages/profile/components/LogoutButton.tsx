import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router'
import Button from '../../../components/ui/Button'
import Spinner from '../../../components/ui/Spinner'
import { logoutUser } from '../../../services/api/authApi'
import { getErrorMessage } from '../../../utils/errors'

function LogoutButton() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setErrorMessage('')
    setIsLoggingOut(true)

    try {
      await logoutUser()
      navigate('/login', { replace: true })

    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Unable to log out. Please try again.'))
      
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="space-y-2">
      {errorMessage && (
        <p
          aria-live="polite"
          className="text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
      <Button
        className="transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        disabled={isLoggingOut}
        onClick={handleLogout}
        variant="secondary"
      >
        {isLoggingOut ? (
          <>
            <Spinner aria-label="Logging out" size="small" />
            <span>Logging out…</span>
          </>
        ) : (
          <>
            <LogOut aria-hidden="true" size={16} />
            <span>Log out</span>
          </>
        )}
      </Button>
    </div>
  )
}

export default LogoutButton
