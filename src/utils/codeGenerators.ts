/** 2 chữ đầu của box type: EXTRA→EX, MEDIUM→ME, SMALL→SM, LARGE→LA */
export function boxTypeCodeSuffix(boxType: string): string {
  const t = String(boxType ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  if (t.length >= 2) return t.slice(0, 2)
  if (t.length === 1) return `${t}X`
  return 'XX'
}

export function generateLpnCode(
  inboundCode: string | undefined | null,
  existingLpnCount: number,
  boxType: string
): string {
  const base = (inboundCode ?? 'IN').replace(/[^a-zA-Z0-9-]/g, '') || 'IN'
  const seq = String(existingLpnCount + 1).padStart(3, '0')
  const suffix = boxTypeCodeSuffix(boxType)
  return `${base}-LPN-${seq}-${suffix}`
}

function slugCodePart(text: string, maxLen = 16): string {
  return (
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toUpperCase()
      .slice(0, maxLen) || 'SKU'
  )
}

export function generateSkuCode(options: {
  productKind?: string
  productName?: string
  existingCodes?: string[]
}): string {
  const base = slugCodePart(options.productKind || options.productName || 'SKU')
  const existing = (options.existingCodes ?? []).map((c) => c.trim().toUpperCase())
  let max = 0
  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`)
  for (const code of existing) {
    const m = code.match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  if (max === 0 && !existing.some((c) => c.startsWith(`${base}-`))) {
    return `${base}-001`
  }
  return `${base}-${String(max + 1).padStart(3, '0')}`
}

/** Gợi ý mã zone tiếp theo trong kho (Z-01, Z-A03, …) */
export function generateZoneCode(existingCodes: string[], prefix = 'Z'): string {
  const codes = existingCodes.map((c) => c.trim().toUpperCase()).filter(Boolean)
  const p = prefix.trim().toUpperCase() || 'Z'

  const letterRows = codes
    .map((c) => c.match(new RegExp(`^${p}-([A-Z])(\\d+)$`, 'i')))
    .filter((m): m is RegExpMatchArray => Boolean(m))

  if (letterRows.length > 0) {
    const byLetter = new Map<string, number>()
    for (const m of letterRows) {
      const letter = m[1].toUpperCase()
      const n = parseInt(m[2], 10)
      byLetter.set(letter, Math.max(byLetter.get(letter) ?? 0, n))
    }
    const letter = [...byLetter.keys()].sort()[0] ?? 'A'
    const next = (byLetter.get(letter) ?? 0) + 1
    return `${p}-${letter}${String(next).padStart(2, '0')}`
  }

  let maxNum = 0
  for (const c of codes) {
    const m = c.match(new RegExp(`^${p}-?(\\d+)$`, 'i'))
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10))
  }
  const next = maxNum + 1
  return `${p}-${String(next).padStart(2, '0')}`
}

export function generateWarehouseCode(city?: string, existingCodes?: string[]): string {
  const cityPart = slugCodePart(city || 'KHO', 8)
  const prefix = `WH-${cityPart}`
  const existing = (existingCodes ?? []).map((c) => c.trim().toUpperCase())
  let max = 0
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-?(\\d+)$`)
  for (const code of existing) {
    const m = code.match(re)
    if (m) max = Math.max(max, parseInt(m[1], 10))
  }
  if (max === 0 && !existing.some((c) => c.startsWith(prefix))) {
    return `${prefix}-01`
  }
  return `${prefix}-${String(max + 1).padStart(2, '0')}`
}
