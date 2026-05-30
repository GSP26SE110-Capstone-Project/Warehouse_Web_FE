/** Dịch thông báo lỗi API sang tiếng Việt (fallback nếu BE chưa dịch). */
const EXACT: Record<string, string> = {
  'Request failed': 'Yêu cầu thất bại',
  Unauthorized: 'Chưa đăng nhập hoặc phiên hết hạn',
  Forbidden: 'Không có quyền truy cập',
  'Not Found': 'Không tìm thấy',
  'Internal Server Error': 'Lỗi máy chủ nội bộ',
  'Authentication required': 'Yêu cầu đăng nhập',
  'Invalid email or password': 'Email hoặc mật khẩu không đúng',
  'Account is not active': 'Tài khoản chưa được kích hoạt',
}

const CODE_MESSAGES: Record<string, string> = {
  RESERVATION_CONFLICT:
    'Vị trí lưu trữ đã được cấp cho tenant khác trong khoảng thời gian này. Chọn zone/bin khác hoặc điều chỉnh thời hạn hợp đồng.',
  ZONE_ALREADY_ASSIGNED:
    'Zone này đã được cấp cho tenant khác. Chọn zone khác hoặc điều chỉnh loại thuê (SHARED/DEDICATED).',
  DUPLICATE: 'Dữ liệu đã tồn tại trong hệ thống.',
  ALREADY_CLAIMED: 'Yêu cầu đã được kho khác duyệt trước.',
}

export function translateApiErrorMessage(message?: string | null, code?: string | null): string {
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code]
  if (!message?.trim()) return 'Yêu cầu thất bại'

  const trimmed = message.trim()
  if (EXACT[trimmed]) return EXACT[trimmed]

  // Đã là tiếng Việt
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(trimmed)) {
    return trimmed
  }

  return trimmed
}
