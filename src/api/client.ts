import type { ApiErrorBody, ApiPaginated, ApiSuccess } from './types'
import { getAccessToken, clearSession } from '../auth/storage'

const API_PREFIX = '/api'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: boolean
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text) return {} as T
  try {
    return JSON.parse(text) as T
  } catch {
    return {} as T
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { body, auth = true, headers: initHeaders, ...rest } = options

  const headers = new Headers(initHeaders)
  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_PREFIX}${path}`, {
    ...rest,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  })

  const payload = await parseJson<ApiSuccess<T> | ApiErrorBody>(res)

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearSession()
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    const err = payload as ApiErrorBody
    throw new ApiError(
      err.message || res.statusText || 'Request failed',
      res.status,
      err.code
    )
  }

  if (payload && typeof payload === 'object' && 'success' in payload && payload.success === false) {
    const err = payload as ApiErrorBody
    throw new ApiError(err.message || 'Request failed', res.status, err.code)
  }

  return (payload as ApiSuccess<T>).data
}

export async function apiPaginated<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ items: T[]; meta: ApiPaginated<T>['meta'] }> {
  const { body, auth = true, headers: initHeaders, ...rest } = options

  const headers = new Headers(initHeaders)
  if (body !== undefined) headers.set('Content-Type', 'application/json')
  if (auth) {
    const token = getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(`${API_PREFIX}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const payload = await parseJson<ApiPaginated<T> | ApiErrorBody>(res)

  if (!res.ok || (payload && 'success' in payload && payload.success === false)) {
    const err = payload as ApiErrorBody
    throw new ApiError(err.message || res.statusText, res.status, err.code)
  }

  const ok = payload as ApiPaginated<T>
  return { items: ok.data ?? [], meta: ok.meta }
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}
