export type DedicatedZonePreference = 'PRIVATE' | 'PREMIUM' | ''

/** Gợi ý loại zone khi guest thuê khu riêng (DEDICATED_ZONE). */
export function deriveSuggestedZoneType(
  preferredZoneType: DedicatedZonePreference
): string | undefined {
  return preferredZoneType || undefined
}

export function countEstimatedSkusFromProductLines(
  lines: { productKind: string; size?: string }[]
): number {
  return new Set(lines.map((line) => `${line.productKind}|${line.size ?? ''}`)).size
}
