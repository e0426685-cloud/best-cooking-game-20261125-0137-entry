// Mouse and keyboard input for Sizzle & Serve.
// Clicks are translated from page pixels into stage coordinates (the canvas
// is a fixed 1280x720 stage scaled by CSS), then routed by the shared
// layout rectangles. Keys 1-6 dispatch ingredients, Space serves, C clears
// the plate, P pauses, M mutes, Enter starts, R restarts.

import {
  STAGE_W, STAGE_H, BIN_ORDER, binRect, stationSlotRect, inside,
  SERVE_BTN, CLEAR_BTN, PLATE, plateItemRect, START_BTN, AGAIN_BTN,
  MUTE_BTN, PAUSE_BTN,
} from './layout.js';
import { INGREDIENTS } from './recipes.js';
import {
  dispatchIngredient, clickStationSlot, clickPlateItem, clearPlate,
  servePlate, startShift,
} from './game.js';
import { setMuted, isMuted } from './audio.js';

export function toStage(canvas, clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((clientX - r.left) / r.width) * STAGE_W,
    y: ((clientY - r.top) / r.height) * STAGE_H,
  };
}

export function handleClick(state, canvas, clientX, clientY) {
  const p = toStage(canvas, clientX, clientY);

  if (inside(MUTE_BTN, p.x, p.y)) {
    state.muted = !state.muted;
    setMuted(state.muted);
    return;
  }

  if (state.phase === 'title') {
    if (inside(START_BTN, p.x, p.y)) startShift(state);
    return;
  }
  if (state.phase === 'over') {
    if (inside(AGAIN_BTN, p.x, p.y)) startShift(state);
    return;
  }
  if (state.phase === 'paused') {
    if (inside(PAUSE_BTN, p.x, p.y)) state.phase = 'playing';
    return;
  }

  // Playing.
  if (inside(PAUSE_BTN, p.x, p.y)) {
    state.phase = 'paused';
    return;
  }
  if (inside(SERVE_BTN, p.x, p.y)) {
    servePlate(state);
    return;
  }
  if (inside(CLEAR_BTN, p.x, p.y)) {
    clearPlate(state);
    return;
  }
  for (let i = 0; i < BIN_ORDER.length; i++) {
    if (inside(binRect(i), p.x, p.y)) {
      dispatchIngredient(state, BIN_ORDER[i]);
      return;
    }
  }
  for (const station of ['grill', 'fryer', 'board']) {
    for (let i = 0; i < 2; i++) {
      if (inside(stationSlotRect(station, i), p.x, p.y)) {
        clickStationSlot(state, station, i);
        return;
      }
    }
  }
  for (let i = 0; i < state.plate.length; i++) {
    if (inside(plateItemRect(i), p.x, p.y)) {
      clickPlateItem(state, i);
      return;
    }
  }
  // Clicking the plate itself serves when it holds a dish.
  if (inside(PLATE, p.x, p.y) && state.plate.length) servePlate(state);
}

export function handleKey(state, event) {
  const key = event.key;
  if (key === 'm' || key === 'M') {
    state.muted = !state.muted;
    setMuted(state.muted);
    return;
  }
  if (state.phase === 'title' && (key === 'Enter' || key === ' ')) {
    event.preventDefault();
    startShift(state);
    return;
  }
  if (state.phase === 'over' && (key === 'Enter' || key === 'r' || key === 'R')) {
    startShift(state);
    return;
  }
  if (state.phase === 'paused' && (key === 'p' || key === 'P' || key === 'Escape')) {
    state.phase = 'playing';
    return;
  }
  if (state.phase !== 'playing') return;
  if (key === 'p' || key === 'P' || key === 'Escape') {
    state.phase = 'paused';
    return;
  }
  if (key === ' ') {
    event.preventDefault();
    servePlate(state);
    return;
  }
  if (key === 'c' || key === 'C' || key === 'Backspace' || key === 'Delete') {
    clearPlate(state);
    return;
  }
  for (const id of BIN_ORDER) {
    if (key === INGREDIENTS[id].key) {
      dispatchIngredient(state, id);
      return;
    }
  }
}

export function mutedNow() {
  return isMuted();
}
