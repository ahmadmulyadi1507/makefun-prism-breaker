// Bricks and sector layouts. A sector is built from one of the patterns in
// config.js into brick objects the world moves, hits and destroys. Brick
// colours come from the sector palette by type and hit points.
import { FIELD, LEVELS, SECTOR_COLORS } from './config.js';
import { randomPick } from './random.js';

export const BRICK_TYPES = {
  NORMAL: 'normal',
  STEEL: 'steel',
  BOMB: 'bomb',
  DRIFT: 'drift',
  CORE: 'core',
};

const CHAR_TO_BRICK = {
  1: { type: BRICK_TYPES.NORMAL, hp: 1 },
  2: { type: BRICK_TYPES.NORMAL, hp: 2 },
  3: { type: BRICK_TYPES.NORMAL, hp: 3 },
  S: { type: BRICK_TYPES.STEEL, hp: Infinity },
  B: { type: BRICK_TYPES.BOMB, hp: 1 },
  D: { type: BRICK_TYPES.DRIFT, hp: 2 },
  C: { type: BRICK_TYPES.CORE, hp: 10 },
};

/** Colour of a brick: normal bricks shade by remaining hits, specials by type. */
export function brickColor(brick, sector) {
  const palette = SECTOR_COLORS[(sector - 1) % SECTOR_COLORS.length];
  if (brick.type === BRICK_TYPES.STEEL) return palette[3];
  if (brick.type === BRICK_TYPES.BOMB) return palette[4];
  if (brick.type === BRICK_TYPES.DRIFT) return palette[5];
  if (brick.type === BRICK_TYPES.CORE) return palette[6];
  return palette[Math.min(2, Math.max(0, brick.hp - 1))];
}

/** Build the bricks of a sector. `random` seeds drift directions. */
export function buildSector(sector, random) {
  const pattern = LEVELS[(sector - 1) % LEVELS.length];
  const bricks = [];
  const gridWidth = FIELD.brickCols * FIELD.brickWidth + (FIELD.brickCols - 1) * FIELD.brickGap;
  const originX = (FIELD.width - gridWidth) / 2;
  for (let row = 0; row < pattern.length; row += 1) {
    for (let col = 0; col < pattern[row].length; col += 1) {
      const spec = CHAR_TO_BRICK[pattern[row][col]];
      if (!spec) continue;
      const moving = spec.type === BRICK_TYPES.DRIFT || spec.type === BRICK_TYPES.CORE;
      bricks.push({
        x: originX + col * (FIELD.brickWidth + FIELD.brickGap),
        y: FIELD.top + row * (FIELD.brickHeight + FIELD.brickGap),
        w: FIELD.brickWidth,
        h: FIELD.brickHeight,
        hp: spec.hp,
        maxHp: spec.hp,
        type: spec.type,
        alive: true,
        homeX: originX + col * (FIELD.brickWidth + FIELD.brickGap),
        driftSpeed: moving ? randomPick(random, [-42, -30, 30, 42]) : 0,
        driftRange: spec.type === BRICK_TYPES.CORE ? 150 : 46,
        phase: random() * Math.PI * 2,
        flash: 0,
      });
    }
  }
  return bricks;
}

/** How many breakable bricks are still alive. */
export function breakableLeft(bricks) {
  let count = 0;
  for (const brick of bricks) {
    if (brick.alive && brick.type !== BRICK_TYPES.STEEL) count += 1;
  }
  return count;
}

/** The eight neighbours of a brick, for bomb chains. */
export function neighbours(bricks, target) {
  const out = [];
  for (const brick of bricks) {
    if (!brick.alive || brick === target) continue;
    const dx = Math.abs(brick.x + brick.w / 2 - (target.x + target.w / 2));
    const dy = Math.abs(brick.y + brick.h / 2 - (target.y + target.h / 2));
    if (dx < target.w + FIELD.brickGap + 2 && dy < target.h + FIELD.brickGap + 2) out.push(brick);
  }
  return out;
}
