# cat-progression

A Claude Code mod: a tiny pixel-art cat lives in the prompt footer, earns EXP every time you use Claude, and ascends to a God Cat at level 100.

## What it does

- **Six breeds:** tuxedo, calico, orange, black, white and sphynx. The breed is picked at random the first time and kept between sessions.
- **Animations:** walking, playing with a ball, meowing, eating and sleeping. While Claude is thinking the cat plays; otherwise it picks a random animation.
- **EXP:** +10 per prompt, +2 per tool call, +5 per finished turn. EXP is saved between sessions. Level 100 takes about 29,550 EXP.
- **Names:** give your cat a name with `/cat name <name>`. It shows on hover, in level-up messages and in the status line.
- **Status line:** the status line under the prompt shows `cat <name> Lv <level>` (just `cat Lv <level>` while the cat is unnamed).
- **Hover:** point at the cat to see its name, breed, level and EXP.
- **God Cat:** at level 100 the cat gets a shimmering gold halo and a white beard.

## Install

Type this at the prompt of a Claude Code terminal session, answer `y` to add the marketplace, then pick a scope:

```
/plugin install cat-progression --marketplace PabloSan93/cats-mod
```

## Commands

- `/cat` shows your cat's breed, level and EXP.
- `/cat <breed>` switches breed: `tuxedo`, `calico`, `orange`, `black`, `white` or `sphynx`.
- `/cat name <name>` names your cat (up to 20 characters); `/cat name` with nothing after it clears the name. The name shows on hover, in level-up messages and in the status line.

## Notes

The cat is drawn with half-block characters, so it needs a terminal with truecolor and a UI that supports the prompt footer (terminal and desktop). Hover needs mouse support.

## License

MIT, see [LICENSE](LICENSE).
