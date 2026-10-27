import { useState, type SubmitEvent } from 'react'
import { Link } from 'react-router'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'
import Spinner from '../../../components/ui/Spinner'
import { registerUser } from '../../../services/api/authApi'
import { getErrorMessage } from '../../../utils/errors'

function RegisterForm() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await registerUser({
        email: email.trim(),
        username: username.trim(),
        password,
      })
      setIsRegistered(true)

    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(error, 'Unable to create your account. Please try again.'),
      )
      
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isRegistered) {
    return (
      <div
        aria-live="polite"
        className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
        role="status"
      >
        <p className="font-semibold">Your account is ready.</p>
        <p>You can now log in with your new account.</p>
        <Link
          className="inline-flex font-semibold underline underline-offset-4"
          to="/login"
        >
          Go to login
        </Link>
      </div>
    )
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
          htmlFor="register-email"
        >
          Email
        </label>
        <Input
          autoComplete="email"
          autoFocus
          id="register-email"
          maxLength={320}
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
          htmlFor="register-username"
        >
          Username
        </label>
        <Input
          autoComplete="username"
          id="register-username"
          maxLength={50}
          minLength={1}
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          required
          value={username}
        />
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          htmlFor="register-password"
        >
          Password
        </label>
        <Input
          autoComplete="new-password"
          id="register-password"
          maxLength={128}
          minLength={8}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Use at least 8 characters.
        </p>
      </div>

      <div className="space-y-2">
        <label
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
          htmlFor="register-confirm-password"
        >
          Confirm password
        </label>
        <Input
          autoComplete="new-password"
          id="register-confirm-password"
          maxLength={128}
          minLength={8}
          name="confirmPassword"
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </div>

      <Button
        className="w-full transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <>
            <Spinner
              aria-label="Creating account"
              className="text-white"
              size="small"
            />
            <span>Creating account…</span>
          </>
        ) : (
          'Create account'
        )}
      </Button>
    </form>
  )
}

export default RegisterForm
