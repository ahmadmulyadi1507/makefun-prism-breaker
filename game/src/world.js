// Prism Breaker: the whole game state and its rules. World owns the paddle,
// the balls, the bricks, the power-ups, the laser bolts, the particles and
// the score, and steps them forward one fixed tick at a time. Rendering and
// sound live elsewhere: step() returns the events of the tick (impacts,
// breaks, catches, clears) and main.js turns them into sounds.
import { BALL, FIELD, LEVELS, PADDLE, RULES, SCREEN, SECTOR_NAMES } from './config.js';
import { brickColor, buildSector, breakableLeft, neighbours, BRICK_TYPES } from './bricks.js';
import { applyPowerup, rollPowerupType, spawnPowerup, stepPowerups } from './powerups.js';
import { ParticleSystem } from './particles.js';
import { mulberry32 } from './random.js';

const STEP = 1 / 120;
const TAU = Math.PI * 2;

export class World {
  constructor(seed) {
    this.random = mulberry32(seed >>> 0 || 1);
    this.particles = new ParticleSystem();
    this.events = [];
    this.high = 0;
    try {
      this.high = Number(window.localStorage.getItem('prism-breaker-high') || 0) || 0;
    } catch {
      this.high = 0;
    }
    this.reset();
  }

  reset() {
    this.screen = SCREEN.TITLE;
    this.level = 1;
    this.score = 0;
    this.lives = RULES.startLives;
    this.streak = 0;
    this.comboTimer = 0;
    this.time = 0;
    this.levelClearTimer = 0;
    this.levelBonus = 0;
    this.lastPowerupLabel = '';
    this.labelTimer = 0;
    this.attract = true;
    this.bricks = buildSector(1, this.random);
    this.powerups = [];
    this.bolts = [];
    this.balls = [this.freshBall()];
    this.paddle = {
      x: (FIELD.width - PADDLE.width) / 2,
      y: PADDLE.y,
      width: PADDLE.width,
      wideWidth: PADDLE.wideWidth,
      laserUntil: 0,
      stickyUntil: 0,
      wideUntil: 0,
      laserCooldown: 0,
    };
    this.particles.clear();
  }

  freshBall() {
    return {
      x: FIELD.width / 2,
      y: PADDLE.y - BALL.radius - 2,
      vx: 0,
      vy: 0,
      r: BALL.radius,
      stuck: true,
      slowUntil: 0,
      fireUntil: 0,
      lastFireHit: null,
      lastFireTime: 0,
      trail: [],
    };
  }

  ballSpeed() {
    const base = Math.min(BALL.maxSpeed, BALL.baseSpeed + (this.level - 1) * BALL.speedPerLevel);
    return base;
  }

  startGame() {
    this.score = 0;
    this.lives = RULES.startLives;
    this.streak = 0;
    this.comboTimer = 0;
    this.level = 1;
    this.attract = false;
    this.loadLevel(1);
    this.screen = SCREEN.SERVE;
  }

  loadLevel(level) {
    this.level = level;
    this.bricks = buildSector(level, this.random);
    this.powerups = [];
    this.bolts = [];
    this.balls = [this.freshBall()];
    this.paddle.x = (FIELD.width - this.paddle.width) / 2;
    this.paddle.width = PADDLE.width;
    this.paddle.laserUntil = 0;
    this.paddle.stickyUntil = 0;
    this.paddle.wideUntil = 0;
    this.paddle.laserCooldown = 0;
    this.particles.clear();
  }

  serveBall() {
    const ball = this.balls[0];
    if (!ball) return;
    ball.stuck = false;
    const angle = (this.random() - 0.5) * 0.5;
    const speed = this.ballSpeed();
    ball.vx = Math.sin(angle) * speed;
    ball.vy = -Math.cos(angle) * speed;
    this.events.push({ type: 'launch' });
  }

  saveHigh() {
    if (this.score > this.high) {
      this.high = this.score;
      try {
        window.localStorage.setItem('prism-breaker-high', String(this.high));
      } catch {
        // High score is decoration; a failure must never break the game.
      }
    }
  }

  multiplier() {
    return Math.min(RULES.comboMax, 1 + this.streak * RULES.comboStep);
  }

  addScore(base, x, y) {
    const points = Math.round((base * this.multiplier()) / 10) * 10;
    this.score += points;
    this.particles.floatText(x, y, `+${points}`, '#ffe14d', false);
    return points;
  }

