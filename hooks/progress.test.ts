import { expect, test } from 'claude-code/testing'

import { MAX_LEVEL, expForLevel, isGod, levelFor } from './progress'
import { BREEDS, MODES, TRACK_COLS, TRACK_ROWS, pixels, toCells } from './sprites'

test('level curve', async () => {
  expect(levelFor(0)).toBe(1)
  expect(levelFor(expForLevel(50))).toBe(50)
  expect(levelFor(expForLevel(MAX_LEVEL) - 1)).toBe(MAX_LEVEL - 1)
  expect(levelFor(10_000_000)).toBe(MAX_LEVEL)
  expect(isGod(expForLevel(MAX_LEVEL))).toBe(true)
  expect(isGod(expForLevel(MAX_LEVEL) - 1)).toBe(false)
})

test('every pose renders a full track of cells', async () => {
  for (const b of BREEDS)
    for (const m of MODES)
      for (let f = 0; f < 8; f++)
        for (const god of [false, true])
          for (const dir of [1, -1] as const) {
            const px = pixels(b, m, f, god, 7, dir)
            expect(px.length).toBe(TRACK_ROWS * 2)
            for (const row of px) expect(row.length).toBe(TRACK_COLS)
            expect(px.flat().some(p => p !== null)).toBe(true)
            // 3 u32 per cell, base64 of 12 bytes per cell
            expect(toCells(px).length).toBe(Math.ceil((TRACK_COLS * TRACK_ROWS * 12) / 3) * 4)
          }
})
