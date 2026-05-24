import * as rackLevelsApi from '../../api/rackLevels'
import { RACK_FIXED_LEVEL_COUNT } from '../../data/rackStructure'

/** Đảm bảo rack có đủ 3 tầng (L1, L2, L3). */
export async function ensureRackLevels(rackId: string, maxBinsPerLevel: number) {
  const { items } = await rackLevelsApi.listRackLevels({ rackId, limit: 20 })
  const existing = new Set(items.map((l) => l.levelNumber))

  for (let n = 1; n <= RACK_FIXED_LEVEL_COUNT; n += 1) {
    if (existing.has(n)) continue
    await rackLevelsApi.createRackLevel({
      rackId,
      levelNumber: n,
      levelCode: `L${n}`,
      maxBins: maxBinsPerLevel,
    })
  }
}
