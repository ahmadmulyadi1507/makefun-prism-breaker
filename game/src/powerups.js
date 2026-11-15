// Falling power-up capsules. The world spawns one when a brick breaks; it
// drifts down, wobbles side to side, and applies its effect when the paddle
// catches it. Every effect is a timed state on the paddle or the balls.
import { POWERUP_COLORS, POWERUP_TYPES, POWERUP_WEIGHTS, RULES } from './config.js';
import { randomPick } from './random.js';

export function rollPowerupType(random) {
  const bag = [];
  for (const type of POWERUP_TYPES) {
    for (let i = 0; i < POWERUP_WEIGHTS[type]; i += 1) bag.push(type);
  }
  return randomPick(random, bag);
}

export function spawnPowerup(powerups, x, y, type) {
  powerups.push({
    x,
    y,
    vy: RULES.powerupFallSpeed,
    type,
    color: POWERUP_COLORS[type],
    phase: Math.random() * Math.PI * 2,
    active: true,
  });
}

/** Move all power-ups; returns the ones that fell past the paddle. */
export function stepPowerups(powerups, dt, fieldHeight) {
  const lost = [];
  for (const item of powerups) {
    if (!item.active) continue;
    item.phase += dt * 3;
    item.y += item.vy * dt;
    item.x += Math.sin(item.phase) * 26 * dt;
    if (item.y - 12 > fieldHeight) {
      item.active = false;
      lost.push(item);
    }
  }
  return lost;
}

/** Apply a caught power-up to the world state; returns a label for the HUD. */
export function applyPowerup(world, type) {
  const paddle = world.paddle;
  const now = world.time;
  switch (type) {
    case 'W':
      paddle.wideUntil = now + RULES.wideSeconds;
      paddle.width = paddle.wideWidth;
      return 'WIDE PADDLE!';
    case 'M': {
      const copies = [];
      for (const ball of world.balls) {
        if (world.balls.length + copies.length >= RULES.maxBalls) break;
        for (const angle of [-0.45, 0.45]) {
          const speed = Math.hypot(ball.vx, ball.vy);
          const base = Math.atan2(ball.vy, ball.vx) + angle;
          copies.push({
            x: ball.x,
            y: ball.y,
            vx: Math.cos(base) * speed,
            vy: Math.sin(base) * speed,
            r: ball.r,
            stuck: false,
            slowUntil: ball.slowUntil,
            fireUntil: ball.fireUntil,
            lastFireHit: null,
            lastFireTime: 0,
            trail: [],
          });
        }
      }
      world.balls.push(...copies);
      return 'MULTI BALL!';
    }
    case 'L':
      paddle.laserUntil = now + RULES.laserSeconds;
      return 'LASER CANNONS!';
    case 'S':
      for (const ball of world.balls) ball.slowUntil = now + RULES.slowSeconds;
      return 'SLOW BALL!';
    case 'G':
      paddle.stickyUntil = now + RULES.stickySeconds;
      return 'STICKY PADDLE!';
    case 'F':
      for (const ball of world.balls) ball.fireUntil = now + RULES.fireSeconds;
      return 'FIREBALL!';
    case '+':
      world.lives += 1;
      return 'EXTRA LIFE!';
    default:
      return '';
  }
}
