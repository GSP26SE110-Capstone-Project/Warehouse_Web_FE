import { apiRequest, apiPaginated, buildQuery } from './client'
import type { ApiUser, UserRole, UserStatus } from './types'

export function getMe() {
  return apiRequest<ApiUser>('/users/me')
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
  return apiRequest<ApiUser>('/users', { method: 'POST', body })
}

export function updateUser(
  userId: string,
  body: {
    fullName?: string
    phone?: string
    status?: UserStatus
    warehouseId?: string
    tenantId?: string
  }
) {
  return apiRequest<ApiUser>(`/users/${userId}`, { method: 'PATCH', body })
}
