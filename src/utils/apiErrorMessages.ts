/** Dịch thông báo lỗi API sang tiếng Việt (fallback nếu BE chưa dịch). */
const EXACT: Record<string, string> = {
  'Request failed': 'Yêu cầu thất bại',
  Unauthorized: 'Chưa đăng nhập hoặc phiên hết hạn',
  Forbidden: 'Không có quyền truy cập',
  'Not Found': 'Không tìm thấy',
  'Internal Server Error': 'Lỗi máy chủ nội bộ',
  'Authentication required': 'Yêu cầu đăng nhập',
  'Invalid email or password': 'Email hoặc mật khẩu không đúng',
  'Current password is incorrect': 'Mật khẩu hiện tại không đúng',
  'Account is not active': 'Tài khoản chưa được kích hoạt',
  'Rental request is already linked to another contract':
    'Yêu cầu thuê đã có hợp đồng — tiếp tục với hợp đồng hiện có.',
}

const CODE_MESSAGES: Record<string, string> = {
  DB_UNAVAILABLE:
    'Không kết nối được cơ sở dữ liệu. Vui lòng bật PostgreSQL/Docker rồi thử lại.',
  MAIL_SEND_FAILED:
    'Không gửi được email OTP. Kiểm tra cấu hình SMTP trên server hoặc thử lại sau.',
  OTP_NOT_FOUND: 'Không tìm thấy OTP. Vui lòng yêu cầu gửi lại mã OTP.',
  OTP_EXPIRED: 'Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại.',
  OTP_LOCKED: 'Nhập sai OTP quá nhiều lần. Vui lòng yêu cầu gửi lại mã mới.',
  OTP_MISMATCH: 'Mã OTP không đúng. Vui lòng kiểm tra lại.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng',
  INVALID_CURRENT_PASSWORD: 'Mật khẩu hiện tại không đúng',
  ZONE_ALREADY_ASSIGNED:
    'Zone này đã được cấp riêng hoặc đang bị khóa DEDICATED — chọn zone khác.',
  RESERVATION_CONFLICT:
    'Vị trí lưu trữ không khả dụng trong khoảng thời gian này — chọn vị trí khác hoặc điều chỉnh thời hạn.',
  DUPLICATE:
    'Thông tin này đã được đăng ký. Kiểm tra email / mã số thuế — hoặc tra cứu yêu cầu cũ bằng mã RR + email.',
  GUEST_TENANT_TAX_EXISTS:
    'Mã số thuế đã đăng ký với email khác. Dùng đúng email đã đăng ký hoặc tra cứu mã RR + email.',
  CONTRACT_ALREADY_LINKED:
    'Yêu cầu thuê đã có hợp đồng — tiếp tục với hợp đồng hiện có.',
  STORAGE_NOT_ASSIGNED:
    'Kho chưa cấp vị trí lưu trữ — bạn chỉ ký sau khi kho hoàn tất cấp bin/zone.',
  ALREADY_CLAIMED: 'Yêu cầu đã được kho khác duyệt trước.',
}

export function translateApiErrorMessage(message?: string | null, code?: string | null): string {
  if (!message?.trim()) {
    if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code]
    return 'Yêu cầu thất bại'
  }

  const trimmed = message.trim()
  if (EXACT[trimmed]) return EXACT[trimmed]

  // Ưu tiên message tiếng Việt từ BE (kể cả khi có code DUPLICATE chung)
  if (/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(trimmed)) {
    return trimmed
  }

  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code]

  return trimmed
}
