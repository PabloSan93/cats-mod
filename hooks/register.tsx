import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Breed, CatState, Mode } from '../types'
import { GAIN, MAX_LEVEL, isGod, levelFor, progressIn } from './progress'
import { BREEDS, GOLD_TEXT, MAX_X, TRACK_COLS, TRACK_ROWS, pixels, toCells } from './sprites'

const cat = atom({ plugin: 'cat-progression', key: 'cat' } as const, {
  frame: 0,
  mode: 'walk',
  x: 0,
  dir: 1,
  exp: 0,
  breed: 'orange',
  name: '',
  isWorking: false,
} satisfies CatState as CatState)

const TICK_MS = 250
const IDLE_MODES: Mode[] = ['walk', 'walk', 'meow', 'eat', 'sleep', 'play']
const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)]

let untilSwitch = 20 // ticks until the next random idle animation

const MAX_NAME = 20

/** One line, no control characters, at most MAX_NAME characters. */
const cleanName = (raw: string): string =>
  raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME)

/** "Mochi · " in front of a description, or nothing for an unnamed cat. */
const prefix = (s: CatState): string => (s.name ? `${s.name} · ` : '')

const describe = (s: CatState): string => {
  if (isGod(s.exp)) return `${prefix(s)}God Cat (${s.breed}) · Lv ${MAX_LEVEL} · Chosen`
  const [have, need] = progressIn(s.exp)
  return `${prefix(s)}${s.breed} cat · Lv ${levelFor(s.exp)} · ${have}/${need} EXP`
}

/** The status line entry: "cat Arwen Lv 12", or "cat Lv 12" for an unnamed cat. */
const statusText = (s: CatState): string =>
  `cat ${s.name ? `${s.name} ` : ''}Lv ${levelFor(s.exp)}`

function save($: any, s: CatState) {
  return Promise.all([
    $.store.set('exp', s.exp),
    $.store.set('breed', s.breed),
    $.store.set('name', s.name ?? ''),
  ])
}

const gain = async ($: any, amount: number) => {
  let before = 0
  let after: CatState | undefined
  await update($, cat, s => {
    before = levelFor(s.exp)
    after = { ...s, exp: s.exp + amount }
    return after
  })
  if (!after) return
  const level = levelFor(after.exp)
  if (level > before) {
    $.ui.toast(
      level >= MAX_LEVEL
        ? `${after.name || 'Your cat'} ascended: GOD CAT!`
        : `${after.name || 'Your cat'} reached level ${level}!`,
    )
  }
  $.ui.status(statusText(after))
  await save($, after)
}

const tick = ($: any) =>
  update($, cat, s => {
    const frame = s.frame + 1
    let { mode, x, dir } = s
    if (s.isWorking) {
      mode = 'play'
      untilSwitch = 0
    } else if (--untilSwitch <= 0) {
      mode = pick(IDLE_MODES)
      untilSwitch = mode === 'sleep' ? 50 : 20 + Math.floor(Math.random() * 20)
    }
    if (mode === 'walk') {
      x += dir
      if (x >= MAX_X) dir = -1
      if (x <= 0) dir = 1
      x = Math.min(Math.max(x, 0), MAX_X)
    }
    return { ...s, frame, mode, x, dir }
  })
export const register: Register = on => {
  let stop: (() => void) | undefined

  on('session.start', async ($, e, next) => {
    const exp = Number((await $.store.get('exp')) ?? 0)
    const saved = await $.store.get('breed')
    const breed = (BREEDS as unknown[]).includes(saved) ? (saved as Breed) : pick(BREEDS)
    const name = cleanName(String((await $.store.get('name')) ?? ''))
    await update($, cat, s => ({ ...s, exp, breed, name }))
    await $.store.set('breed', breed)
    await $.command.register({
      name: 'cat',
      description: 'Show your cat, pick a breed (/cat tuxedo|calico|orange|black|white|sphynx) or rename it (/cat name <name>)',
    })
    stop?.()
    stop = $.clock.every(TICK_MS, () => void tick($))
    $.ui.status(statusText({ ...(await read($, cat)), exp, name }))
    return next(e)
  })

  on('command.run', { command: 'cat' }, async ($, e) => {
    const args = e.args.trim()
    const [word, ...rest] = args.split(/\s+/)
    if (word.toLowerCase() === 'name') {
      const name = cleanName(rest.join(' '))
      await update($, cat, s => ({ ...s, name }))
      await $.store.set('name', name)
      $.ui.status(statusText({ ...(await read($, cat)), name }))
      return { text: name ? `Your cat is now called ${name}.` : 'Your cat has no name now.' }
    }
    const want = args.toLowerCase()
    if (want) {
      if (!(BREEDS as string[]).includes(want)) {
        return {
          text: `Unknown breed "${want}". Choose: ${BREEDS.join(', ')}. Rename with /cat name <name>.`,
        }
      }
      await update($, cat, s => ({ ...s, breed: want as Breed }))
      await $.store.set('breed', want)
      return { text: `Your cat is now a ${want} cat.` }
    }
    const s = await read($, cat)
    return { text: `${describe(s)} (${s.exp} total EXP)` }
  })

  on('prompt.submit', async ($, e, next) => {
    await gain($, GAIN.prompt)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    await gain($, GAIN.tool)
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    await update($, cat, s => ({ ...s, isWorking: true, mode: 'play' }))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await update($, cat, s => ({ ...s, isWorking: false }))
    await gain($, GAIN.turn)
    return next(e)
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e) => {
    const s = await read($, cat)
    const { Box, Text, Raster } = $.ui.resolve(e)
    const god = isGod(s.exp)
    const cells = toCells(pixels(s.breed, s.mode, s.frame, god, s.x, s.dir))
    const info = describe(s)

    return (
      <Box key="cat" flexDirection="row">
        {e.props.modes.length > 0 && <Text dimColor>{e.props.modes.join(' & ')} </Text>}
        <Raster key="cat-pixels" columns={TRACK_COLS} rows={TRACK_ROWS} cells={cells} />
        <Box position="absolute" top={-1} right={0} display="none" hover={{ display: 'flex' }}>
          <Text color={god ? GOLD_TEXT : undefined} bold>
            {info}
          </Text>
        </Box>
      </Box>
    )
  })
}
