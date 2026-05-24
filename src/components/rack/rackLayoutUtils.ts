export function rowLabel(rowIndex: number): string {
  return String.fromCharCode(65 + rowIndex)
}

export function suggestRackCode(row: number, col: number): string {
  return `${rowLabel(row)}${col + 1}`
}

/** Mã dạng A1, A-01, B12 → vị trí lưới */
export function parseRackPosition(code: string): { row: number; col: number } | null {
  const trimmed = code.trim().toUpperCase()
  const m = trimmed.match(/^([A-Z])[- ]?(\d+)$/)
  if (m) {
    const row = m[1].charCodeAt(0) - 65
    const col = parseInt(m[2], 10) - 1
    if (row >= 0 && col >= 0) return { row, col }
  }
  return null
}

export type PlacedItem<T> = {
  item: T
  row: number
  col: number
}

export function layoutItemsInGrid<T>(
  items: T[],
  columns: number,
  getCode: (item: T) => string
): { rows: number; cols: number; cells: (T | null)[][] } {
  const cols = Math.max(4, columns)
  const placed = new Map<string, T>()
  const unplaced: T[] = []

  for (const item of items) {
    const pos = parseRackPosition(getCode(item))
    if (pos) placed.set(`${pos.row}-${pos.col}`, item)
    else unplaced.push(item)
  }

  unplaced.sort((a, b) => getCode(a).localeCompare(getCode(b), 'vi'))

  let r = 0
  let c = 0
  for (const item of unplaced) {
    while (placed.has(`${r}-${c}`)) {
      c += 1
      if (c >= cols) {
        c = 0
        r += 1
      }
    }
    placed.set(`${r}-${c}`, item)
    c += 1
    if (c >= cols) {
      c = 0
      r += 1
    }
  }

  let maxRow = items.length === 0 ? 2 : 0
  let maxCol = cols - 1
  for (const key of placed.keys()) {
    const [row, col] = key.split('-').map(Number)
    maxRow = Math.max(maxRow, row)
    maxCol = Math.max(maxCol, col)
  }

  const rows = Math.max(3, maxRow + 1)
  const gridCols = Math.max(cols, maxCol + 1)

  const cells: (T | null)[][] = []
  for (let row = 0; row < rows; row += 1) {
    const line: (T | null)[] = []
    for (let col = 0; col < gridCols; col += 1) {
      line.push(placed.get(`${row}-${col}`) ?? null)
    }
    cells.push(line)
  }

  return { rows, cols: gridCols, cells }
}
