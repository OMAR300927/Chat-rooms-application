import type { DocumentResponse } from '../../types/documents'
import aiApi from './aiApi'

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await aiApi.post<DocumentResponse>('/documents', formData)
  return response.data
}

export async function listDocuments(): Promise<DocumentResponse[]> {
  const response = await aiApi.get<DocumentResponse[]>('/documents')
  return response.data
}

export async function getDocument(
  documentId: string,
): Promise<DocumentResponse> {
  const response = await aiApi.get<DocumentResponse>(
    `/documents/${documentId}`,
  )
  return response.data
}

export async function deleteDocument(documentId: string): Promise<void> {
  await aiApi.delete<void>(`/documents/${documentId}`)
}
