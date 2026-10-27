import { Link } from 'react-router'
import Card from '../../components/ui/Card'
import LoginForm from './components/LoginForm'

function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="mb-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
            Chat Rooms
          </p>
          <h1 className="m-0 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Log in to continue to your account.
          </p>
        </header>

        <Card className="p-6 sm:p-8">
          <LoginForm />
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <Link
              className="font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
              to="/register"
            >
              Create one
            </Link>
          </p>
        </Card>
      </div>
    </main>
  )
}

export default LoginPage