  destroyBrick(brick, chained) {
    if (!brick.alive) return;
    brick.alive = false;
    brick.flash = 0;
    const cx = brick.x + brick.w / 2;
    const cy = brick.y + brick.h / 2;
    const color = brickColor(brick, this.level);
    this.particles.burst(cx, cy, color, brick.type === BRICK_TYPES.BOMB ? 26 : 14, 300);
    this.particles.addShake(brick.type === BRICK_TYPES.BOMB ? 6 : 2.5);
    if (brick.type === BRICK_TYPES.BOMB) {
      this.events.push({ type: 'bomb', x: cx, y: cy });
      for (const near of neighbours(this.bricks, brick)) {
        if (near.type === BRICK_TYPES.STEEL) continue;
        this.destroyBrick(near, true);
      }
    } else {
      this.events.push({ type: 'brickBreak', x: cx, y: cy });
    }
    if (brick.type !== BRICK_TYPES.STEEL) {
      this.streak += 1;
      this.comboTimer = RULES.comboWindow;
      this.addScore(RULES.brickScore * Math.max(1, brick.maxHp === Infinity ? 1 : brick.maxHp), cx, cy);
      if (!chained && this.random() < RULES.powerupDropChance) {
        spawnPowerup(this.powerups, cx, cy, rollPowerupType(this.random));
      }
    }
  }

  damageBrick(brick, ball) {
    if (!brick.alive) return;
    if (brick.type === BRICK_TYPES.STEEL) {
      brick.flash = 0.18;
      this.events.push({ type: 'brickHit', x: brick.x + brick.w / 2, y: brick.y + brick.h / 2, hp: 0 });
      return;
    }
    brick.hp -= 1;
    brick.flash = 0.18;
    if (brick.hp <= 0) {
      this.destroyBrick(brick, false);
    } else {
      this.events.push({ type: 'brickHit', x: brick.x + brick.w / 2, y: brick.y + brick.h / 2, hp: brick.hp });
      this.particles.burst(brick.x + brick.w / 2, brick.y + brick.h / 2, brickColor(brick, this.level), 5, 180);
    }
  }

  movePaddle(dt, drive) {
    const paddle = this.paddle;
    if (drive.targetX !== null && drive.targetX !== undefined) {
      const target = Math.max(0, Math.min(FIELD.width - paddle.width, drive.targetX - paddle.width / 2));
      const delta = target - paddle.x;
      const maxStep = PADDLE.speed * 1.7 * dt;
      paddle.x += Math.max(-maxStep, Math.min(maxStep, delta));
    } else if (drive.axis !== 0) {
      paddle.x += drive.axis * PADDLE.speed * dt;
    }
    paddle.x = Math.max(0, Math.min(FIELD.width - paddle.width, paddle.x));
    if (this.time > paddle.wideUntil && paddle.width !== PADDLE.width) paddle.width = PADDLE.width;
    for (const ball of this.balls) {
      if (ball.stuck) {
        ball.x = paddle.x + paddle.width / 2;
        ball.y = PADDLE.y - ball.r - 2;
      }
    }
  }

  fireLaser() {
    const paddle = this.paddle;
    if (this.time < paddle.laserUntil && this.time >= paddle.laserCooldown) {
      paddle.laserCooldown = this.time + RULES.laserCooldown;
      for (const offset of [14, paddle.width - 14]) {
        this.bolts.push({ x: paddle.x + offset, y: PADDLE.y - 8, vy: -RULES.boltSpeed, active: true });
      }
      this.events.push({ type: 'laser' });
    }
  }

