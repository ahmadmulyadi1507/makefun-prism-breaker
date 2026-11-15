// A tiny seeded random number generator (mulberry32) so the game and its
// screenshot scenes are deterministic for a given seed, while normal play
// seeds from the clock. Every roll the game makes goes through this module.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** An integer in [min, max] from the given random function. */
export function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}

/** Pick one element of an array with the given random function. */
export function randomPick(random, items) {
  return items[Math.floor(random() * items.length)];
}

/** Shuffle a copy of an array with the given random function. */
export function shuffled(random, items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}
