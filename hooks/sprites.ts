import type { Breed, Mode } from '../types'

export const BREEDS: Breed[] = ['tuxedo', 'calico', 'orange', 'black', 'white', 'sphynx']
export const MODES: Mode[] = ['walk', 'play', 'meow', 'eat', 'sleep']

/** Sprite size in pixels. One terminal row = 2 pixel rows (half blocks). */
export const SPRITE_W = 12
export const SPRITE_H = 6
/** The Raster is a track the cat walks along: columns x terminal rows. */
export const TRACK_COLS = 24
export const TRACK_ROWS = SPRITE_H / 2
export const MAX_X = TRACK_COLS - SPRITE_W

const GOLD = 0xffd700
const GLOW = 0xfff3a0

type Grid = string[]

// Legend: B body, T tail, E eye, e closed eye, N nose, M open mouth,
// W white, Y ball, K bowl, F food, R heart, Z sleep particle, H halo, '.' empty.
// Rows shorter than SPRITE_W are padded with '.' on the right.
const put = (g: Grid, r: number, c: number, ch: string): Grid =>
  g.map((row, i) => (i === r ? row.slice(0, c) + ch + row.slice(c + 1) : row))

const walk = (t: number): Grid => [
  '.......B.B',
  t % 4 < 2 ? 'T......BEN' : '.......BEN',
  'TT.BBBBBBB',
  'T.BBBBBBB.',
  t % 2 === 0 ? '.B.B..B.B.' : '..B.B.B.B.',
  t % 2 === 0 ? '.B.B..B.B.' : '.B..B..B.B',
]

// Play: watch the ball, crouch, pounce, swat it up, look up, swat again.
const PLAY_STEPS = ['watch', 'bow', 'bow', 'swat', 'up', 'up', 'swat', 'watch'] as const
const BALL_ROWS = [5, 5, 5, 3, 1, 1, 3, 5]

const play = (t: number): Grid => {
  const step = t % 8
  const kind = PLAY_STEPS[step]
  const wag = step % 2 === 0
  let g: Grid
  if (kind === 'bow') {
    g = [
      '............',
      '............',
      wag ? 'T......B.B..' : '.......B.B..',
      'TT.BBBBBEN..',
      '.BBBBBBBB...',
      '.B.B..B.BBB.',
    ]
  } else {
    g = [
      '.......B.B..',
      (wag ? 'T......BE' : '.......BE') + (kind === 'up' ? 'M..' : 'N..'),
      'TT.BBBBBBB' + (kind === 'up' ? 'M' : 'B') + '.',
      'T.BBBBBBB...',
      kind === 'swat' ? '.B.B..B.BBB.' : '.B.B..B.B...',
      '.B.B..B.B...',
    ]
  }
  return put(g, BALL_ROWS[step], 11, 'Y')
}

const meow = (t: number): Grid => {
  const open = t % 4 < 3
  return [
    '.......B.B',
    open ? 'T......BEM' : 'T......BEN',
    open ? 'TT.BBBBBBM' : 'TT.BBBBBBB',
    open ? 'T.BBBBBBBM' : 'T.BBBBBBB.',
    '.B.B..B.B.',
    '.B.B..B.B.',
  ]
}

// Eat: sniff the bowl, dip the head and chew as the food shrinks,
// then sit up, lick and purr a little heart.
const EAT_FOOD = ['FFF', 'FFF', 'FFF', 'FF.', 'FF.', 'F..', '...', '...']
const EAT_STEPS = ['sit', 'dip', 'chew', 'dip', 'chew', 'dip', 'lick', 'happy'] as const

const eat = (t: number): Grid => {
  const step = t % 8
  const kind = EAT_STEPS[step]
  const food = EAT_FOOD[step]
  if (kind === 'sit' || kind === 'lick' || kind === 'happy') {
    const happy = kind !== 'sit'
    let g: Grid = [
      '.......B.B..',
      'T......B' + (happy ? 'e' : 'E') + (kind === 'lick' ? 'M' : 'N') + '..',
      'TT.BBBBBBB..',
      'T.BBBBBBB...',
      '.B.B..B.B' + food,
      '.B.B..B.BKKK',
    ]
    if (kind === 'happy') g = put(g, 0, step % 2 ? 10 : 11, 'R')
    return g
  }
  let g: Grid = [
    '............',
    '............',
    'T......B.B..',
    'TT.BBBBBE' + (kind === 'chew' ? 'N' : 'M') + '..',
    '.BBBBBBB.' + food,
    '.B.B..B.BKKK',
  ]
  if (kind === 'chew') g = put(g, 3, step % 4 === 0 ? 11 : 10, 'F')
  return g
}

const sleep = (t: number): Grid => [
  ['........Z.', '.........Z', '.......Z..', '........Z.'][t % 4],
  '..........',
  '.......B.B',
  '.BBBBBBBeN',
  'BBBBBBBBBB',
  'TTTTBBBBBB',
]

const poseOf = (mode: Mode, t: number): Grid => {
  switch (mode) {
    case 'walk': return walk(t)
    case 'play': return play(t)
    case 'meow': return meow(t)
    case 'eat': return eat(t)
    case 'sleep': return sleep(t)
  }
}

