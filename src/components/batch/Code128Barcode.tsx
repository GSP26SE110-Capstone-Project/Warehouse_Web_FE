import { useEffect, useRef } from 'react'
import JsBarcode from 'jsbarcode'

type Props = {
  value: string
  height?: number
  displayValue?: boolean
  className?: string
}

/** Render Code 128 từ chuỗi (vd batchCode) — client-side, không gọi BE. */
export function Code128Barcode({
  value,
  height = 72,
  displayValue = true,
  className = '',
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    el.innerHTML = ''
    const text = value.trim()
    if (!text) return
    try {
      JsBarcode(el, text, {
        format: 'CODE128',
        width: 2,
        height,
        displayValue,
        fontSize: 14,
        margin: 12,
        background: '#ffffff',
        lineColor: '#000000',
      })
    } catch {
      /* invalid charset for Code128 */
    }
  }, [value, height, displayValue])

  if (!value.trim()) {
    return (
      <p className="text-sm text-slate-500">Chưa có mã để tạo barcode.</p>
    )
  }

  return (
    <svg
      ref={svgRef}
      role="img"
      aria-label={`Barcode Code 128: ${value}`}
      className={`max-w-full bg-white rounded-lg ${className}`}
    />
  )
}
