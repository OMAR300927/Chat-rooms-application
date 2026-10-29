import { useRef, useState } from 'react'
import { FileUp } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Spinner from '../../../components/ui/Spinner'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

type DocumentUploaderProps = {
  isUploading: boolean
  errorMessage: string
  onUpload: (file: File) => Promise<void>
}

function DocumentUploader({
  isUploading,
  errorMessage,
  onUpload,
}: DocumentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [validationError, setValidationError] = useState('')

  async function handleFile(file: File | undefined) {
    if (!file) return

    setValidationError('')
    if (!file.name.toLocaleLowerCase().endsWith('.pdf')) {
      setValidationError('Choose a PDF file to upload.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('The PDF must be 10 MB or smaller.')
      return
    }

    await onUpload(file)
  }

  return (
    <section className="rounded-xl border border-dashed border-slate-300 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <FileUp aria-hidden="true" size={20} />
          </span>
          <div>
            <h2 className="m-0 text-base font-semibold text-slate-900 dark:text-white">
              Upload a PDF
            </h2>
            <p className="mb-0 mt-1 text-sm text-slate-600 dark:text-slate-400">
              Add documents to use as sources in AI conversations. Maximum file
              size: 10 MB.
            </p>
          </div>
        </div>
        <input
          accept=".pdf,application/pdf"
          className="sr-only"
          disabled={isUploading}
          onChange={(event) => {
            void handleFile(event.currentTarget.files?.[0])
            event.currentTarget.value = ''
          }}
          ref={inputRef}
          type="file"
        />
        <Button
          className="shrink-0 transform-gpu transition-transform duration-150 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Spinner aria-label="Uploading document" size="small" />
              <span>Uploading…</span>
            </>
          ) : (
            <>
              <FileUp aria-hidden="true" size={16} />
              <span>Select PDF</span>
            </>
          )}
        </Button>
      </div>
      {(validationError || errorMessage) && (
        <p
          aria-live="polite"
          className="mb-0 mt-4 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {validationError || errorMessage}
        </p>
      )}
    </section>
  )
}

export default DocumentUploader
