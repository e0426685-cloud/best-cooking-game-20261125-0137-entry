// Tiny synthesised sound effects for Sizzle & Serve.
// No audio files: every sound is an oscillator (or a short filtered noise
// burst) built with the Web Audio API. The context is created lazily on the
// first user gesture so the game stays silent until it is played, and every
// call is a no-op while muted or when audio is unavailable.

let ctx = null;
let muted = false;

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

function audioContext() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, duration, type, volume, slideTo) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
  gain.gain.setValueAtTime(volume || 0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

// Short burst of filtered noise: the grill sizzle and the fryer bubble.
function noiseBurst(duration, volume, filterFreq) {
  if (muted) return;
  const ac = audioContext();
  if (!ac) return;
  const now = ac.currentTime;
  const len = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq || 3200;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume || 0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(now);
}

export const sfx = {
  dispatch() { tone(520, 0.07, 'triangle', 0.08); },
  chop() { noiseBurst(0.08, 0.12, 1800); tone(180, 0.05, 'square', 0.05); },
  ready() { tone(880, 0.12, 'sine', 0.1); tone(1320, 0.14, 'sine', 0.07); },
  sizzle() { noiseBurst(0.5, 0.05, 4200); },
  plate() { tone(660, 0.08, 'triangle', 0.09); },
  serve() { tone(523, 0.1, 'sine', 0.12); tone(659, 0.1, 'sine', 0.12); tone(784, 0.18, 'sine', 0.12); },
  wrong() { tone(220, 0.22, 'sawtooth', 0.08, 140); },
  expire() { tone(330, 0.3, 'square', 0.06, 180); },
  burn() { noiseBurst(0.3, 0.1, 900); },
  start() { tone(392, 0.1, 'sine', 0.1); tone(523, 0.1, 'sine', 0.1); tone(659, 0.16, 'sine', 0.1); },
  over() { tone(392, 0.18, 'sine', 0.1); tone(330, 0.18, 'sine', 0.1); tone(262, 0.34, 'sine', 0.1); },
};
