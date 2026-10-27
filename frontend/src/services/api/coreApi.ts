import axios from 'axios'
import { CORE_API_BASE_URL } from '../../utils/apiBaseUrl'

const coreApi = axios.create({
  baseURL: CORE_API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

export default coreApi
