# makefun-prism-breaker

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/ahmadmulyadi1507/makefun-prism-breaker/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/ahmadmulyadi1507/makefun-prism-breaker/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Prism Breaker — a neon breakout game for [best-game-01](https://make.fun/bounty/best-game-01), "Make the best game".

Smash the prism. Clear all 10 sectors. A glowing ball, a paddle of pure
light, and a wall of bricks that fights back: steel that never breaks, bombs
that burst their neighbours, drifting bricks that slide away, and a many-hit
Prism Core waiting in sector 10.

## How to play

- **Move:** mouse or ← → / A D
- **Launch / fire laser:** Space or click
- **Pause:** P — **Mute:** M — **Restart:** R
- **Catch the falling capsules:** Wide paddle, Multi ball, Laser cannons,
  Slow ball, Sticky paddle, Fireball, Extra life.
- **Win:** clear every breakable brick in all 10 sectors.
- **Lose:** let the last ball fall with no lives left.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The game is plain static files under `game/` — no build step, no network
requests, all art and sound generated in code. Screenshots in `screenshots/`
are real renders of the game in a browser (`?shot=title|play|victory|gameover`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=wwkc1ve8&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
