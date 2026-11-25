// Core game state and rules for Sizzle & Serve.
// A shift lasts 150 seconds. Orders arrive, the cook prepares ingredients
// at the stations, assembles them on the plate and serves the matching
// order. Correct serves pay coins plus a speed tip and build a combo;
// wrong serves and expired orders cost a heart. Three hearts lost, or the
// clock running out, ends the shift.

import { INGREDIENTS, plateMatchesRecipe } from './recipes.js';
import { freshStations, dispatchToStation, takeFromStation, clearStationSlot, updateStations } from './kitchen.js';
import { updateOrders, maybeSpawnOrder, resetOrderIds } from './orders.js';
import { mulberry32 } from './random.js';
import { sfx } from './audio.js';

export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_PLATE = 5;

export function freshState(seed) {
  resetOrderIds();
  return {
    phase: 'title', // title | playing | paused | over
    seed: seed ?? (Date.now() % 2147483647),
    rng: mulberry32(seed ?? (Date.now() % 2147483647)),
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    level: 1,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    missed: 0,
    wrongServes: 0,
    hearts: MAX_HEARTS,
    orders: [],
    spawnTimer: 2.0,
    stations: freshStations(),
    plate: [],
    message: 'Welcome to the kitchen! Click an ingredient to start.',
    messageUntil: 0,
    overReason: '',
    stars: 0,
    muted: false,
    shot: null,
  };
}

export function startShift(state) {
  const keepSeed = state.seed;
  const fresh = freshState(keepSeed);
  fresh.phase = 'playing';
  fresh.message = 'Shift started! First order is on the board.';
  fresh.messageUntil = 4;
  Object.assign(state, fresh);
  state.rng = mulberry32(keepSeed ^ 0x9e3779b9);
  sfx.start();
}

export function levelFor(elapsed) {
  return 1 + Math.floor(elapsed / 45);
}

export function comboMultiplier(combo) {
  return Math.min(2, 1 + 0.1 * combo);
}

export function setMessage(state, text, seconds) {
  state.message = text;
  state.messageUntil = state.elapsed + (seconds || 3);
}

// Click an ingredient bin: route it to its station or straight to the plate.
export function dispatchIngredient(state, ingredientId) {
  if (state.phase !== 'playing') return;
  const ing = INGREDIENTS[ingredientId];
  if (!ing) return;
  if (ing.station === 'plate') {
    if (state.plate.length >= MAX_PLATE) {
      setMessage(state, 'The plate is full — serve it or clear it first!', 2.5);
      sfx.wrong();
      return;
    }
    state.plate.push(ingredientId);
    setMessage(state, `${ing.name} on the plate.`, 1.5);
    sfx.plate();
    return;
  }
  const result = dispatchToStation(state.stations, ingredientId);
  if (result === 'ok') {
    setMessage(state, `${ing.name} on the ${ing.station === 'grill' ? 'grill' : ing.station === 'fryer' ? 'fryer' : 'chopping board'}.`, 1.5);
    sfx.dispatch();
    if (ing.station === 'grill' || ing.station === 'fryer') sfx.sizzle();
  } else if (result === 'busy') {
    setMessage(state, `The ${ing.station} is full — wait for a slot.`, 2.5);
    sfx.wrong();
  }
}

// Click a station slot: collect a ready item onto the plate, or bin a burnt one.
export function clickStationSlot(state, station, index) {
  if (state.phase !== 'playing') return;
  const slot = state.stations[station][index];
  if (!slot) return;
  if (slot.burnt) {
    clearStationSlot(state.stations, station, index);
    setMessage(state, 'Burnt! Binned. Watch the timer next time.', 2.5);
    sfx.burn();
    return;
  }
  if (!slot.ready) {
    setMessage(state, 'Still cooking — wait for the READY glow.', 1.5);
    return;
  }
  if (state.plate.length >= MAX_PLATE) {
    setMessage(state, 'The plate is full — serve it or clear it first!', 2.5);
    sfx.wrong();
    return;
  }
  const ing = takeFromStation(state.stations, station, index);
  if (ing) {
    state.plate.push(ing);
    setMessage(state, `${INGREDIENTS[ing].name} plated.`, 1.5);
    sfx.plate();
  }
}

// Click a plate item to take it back off (fix a mistake before serving).
export function clickPlateItem(state, index) {
  if (state.phase !== 'playing') return;
  if (index < 0 || index >= state.plate.length) return;
  const removed = state.plate.splice(index, 1)[0];
  setMessage(state, `${INGREDIENTS[removed].name} taken off the plate.`, 1.5);
}

export function clearPlate(state) {
  if (state.phase !== 'playing') return;
  if (!state.plate.length) return;
  state.plate = [];
  setMessage(state, 'Plate cleared.', 1.5);
}

// Serve the plate. A match pays the order's reward plus a speed tip, scaled
// by the combo multiplier. A miss costs a heart and resets the combo.
export function servePlate(state) {
  if (state.phase !== 'playing') return;
  if (!state.plate.length) {
    setMessage(state, 'The plate is empty — build a dish first!', 2);
    return;
  }
  const match = state.orders.find((o) => plateMatchesRecipe(state.plate, o.recipe));
  if (!match) {
    state.wrongServes += 1;
    state.combo = 0;
    state.hearts -= 1;
    state.plate = [];
    setMessage(state, 'Wrong dish! No order wants that — one heart lost.', 3);
    sfx.wrong();
    if (state.hearts <= 0) endShift(state, 'fired');
    return;
  }
  const patienceFrac = Math.max(0, match.patience / match.maxPatience);
  const tip = Math.round(10 * patienceFrac);
  const mult = comboMultiplier(state.combo);
  const earned = Math.round((match.reward + tip) * mult);
  state.score += earned;
  state.coins += earned;
  state.served += 1;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.orders = state.orders.filter((o) => o.id !== match.id);
  state.plate = [];
  setMessage(
    state,
    `Served ${match.recipe.name}! +${earned} coins${state.combo > 1 ? ` — combo x${mult.toFixed(1)}` : ''}`,
    3,
  );
  sfx.serve();
}

function endShift(state, reason) {
  state.phase = 'over';
  state.overReason = reason;
  const target = 120;
  state.stars = state.score >= target * 1.5 ? 3 : state.score >= target ? 2 : state.score >= target / 2 ? 1 : 0;
  sfx.over();
}

export function update(state, dt) {
  if (state.phase !== 'playing') return;
  state.elapsed += dt;
  state.timeLeft = Math.max(0, SHIFT_SECONDS - state.elapsed);
  state.level = levelFor(state.elapsed);

  maybeSpawnOrder(state, dt);

  const expired = updateOrders(state, dt);
  for (const order of expired) {
    state.missed += 1;
    state.combo = 0;
    state.hearts -= 1;
    setMessage(state, `Order for ${order.recipe.name} walked out! One heart lost.`, 3);
    sfx.expire();
  }
  if (state.hearts <= 0) {
    endShift(state, 'fired');
    return;
  }

  const events = updateStations(state.stations, dt);
  for (const ev of events) {
    if (ev.type === 'ready') {
      setMessage(state, `${INGREDIENTS[ev.ingredient].name} is READY — click it to plate!`, 2);
      sfx.ready();
    } else if (ev.type === 'burnt') {
      setMessage(state, `The ${INGREDIENTS[ev.ingredient].name} burnt! Click it to bin it.`, 3);
      sfx.burn();
    }
  }

  if (state.timeLeft <= 0) endShift(state, 'complete');
}
