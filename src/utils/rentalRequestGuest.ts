/** Gợi ý zone từ tuỳ chọn guest — thay cho dropdown + lượt nhập/xuất/tuần. */
export function deriveSuggestedZoneType(
  requiresFastPicking: boolean,
  requiresPremiumStorage: boolean
): string | undefined {
  if (requiresPremiumStorage) return 'PREMIUM'
  if (requiresFastPicking) return 'FAST_MOVING'
  return undefined
}

export function countEstimatedSkusFromProductLines(
  lines: { productKind: string; size?: string }[]
): number {
  return new Set(lines.map((line) => `${line.productKind}|${line.size ?? ''}`)).size
}
