import type {
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '../../types/auth'
import coreApi from './coreApi'

export async function registerUser(
  request: RegisterRequest,
): Promise<UserResponse> {
  const response = await coreApi.post<UserResponse>('/auth/register', request)
  return response.data
}

export async function loginUser(request: LoginRequest): Promise<UserResponse> {
  const response = await coreApi.post<UserResponse>('/auth/login', request)
  return response.data
}

export async function getCurrentUser(): Promise<UserResponse> {
  const response = await coreApi.get<UserResponse>('/auth/me')
  return response.data
}

export async function logoutUser(): Promise<void> {
  await coreApi.post<void>('/auth/logout')
}
