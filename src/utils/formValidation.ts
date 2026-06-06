const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VN_MOBILE_RE = /^0[35789]\d{8}$/

export function normalizePhoneDigits(value: string): string {
  let digits = value.trim().replace(/[\s().-]/g, '')
  if (digits.startsWith('+84')) digits = `0${digits.slice(3)}`
  else if (/^84[35789]/.test(digits) && digits.length === 11) digits = `0${digits.slice(2)}`
  return digits
}

/** Rỗng = hợp lệ (trường tùy chọn). Có giá trị thì phải là SĐT VN, không được là email. */
export function validatePhone(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (EMAIL_RE.test(trimmed) || trimmed.includes('@')) {
    return 'Số điện thoại không được là địa chỉ email'
  }
  const normalized = normalizePhoneDigits(trimmed)
  if (!VN_MOBILE_RE.test(normalized)) {
    return 'Số điện thoại không hợp lệ (vd: 0901234567)'
  }
  return null
}

export function formatPhoneForSubmit(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return normalizePhoneDigits(trimmed)
}

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
