// Seeded random numbers for Sizzle & Serve.
// The game uses Math.random during live play, but screenshot mode and the
// demo attract loop run on a fixed seed so a staged scene renders the same
// way every time. mulberry32 is small, fast and deterministic.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one element of an array with the given random function.
export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

// Integer in [min, max] inclusive.
export function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}
