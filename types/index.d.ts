export type Breed = 'tuxedo' | 'calico' | 'orange' | 'black' | 'white' | 'sphynx'
export type Mode = 'walk' | 'play' | 'meow' | 'eat' | 'sleep'
export type CatState = {
  frame: number
  mode: Mode
  x: number
  dir: 1 | -1
  exp: number
  breed: Breed
  name: string
  isWorking: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'cat-progression': { cat: CatState }
  }
}
