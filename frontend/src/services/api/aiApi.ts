import axios from 'axios'
import { AI_API_BASE_URL } from '../../utils/apiBaseUrl'

const aiApi = axios.create({
  baseURL: AI_API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

export default aiApi
