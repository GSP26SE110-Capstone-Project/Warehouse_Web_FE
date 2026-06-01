import React, { useState, useEffect } from 'react'

interface RentalRequestLookupProps {
  initialCode: string
  initialEmail: string
  autoLookup: boolean
}

export const RentalRequestLookup: React.FC<RentalRequestLookupProps> = ({
  initialCode,
  initialEmail,
  autoLookup,
}) => {
  const [code, setCode] = useState(initialCode)
  const [email, setEmail] = useState(initialEmail)
  const [result, setResult] = useState<any>(null)
  const [searching, setSearching] = useState(false)

  const handleLookup = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!code || !email) return

    setSearching(true)
    setResult(null)

    // Giả lập gọi API tìm kiếm
    setTimeout(() => {
      setSearching(false)
      setResult({
        code: code.toUpperCase(),
        date: '01/06/2026',
        status: 'PENDING_REVIEW', // PENDING_REVIEW | APPROVED | REJECTED
        statusLabel: 'Chờ duyệt',
        contractType: 'Lưu hàng linh hoạt',
        note: 'Hệ thống đã tiếp nhận. Nhân sự vận hành sẽ liên hệ khảo sát trong vòng 2 giờ làm việc.',
      })
    }, 1000)
  }

  useEffect(() => {
    if (autoLookup && initialCode && initialEmail) {
      setCode(initialCode)
      setEmail(initialEmail)
      handleLookup()
    }
  }, [autoLookup, initialCode, initialEmail])

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 h-full flex flex-col">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#0077b6]">manage_search</span>
        Tra cứu trạng thái đơn thuê
      </h3>

      <form onSubmit={handleLookup} className="space-y-3 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Mã yêu cầu (Ví dụ: RR-123456)"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email lúc đăng ký"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">search</span>
          Kiểm tra tiến độ đơn
        </button>
      </form>

      {/* Kết quả hiển thị */}
      <div className="flex-1 border-2 border-dashed border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
        {searching && (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#0077b6] border-t-transparent" />
            <p className="text-xs text-gray-500">Đang lục tìm hồ sơ hệ thống...</p>
          </div>
        )}

        {!searching && !result && (
          <div className="text-gray-400">
            <span className="material-symbols-outlined text-4xl mb-1">find_in_page</span>
            <p className="text-sm">Nhập thông tin bên trên để kiểm tra tình trạng xét duyệt.</p>
          </div>
        )}

        {!searching && result && (
          <div className="w-full text-left space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <span className="text-xs font-bold text-gray-400 block">MÃ ĐƠN HÀNG</span>
                <span className="text-sm font-black text-gray-900">{result.code}</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {result.statusLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400 block">Ngày gửi đơn:</span>
                <span className="text-gray-800 font-medium">{result.date}</span>
              </div>
              <div>
                <span className="text-gray-400 block">Mô hình chọn:</span>
                <span className="text-gray-800 font-medium">{result.contractType}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Phản hồi từ Admin:
              </span>
              <p className="text-xs text-gray-600 leading-relaxed">{result.note}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}