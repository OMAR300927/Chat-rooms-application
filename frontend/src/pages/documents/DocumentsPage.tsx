import { useCallback, useEffect, useState } from 'react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import { deleteDocument, listDocuments, uploadDocument } from '../../services/api/documentsApi'
import type { DocumentResponse } from '../../types/documents'
import { getErrorMessage } from '../../utils/errors'
import DeleteDocumentDialog from './components/DeleteDocumentDialog'
import DocumentList from './components/DocumentList'
import DocumentUploader from './components/DocumentUploader'

function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentResponse[]>([])
  const [documentToDelete, setDocumentToDelete] =
    useState<DocumentResponse | null>(null)
  const [listError, setListError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reloadCount, setReloadCount] = useState(0)

  const loadDocuments = useCallback(async () => {
    setListError('')
    try {
      setDocuments(await listDocuments())

    } catch (error: unknown) {
      setListError(getErrorMessage(error, 'Unable to load your documents.'))
      
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let isCurrent = true

    listDocuments()
      .then((loadedDocuments) => {
        if (isCurrent) {
          setDocuments(loadedDocuments)
          setListError('')
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setListError(
            getErrorMessage(error, 'Unable to load your documents.'),
          )
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [reloadCount])

  async function handleUpload(file: File) {
    setUploadError('')
    setIsUploading(true)
    try {
      const uploadedDocument = await uploadDocument(file)
      setDocuments((currentDocuments) => [
        uploadedDocument,
        ...currentDocuments.filter(
          (document) => document.id !== uploadedDocument.id,
        ),
      ])
    } catch (error: unknown) {
      setUploadError(
        getErrorMessage(error, 'Unable to upload this PDF. Please try again.'),
      )
      setReloadCount((count) => count + 1)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete() {
    if (!documentToDelete) return

    setDeleteError('')
    setIsDeleting(true)
    try {
      await deleteDocument(documentToDelete.id)
      setDocuments((currentDocuments) =>
        currentDocuments.filter(
          (document) => document.id !== documentToDelete.id,
        ),
      )
      setDocumentToDelete(null)
    } catch (error: unknown) {
      setDeleteError(
        getErrorMessage(error, 'Unable to delete this document.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const hasDocumentsInProgress = documents.some(
    (document) =>
      document.status === 'uploaded' || document.status === 'processing',
  )

  useEffect(() => {
    if (!hasDocumentsInProgress) return

    const intervalId = window.setInterval(() => {
      void loadDocuments()
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [hasDocumentsInProgress, loadDocuments])

  function handleRetry() {
    setIsLoading(true)
    setReloadCount((count) => count + 1)
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="m-0 text-sm font-semibold text-blue-700 dark:text-blue-300">
          Knowledge base
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Documents
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Upload and manage PDF sources for your AI conversations.
        </p>
      </header>

      <DocumentUploader
        errorMessage={uploadError}
        isUploading={isUploading}
        onUpload={handleUpload}
      />

      {isLoading && documents.length === 0 && !listError ? (
        <Card className="flex min-h-48 items-center justify-center">
          <Spinner
            aria-label="Loading documents"
            className="text-blue-700 dark:text-blue-300"
          />
        </Card>
      ) : listError && documents.length === 0 ? (
        <Card className="flex flex-col items-start gap-3" role="alert">
          <div>
            <h3 className="m-0 text-base font-semibold text-slate-900 dark:text-white">
              Could not load documents
            </h3>
            <p className="mb-0 mt-1 text-sm text-red-700 dark:text-red-300">
              {listError}
            </p>
          </div>
          <Button onClick={handleRetry} variant="secondary">
            Try again
          </Button>
        </Card>
      ) : (
        <DocumentList
          documents={documents}
          errorMessage={listError}
          isLoading={isLoading}
          onDelete={(document) => {
            setDeleteError('')
            setDocumentToDelete(document)
          }}
          onRetry={handleRetry}
        />
      )}

      <DeleteDocumentDialog
        document={documentToDelete}
        errorMessage={deleteError}
        isDeleting={isDeleting}
        onClose={() => {
          setDeleteError('')
          setDocumentToDelete(null)
        }}
        onConfirm={handleDelete}
      />
    </main>
  )
}

export default DocumentsPage
