// Canvas renderer for Sizzle & Serve.
// Everything on screen is drawn, not loaded: the kitchen, the order board,
// the stations, the plate and every ingredient are vector shapes on one
// 1280x720 canvas. No images, no fonts from the network; the page uses the
// system font stack only.

import { STAGE_W, STAGE_H, BOARD, ticketRect, BINS, binRect, BIN_ORDER,
  GRILL, FRYER, BOARD_STATION, stationSlotRect, PLATE, SERVE_BTN, CLEAR_BTN,
  TRASH_HINT, MESSAGE_BAR, START_BTN, AGAIN_BTN, MUTE_BTN, PAUSE_BTN,
  plateItemRect } from './layout.js';
import { INGREDIENTS, PREP_TIME, BURN_AFTER } from './recipes.js';
import { SHIFT_SECONDS, MAX_HEARTS } from './game.js';

const CREAM = '#fff6e5';
const INK = '#3a2a1a';
const COUNTER = '#8a5a33';
const COUNTER_DARK = '#6e4525';
const STEEL = '#c9ced6';
const TILE = '#f7ead2';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align, weight) {
  ctx.fillStyle = color || INK;
  ctx.font = `${weight || 700} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// One ingredient drawn at (cx, cy) with radius r. All food art is drawn
// shapes: bun dome with sesame, patty slab, lettuce wave, tomato slice,
// cheese wedge, fries carton.
export function drawIngredient(ctx, id, cx, cy, r) {
  const ing = INGREDIENTS[id];
  ctx.save();
  ctx.translate(cx, cy);
  if (id === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    ctx.fillRect(-r, r * 0.1, r * 2, r * 0.28);
    ctx.fillStyle = '#fff2cf';
    for (const [dx, dy] of [[-0.45, -0.45], [0.1, -0.62], [0.5, -0.35], [-0.05, -0.3]]) {
      ctx.beginPath();
      ctx.ellipse(dx * r, dy * r, r * 0.14, r * 0.08, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = ing.color;
    rr(ctx, -r, -r * 0.45, r * 2, r * 0.9, r * 0.4);
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [dx, dy] of [[-0.5, 0], [0, -0.15], [0.5, 0.1]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rad = r * (i % 2 === 0 ? 1 : 0.72);
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad * 0.55;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, 0);
    ctx.lineTo(r * 0.7, 0);
    ctx.stroke();
  } else if (id === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a70';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd9d0';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.34, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.55);
    ctx.lineTo(r, r * 0.55);
    ctx.lineTo(0, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.dark;
    for (const [dx, dy] of [[-0.3, 0.15], [0.25, 0.25], [0, -0.25]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'fries') {
    ctx.fillStyle = '#d23b2e';
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.2);
    ctx.lineTo(r * 0.8, -r * 0.2);
    ctx.lineTo(r * 0.55, r * 0.9);
    ctx.lineTo(-r * 0.55, r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ing.color;
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.translate(i * r * 0.45, -r * 0.35);
      ctx.rotate(i * 0.12);
      ctx.fillRect(-r * 0.14, -r * 0.75, r * 0.28, r * 1.1);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawPatienceBar(ctx, x, y, w, frac) {
  ctx.fillStyle = '#e5d5bd';
  rr(ctx, x, y, w, 8, 4);
  ctx.fill();
  const color = frac > 0.5 ? '#58a34a' : frac > 0.25 ? '#e8a13a' : '#d23b2e';
  ctx.fillStyle = color;
  if (frac > 0.01) {
    rr(ctx, x, y, Math.max(8, w * frac), 8, 4);
    ctx.fill();
  }
}

function drawOrderTicket(ctx, order, i) {
  const rect = ticketRect(i);
  const frac = Math.max(0, order.patience / order.maxPatience);
  ctx.fillStyle = frac < 0.25 ? '#ffe3d6' : '#fffdf6';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = frac < 0.25 ? '#d23b2e' : '#d8c49a';
  ctx.lineWidth = frac < 0.25 ? 3 : 2;
  ctx.stroke();
  text(ctx, `#${order.id}  ${order.recipe.name}`, rect.x + 12, rect.y + 18, 17, INK, 'left', 800);
  text(ctx, `${order.reward} coins`, rect.x + rect.w - 12, rect.y + 18, 15, '#8a6d1f', 'right', 700);
  // Ingredient icons for the recipe.
  let ix = rect.x + 22;
  for (const id of order.recipe.items) {
    drawIngredient(ctx, id, ix, rect.y + 56, 15);
    ix += 34;
  }
  drawPatienceBar(ctx, rect.x + 12, rect.y + rect.h - 16, rect.w - 24, frac);
}

