export type DocumentStatus = 'uploaded' | 'processing' | 'ready' | 'failed'

export type DocumentResponse = {
  id: string
  filename: string
  status: DocumentStatus
  created_at: string
  updated_at: string
}
