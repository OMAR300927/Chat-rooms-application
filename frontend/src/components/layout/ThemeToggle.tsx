import { Moon, Sun } from 'lucide-react'
import useTheme from '../../hooks/useTheme'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'

  return (
    <button
      aria-label={label}
      aria-pressed={isDark}
      className="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 motion-reduce:transition-none motion-reduce:active:scale-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      onClick={toggleTheme}
      type="button"
    >
      {isDark ? (
        <Sun aria-hidden="true" size={18} />
      ) : (
        <Moon aria-hidden="true" size={18} />
      )}
    </button>
  )
}

export default ThemeToggle
