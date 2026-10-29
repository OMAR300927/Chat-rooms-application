import { FileText } from 'lucide-react'
import { Link } from 'react-router'
import type { DocumentResponse } from '../../../types/documents'

type DocumentSelectorProps = {
  documents: DocumentResponse[]
  selectedDocumentIds: string[]
  onChange: (documentIds: string[]) => void
  isLoading: boolean
  errorMessage: string
}

function DocumentSelector({
  documents,
  selectedDocumentIds,
  onChange,
  isLoading,
  errorMessage,
}: DocumentSelectorProps) {
  const readyDocuments = documents.filter(
    (document) => document.status === 'ready',
  )

  function toggleDocument(documentId: string) {
    onChange(
      selectedDocumentIds.includes(documentId)
        ? selectedDocumentIds.filter((id) => id !== documentId)
        : [...selectedDocumentIds, documentId],
    )
  }

  return (
    <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <FileText aria-hidden="true" size={18} />
        </span>
        <div>
          <h3 className="m-0 text-base font-semibold text-slate-900 dark:text-white">
            Choose document sources
          </h3>
          <p className="mb-0 mt-1 text-sm text-slate-600 dark:text-slate-400">
            Optional. The AI will use selected documents to ground its answers.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="m-0 text-sm text-slate-500 dark:text-slate-400">
          Loading your documents…
        </p>
      ) : errorMessage ? (
        <p className="m-0 text-sm text-red-700 dark:text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : readyDocuments.length === 0 ? (
        <p className="m-0 text-sm leading-6 text-slate-600 dark:text-slate-400">
          No ready PDFs found. You can start without sources or upload a PDF on
          the{' '}
          <Link
            className="font-medium text-blue-700 dark:text-blue-300"
            to="/documents"
          >
            Documents
          </Link>{' '}
          page first.
        </p>
      ) : (
        <ul className="m-0 max-h-52 list-none space-y-1 overflow-y-auto p-0">
          {readyDocuments.map((document) => (
            <li key={document.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  checked={selectedDocumentIds.includes(document.id)}
                  className="mt-0.5 size-4 accent-blue-700"
                  onChange={() => toggleDocument(document.id)}
                  type="checkbox"
                />
                <span className="min-w-0 break-all text-sm text-slate-800 dark:text-slate-200">
                  {document.filename}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default DocumentSelector
