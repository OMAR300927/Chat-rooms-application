import { Link, Navigate, createBrowserRouter } from 'react-router'
import AppLayout from '../components/layout/AppLayout'
import AIConversationsPage from '../pages/ai-conversations/AIConversationsPage'
import DocumentsPage from '../pages/documents/DocumentsPage'
import LoginPage from '../pages/login/LoginPage'
import PaymentsPage from '../pages/payments/PaymentsPage'
import ProfilePage from '../pages/profile/ProfilePage'
import RegisterPage from '../pages/register/RegisterPage'
import RoomChatPage from '../pages/room-chat/RoomChatPage'
import RoomsPage from '../pages/rooms/RoomsPage'

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
        element: <RoomChatPage />,
      },
      {
        path: 'payments',
        element: <PaymentsPage />,
      },
      {
        path: 'payment/success',
        element: <Navigate to="/payments?checkout=success" replace />,
      },
      {
        path: 'payment/cancel',
        element: <Navigate to="/payments?checkout=cancel" replace />,
      },
      {
        path: 'documents',
        element: <DocumentsPage />,
      },
      {
        path: 'ai-conversations',
        element: <AIConversationsPage />,
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
