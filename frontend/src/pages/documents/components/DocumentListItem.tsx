import { FileText, Trash2 } from 'lucide-react'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'
import type { DocumentResponse, DocumentStatus } from '../../../types/documents'

type DocumentListItemProps = {
  document: DocumentResponse
  onDelete: (document: DocumentResponse) => void
}

const statusDetails: Record<
  DocumentStatus,
  { label: string; variant: 'neutral' | 'info' | 'success' | 'danger' }
> = {
  uploaded: { label: 'Uploaded', variant: 'neutral' },
  processing: { label: 'Processing', variant: 'info' },
  ready: { label: 'Ready', variant: 'success' },
  failed: { label: 'Failed', variant: 'danger' },
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function DocumentListItem({ document, onDelete }: DocumentListItemProps) {
  const status = statusDetails[document.status] ?? {
    label: 'Unknown',
    variant: 'neutral' as const,
  }

  return (
    <li className="flex flex-col gap-4 border-b border-slate-200 py-4 last:border-b-0 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <FileText aria-hidden="true" size={18} />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="m-0 break-all text-sm font-medium text-slate-900 dark:text-slate-100">
            {document.filename}
          </p>
          <p className="m-0 text-xs text-slate-500 dark:text-slate-400">
            Added {formatDate(document.created_at)}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <Badge variant={status.variant}>{status.label}</Badge>
        <Button
          aria-label={`Delete ${document.filename}`}
          className="size-9 min-h-9 px-0"
          onClick={() => onDelete(document)}
          variant="secondary"
        >
          <Trash2 aria-hidden="true" size={16} />
        </Button>
      </div>
    </li>
  )
}

export default DocumentListItem
