import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiUser, UserRole, UserStatus } from './types'

export interface WelcomeEmailResult {
  sent: boolean
  to?: string
  error?: string
}

export interface CreateUserResult {
  user: ApiUser
  welcomeEmail?: WelcomeEmailResult
}

export function welcomeEmailMessage(result?: WelcomeEmailResult): string {
  if (!result) return ''
  if (result.sent) {
    return ` Email chào mừng đã gửi tới ${result.to}.`
  }
  if (result.error) {
    return ` Không gửi được email: ${result.error}.`
  }
  return ''
}

export function getMe() {
  return apiRequest<ApiUser>('/users/me')
}

export function updateMe(body: {
  fullName?: string
  phone?: string
  defaultVehiclePlate?: string | null
  defaultDriverIdNumber?: string | null
  defaultCarrierName?: string | null
}) {
  return apiRequest<ApiUser>('/users/me', { method: 'PATCH', body })
}

export function listUsers(params?: {
  role?: UserRole
  status?: UserStatus
  page?: number
  limit?: number
}) {
  return apiPaginated<ApiUser>(`/users${buildQuery(params ?? {})}`)
}

export function createUser(body: {
  fullName: string
  email: string
  password: string
  role: UserRole
  phone?: string
  warehouseId?: string
  tenantId?: string
  status?: UserStatus
}) {
  return apiRequest<CreateUserResult>('/users', { method: 'POST', body })
}

export function updateUser(
  userId: string,
  body: {
    fullName?: string
    phone?: string
    status?: UserStatus
    warehouseId?: string | null
    tenantId?: string | null
  }
) {
  return apiRequest<ApiUser>(`/users/${userId}`, { method: 'PATCH', body })
}

/** System Admin — bật/tắt tài khoản nhanh */
export function setUserAccountActive(userId: string, active: boolean) {
  return updateUser(userId, { status: active ? 'ACTIVE' : 'INACTIVE' })
}
