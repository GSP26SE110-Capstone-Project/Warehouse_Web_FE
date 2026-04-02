import React, { useState } from 'react'
import type { ImportExportRequest } from '../../../types/ImportExport'
type Driver = {
  id: number
  name: string
}

const drivers: Driver[] = [
  { id: 1, name: 'Nguyễn Văn A' },
  { id: 2, name: 'Trần Văn B' },
]

type Props = {
  open: boolean
  request?: ImportExportRequest
  onClose: () => void
  onSubmit: (driverId: number) => void
}

export const AssignDriverModal: React.FC<Props> = ({
  open,
  request,
  onClose,
  onSubmit
}) => {
  const [driverId, setDriverId] = useState<number>()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="bg-[#0b101a] p-6 rounded-xl w-[400px] z-10">
        <h2 className="text-white text-lg font-bold mb-4">
          Tạo vận chuyển
        </h2>

        <p className="text-sm text-slate-400 mb-4">
          {request?.origin} → {request?.destination}
        </p>

        <select
          className="w-full p-2 bg-[#1a2333] text-white rounded"
          onChange={(e) => setDriverId(Number(e.target.value))}
        >
          <option>Chọn tài xế</option>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => onSubmit(driverId!)}
          className="mt-4 w-full bg-cyan-500 p-2 rounded text-black font-bold"
        >
          Xác nhận
        </button>
      </div>
    </div>
  )
}