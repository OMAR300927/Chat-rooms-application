import { Link, Navigate, createBrowserRouter } from 'react-router'
import AppLayout from '../components/layout/AppLayout'
import LoginPage from '../pages/login/LoginPage'
import ProfilePage from '../pages/profile/ProfilePage'
import RegisterPage from '../pages/register/RegisterPage'
import RoomsPage from '../pages/rooms/RoomsPage'

function placeholder(title: string, description: string) {
  return (
    <main className="page-placeholder">
      <p className="page-placeholder__eyebrow">Chat Rooms</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </main>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'rooms',
        element: <RoomsPage />,
      },
      {
        path: 'rooms/:roomId',
        element: placeholder(
          'Room chat',
          'Realtime user-to-user room chat will be built here.',
        ),
      },
      {
        path: 'payments',
        element: placeholder(
          'Payments',
          'AI access and payment management will be available here.',
        ),
      },
      {
        path: 'documents',
        element: placeholder(
          'Documents',
          'Upload and manage your PDF documents here.',
        ),
      },
      {
        path: 'ai-conversations',
        element: placeholder(
          'AI conversations',
          'Your AI conversation sidebar and chat will be built here.',
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <main className="page-placeholder">
        <p className="page-placeholder__eyebrow">404</p>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/login">Go to login</Link>
      </main>
    ),
  },
])
