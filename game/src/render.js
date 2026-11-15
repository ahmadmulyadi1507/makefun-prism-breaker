// Every pixel of Prism Breaker: the starfield background, the bricks, the
// paddle, the balls, the power-ups, the particles and the HUD, plus the
// title, pause, level-clear, game-over and victory screens. It only reads
// the world's state; it never changes it.
import { FIELD, PADDLE, POWERUP_COLORS, RULES, SCREEN } from './config.js';
import { brickColor, BRICK_TYPES } from './bricks.js';

const STARS = [];
for (let i = 0; i < 130; i += 1) {
  STARS.push({
    x: (i * 7919) % FIELD.width,
    y: (i * 104729) % FIELD.height,
    size: 0.6 + ((i * 37) % 10) / 10,
    twinkle: ((i * 13) % 10) / 10,
  });
}

const NEBULAE = [
  { x: 150, y: 120, r: 260, color: 'rgba(56, 189, 248, 0.10)' },
  { x: 820, y: 300, r: 300, color: 'rgba(167, 139, 250, 0.10)' },
  { x: 420, y: 560, r: 280, color: 'rgba(46, 230, 168, 0.08)' },
  { x: 760, y: 90, r: 200, color: 'rgba(244, 114, 182, 0.08)' },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.bezierCurveTo(0, 8, 0, 2, 4, 2);
  ctx.bezierCurveTo(6.5, 2, 8, 4, 8, 5);
  ctx.bezierCurveTo(8, 4, 9.5, 2, 12, 2);
  ctx.bezierCurveTo(16, 2, 16, 8, 8, 14);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(world, time) {
    const ctx = this.ctx;
    ctx.save();
    const shake = world.particles.shake;
    if (shake > 0.2) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    this.drawBackground(ctx, time);
    this.drawBricks(ctx, world, time);
    this.drawPowerups(ctx, world);
    this.drawBolts(ctx, world);
    this.drawPaddle(ctx, world, time);
    this.drawBalls(ctx, world);
    this.drawParticles(ctx, world);
    this.drawFloatTexts(ctx, world);
    ctx.restore();
    this.drawHud(ctx, world);
    this.drawScreen(ctx, world, time);
  }

  drawBackground(ctx, time) {
    const bg = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    bg.addColorStop(0, '#070b1d');
    bg.addColorStop(0.55, '#0a1030');
    bg.addColorStop(1, '#12082b');
    ctx.fillStyle = bg;
    ctx.fillRect(-20, -20, FIELD.width + 40, FIELD.height + 40);
    for (const nebula of NEBULAE) {
      const g = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.r);
      g.addColorStop(0, nebula.color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(nebula.x - nebula.r, nebula.y - nebula.r, nebula.r * 2, nebula.r * 2);
    }
    for (const star of STARS) {
      const alpha = 0.35 + 0.65 * Math.abs(Math.sin(time * 0.7 + star.twinkle * 6.28));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#dbeafe';
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
  }

  drawBricks(ctx, world, time) {
    for (const brick of world.bricks) {
      if (!brick.alive) continue;
      const color = brickColor(brick, world.level);
      const flash = brick.flash > 0 ? 0.7 : 0;
      const grad = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.h);
      grad.addColorStop(0, color);
      grad.addColorStop(1, '#0b1026');
      ctx.fillStyle = grad;
      roundRect(ctx, brick.x + 1, brick.y + 1, brick.w - 2, brick.h - 2, 5);
      ctx.fill();
      ctx.strokeStyle = flash > 0 ? '#ffffff' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = flash > 0 ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillRect(brick.x + 5, brick.y + 3, brick.w - 10, 3);
      if (brick.type === BRICK_TYPES.BOMB) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✦', brick.x + brick.w / 2, brick.y + brick.h / 2 + 1);
      }
      if (brick.type === BRICK_TYPES.CORE) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 5);
        ctx.save();
        ctx.shadowColor = '#ffe14d';
        ctx.shadowBlur = 14 + pulse * 10;
        ctx.fillStyle = '#ffe14d';
        ctx.font = 'bold 15px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◆', brick.x + brick.w / 2, brick.y + brick.h / 2 + 1);
        ctx.restore();
      }
      if (brick.type === BRICK_TYPES.STEEL) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(brick.x + 6, brick.y + brick.h - 6);
        ctx.lineTo(brick.x + brick.w - 6, brick.y + 6);
        ctx.moveTo(brick.x + 6, brick.y + 6);
        ctx.lineTo(brick.x + brick.w - 6, brick.y + brick.h - 6);
        ctx.stroke();
      }
      if (brick.hp > 1 && brick.hp !== Infinity) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 11px Arial, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(String(brick.hp), brick.x + brick.w - 5, brick.y + 3);
      }
    }
  }

  drawPowerups(ctx, world) {
    for (const item of world.powerups) {
      if (!item.active) continue;
      const bob = Math.sin(item.phase) * 2;
      ctx.save();
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = 'rgba(5, 8, 20, 0.9)';
      roundRect(ctx, item.x - 15, item.y - 11 + bob, 30, 22, 11);
      ctx.fill();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = item.color;
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.type === '+' ? '+' : item.type, item.x, item.y + 1 + bob);
      ctx.restore();
    }
  }

  drawBolts(ctx, world) {
    ctx.save();
    ctx.shadowColor = '#ff3d71';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffd166';
    for (const bolt of world.bolts) {
      if (!bolt.active) continue;
      roundRect(ctx, bolt.x - 2, bolt.y - 10, 4, 12, 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawPaddle(ctx, world, time) {
    const paddle = world.paddle;
    const laser = time < paddle.laserUntil;
    const sticky = time < paddle.stickyUntil;
    const wide = time < paddle.wideUntil;
    ctx.save();
    ctx.shadowColor = wide ? '#38e1ff' : '#7c5cff';
    ctx.shadowBlur = 16;
    const grad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + PADDLE.height);
    grad.addColorStop(0, '#e0e7ff');
    grad.addColorStop(0.35, laser ? '#ff5d8f' : '#8b7cff');
    grad.addColorStop(1, '#3b2f8f');
    ctx.fillStyle = grad;
    roundRect(ctx, paddle.x, paddle.y, paddle.width, PADDLE.height, PADDLE.corner);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(paddle.x + 6, paddle.y + 2, paddle.width - 12, 3);
    if (laser) {
      for (const offset of [14, paddle.width - 14]) {
        ctx.fillStyle = '#ff3d71';
        ctx.fillRect(paddle.x + offset - 4, paddle.y - 10, 8, 10);
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(paddle.x + offset - 1.5, paddle.y - 12, 3, 6);
      }
    }
    if (sticky) {
      ctx.fillStyle = '#c77dff';
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STICKY', paddle.x + paddle.width / 2, paddle.y - 8);
    }
    ctx.restore();
  }

  drawBalls(ctx, world) {
    for (const ball of world.balls) {
      for (let i = 0; i < ball.trail.length; i += 1) {
        const point = ball.trail[i];
        const alpha = (i / ball.trail.length) * 0.35;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#9be8ff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, ball.r * (0.4 + 0.6 * (i / ball.trail.length)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      const fire = world.time < ball.fireUntil;
      ctx.save();
      ctx.shadowColor = fire ? '#ff5d3b' : '#38e1ff';
      ctx.shadowBlur = 18;
      const grad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.r + 2);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, fire ? '#ffb347' : '#7dd3fc');
      grad.addColorStop(1, fire ? '#ff3d00' : '#2563eb');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawParticles(ctx, world) {
    const system = world.particles;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of system.particles) {
      const alpha = 1 - p.age / p.life;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shard) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawFloatTexts(ctx, world) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of world.particles.texts) {
      const alpha = 1 - t.age / t.life;
      ctx.globalAlpha = alpha;
      ctx.font = t.big ? 'bold 20px Arial, sans-serif' : 'bold 15px Arial, sans-serif';
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawHud(ctx, world) {
    ctx.save();
    ctx.fillStyle = 'rgba(4, 7, 18, 0.72)';
    ctx.fillRect(0, 0, FIELD.width, 52);
    ctx.strokeStyle = 'rgba(139, 124, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 52.5);
    ctx.lineTo(FIELD.width, 52.5);
    ctx.stroke();
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#8b98a9';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE', 18, 14);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(String(world.score).padStart(6, '0'), 18, 34);
    ctx.fillStyle = '#8b98a9';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SECTOR', FIELD.width / 2, 14);
    ctx.fillStyle = '#38e1ff';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(`${world.level} / ${10} — ${world.sectorName}`, FIELD.width / 2, 33);
    ctx.fillStyle = '#8b98a9';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('LIVES', FIELD.width - 18, 14);
    for (let i = 0; i < Math.max(0, world.lives); i += 1) {
      drawHeart(ctx, FIELD.width - 26 - i * 24, 33, 15, '#ff3d71');
    }
    ctx.fillStyle = '#8b98a9';
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`BEST ${Math.max(world.high, world.score)}`, 18, 66);
    const remaining = world.breakableRemaining;
    const total = world.breakableTotal;
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, FIELD.width - 218, 60, 200, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = '#2ee6a8';
    const cleared = total - remaining;
    roundRect(ctx, FIELD.width - 218, 60, Math.max(7, 200 * (total ? cleared / total : 0)), 7, 3.5);
    ctx.fill();
    if (world.streak >= 3) {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`COMBO x${world.multiplier().toFixed(1)}`, 18, 84);
    }
    if (world.labelTimer > 0 && world.lastPowerupLabel) {
      ctx.globalAlpha = Math.min(1, world.labelTimer);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(world.lastPowerupLabel, FIELD.width / 2, 84);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  overlay(ctx) {
    ctx.fillStyle = 'rgba(3, 5, 14, 0.62)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  drawScreen(ctx, world, time) {
    if (world.screen === SCREEN.TITLE) this.drawTitle(ctx, world, time);
    else if (world.screen === SCREEN.SERVE) this.drawServeHint(ctx, world);
    else if (world.screen === SCREEN.PAUSED) this.drawPaused(ctx, world);
    else if (world.screen === SCREEN.LEVEL_CLEAR) this.drawLevelClear(ctx, world);
    else if (world.screen === SCREEN.GAME_OVER) this.drawGameOver(ctx, world);
    else if (world.screen === SCREEN.VICTORY) this.drawVictory(ctx, world);
  }

  drawTitle(ctx, world, time) {
    this.overlay(ctx);
    const bob = Math.sin(time * 1.6) * 6;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#7c5cff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 76px Arial, sans-serif';
    ctx.fillText('PRISM', FIELD.width / 2, 168 + bob);
    ctx.shadowColor = '#38e1ff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#38e1ff';
    ctx.font = '900 76px Arial, sans-serif';
    ctx.fillText('BREAKER', FIELD.width / 2, 246 + bob);
    ctx.restore();
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 17px Arial, sans-serif';
    ctx.fillText('SMASH THE PRISM. CLEAR ALL 10 SECTORS.', FIELD.width / 2, 306);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px Arial, sans-serif';
    ctx.fillText('Move with MOUSE or ← →  •  SPACE to launch  •  Catch falling power-ups', FIELD.width / 2, 348);
    ctx.fillText('P pause  •  M mute  •  Break every glowing brick — steel never breaks', FIELD.width / 2, 374);
    const pulse = 0.8 + 0.2 * Math.sin(time * 4);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#2ee6a8';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText('▶  CLICK OR PRESS ENTER TO PLAY', FIELD.width / 2, 440);
    ctx.restore();
    if (world.high > 0) {
      ctx.fillStyle = '#8b98a9';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`BEST SCORE  ${world.high}`, FIELD.width / 2, 492);
    }
    ctx.fillStyle = 'rgba(139, 152, 169, 0.8)';
    ctx.font = '12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('A neon breakout — 10 sectors, power-ups, lasers and fireballs. No downloads, no sign-up.', FIELD.width / 2, 580);
  }

  drawServeHint(ctx, world) {
    ctx.save();
    ctx.textAlign = 'center';
    const pulse = 0.8 + 0.2 * Math.sin(world.time * 5);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 19px Arial, sans-serif';
    ctx.fillText('SPACE OR CLICK TO LAUNCH', FIELD.width / 2, 540);
    ctx.restore();
    ctx.fillStyle = '#8b98a9';
    ctx.font = '13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SECTOR ${world.level} — ${world.sectorName}`, FIELD.width / 2, 566);
  }

  drawPaused(ctx, world) {
    this.overlay(ctx);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px Arial, sans-serif';
    ctx.fillText('PAUSED', FIELD.width / 2, 300);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('Press P to resume  •  R to restart', FIELD.width / 2, 350);
    ctx.restore();
  }

  drawLevelClear(ctx, world) {
    this.overlay(ctx);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#2ee6a8';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#2ee6a8';
    ctx.font = '900 54px Arial, sans-serif';
    ctx.fillText(`SECTOR ${world.level} CLEAR!`, FIELD.width / 2, 280);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`BONUS  +${world.levelBonus}`, FIELD.width / 2, 340);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(world.level >= 10 ? 'One more push — the Prism Core awaits…' : `Next: SECTOR ${world.level + 1}`, FIELD.width / 2, 380);
  }

  drawGameOver(ctx, world) {
    this.overlay(ctx);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff3d71';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ff5d5d';
    ctx.font = '900 64px Arial, sans-serif';
    ctx.fillText('GAME OVER', FIELD.width / 2, 250);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`SCORE  ${world.score}`, FIELD.width / 2, 320);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(`BEST  ${world.high}    •    REACHED SECTOR ${world.level}`, FIELD.width / 2, 356);
    const pulse = 0.8 + 0.2 * Math.sin(world.time * 4);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#2ee6a8';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', FIELD.width / 2, 420);
    ctx.restore();
  }

  drawVictory(ctx, world) {
    this.overlay(ctx);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffd166';
    ctx.font = '900 58px Arial, sans-serif';
    ctx.fillText('★ PRISM MASTER ★', FIELD.width / 2, 230);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('You cleared all 10 sectors. The Prism is yours!', FIELD.width / 2, 300);
    ctx.fillStyle = '#2ee6a8';
    ctx.font = 'bold 26px Arial, sans-serif';
    ctx.fillText(`FINAL SCORE  ${world.score}`, FIELD.width / 2, 350);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText(`BEST  ${world.high}`, FIELD.width / 2, 386);
    const pulse = 0.8 + 0.2 * Math.sin(world.time * 4);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#38e1ff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('PRESS R OR CLICK TO PLAY AGAIN', FIELD.width / 2, 440);
    ctx.restore();
  }
}
