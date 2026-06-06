export type DeliveryMode = 'TENANT_SELF' | 'WAREHOUSE_TRANSPORT'

export const DELIVERY_MODE_OPTIONS: { value: DeliveryMode; label: string; hint: string }[] = [
  {
    value: 'TENANT_SELF',
    label: 'Tenant tự mang xe đến kho',
    hint: 'Nhập biển số & tài xế trước khi xe vào cổng',
  },
  {
    value: 'WAREHOUSE_TRANSPORT',
    label: 'Kho / đối tác vận chuyển',
    hint: 'Warehouse sẽ điền thông tin xe sau khi duyệt',
  },
]

/** Nhãn cho outbound (hướng ngược inbound). */
export const OUTBOUND_DELIVERY_MODE_OPTIONS: { value: DeliveryMode; label: string; hint: string }[] = [
  {
    value: 'TENANT_SELF',
    label: 'Tenant tự đến kho lấy hàng',
    hint: 'Nhập biển số xe trước khi WH Admin xuất hàng (SHIPPED)',
  },
  {
    value: 'WAREHOUSE_TRANSPORT',
    label: 'Kho giao hàng ra',
    hint: 'Nhập địa chỉ giao — sau SHIPPED WH Admin gán tài xế',
  },
]
