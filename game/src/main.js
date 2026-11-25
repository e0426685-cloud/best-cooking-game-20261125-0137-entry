// Bootstrap and main loop for Sizzle & Serve.
// Wires the canvas, input and the game together: a requestAnimationFrame
// loop advances the shift while it is playing and redraws every frame. In
// screenshot mode (?shot=...) the loop renders one staged scene and stops
// advancing the clock so the picture is stable.

import { freshState, update, startShift, dispatchIngredient, clickStationSlot, servePlate } from './game.js';
import { render } from './render.js';
import { handleClick, handleKey } from './input.js';
import { stagedState, shotFromUrl } from './shots.js';
import { STAGE_W, STAGE_H } from './layout.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const shot = shotFromUrl();
const state = shot ? stagedState(shot.shot, shot.seed) : freshState();

function announce() {
  if (!statusEl) return;
  const phase = state.phase === 'playing'
    ? `Playing. ${Math.ceil(state.timeLeft)} seconds left, score ${state.score}, ${state.orders.length} orders.`
    : state.phase === 'title'
      ? 'Sizzle and Serve. Press Enter to start your shift.'
      : state.phase === 'paused'
        ? 'Paused.'
        : `Shift over. Score ${state.score}, ${state.served} orders served.`;
  if (statusEl.textContent !== phase) statusEl.textContent = phase;
}

function frame(now) {
  if (!frame.last) frame.last = now;
  const dt = Math.min(0.1, (now - frame.last) / 1000);
  frame.last = now;
  if (!shot) update(state, dt);
  render(ctx, state);
  announce();
  requestAnimationFrame(frame);
}

canvas.addEventListener('click', (event) => {
  if (shot) return; // staged scenes are pictures, not playable
  handleClick(state, canvas, event.clientX, event.clientY);
});
window.addEventListener('keydown', (event) => {
  if (shot) return;
  handleKey(state, event);
});

// Keep the canvas crisp on high-density screens.
function fitCanvas() {
  const scale = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = STAGE_W * scale;
  canvas.height = STAGE_H * scale;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

render(ctx, state);
announce();
requestAnimationFrame(frame);

// Headless self-test hook: `?selftest=1` runs a scripted playthrough in the
// page and reports the result on window.__selftest for the maker to check.
if (new URLSearchParams(window.location.search).get('selftest') === '1') {
  window.__selftest = runSelfTest();
  document.title = `SELFTEST ${JSON.stringify(window.__selftest)}`;
}

function runSelfTest() {
  const results = [];
  try {
    const s = freshState(7);
    startShift(s);
    results.push(['start', s.phase === 'playing']);
    // Order a Classic Burger: bun straight to plate, patty via grill,
    // lettuce via board. Force the first order to be a Classic Burger.
    s.orders = [{ id: 99, recipe: { id: 'classic', name: 'Classic Burger', items: ['bun', 'patty', 'lettuce'], reward: 12 }, patience: 40, maxPatience: 40, reward: 12 }];
    dispatchIngredient(s, 'bun');
    dispatchIngredient(s, 'patty');
    dispatchIngredient(s, 'lettuce');
    results.push(['dispatch', s.plate.length === 1 && s.stations.grill[0] && s.stations.board[0]]);
    for (let i = 0; i < 60; i++) update(s, 0.1); // 6s: everything cooked
    results.push(['cooked', s.stations.grill[0].ready && s.stations.board[0].ready]);
    clickStationSlot(s, 'grill', 0);
    clickStationSlot(s, 'board', 0);
    results.push(['plated', s.plate.length === 3]);
    servePlate(s);
    results.push(['served', s.served === 1 && s.score > 0 && !s.orders.find((o) => o.id === 99)]);
    // Wrong serve costs a heart.
    const hearts = s.hearts;
    dispatchIngredient(s, 'bun');
    servePlate(s);
    results.push(['wrong-serve', s.hearts === hearts - 1 && s.wrongServes === 1]);
    // Expiry costs a heart.
    s.orders = [{ id: 100, recipe: { id: 'melt', name: 'Cheese Melt', items: ['bun', 'patty', 'cheese', 'tomato'], reward: 18 }, patience: 0.5, maxPatience: 40, reward: 18 }];
    const h2 = s.hearts;
    for (let i = 0; i < 20; i++) update(s, 0.1);
    results.push(['expiry', s.missed === 1 && s.hearts === h2 - 1]);
    // Burnt patty: grill a patty and leave it.
    dispatchIngredient(s, 'patty');
    for (let i = 0; i < 120; i++) update(s, 0.1);
    results.push(['burnt', s.stations.grill[0] && s.stations.grill[0].burnt === true]);
  } catch (err) {
    results.push(['error', false, String(err && err.message)]);
  }
  const passed = results.filter((r) => r[1]).length;
  return { passed, total: results.length, results };
}
