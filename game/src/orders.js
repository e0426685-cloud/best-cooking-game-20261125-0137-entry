// Order board logic for Sizzle & Serve.
// Orders arrive on a timer, wait with a shrinking patience bar, and either
// get served for coins or expire and cost the cook a heart. The pace and the
// patience both tighten as the shift's level rises.

import { availableRecipes } from './recipes.js';
import { pick as pickRng } from './random.js';

let nextOrderId = 1;

export function resetOrderIds() {
  nextOrderId = 1;
}

export function spawnIntervalSeconds(level) {
  return Math.max(6, 12 - level);
}

export function patienceSeconds(level) {
  return Math.max(24, 46 - 5 * level);
}

export function maxConcurrentOrders(level) {
  return Math.min(4, 2 + level);
}

export function makeOrder(rng, level) {
  const recipe = pickRng(rng, availableRecipes(level));
  const patience = patienceSeconds(level);
  return {
    id: nextOrderId++,
    recipe,
    patience,
    maxPatience: patience,
    reward: recipe.reward,
    bornAt: 0,
  };
}

// Advance the board by dt seconds. Returns the orders that expired.
export function updateOrders(state, dt) {
  const expired = [];
  for (const order of state.orders) {
    order.patience -= dt;
    if (order.patience <= 0) expired.push(order);
  }
  if (expired.length) {
    state.orders = state.orders.filter((o) => o.patience > 0);
  }
  return expired;
}

// Try to spawn a new order when the timer allows it.
export function maybeSpawnOrder(state, dt) {
  state.spawnTimer -= dt;
  if (state.spawnTimer > 0) return null;
  if (state.orders.length >= maxConcurrentOrders(state.level)) {
    state.spawnTimer = 1.5;
    return null;
  }
  const order = makeOrder(state.rng, state.level);
  state.orders.push(order);
  state.spawnTimer = spawnIntervalSeconds(state.level);
  return order;
}
