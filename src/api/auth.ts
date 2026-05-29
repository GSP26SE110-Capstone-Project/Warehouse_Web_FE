import { apiRequest } from './client'
import type { LoginPayload, LoginResult } from './types'

export function login(payload: LoginPayload) {
  return apiRequest<LoginResult>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export function resetPasswordWithToken(body: { token: string; newPassword: string }) {
  return apiRequest<{ changedAt: string }>('/auth/reset-password', {
    method: 'POST',
    body,
    auth: false,
  })
}

export function healthCheck() {
  return apiRequest<{ status: string; database: string; timestamp: string }>('/health', {
    auth: false,
  })
}
