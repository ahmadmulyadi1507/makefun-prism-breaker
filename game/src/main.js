// Prism Breaker: bootstrap and the game loop. The loop runs the world on a
// fixed 120 Hz step, reads the keyboard and mouse each frame, maps the
// world's events to sounds, and draws every frame. With ?shot= in the URL
// the game stages a screenshot scene instead of waiting for a player, and
// sound stays off.
import { FIELD, SCREEN } from './config.js';
import { World, STEP } from './world.js';
import { Renderer } from './render.js';
import { Input } from './input.js';
import { SoundEngine } from './audio.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const seedParam = Number(params.get('seed'));
const seed = Number.isFinite(seedParam) && seedParam > 0 ? seedParam : (Date.now() % 2147483647);

const canvas = document.getElementById('game');
const world = new World(seed);
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const sound = new SoundEngine();
sound.enabled = shotName === null;

if (shotName !== null) {
  stageShot(shotName, world);
}

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function playEventSounds(events) {
  for (const event of events) {
    switch (event.type) {
      case 'paddle': sound.paddleHit(); break;
      case 'wall': sound.wallHit(); break;
      case 'brickHit': sound.brickHit(event.hp); break;
      case 'brickBreak': sound.brickBreak(); break;
      case 'bomb': sound.bomb(); break;
      case 'powerup': sound.powerup(); break;
      case 'launch': sound.launch(); break;
      case 'laser': sound.laser(); break;
      case 'loseLife': sound.loseLife(); break;
      case 'levelClear': sound.levelClear(); break;
      case 'victory': sound.victory(); break;
      case 'gameOver': sound.gameOver(); break;
      default: break;
    }
  }
}

function readDrive() {
  return {
    axis: input.left ? -1 : input.right ? 1 : 0,
    targetX: input.mouseActive ? input.mouseX : null,
    action: input.actionPressed,
  };
}

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const elapsed = Math.min(0.1, (now - last) / 1000);
  last = now;
  if (shotName === null) {
    if (input.wasPressed('KeyM')) sound.setMuted(!sound.muted);
    if (input.wasPressed('KeyP') && (world.screen === SCREEN.PLAY || world.screen === SCREEN.SERVE || world.screen === SCREEN.PAUSED)) {
      world.screen = world.screen === SCREEN.PAUSED ? SCREEN.PLAY : SCREEN.PAUSED;
    }
    if (input.wasPressed('KeyR') && (world.screen === SCREEN.GAME_OVER || world.screen === SCREEN.VICTORY || world.screen === SCREEN.PAUSED)) {
      world.startGame();
    }
    if (world.screen === SCREEN.TITLE && input.actionPressed) {
      sound.unlock();
      sound.startMusic();
      world.startGame();
    } else if ((world.screen === SCREEN.GAME_OVER || world.screen === SCREEN.VICTORY) && input.actionPressed) {
      world.startGame();
    } else if (world.screen !== SCREEN.PAUSED) {
      accumulator += elapsed;
      let guard = 0;
      while (accumulator >= STEP && guard < 40) {
        const events = world.step(STEP, readDrive());
        playEventSounds(events);
        accumulator -= STEP;
        guard += 1;
      }
      if (guard >= 40) accumulator = 0;
    }
    input.endFrame();
  }
  renderer.draw(world, world.time);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