/** Colour of a legend char at (r, c) for a breed; null = transparent. */
const colorOf = (ch: string, r: number, c: number, breed: Breed): number | null => {
  switch (ch) {
    case '.': return null
    case 'E': return breed === 'black' ? 0xffe066 : breed === 'calico' ? 0x8fd1b0 : 0x57d36b
    case 'e': return 0x222222
    case 'N': return 0xff8fa3
    case 'M': return 0xc2185b
    case 'Y': return 0xe8453c
    case 'K': return 0x8a94a6
    case 'F': return 0xb5651d
    case 'R': return 0xff6b81
    case 'Z': return 0x9ecbff
    case 'W': return 0xffffff
  }
  // B or T: the coat.
  const tail = ch === 'T'
  switch (breed) {
    case 'orange': return 0xff9f2e
    case 'white': return 0xf7f7f7
    case 'black': return 0x3a3a48
    case 'sphynx': return tail || (r + c) % 4 === 0 ? 0xd9988f : 0xeab8ad
    case 'tuxedo': {
      const white =
        (r === 1 && c === 9) || (r >= 2 && r <= 3 && c >= 8) || (r === 5 && !tail)
      return white ? 0xf5f5f5 : 0x30303c
    }
    case 'calico': {
      // Like the photo: dark tabby head with an orange cheek, white chest and
      // paws, orange back with black patches, black tail.
      const BLACK = 0x2b2420
      const RUST = 0xc8641e
      const WHITE = 0xf6f3ee
      if (tail) return BLACK
      if (r <= 1) return r === 1 && c === 7 ? 0xd9742a : 0x4b3a33
      if (r >= 4) return c >= 6 ? WHITE : c <= 2 ? BLACK : RUST
      if (c >= 8) return WHITE
      if (r === 2) return c === 3 || c === 7 ? BLACK : RUST
      return c <= 4 ? (c === 4 ? RUST : BLACK) : c === 5 ? RUST : WHITE
    }
  }
}

// Tail swish: [row, col] pixels from the base (touching the body) to the tip.
const TAIL: [number, number][][] = [
  [[3, 1], [2, 0], [1, 0], [0, 1]], // curled forward
  [[3, 1], [2, 1], [1, 1], [0, 1]], // straight up
  [[3, 1], [2, 1], [1, 1], [1, 2]], // tip hooks toward the body
  [[3, 1], [2, 1], [1, 1], [0, 1]], // straight up
  [[3, 1], [2, 0], [1, 0], [0, 0]], // leaning back
  [[3, 1], [3, 0], [2, 0], [1, 0]], // low swish
]
const TAIL_ORDER = [0, 1, 2, 1, 0, 4, 5, 4]

/** Replace the grid's fixed tail with the swishing one (the sleeper's stays curled). */
const withTail = (g: Grid, mode: Mode, t: number): Grid => {
  if (mode === 'sleep') return g
  let out = g.map(row => row.replace(/T/g, '.'))
  const lowered = g[1] === '.'.repeat(SPRITE_W) // head down: body starts a pixel in
  const shape = TAIL[TAIL_ORDER[(mode === 'play' ? t * 2 : t) % TAIL_ORDER.length]]
  for (const [r, c] of shape) out = put(out, r, c + (lowered ? 1 : 0), 'T')
  return out
}

const HALO_ROW: Record<Mode, number> = { walk: 0, play: 0, meow: 0, eat: 1, sleep: 1 }

/** Pixel matrix (rows x TRACK_COLS) of the cat placed at pixel offset x. */
export const pixels = (
  breed: Breed,
  mode: Mode,
  frame: number,
  god: boolean,
  x: number,
  dir: 1 | -1,
): (number | null)[][] => {
  const t = Math.floor(frame / 2)
  let g = withTail(poseOf(mode, t).map(row => row.padEnd(SPRITE_W, '.')), mode, t)
  if (god) {
    // Halo floats in the empty pixels above the ears.
    const hr = HALO_ROW[mode]
    for (let c = 6; c < 10; c++) if (g[hr][c] === '.') g = put(g, hr, c, 'H')
    // Beard hangs from the chin.
    if (mode !== 'sleep' && mode !== 'eat') {
      for (const [r, c] of [[2, 9], [3, 9], [3, 8]]) {
        if (!'MY'.includes(g[r][c])) g = put(g, r, c, 'W')
      }
    }
  }
  const out = Array.from({ length: SPRITE_H }, () =>
    Array<number | null>(TRACK_COLS).fill(null),
  )
  const ox = Math.min(Math.max(Math.round(x), 0), MAX_X)
  for (let r = 0; r < SPRITE_H; r++) {
    for (let c = 0; c < SPRITE_W; c++) {
      const ch = g[r][c]
      const col = ch === 'H' ? (frame % 2 ? GOLD : GLOW) : colorOf(ch, r, c, breed)
      const dx = dir === 1 ? c : SPRITE_W - 1 - c
      out[r][ox + dx] = col
    }
  }
  return out
}

const DEFAULT = 0x01000000

/** Encode pixels as a Raster `cells` string: half blocks, 2 pixel rows per cell row. */
export const toCells = (px: (number | null)[][]): string => {
  const rows = px.length / 2
  const words = new Uint32Array(TRACK_COLS * rows * 3)
  let i = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < TRACK_COLS; c++) {
      const top = px[r * 2][c]
      const bottom = px[r * 2 + 1][c]
      let glyph = 0x20
      let fg = DEFAULT
      let bg = DEFAULT
      if (top !== null && bottom !== null) {
        glyph = 0x2580
        fg = top
        bg = bottom
      } else if (top !== null) {
        glyph = 0x2580
        fg = top
      } else if (bottom !== null) {
        glyph = 0x2584
        fg = bottom
      }
      words[i++] = glyph
      words[i++] = fg
      words[i++] = bg
    }
  }
  return base64(new Uint8Array(words.buffer))
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

const base64 = (bytes: Uint8Array): string => {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63]
    out += i + 1 < bytes.length ? ALPHABET[(n >> 6) & 63] : '='
    out += i + 2 < bytes.length ? ALPHABET[n & 63] : '='
  }
  return out
}

export const GOLD_TEXT = '#ffd700'