  stepBall(ball, dt) {
    const prevX = ball.x;
    const prevY = ball.y;
    const slow = this.time < ball.slowUntil ? 0.6 : 1;
    ball.x += ball.vx * slow * dt;
    ball.y += ball.vy * slow * dt;
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 10) ball.trail.shift();

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
      this.events.push({ type: 'wall' });
    } else if (ball.x + ball.r > FIELD.width) {
      ball.x = FIELD.width - ball.r;
      ball.vx = -Math.abs(ball.vx);
      this.events.push({ type: 'wall' });
    }
    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
      this.events.push({ type: 'wall' });
    }
    if (ball.y - ball.r > FIELD.height) return 'lost';

    const paddle = this.paddle;
    const sticky = this.time < paddle.stickyUntil;
    if (ball.vy > 0 && ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + PADDLE.height + 10
      && ball.x >= paddle.x - ball.r && ball.x <= paddle.x + paddle.width + ball.r) {
      if (sticky && !ball.fireUntil) {
        ball.stuck = true;
        ball.vx = 0;
        ball.vy = 0;
        ball.y = PADDLE.y - ball.r - 2;
        this.events.push({ type: 'paddle' });
        return 'stuck';
      }
      const offset = Math.max(-1, Math.min(1, (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2)));
      const angle = offset * 1.15;
      const speed = this.ballSpeed();
      ball.vx = Math.sin(angle) * speed;
      ball.vy = -Math.cos(angle) * speed;
      ball.y = paddle.y - ball.r - 1;
      this.streak = 0;
      this.events.push({ type: 'paddle', x: ball.x, y: paddle.y });
      this.particles.puff(ball.x, paddle.y, '#38e1ff');
    }

    const fire = this.time < ball.fireUntil;
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.w));
      const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.h));
      const dx = ball.x - closestX;
      const dy = ball.y - closestY;
      if (dx * dx + dy * dy > ball.r * ball.r) continue;
      if (fire) {
        if (brick === ball.lastFireHit && this.time - ball.lastFireTime < 0.15) continue;
        ball.lastFireHit = brick;
        ball.lastFireTime = this.time;
        this.damageBrick(brick, ball);
        continue;
      }
      const wasAbove = prevY + ball.r <= brick.y;
      const wasBelow = prevY - ball.r >= brick.y + brick.h;
      const wasLeft = prevX + ball.r <= brick.x;
      const wasRight = prevX - ball.r >= brick.x + brick.w;
      if (wasAbove) {
        ball.vy = -Math.abs(ball.vy);
        ball.y = brick.y - ball.r - 0.5;
      } else if (wasBelow) {
        ball.vy = Math.abs(ball.vy);
        ball.y = brick.y + brick.h + ball.r + 0.5;
      } else if (wasLeft) {
        ball.vx = -Math.abs(ball.vx);
        ball.x = brick.x - ball.r - 0.5;
      } else if (wasRight) {
        ball.vx = Math.abs(ball.vx);
        ball.x = brick.x + brick.w + ball.r + 0.5;
      } else {
        const overlapX = Math.min(ball.x + ball.r - brick.x, brick.x + brick.w - (ball.x - ball.r));
        const overlapY = Math.min(ball.y + ball.r - brick.y, brick.y + brick.h - (ball.y - ball.r));
        if (overlapX < overlapY) {
          ball.vx = ball.x < brick.x + brick.w / 2 ? -Math.abs(ball.vx) : Math.abs(ball.vx);
        } else {
          ball.vy = ball.y < brick.y + brick.h / 2 ? -Math.abs(ball.vy) : Math.abs(ball.vy);
        }
      }
      const speed = Math.hypot(ball.vx, ball.vy) || 1;
      const target = this.ballSpeed();
      ball.vx = (ball.vx / speed) * target;
      ball.vy = (ball.vy / speed) * target;
      this.damageBrick(brick, ball);
      break;
    }
    return 'alive';
  }

  stepBolts(dt) {
    for (const bolt of this.bolts) {
      if (!bolt.active) continue;
      bolt.y += bolt.vy * dt;
      if (bolt.y < 0) {
        bolt.active = false;
        continue;
      }
      for (const brick of this.bricks) {
        if (!brick.alive) continue;
        if (bolt.x >= brick.x && bolt.x <= brick.x + brick.w && bolt.y >= brick.y && bolt.y <= brick.y + brick.h) {
          bolt.active = false;
          this.damageBrick(brick, null);
          break;
        }
      }
    }
    this.bolts = this.bolts.filter((b) => b.active);
  }

  stepBricks(dt) {
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      if (brick.flash > 0) brick.flash = Math.max(0, brick.flash - dt);
      if (brick.driftSpeed !== 0) {
        const range = brick.driftRange;
        brick.x = Math.max(8, Math.min(FIELD.width - brick.w - 8,
          brick.homeX + Math.sin(this.time * 0.9 + brick.phase) * range));
      }
    }
  }

  catchPowerups() {
    const paddle = this.paddle;
    for (const item of this.powerups) {
      if (!item.active) continue;
      if (item.y + 12 >= paddle.y && item.y - 12 <= paddle.y + PADDLE.height
        && item.x >= paddle.x - 8 && item.x <= paddle.x + paddle.width + 8) {
        item.active = false;
        const label = applyPowerup(this, item.type);
        this.lastPowerupLabel = label;
        this.labelTimer = 1.6;
        this.particles.floatText(item.x, paddle.y - 24, label, item.color, true);
        this.particles.burst(item.x, paddle.y, item.color, 12, 220);
        this.events.push({ type: 'powerup', label });
      }
    }
    this.powerups = this.powerups.filter((p) => p.active);
  }

  loseBall() {
    this.lives -= 1;
    this.streak = 0;
    this.events.push({ type: 'loseLife', lives: this.lives });
    this.particles.addShake(8);
    if (this.lives <= 0) {
      this.saveHigh();
      this.screen = SCREEN.GAME_OVER;
      this.events.push({ type: 'gameOver' });
    } else {
      this.powerups = [];
      this.bolts = [];
      this.balls = [this.freshBall()];
      this.screen = SCREEN.SERVE;
    }
  }

  checkLevelClear() {
    if (breakableLeft(this.bricks) === 0 && this.screen === SCREEN.PLAY) {
      this.levelBonus = RULES.levelClearBonus + this.lives * RULES.lifeBonus;
      this.score += this.levelBonus;
      this.screen = SCREEN.LEVEL_CLEAR;
      this.levelClearTimer = 2.4;
      this.events.push({ type: 'levelClear', bonus: this.levelBonus });
      this.saveHigh();
    }
  }

  advanceLevel() {
    if (this.level >= LEVELS.length) {
      this.saveHigh();
      this.screen = SCREEN.VICTORY;
      this.events.push({ type: 'victory' });
    } else {
      this.loadLevel(this.level + 1);
      this.screen = SCREEN.SERVE;
    }
  }

  /** One fixed tick. `drive` is { axis, targetX, action }. Returns the events. */
  step(dt, drive) {
    this.events = [];
    this.time += dt;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.streak = 0;
    }
    if (this.labelTimer > 0) this.labelTimer -= dt;
    this.particles.step(dt);
    this.stepBricks(dt);

    if (this.screen === SCREEN.TITLE) {
      this.stepAttract(dt);
      return this.events;
    }
    if (this.screen === SCREEN.PAUSED || this.screen === SCREEN.GAME_OVER || this.screen === SCREEN.VICTORY) {
      return this.events;
    }
    if (this.screen === SCREEN.LEVEL_CLEAR) {
      this.levelClearTimer -= dt;
      if (this.levelClearTimer <= 0) this.advanceLevel();
      return this.events;
    }

    this.movePaddle(dt, drive);
    if (this.screen === SCREEN.SERVE) {
      if (drive.action) {
        this.screen = SCREEN.PLAY;
        this.serveBall();
      }
      return this.events;
    }

    if (drive.action) this.fireLaser();
    stepPowerups(this.powerups, dt, FIELD.height);
    this.stepBolts(dt);
    this.catchPowerups();

    let lost = 0;
    for (const ball of this.balls) {
      if (ball.stuck) {
        if (drive.action) {
          ball.stuck = false;
          const angle = (this.random() - 0.5) * 0.5;
          const speed = this.ballSpeed();
          ball.vx = Math.sin(angle) * speed;
          ball.vy = -Math.cos(angle) * speed;
          this.events.push({ type: 'launch' });
        }
        continue;
      }
      const result = this.stepBall(ball, dt);
      if (result === 'lost') lost += 1;
    }
    this.balls = this.balls.filter((b) => !(b.y - b.r > FIELD.height));
    if (this.balls.length === 0) {
      this.loseBall();
      return this.events;
    }
    this.checkLevelClear();
    return this.events;
  }

  /** The title screen's demo: a ball bounces forever, chased by the paddle. */
  stepAttract(dt) {
    const ball = this.balls[0];
    if (!ball) return;
    ball.stuck = false;
    if (ball.vx === 0 && ball.vy === 0) {
      ball.vx = 240;
      ball.vy = -320;
    }
    const targetX = ball.x;
    this.movePaddle(dt, { axis: 0, targetX, action: false });
    const result = this.stepBall(ball, dt);
    if (result === 'lost' || result === 'stuck') {
      this.bricks = buildSector(1, this.random);
      this.balls = [this.freshBall()];
      const fresh = this.balls[0];
      fresh.stuck = false;
      fresh.vx = 240 + this.random() * 120;
      fresh.vy = -320;
      fresh.y = 480;
    }
    if (breakableLeft(this.bricks) === 0) this.bricks = buildSector(1, this.random);
  }

  get sectorName() {
    return SECTOR_NAMES[(this.level - 1) % SECTOR_NAMES.length];
  }

  get breakableTotal() {
    return this.bricks.filter((b) => b.type !== BRICK_TYPES.STEEL).length;
  }

  get breakableRemaining() {
    return breakableLeft(this.bricks);
  }
}

export { STEP };
