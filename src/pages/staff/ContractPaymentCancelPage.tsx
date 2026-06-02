import { Link } from 'react-router-dom'

export function ContractPaymentCancelPage() {
  return (
    <div className="mx-auto max-w-lg px-6 py-16 text-slate-100">
      <h1 className="text-xl font-bold text-white">Đã hủy thanh toán PayOS</h1>
      <p className="mt-4 text-sm text-slate-400">
        Bạn có thể quay lại trang Hợp đồng và bấm thanh toán lại khi sẵn sàng.
      </p>
      <Link
        to="/staff/contracts"
        className="mt-8 inline-flex rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
      >
        Về Hợp đồng
      </Link>
    </div>
  )
}
