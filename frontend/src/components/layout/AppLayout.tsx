import { NavLink, Outlet, useLocation } from 'react-router'
import ThemeToggle from './ThemeToggle'

const navigationItems = [
  { label: 'Rooms', to: '/rooms' },
  { label: 'AI conversations', to: '/ai-conversations' },
  { label: 'Documents', to: '/documents' },
  { label: 'Payments', to: '/payments' },
  { label: 'Profile', to: '/profile', mobileOnly: true },
]

function getPageTitle(pathname: string) {
  if (pathname.startsWith('/rooms/')) return 'Room chat'
  if (pathname.startsWith('/ai-conversations')) return 'AI conversations'
  if (pathname.startsWith('/documents')) return 'Documents'
  if (pathname.startsWith('/payments')) return 'Payments'
  if (pathname.startsWith('/profile')) return 'Profile'
  return 'Rooms'
}

function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 max-[720px]:flex-col">
      <aside
        className="fixed inset-y-0 left-0 z-10 flex w-62 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 max-[720px]:sticky max-[720px]:inset-0 max-[720px]:w-full max-[720px]:border-r-0 max-[720px]:border-b max-[720px]:p-3"
        aria-label="Main navigation"
      >
        <NavLink
          className="flex items-center gap-3 px-2 text-inherit no-underline max-[720px]:px-1 max-[720px]:pb-2"
          to="/rooms"
          aria-label="Chat Rooms home"
        >
          <span
            className="grid size-9 place-items-center rounded-xl bg-blue-700 text-lg font-bold text-white max-[720px]:size-8 max-[720px]:rounded-[0.6rem]"
            aria-hidden="true"
          >
            C
          </span>
          <span className="text-base font-bold tracking-tight">Chat Rooms</span>
        </NavLink>

        <div className="mb-2.5 mt-9 px-3 text-[0.7rem] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 max-[720px]:hidden">
          Workspace
        </div>
        <nav className="grid gap-1 max-[720px]:flex max-[720px]:gap-1 max-[720px]:overflow-x-auto">
          {navigationItems.map(({ label, to, mobileOnly }) => (
            <NavLink
              className={({ isActive }) =>
                `${mobileOnly ? 'hidden max-[720px]:flex' : 'flex'} min-h-[2.6rem] items-center rounded-[0.65rem] px-3 py-2.5 text-sm font-medium no-underline transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white max-[720px]:min-h-[2.3rem] max-[720px]:shrink-0 max-[720px]:px-2.5 max-[720px]:py-2 max-[720px]:text-[0.82rem] ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900'
                    : 'text-slate-600 dark:text-slate-300'
                }`
              }
              key={to}
              to={to}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-4 dark:border-slate-800 max-[720px]:hidden">
          <NavLink
            className={({ isActive }) =>
              `flex min-h-[2.6rem] items-center rounded-[0.65rem] px-3 py-2.5 text-sm font-medium no-underline transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white ${
                isActive
                  ? 'bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:hover:bg-blue-900'
                  : 'text-slate-600 dark:text-slate-300'
              }`
            }
            to="/profile"
          >
            Profile
          </NavLink>
        </div>
      </aside>

      <div className="ml-62 flex min-h-screen min-w-0 flex-1 flex-col max-[720px]:ml-0 max-[720px]:min-h-[calc(100vh-6.25rem)]">
        <header className="flex min-h-18 items-center justify-between border-b border-slate-200 bg-white px-8 dark:border-slate-800 dark:bg-slate-900 max-[720px]:min-h-15 max-[720px]:px-5">
          <h1 className="m-0 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            {getPageTitle(pathname)}
          </h1>
          <ThemeToggle />
        </header>
        <div className="w-full flex-1 [&>.page-placeholder]:min-h-[calc(100vh-4.5rem)] max-[720px]:[&>.page-placeholder]:min-h-[calc(100vh-10rem)]">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AppLayout
