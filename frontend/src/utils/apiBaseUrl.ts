const API_PREFIX = '/api/v1'

function getApiBaseUrl(
  configuredUrl: string | undefined,
  defaultOrigin: string,
): string {
  const origin = (configuredUrl || defaultOrigin).replace(/\/+$/, '')
  return origin.endsWith(API_PREFIX) ? origin : `${origin}${API_PREFIX}`
}

export const CORE_API_BASE_URL = getApiBaseUrl(
  import.meta.env.VITE_CORE_API_BASE_URL,
  'http://localhost:8000',
)

export const AI_API_BASE_URL = getApiBaseUrl(
  import.meta.env.VITE_AI_API_BASE_URL,
  'http://localhost:8001',
)
