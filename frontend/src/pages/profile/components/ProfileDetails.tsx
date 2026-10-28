import { useId } from 'react'
import type { UserResponse } from '../../../types/auth'
import Badge from '../../../components/ui/Badge'
import Card from '../../../components/ui/Card'

type ProfileDetailsProps = {
  user: UserResponse
}

function ProfileDetails({ user }: ProfileDetailsProps) {
  const headingId = useId()
  const joinedDate = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'long',
  }).format(new Date(user.created_at))

  return (
    <Card aria-labelledby={headingId} className="space-y-6">
      <div>
        <h2
          className="m-0 text-lg font-semibold text-slate-900 dark:text-white"
          id={headingId}
        >
          Account details
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Your profile information and account access.
        </p>
      </div>

      <dl className="divide-y divide-slate-200 dark:divide-slate-800">
        <div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Username
          </dt>
          <dd className="m-0 wrap-break-word text-sm text-slate-900 dark:text-slate-100">
            {user.username}
          </dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Email
          </dt>
          <dd className="m-0 wrap-break-word text-sm text-slate-900 dark:text-slate-100">
            {user.email}
          </dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Account status
          </dt>
          <dd className="m-0">
            <Badge variant={user.is_active ? 'success' : 'danger'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
            AI chat access
          </dt>
          <dd className="m-0">
            <Badge variant={user.ai_chat_unlocked ? 'success' : 'neutral'}>
              {user.ai_chat_unlocked ? 'Unlocked' : 'Locked'}
            </Badge>
          </dd>
        </div>
        <div className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Member since
          </dt>
          <dd className="m-0 text-sm text-slate-900 dark:text-slate-100">
            {joinedDate}
          </dd>
        </div>
      </dl>
    </Card>
  )
}

export default ProfileDetails
