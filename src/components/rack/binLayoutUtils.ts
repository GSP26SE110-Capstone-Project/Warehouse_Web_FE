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
