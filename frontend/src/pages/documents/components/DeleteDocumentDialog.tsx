import { useState } from 'react'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import Spinner from '../../../components/ui/Spinner'
import type { DocumentResponse } from '../../../types/documents'

type DeleteDocumentDialogProps = {
  document: DocumentResponse | null
  isDeleting: boolean
  errorMessage: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

function DeleteDocumentDialog({
  document,
  isDeleting,
  errorMessage,
  onClose,
  onConfirm,
}: DeleteDocumentDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  async function handleConfirm() {
    if (isDeleting || isConfirming) return
    setIsConfirming(true)
    try {
      await onConfirm()
      
    } finally {
      setIsConfirming(false)
    }
  }

  function handleClose() {
    if (!isDeleting && !isConfirming) onClose()
  }

  return (
    <Modal
      description="This removes the PDF and its indexed content from your account."
      footer={
        <>
          <Button
            disabled={isDeleting || isConfirming}
            onClick={handleClose}
            variant="secondary"
          >
            Cancel
          </Button>
          <Button
            className="transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
            disabled={isDeleting || isConfirming || !document}
            onClick={() => void handleConfirm()}
            variant="danger"
          >
            {isDeleting || isConfirming ? (
              <>
                <Spinner aria-label="Deleting document" size="small" />
                <span>Deleting…</span>
              </>
            ) : (
              'Delete document'
            )}
          </Button>
        </>
      }
      onClose={handleClose}
      open={document !== null}
      title="Delete document?"
    >
      <p className="m-0 break-all text-sm text-slate-700 dark:text-slate-300">
        Are you sure you want to delete{' '}
        <span className="font-semibold">{document?.filename}</span>? This action
        cannot be undone.
      </p>
      {errorMessage && (
        <p
          aria-live="polite"
          className="mb-0 mt-4 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </Modal>
  )
}

export default DeleteDocumentDialog
