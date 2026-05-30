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
  'Rental request is already linked to another contract':
    'Yêu cầu thuê đã có hợp đồng — tiếp tục với hợp đồng hiện có.',
}

const CODE_MESSAGES: Record<string, string> = {
  ZONE_ALREADY_ASSIGNED:
    'Zone này đã được cấp riêng hoặc đang bị khóa DEDICATED — chọn zone khác.',
  RESERVATION_CONFLICT:
    'Vị trí lưu trữ không khả dụng trong khoảng thời gian này — chọn vị trí khác hoặc điều chỉnh thời hạn.',
  DUPLICATE: 'Dữ liệu đã tồn tại trong hệ thống.',
  CONTRACT_ALREADY_LINKED:
    'Yêu cầu thuê đã có hợp đồng — tiếp tục với hợp đồng hiện có.',
  STORAGE_NOT_ASSIGNED:
    'Kho chưa cấp vị trí lưu trữ — bạn chỉ ký sau khi kho hoàn tất cấp bin/zone.',
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
