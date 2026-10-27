import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Spinner from '../../../components/ui/Spinner'
import { loginUser } from '../../../services/api/authApi'
import { getErrorMessage } from '../../../utils/errors'

function LoginForm() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      await loginUser({ email: email.trim(), password })
      navigate('/rooms', { replace: true })

    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Unable to log in. Please try again.'))
      
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {errorMessage && (
        <p
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          role="alert"
        >
          {errorMessage}
        </p>
      )}

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          htmlFor="login-email"
        >
          Email
        </label>
        <Input
          autoComplete="email"
          autoFocus
          id="login-email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          htmlFor="login-password"
        >
          Password
        </label>
        <Input
          autoComplete="current-password"
          id="login-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>

      <Button
        className="w-full transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <Spinner aria-label="Logging in" className="text-white" size="small" />
            <span>Logging in…</span>
          </>
        ) : (
          'Log in'
        )}
      </Button>
    </form>
  )
}

export default LoginForm
