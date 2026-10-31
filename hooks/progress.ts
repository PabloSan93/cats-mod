export const MAX_LEVEL = 100

/** Total EXP needed to reach `level` (level 1 = 0). Level 100 ≈ 29,550 EXP. */
export const expForLevel = (level: number): number =>
  level <= 1 ? 0 : Math.round(30 * Math.pow(level - 1, 1.5))

export const levelFor = (exp: number): number => {
  let level = 1
  while (level < MAX_LEVEL && exp >= expForLevel(level + 1)) level += 1
  return level
}

export const isGod = (exp: number): boolean => levelFor(exp) >= MAX_LEVEL

export const GAIN = { prompt: 10, tool: 2, turn: 5 } as const

/** Progress inside the current level: [have, need]. At max level: [0, 0]. */
export const progressIn = (exp: number): [number, number] => {
  const level = levelFor(exp)
  if (level >= MAX_LEVEL) return [0, 0]
  const base = expForLevel(level)
  return [exp - base, expForLevel(level + 1) - base]
}