function drawStation(ctx, title, area, station, state) {
  ctx.fillStyle = station === 'board' ? '#c89b6a' : '#3c3f46';
  rr(ctx, area.x, area.y, area.w, area.h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, title, area.x + 12, area.y + 17, 15, '#fff', 'left', 800);
  for (let i = 0; i < 2; i++) {
    const slot = stationSlotRect(station, i);
    const item = state.stations[station][i];
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 8);
    ctx.fill();
    if (!item) {
      text(ctx, 'empty', slot.x + slot.w / 2, slot.y + slot.h / 2, 13, 'rgba(255,255,255,0.55)', 'center', 600);
      continue;
    }
    if (item.burnt) {
      drawIngredient(ctx, item.ingredient, slot.x + slot.w / 2, slot.y + slot.h / 2 - 8, 26);
      ctx.fillStyle = '#1c1c1c';
      ctx.globalAlpha = 0.55;
      rr(ctx, slot.x, slot.y, slot.w, slot.h, 8);
      ctx.fill();
      ctx.globalAlpha = 1;
      text(ctx, 'BURNT — click to bin', slot.x + slot.w / 2, slot.y + slot.h - 14, 12, '#fff', 'center', 800);
      continue;
    }
    const frac = Math.min(1, item.progress / PREP_TIME[station]);
    drawIngredient(ctx, item.ingredient, slot.x + slot.w / 2, slot.y + slot.h / 2 - 6, 26);
    const barW = slot.w - 20;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, slot.x + 10, slot.y + slot.h - 20, barW, 9, 4);
    ctx.fill();
    if (item.ready) {
      ctx.fillStyle = '#7dc242';
      rr(ctx, slot.x + 10, slot.y + slot.h - 20, barW, 9, 4);
      ctx.fill();
      text(ctx, 'READY — click to plate!', slot.x + slot.w / 2, slot.y + 14, 12, '#b9f29a', 'center', 800);
    } else {
      ctx.fillStyle = '#ffc93c';
      rr(ctx, slot.x + 10, slot.y + slot.h - 20, Math.max(9, barW * frac), 9, 4);
      ctx.fill();
      text(ctx, station === 'board' ? 'chopping…' : station === 'grill' ? 'grilling…' : 'frying…',
        slot.x + slot.w / 2, slot.y + 14, 12, '#ffe9b0', 'center', 700);
    }
  }
}

function drawBins(ctx, state) {
  text(ctx, 'INGREDIENTS — click (or press 1–6)', BINS.x, BINS.y - 12, 14, '#f3e2c2', 'left', 800);
  for (let i = 0; i < BIN_ORDER.length; i++) {
    const id = BIN_ORDER[i];
    const ing = INGREDIENTS[id];
    const rect = binRect(i);
    ctx.fillStyle = TILE;
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#d8c49a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, id, rect.x + rect.w / 2, rect.y + 32, 22);
    text(ctx, ing.name, rect.x + rect.w / 2, rect.y + 68, 14, INK, 'center', 700);
    text(ctx, `[${ing.key}]`, rect.x + rect.w / 2, rect.y + 84, 11, '#8a6d4a', 'center', 600);
  }
}

