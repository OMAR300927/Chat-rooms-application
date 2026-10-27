import axios from 'axios'

type APIErrorResponse = {
  detail?: unknown
  message?: unknown
}

function getResponseMessage(data: unknown): string | undefined {
  if (typeof data === 'string' && data.trim()) {
    return data.trim()
  }

  if (typeof data !== 'object' || data === null) {
    return undefined
  }

  const body = data as APIErrorResponse
  for (const value of [body.detail, body.message]) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }

    if (Array.isArray(value)) {
      const messages = value.flatMap((item: unknown) => {
        if (
          typeof item === 'object' &&
          item !== null &&
          'msg' in item &&
          typeof item.msg === 'string'
        ) {
          return [item.msg]
        }
        
        return []
      })

      if (messages.length > 0) {
        return messages.join(' ')
      }
    }
  }

  return undefined
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      return (
        getResponseMessage(error.response.data) ??
        `Request failed with status ${error.response.status}.`
      )
    }

    if (error.request) {
      return 'Unable to reach the server. Check your connection and try again.'
    }

    return error.message || fallback
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}
