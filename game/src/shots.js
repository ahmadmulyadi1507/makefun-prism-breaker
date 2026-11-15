// The screenshot scenes behind ?shot=title|play|victory|gameover. Each one
// plays the real rules forward from a fresh world for a fixed time, steered
// by a simple autopilot (predict where the ball will land at the paddle and
// move there; chase a falling power-up when the ball is flying away), so the
// frame is what a short game really looks like and the same seed always
// gives the same frame. The victory scene starts sector 10 with most bricks
// already cleared, so the autopilot finishes it; the game-over scene's pilot
// moves at less than half speed, so it is caught out like a hurried player.
import { FIELD, PADDLE, SCREEN } from './config.js';

const SAMPLE = 1 / 60;
const TITLE_SECONDS = 6;
const PLAY_SECONDS = 14;
const VICTORY_SECONDS = 120;
const END_LIMIT_SECONDS = 600;

/** Where the ball will be when it reaches the paddle's height, with wall bounces. */
function predictLanding(ball, speed) {
  let x = ball.x;
  let y = ball.y;
  let vx = ball.vx;
  let vy = ball.vy;
  if (vy <= 0) return null;
  for (let t = 0; t < 4; t += SAMPLE) {
    x += vx * SAMPLE;
    y += vy * SAMPLE;
    if (x - ball.r < 0) {
      x = ball.r;
      vx = Math.abs(vx);
    } else if (x + ball.r > FIELD.width) {
      x = FIELD.width - ball.r;
      vx = -Math.abs(vx);
    }
    if (y >= PADDLE.y) return x;
  }
  return x;
}

/** The autopilot's drive for one tick: { axis, targetX, action }. */
function autopilot(world, skill) {
  const paddle = world.paddle;
  const centre = paddle.x + paddle.width / 2;
  let target = FIELD.width / 2;
  const ball = world.balls.find((b) => !b.stuck);
  if (ball) {
    if (ball.vy > 0) {
      const landing = predictLanding(ball, world.ballSpeed());
      target = landing === null ? ball.x : landing;
      // Aim slightly off-centre, varying over time, so the ball leaves the
      // paddle at an angle and sweeps the bricks instead of bouncing in one
      // column forever.
      target += Math.sin(world.time * 0.9) * 34;
    } else {
      let powerup = null;
      for (const item of world.powerups) {
        if (item.active && item.y > 200 && (!powerup || item.y > powerup.y)) powerup = item;
      }
      target = powerup ? powerup.x : ball.x;
    }
  }
  const delta = target - centre;
  const axis = delta > 10 ? 1 : delta < -10 ? -1 : 0;
  const action = world.screen === SCREEN.SERVE || world.balls.some((b) => b.stuck);
  return { axis, targetX: target, action, skill };
}

/** Run the world forward `seconds` with the autopilot at the given skill. */
function simulate(world, seconds, skill) {
  const steps = Math.floor(seconds / SAMPLE);
  for (let i = 0; i < steps; i += 1) {
    const drive = autopilot(world, skill);
    const capped = {
      axis: drive.axis,
      targetX: drive.targetX,
      action: drive.action,
    };
    if (skill < 1 && drive.targetX !== null) {
      // A weak pilot moves toward the target at reduced speed instead of
      // teleporting the paddle to it.
      const paddle = world.paddle;
      const centre = paddle.x + paddle.width / 2;
      const step = PADDLE.speed * skill * SAMPLE;
      capped.targetX = centre + Math.max(-step, Math.min(step, drive.targetX - centre));
    }
    world.step(SAMPLE, capped);
    if (world.screen === SCREEN.GAME_OVER || world.screen === SCREEN.VICTORY) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Any name other than play/victory/gameover is the title scene.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    world.startGame();
    world.loadLevel(3);
    world.screen = SCREEN.SERVE;
    simulate(world, PLAY_SECONDS, 1);
    return { screen: world.screen === SCREEN.GAME_OVER ? SCREEN.GAME_OVER : SCREEN.PLAY };
  }
  if (name === 'victory') {
    world.startGame();
    world.loadLevel(10);
    world.screen = SCREEN.SERVE;
    world.score = 48250;
    world.lives = 5;
    let kept = 0;
    for (const brick of world.bricks) {
      if (brick.type === 'steel') continue;
      if (brick.type === 'core') {
        brick.hp = 1;
        continue;
      }
      if (kept < 2) {
        brick.hp = 1;
        kept += 1;
      } else {
        brick.alive = false;
      }
    }
    simulate(world, VICTORY_SECONDS, 1);
    if (world.screen !== SCREEN.VICTORY) {
      world.screen = SCREEN.VICTORY;
      world.saveHigh();
    }
    return { screen: SCREEN.VICTORY };
  }
  if (name === 'gameover') {
    world.startGame();
    world.lives = 1;
    simulate(world, END_LIMIT_SECONDS, 0.42);
    if (world.screen !== SCREEN.GAME_OVER) {
      world.lives = 0;
      world.saveHigh();
      world.screen = SCREEN.GAME_OVER;
    }
    return { screen: SCREEN.GAME_OVER };
  }
  simulate(world, TITLE_SECONDS, 1);
  world.score = 0;
  world.streak = 0;
  return { screen: SCREEN.TITLE };
}
