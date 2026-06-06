const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function requireTrimmed(value: string, fieldLabel: string): string | null {
  if (!value.trim()) return `${fieldLabel} là bắt buộc`
  return null
}

export function requireEmail(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return 'Email là bắt buộc'
  if (!EMAIL_RE.test(trimmed)) return 'Email không hợp lệ'
  return null
}

export function requireMinPassword(value: string, min = 8): string | null {
  if (!value.trim()) return 'Mật khẩu là bắt buộc'
  if (value.length < min) return `Mật khẩu phải có ít nhất ${min} ký tự`
  return null
}
