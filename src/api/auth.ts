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

// ── Forgot password (OTP qua email) ────────────────────────────────────────
export interface ForgotPasswordRequestResult {
  email: string
  expiresInMinutes: number
}

export function requestForgotPassword(body: { email: string }) {
  return apiRequest<ForgotPasswordRequestResult>('/auth/forgot-password', {
    method: 'POST',
    body,
    auth: false,
  })
}

export function verifyForgotPassword(body: {
  email: string
  otp: string
  newPassword: string
}) {
  return apiRequest<{ changedAt: string }>('/auth/forgot-password/verify', {
    method: 'POST',
    body,
    auth: false,
  })
}

export function changePassword(body: { currentPassword: string; newPassword: string }) {
  return apiRequest<{ changedAt: string }>('/auth/change-password', {
    method: 'POST',
    body,
    keepSessionOn401: true,
  })
}

export function healthCheck() {
  return apiRequest<{ status: string; database: string; timestamp: string }>('/health', {
    auth: false,
  })
}
