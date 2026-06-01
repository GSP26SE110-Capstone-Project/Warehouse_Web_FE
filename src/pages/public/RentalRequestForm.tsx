import React, { useState } from 'react'
import type { ContractType } from '../../types/RentalRequest'

interface RentalRequestFormProps {
  contractType: ContractType
  onContractTypeChange: (type: ContractType) => void
  onSubmitted: (requestCode: string, contactEmail: string) => void
}

export const RentalRequestForm: React.FC<RentalRequestFormProps> = ({
  contractType,
  onContractTypeChange,
  onSubmitted,
}) => {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !phone || !name) return

    setLoading(true)
    // Giả lập gửi API tạo yêu cầu thuê kho
    setTimeout(() => {
      const mockRequestCode = `RR-${Math.floor(100000 + Math.random() * 900000)}`
      setLoading(false)
      onSubmitted(mockRequestCode, email)
      // Reset form
      setName('')
      setArea('')
      setNote('')
    }, 1200)
  }

  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-[#0077b6]">edit_note</span>
        Thông tin đăng ký thuê kho
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Họ và tên / Doanh nghiệp *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nguyễn Văn A / Công ty XYZ"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email liên hệ *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Số điện thoại *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0901234567"
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Diện tích / Thể tích dự kiến (m² hoặc m³)
          </label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Ví dụ: 50 m2 hoặc 20 khối"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Mô tả loại hàng & Yêu cầu đặc biệt
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Hàng thực phẩm khô, cần lưu mát, chu kỳ xuất nhập hàng ngày..."
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#0077b6] focus:bg-white transition-colors resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0077b6] hover:bg-[#0096c7] text-white font-bold py-3 px-4 rounded-lg text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">cloud_upload</span>
              Gửi yêu cầu hệ thống
            </>
          )}
        </button>
      </form>
    </div>
  )
}