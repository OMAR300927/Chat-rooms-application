import axios from 'axios'
import { CORE_API_BASE_URL } from '../../utils/apiBaseUrl'
import { handleExpiredSessions } from '../../utils/session'

const coreApi = axios.create({
  baseURL: CORE_API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

handleExpiredSessions(coreApi)

export default coreApi
