import type { RegionWarehouseItem } from '../api/locations'

export type DedicatedLeaseAvailability = 'AVAILABLE' | 'NEEDS_REVIEW' | 'OCCUPIED'

export function dedicatedLeaseBadge(status: DedicatedLeaseAvailability): {
  label: string
  className: string
} {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'Có thể thuê nguyên',
        className: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
      }
    case 'OCCUPIED':
      return {
        label: 'Đang có khách thuê',
        className: 'border-rose-400/35 bg-rose-400/10 text-rose-300',
      }
    default:
      return {
        label: 'Cần admin xác nhận',
        className: 'border-amber-400/35 bg-amber-400/10 text-amber-200',
      }
  }
}

export function hasWarehouseAvailableForDedicated(items: RegionWarehouseItem[]): boolean {
  return items.some((item) => item.dedicatedLeaseAvailability === 'AVAILABLE')
}

export function dedicatedLeaseNoVacancyMessage(district: string, city: string): string {
  return `Hiện chưa có kho trống hoàn toàn tại ${district}, ${city}. Bạn vẫn có thể gửi yêu cầu — admin sẽ liên hệ với phương án phù hợp (chờ kho trống, thuê khu riêng, hoặc kho/quận khác).`
}
