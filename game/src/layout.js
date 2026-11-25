// Shared kitchen geometry for Sizzle & Serve.
// One place owns every clickable rectangle so the renderer and the input
// handler can never disagree about where a button lives. The canvas is a
// fixed 1280x720 stage, scaled by CSS to fit the window.

export const STAGE_W = 1280;
export const STAGE_H = 720;

// Order board: four ticket slots across the top.
export const BOARD = { x: 16, y: 92, w: 1248, h: 104 };
export function ticketRect(i) {
  const gap = 12;
  const w = (BOARD.w - gap * 3) / 4;
  return { x: BOARD.x + i * (w + gap), y: BOARD.y, w, h: BOARD.h };
}

// Ingredient bins: six across the lower-left counter.
export const BINS = { x: 16, y: 560, w: 560, h: 96 };
export function binRect(i) {
  const gap = 8;
  const w = (BINS.w - gap * 5) / 6;
  return { x: BINS.x + i * (w + gap), y: BINS.y, w, h: BINS.h };
}
export const BIN_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'fries'];

// Stations: grill and fryer on the back counter, board in the middle.
export const GRILL = { x: 16, y: 210, w: 300, h: 150 };
export const FRYER = { x: 332, y: 210, w: 300, h: 150 };
export const BOARD_STATION = { x: 16, y: 380, w: 300, h: 150 };
export function stationSlotRect(station, index) {
  const area = station === 'grill' ? GRILL : station === 'fryer' ? FRYER : BOARD_STATION;
  const w = (area.w - 24) / 2;
  return { x: area.x + 8 + index * (w + 8), y: area.y + 34, w, h: area.h - 44 };
}

// Plate and serve controls on the right.
export const PLATE = { x: 660, y: 210, w: 300, h: 320 };
export const SERVE_BTN = { x: 980, y: 210, w: 284, h: 92 };
export const CLEAR_BTN = { x: 980, y: 316, w: 284, h: 56 };
export const TRASH_HINT = { x: 980, y: 386, w: 284, h: 40 };

// Bottom bar and title-screen buttons.
export const MESSAGE_BAR = { x: 16, y: 668, w: 1248, h: 40 };
export const START_BTN = { x: 490, y: 470, w: 300, h: 64 };
export const AGAIN_BTN = { x: 490, y: 496, w: 300, h: 64 };
export const MUTE_BTN = { x: 1216, y: 12, w: 48, h: 40 };
export const PAUSE_BTN = { x: 1156, y: 12, w: 48, h: 40 };

export function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Plate items are drawn as a vertical stack inside PLATE.
export function plateItemRect(i) {
  const rowH = 44;
  return { x: PLATE.x + 16, y: PLATE.y + 46 + i * rowH, w: PLATE.w - 32, h: 38 };
}
