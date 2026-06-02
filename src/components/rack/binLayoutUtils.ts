import type { ApiBin } from '../../api/bins'

export type BinSlotToCreate = {
  rackLevelId: string
  levelNumber: number
  binCode: string
}

export function suggestBinCode(rackCode: string, levelNumber: number, colIndex: number): string {
  return `${rackCode}-L${levelNumber}-${colIndex + 1}`
}

/** Các ô bin trống trên một tầng (theo mã chuẩn RACK-L{n}-{slot}). */
export function listEmptyBinSlotsForLevel(
  rackCode: string,
  rackLevelId: string,
  levelNumber: number,
  existingBins: ApiBin[],
  binsPerLevel: number
): BinSlotToCreate[] {
  const existingCodes = new Set(existingBins.map((b) => b.binCode.toUpperCase()))
  const slots: BinSlotToCreate[] = []
  for (let c = 0; c < binsPerLevel; c += 1) {
    const binCode = suggestBinCode(rackCode, levelNumber, c)
    if (!existingCodes.has(binCode.toUpperCase())) {
      slots.push({ rackLevelId, levelNumber, binCode })
    }
  }
  return slots
}

/** Bin có thể xóa (không LPN, không volume, không tồn kho — backend kiểm tra lại). */
export function isBinDeletable(bin: ApiBin): boolean {
  return (bin.usedVolumeUnits ?? 0) === 0 && (bin.currentLpnCount ?? 0) === 0
}

export function listDeletableBinsForLevel(bins: ApiBin[]): ApiBin[] {
  return [...bins]
    .filter(isBinDeletable)
    .sort((a, b) => a.binCode.localeCompare(b.binCode, 'vi'))
}

/** Tất cả bin có thể xóa trên mọi tầng của rack. */
export function listDeletableBinsForRack(
  levels: { rackLevelId: string; levelNumber: number }[],
  binsByLevel: Record<string, ApiBin[]>
): ApiBin[] {
  return [...levels]
    .sort((a, b) => a.levelNumber - b.levelNumber)
    .flatMap((level) => listDeletableBinsForLevel(binsByLevel[level.rackLevelId] ?? []))
}

/** Tất cả ô bin trống trên mọi tầng của rack. */
export function listEmptyBinSlotsForRack(
  rackCode: string,
  levels: { rackLevelId: string; levelNumber: number }[],
  binsByLevel: Record<string, ApiBin[]>,
  binsPerLevel: number
): BinSlotToCreate[] {
  return [...levels]
    .sort((a, b) => a.levelNumber - b.levelNumber)
    .flatMap((level) =>
      listEmptyBinSlotsForLevel(
        rackCode,
        level.rackLevelId,
        level.levelNumber,
        binsByLevel[level.rackLevelId] ?? [],
        binsPerLevel
      )
    )
}
