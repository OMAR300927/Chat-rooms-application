import { FileText, RotateCw } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import Spinner from '../../../components/ui/Spinner'
import type { DocumentResponse } from '../../../types/documents'
import DocumentListItem from './DocumentListItem'

type DocumentListProps = {
  documents: DocumentResponse[]
  isLoading: boolean
  errorMessage: string
  onRetry: () => void
  onDelete: (document: DocumentResponse) => void
}

function DocumentList({
  documents,
  isLoading,
  errorMessage,
  onRetry,
  onDelete,
}: DocumentListProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h2 className="m-0 text-lg font-semibold text-slate-900 dark:text-white">
            Your documents
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Documents uploaded to your account.
          </p>
        </div>
        <span className="hidden size-10 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 sm:grid">
          <FileText aria-hidden="true" size={19} />
        </span>
      </div>

      {isLoading ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner
            aria-label="Loading documents"
            className="text-blue-700 dark:text-blue-300"
          />
        </div>
      ) : errorMessage ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-center">
          <p className="m-0 max-w-md text-sm text-red-700 dark:text-red-300" role="alert">
            {errorMessage}
          </p>
          <Button onClick={onRetry} variant="secondary">
            <RotateCw aria-hidden="true" size={15} />
            <span>Try again</span>
          </Button>
        </div>
      ) : documents.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center text-center">
          <p className="m-0 text-sm font-medium text-slate-800 dark:text-slate-200">
            No documents yet
          </p>
          <p className="mb-0 mt-1 text-sm text-slate-600 dark:text-slate-400">
            Upload a PDF to make it available to your AI conversations.
          </p>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {documents.map((document) => (
            <DocumentListItem
              document={document}
              key={document.id}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}

export default DocumentList