function drawPlate(ctx, state) {
  ctx.fillStyle = '#fffdf6';
  rr(ctx, PLATE.x, PLATE.y, PLATE.w, PLATE.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#d8c49a';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'YOUR PLATE — click to remove', PLATE.x + 14, PLATE.y + 20, 14, INK, 'left', 800);
  if (!state.plate.length) {
    text(ctx, 'Empty. Build a dish that matches an order!', PLATE.x + PLATE.w / 2, PLATE.y + 150, 14, '#a08a68', 'center', 600);
  }
  for (let i = 0; i < state.plate.length; i++) {
    const rect = plateItemRect(i);
    const id = state.plate[i];
    ctx.fillStyle = i % 2 === 0 ? '#f7ead2' : '#f3e2c2';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    drawIngredient(ctx, id, rect.x + 26, rect.y + rect.h / 2, 15);
    text(ctx, INGREDIENTS[id].name, rect.x + 52, rect.y + rect.h / 2, 15, INK, 'left', 700);
    text(ctx, '✕', rect.x + rect.w - 16, rect.y + rect.h / 2, 14, '#a08a68', 'center', 700);
  }
  // Serve button.
  ctx.fillStyle = state.plate.length ? '#58a34a' : '#9aa38f';
  rr(ctx, SERVE_BTN.x, SERVE_BTN.y, SERVE_BTN.w, SERVE_BTN.h, 12);
  ctx.fill();
  text(ctx, 'SERVE  [Space]', SERVE_BTN.x + SERVE_BTN.w / 2, SERVE_BTN.y + SERVE_BTN.h / 2 - 10, 24, '#fff', 'center', 800);
  text(ctx, 'match an order ticket', SERVE_BTN.x + SERVE_BTN.w / 2, SERVE_BTN.y + SERVE_BTN.h / 2 + 18, 13, '#eaf7e2', 'center', 600);
  // Clear button.
  ctx.fillStyle = '#f3e2c2';
  rr(ctx, CLEAR_BTN.x, CLEAR_BTN.y, CLEAR_BTN.w, CLEAR_BTN.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#d8c49a';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'Clear plate  [C]', CLEAR_BTN.x + CLEAR_BTN.w / 2, CLEAR_BTN.y + CLEAR_BTN.h / 2, 16, INK, 'center', 700);
  text(ctx, 'Burnt items: click them on the station to bin.', TRASH_HINT.x, TRASH_HINT.y + 14, 13, '#f3e2c2', 'left', 600);
}

function drawHud(ctx, state) {
  // Top bar.
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 0, STAGE_W, 64);
  text(ctx, '🍳 SIZZLE & SERVE', 16, 33, 26, '#ffd94d', 'left', 800);
  const urgent = state.timeLeft <= 30 && state.phase === 'playing';
  text(ctx, `⏱ ${formatTime(state.timeLeft)}`, STAGE_W / 2, 33, 26, urgent ? '#ff6b4a' : '#fff', 'center', 800);
  text(ctx, `★ ${state.score}`, 880, 33, 22, '#fff', 'left', 800);
  text(ctx, `♥`.repeat(state.hearts) + `♡`.repeat(MAX_HEARTS - state.hearts), 1000, 33, 22, '#ff6b6b', 'left', 800);
  text(ctx, state.muted ? '🔇' : '🔊', MUTE_BTN.x + 24, MUTE_BTN.y + 21, 20, '#fff', 'center', 700);
  text(ctx, state.phase === 'paused' ? '▶' : '⏸', PAUSE_BTN.x + 24, PAUSE_BTN.y + 21, 18, '#fff', 'center', 700);
  // Level + combo strip: its own dark band under the top bar.
  ctx.fillStyle = '#4a3220';
  ctx.fillRect(0, 64, STAGE_W, 22);
  text(ctx, `Level ${state.level}  •  Combo x${Math.min(2, 1 + 0.1 * state.combo).toFixed(1)}${state.combo > 1 ? ` — ${state.combo} in a row!` : ''}  •  Served ${state.served}  •  Missed ${state.missed}`,
    16, 75, 14, '#ffe9b0', 'left', 700);
  // Message bar.
  ctx.fillStyle = '#2e2118';
  rr(ctx, MESSAGE_BAR.x, MESSAGE_BAR.y, MESSAGE_BAR.w, MESSAGE_BAR.h, 8);
  ctx.fill();
  const msg = state.elapsed < state.messageUntil || state.phase !== 'playing' ? state.message : 'Tip: serve fast for a bigger tip — watch the patience bars!';
  text(ctx, msg, MESSAGE_BAR.x + 14, MESSAGE_BAR.y + 20, 15, '#ffe9b0', 'left', 600);
}

function drawKitchenBackdrop(ctx) {
  // Warm kitchen: tiled wall, back counter, floor.
  ctx.fillStyle = '#f2d8a7';
  ctx.fillRect(0, 64, STAGE_W, 600);
  ctx.fillStyle = '#e8c88f';
  for (let y = 64; y < 200; y += 34) {
    for (let x = (y % 68 === 0 ? 0 : 34); x < STAGE_W; x += 68) {
      ctx.fillRect(x, y, 66, 32);
    }
  }
  ctx.fillStyle = COUNTER;
  rr(ctx, 0, 190, STAGE_W, 370, 0);
  ctx.fill();
  ctx.fillStyle = COUNTER_DARK;
  ctx.fillRect(0, 190, STAGE_W, 10);
  ctx.fillStyle = '#7a4a2b';
  ctx.fillRect(0, 560, STAGE_W, 100);
}

function overlay(ctx, title, lines, buttonLabel, buttonRect) {
  ctx.fillStyle = 'rgba(30, 18, 8, 0.72)';
  ctx.fillRect(0, 0, STAGE_W, STAGE_H);
  ctx.fillStyle = CREAM;
  rr(ctx, 340, 130, 600, 440, 16);
  ctx.fill();
  ctx.strokeStyle = '#d8a13a';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, title, 640, 190, 40, INK, 'center', 800);
  let y = 250;
  for (const line of lines) {
    text(ctx, line, 640, y, 18, '#5a4632', 'center', 600);
    y += 32;
  }
  if (buttonLabel) {
    ctx.fillStyle = '#58a34a';
    rr(ctx, buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h, 12);
    ctx.fill();
    text(ctx, buttonLabel, buttonRect.x + buttonRect.w / 2, buttonRect.y + buttonRect.h / 2, 22, '#fff', 'center', 800);
  }
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, STAGE_W, STAGE_H);
  drawKitchenBackdrop(ctx);
  drawHud(ctx, state);
  // Order board.
  for (let i = 0; i < state.orders.length; i++) drawOrderTicket(ctx, state.orders[i], i);
  for (let i = state.orders.length; i < 4; i++) {
    const rect = ticketRect(i);
    ctx.fillStyle = 'rgba(255,253,246,0.35)';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    text(ctx, 'waiting for orders…', rect.x + rect.w / 2, rect.y + rect.h / 2, 14, 'rgba(90,70,50,0.7)', 'center', 600);
  }
  drawStation(ctx, '🔥 GRILL — patties', GRILL, 'grill', state);
  drawStation(ctx, '🍟 FRYER — fries', FRYER, 'fryer', state);
  drawStation(ctx, '🔪 CHOPPING BOARD', BOARD_STATION, 'board', state);
  drawBins(ctx, state);
  drawPlate(ctx, state);

  if (state.phase === 'title') {
    overlay(ctx, '🍳 SIZZLE & SERVE', [
      'You run the lunch rush. Orders land on the board —',
      'grill the patties, fry the fries, chop the veg,',
      'stack it on the plate and SERVE before patience runs out.',
      '',
      'Click ingredients (or keys 1–6). Space serves. C clears.',
      'Burnt food must be binned. Three lost hearts end the shift.',
      'Fast serves earn bigger tips and build your combo!',
    ], '▶  START SHIFT  [Enter]', START_BTN);
  } else if (state.phase === 'paused') {
    overlay(ctx, '⏸ PAUSED', ['Take a breath. The grill is holding.', '', 'Press P or click ▶ to keep cooking.'], null, null);
  } else if (state.phase === 'over') {
    const title = state.overReason === 'fired' ? '🔥 SHIFT OVER — FIRED!' : '🎉 SHIFT COMPLETE!';
    const lines = [
      state.overReason === 'fired'
        ? 'Too many orders walked out. The lunch rush won today.'
        : 'The lunch rush is done — the kitchen survived!',
      '',
      `Score: ${state.score} coins   •   Orders served: ${state.served}   •   Missed: ${state.missed}`,
      `Best combo: x${Math.min(2, 1 + 0.1 * state.bestCombo).toFixed(1)} (${state.bestCombo} serves in a row)`,
      `Stars: ${'★'.repeat(state.stars)}${'☆'.repeat(3 - state.stars)}`,
      '',
      'Tip: keep an eye on the red patience bars — serve fast!',
    ];
    overlay(ctx, title, lines, '↻  COOK AGAIN  [R]', AGAIN_BTN);
  }
}
