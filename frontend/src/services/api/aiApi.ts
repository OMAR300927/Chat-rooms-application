import axios from 'axios'
import { AI_API_BASE_URL } from '../../utils/apiBaseUrl'
import { handleExpiredSessions } from '../../utils/session'

const aiApi = axios.create({
  baseURL: AI_API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

handleExpiredSessions(aiApi)

export default aiApi
