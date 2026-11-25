# 🍳 Sizzle & Serve

A lunch-rush cooking game — run the kitchen, serve the orders, don't get fired.

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## The game

You are the cook on a lunch shift. Orders land on the board with a patience
bar. Grill the patties, fry the fries, chop the veg, stack the dish on the
plate and **SERVE** before the customer walks out.

- **5 recipes** — Classic Burger, Cheese Melt, Garden Stack, Loaded Fries,
  Double Trouble — each a different combination of 6 ingredients.
- **3 stations** — grill (patties), fryer (fries), chopping board (lettuce,
  tomato, cheese). Food cooks over time, sits ready, then **burns** if you
  leave it — bin it and start over.
- **150-second shift** with a rising level: orders arrive faster and patience
  shrinks as the rush builds. Fast serves earn bigger tips and build a
  **combo multiplier** (up to ×2). Wrong dishes and expired orders cost one
  of 3 hearts — lose them all and you're fired.
- **Score, stars, best combo** on the shift summary, with instant restart.

## How to play

- Click an ingredient bin (or press **1–6**) to send it to its station.
  Buns go straight to the plate.
- Click a **READY** station item to plate it. Click a plate item to take it
  back off. **C** clears the plate.
- Click **SERVE** (or press **Space**) when the plate matches an order ticket
  exactly — any order of ingredients counts.
- **P** pauses, **M** mutes, **R** restarts after a shift ends.
- Sound effects are synthesised with the Web Audio API — no audio files.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `game/` is plain static files
(`index.html` + ES modules + one stylesheet) that run in any desktop browser.

## Screenshots

The three screenshots in `screenshots/` are real renders of this game's own
code, staged deterministically with `?shot=start|play|end&seed=1` (see
`game/src/shots.js` and `shots.json`): the title screen, a busy mid-shift
moment, and the shift-complete summary.

## Layout

| File | Job |
| --- | --- |
| `game/index.html` | Page shell, canvas, help line |
| `game/styles.css` | Page chrome, stage sizing |
| `game/src/main.js` | Bootstrap, game loop, self-test hook |
| `game/src/game.js` | Shift state, serving, scoring, combos |
| `game/src/recipes.js` | Ingredients, stations, recipes |
| `game/src/orders.js` | Order spawning, patience, difficulty ramp |
| `game/src/kitchen.js` | Grill / fryer / board slots, cooking, burning |
| `game/src/layout.js` | Shared stage geometry for render + input |
| `game/src/render.js` | All canvas drawing, food art, HUD |
| `game/src/input.js` | Mouse + keyboard handling |
| `game/src/audio.js` | Synthesised sound effects (Web Audio) |
| `game/src/random.js` | Seeded RNG for deterministic staging |
| `game/src/shots.js` | Deterministic screenshot scenes |
| `main.ts` | Hand-in program: copies `game/` + `screenshots/`, writes `dossier.json` |
| `vendor/makefun-game.ts` | Kit's dossier library, unchanged |
| `serve.ts` | Tiny static server for local play |

## Entry

Built for the make.fun competition
[`best-cooking-game-20261125-0137`](https://make.fun/c/best-cooking-game-20261125-0137)
("Make the best cooking game"). Original code, art, sounds and names —
no copied assets, no external requests at grade time.

License: MIT — see [LICENSE](LICENSE).
