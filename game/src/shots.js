// Deterministic screenshot staging for Sizzle & Serve.
// With ?shot=start|play|end&seed=N the game renders one fixed scene instead
// of live play, so the maker's screenshots are reproducible: the title
// screen, a busy mid-shift moment (orders on the board, a patty on the
// grill, veg mid-chop, a dish half-built on the plate, timer running), and
// the shift-complete summary. Nothing here touches live play.

import { freshState } from './game.js';
import { makeOrder } from './orders.js';
import { mulberry32 } from './random.js';

export function stagedState(shot, seed) {
  const rng = mulberry32(seed || 1);
  const state = freshState(seed || 1);
  state.rng = rng;
  state.shot = shot;

  if (shot === 'start') {
    state.phase = 'title';
    state.orders = [makeOrder(rng, 1), makeOrder(rng, 1), makeOrder(rng, 1)];
    state.orders[0].patience = state.orders[0].maxPatience * 0.9;
    state.orders[1].patience = state.orders[1].maxPatience * 0.6;
    state.orders[2].patience = state.orders[2].maxPatience * 0.8;
    state.message = 'Welcome to the kitchen! Click an ingredient to start.';
    return state;
  }

  if (shot === 'play') {
    state.phase = 'playing';
    state.elapsed = 78;
    state.timeLeft = 72;
    state.level = 2;
    state.score = 86;
    state.coins = 86;
    state.combo = 4;
    state.bestCombo = 4;
    state.served = 5;
    state.missed = 1;
    state.orders = [makeOrder(rng, 2), makeOrder(rng, 2), makeOrder(rng, 2)];
    // Force a readable mix: a burger, a melt and loaded fries.
    state.orders[0].recipe = { id: 'classic', name: 'Classic Burger', items: ['bun', 'patty', 'lettuce'], reward: 12 };
    state.orders[0].reward = 12;
    state.orders[1].recipe = { id: 'melt', name: 'Cheese Melt', items: ['bun', 'patty', 'cheese', 'tomato'], reward: 18 };
    state.orders[1].reward = 18;
    state.orders[2].recipe = { id: 'loaded', name: 'Loaded Fries', items: ['fries', 'cheese', 'tomato'], reward: 15 };
    state.orders[2].reward = 15;
    state.orders[0].patience = state.orders[0].maxPatience * 0.22; // nearly walking out
    state.orders[1].patience = state.orders[1].maxPatience * 0.65;
    state.orders[2].patience = state.orders[2].maxPatience * 0.85;
    // Grill: patty 60% cooked. Fryer: fries ready. Board: tomato mid-chop.
    state.stations.grill[0] = { ingredient: 'patty', progress: 2.4, ready: false, burnt: false, overTime: 0 };
    state.stations.fryer[0] = { ingredient: 'fries', progress: 5.0, ready: true, burnt: false, overTime: 1.2 };
    state.stations.board[0] = { ingredient: 'tomato', progress: 1.4, ready: false, burnt: false, overTime: 0 };
    // Plate mid-assembly: bun + patty + lettuce, one ingredient short of the Classic Burger.
    state.plate = ['bun', 'patty', 'lettuce'];
    state.message = 'Served Cheese Melt! +24 coins — combo x1.4';
    state.messageUntil = 9999;
    return state;
  }

  if (shot === 'end') {
    state.phase = 'over';
    state.overReason = 'complete';
    state.elapsed = 150;
    state.timeLeft = 0;
    state.level = 4;
    state.score = 214;
    state.coins = 214;
    state.combo = 0;
    state.bestCombo = 9;
    state.served = 11;
    state.missed = 2;
    state.wrongServes = 1;
    state.stars = 3;
    state.orders = [];
    state.message = 'The lunch rush is done — the kitchen survived!';
    return state;
  }

  return state;
}

// Read the shot parameters from the page URL. Returns null in live play.
export function shotFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (!shot || !['start', 'play', 'end'].includes(shot)) return null;
  const seed = Number.parseInt(params.get('seed') || '1', 10) || 1;
  return { shot, seed };
}
