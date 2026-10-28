import axios, { type AxiosError, type AxiosInstance } from 'axios'

export const SESSION_EXPIRED_MESSAGE =
  'the session is expire, please log in'

export function redirectToLoginForExpiredSession() {
  const loginUrl = new URL('/login', window.location.origin)
  loginUrl.searchParams.set('sessionExpired', 'true')

  if (
    window.location.pathname !== loginUrl.pathname ||
    window.location.search !== loginUrl.search
  ) {
    window.location.replace(`${loginUrl.pathname}${loginUrl.search}`)
  }
}

function isLoginRequest(error: AxiosError): boolean {
  return (error.config?.url ?? '').split('?')[0].endsWith('/auth/login')
}

export function handleExpiredSessions(client: AxiosInstance) {
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        !isLoginRequest(error) &&
        window.location.pathname !== '/login'
      ) {
        
        redirectToLoginForExpiredSession()
      }

      return Promise.reject(error)
    },
  )
}
