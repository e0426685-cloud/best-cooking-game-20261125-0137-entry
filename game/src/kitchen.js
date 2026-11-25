// Kitchen stations for Sizzle & Serve.
// Three stations plus the plate: the grill (patties), the fryer (fries) and
// the chopping board (lettuce, tomato, cheese). Each station has two slots.
// An item cooks or chops over its prep time, sits ready for a while, then
// burns and must be binned. Buns skip the stations and go straight to the
// plate. Clicking a ready item moves it onto the plate.

import { INGREDIENTS, PREP_TIME, BURN_AFTER } from './recipes.js';

export function freshStations() {
  return {
    grill: [null, null],
    fryer: [null, null],
    board: [null, null],
  };
}

function slotCount() {
  return 2;
}

// Send an ingredient to its station. Returns 'ok', 'busy' (no free slot),
// or 'plate' (buns go straight to the plate and the caller handles that).
export function dispatchToStation(stations, ingredientId) {
  const ing = INGREDIENTS[ingredientId];
  if (!ing) return 'unknown';
  if (ing.station === 'plate') return 'plate';
  const slots = stations[ing.station];
  const limit = slotCount();
  for (let i = 0; i < limit; i++) {
    if (!slots[i]) {
      slots[i] = {
        ingredient: ingredientId,
        progress: 0,
        ready: false,
        burnt: false,
        overTime: 0,
      };
      return 'ok';
    }
  }
  return 'busy';
}

// Advance every cooking item by dt seconds. Returns a list of events:
// { type: 'ready'|'burnt', station, slot, ingredient }.
export function updateStations(stations, dt) {
  const events = [];
  for (const name of Object.keys(stations)) {
    const slots = stations[name];
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      if (!slot || slot.burnt) continue;
      if (!slot.ready) {
        slot.progress += dt;
        if (slot.progress >= PREP_TIME[name]) {
          slot.ready = true;
          slot.overTime = 0;
          events.push({ type: 'ready', station: name, slot: i, ingredient: slot.ingredient });
        }
      } else {
        slot.overTime += dt;
        if (slot.overTime >= BURN_AFTER[name]) {
          slot.burnt = true;
          events.push({ type: 'burnt', station: name, slot: i, ingredient: slot.ingredient });
        }
      }
    }
  }
  return events;
}

// Take a ready item off a station and onto the plate. Returns the
// ingredient id, or null when the slot is empty, still cooking or burnt.
export function takeFromStation(stations, station, index) {
  const slot = stations[station] && stations[station][index];
  if (!slot || !slot.ready || slot.burnt) return null;
  stations[station][index] = null;
  return slot.ingredient;
}

// Bin a burnt item (or clear a slot). Returns true when something was there.
export function clearStationSlot(stations, station, index) {
  const slot = stations[station] && stations[station][index];
  if (!slot) return false;
  stations[station][index] = null;
  return true;
}

// Is any station slot holding a burnt item?
export function anyBurnt(stations) {
  for (const name of Object.keys(stations)) {
    for (const slot of stations[name]) {
      if (slot && slot.burnt) return true;
    }
  }
  return false;
}
